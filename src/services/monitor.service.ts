import { probeHealth } from "./health.service";
import { createMetric } from "./metrics.service";
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

    const result = await probeHealth(project.healthcheckUrl);

    await createMetric(project.id, result.latency, result.statusCode);

    if (result.ok) {
      console.log("✅", project.name, "healthy", result.latency + "ms");
      await resolveIncident(project.id);
      continue;
    }

    if (result.failureType === "connection_refused") {
      console.log("❌ Connection refused");
    } else if (result.failureType === "timeout") {
      console.log("❌ Timeout");
    } else if (result.failureType === "http_404") {
      console.log("❌ Route not found");
    } else if (result.failureType === "http_500") {
      console.log("❌ Internal server error");
    } else if (result.failureType === "http_502_503_504") {
      console.log("❌ Upstream unavailable");
    } else {
      console.log("❌ Service unreachable");
    }

    await createIncident({
      projectId: project.id,
      message: result.failureType,
      statusCode: result.statusCode || 0
    });

    const healed = await tryAutoHeal({
      project,
      failureType: result.failureType,
      statusCode: result.statusCode
    });

    if (healed) {
      console.log("🔁 Rechecking after auto-heal...");

      const retry = await probeHealth(project.healthcheckUrl);

      if (retry.ok) {
        console.log("✅ Service recovered after auto-heal");
        await resolveIncident(project.id);
      } else {
        console.log("❌ Retry failed after auto-heal:", retry.failureType);
      }
    }
  }
};
