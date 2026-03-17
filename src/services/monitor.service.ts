import { createMetric } from "./metrics.service";
import { probeHealth } from "./health.service";
import { tryAutoHeal } from "./autoheal.service";
import {
  createIncident,
  resolveIncident
} from "../modules/incidents/incidents.controller";
import { getAllProjects } from "../modules/projects/projects.controller";

export const runMonitorCycle = async () => {
  console.log("Running monitor cycle...");

  const projects = await getAllProjects();

  if (projects.length === 0) {
    console.log("No projects registered");
    return;
  }

  for (const project of projects) {
    console.log("Checking", project.name);

    const health = await probeHealth(project.healthcheckUrl);

    await createMetric(
      project.id,
      health.latency,
      health.statusCode ?? 0
    );

    if (health.ok) {
      console.log("✅", project.name, "healthy", health.latency + "ms");
      await resolveIncident(project.id);
      continue;
    }

    console.log("❌", health.message);

    await createIncident({
      projectId: project.id,
      message: health.message,
      statusCode: health.statusCode ?? undefined,
    });

    const healed = await tryAutoHeal({
      project,
      failureType: health.failureType,
      statusCode: health.statusCode,
    });

    if (!healed) {
      continue;
    }

    console.log("🔁 Rechecking after auto-heal...");

    const retry = await probeHealth(project.healthcheckUrl);

    if (retry.ok) {
      console.log("✅ Service recovered after auto-heal");
      await resolveIncident(project.id);
    } else {
      console.log("❌ Retry failed after auto-heal:", retry.message);
    }
  }
};
