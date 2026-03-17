import { Request, Response } from "express";
import { db } from "../../lib/db";

export const getDashboardOverview = async (_req: Request, res: Response) => {
  const projectsResult = await db.query(
    `SELECT
       p.id,
       p.name,
       p."repoUrl",
       p."healthcheckUrl",
       p."createdAt"
     FROM "Project" p
     ORDER BY p.id ASC`
  );

  const projects = projectsResult.rows;

  const enrichedProjects = await Promise.all(
    projects.map(async (project) => {
      const latestMetricResult = await db.query(
        `SELECT
           m."responseTime",
           m."statusCode",
           m."createdAt"
         FROM "Metric" m
         WHERE m."projectId" = $1
         ORDER BY m.id DESC
         LIMIT 1`,
        [project.id]
      );

      const integrityResult = await db.query(
        `SELECT
           COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE "statusCode" >= 200 AND "statusCode" < 400)::int AS healthy
         FROM (
           SELECT "statusCode"
           FROM "Metric"
           WHERE "projectId" = $1
           ORDER BY id DESC
           LIMIT 10
         ) recent_metrics`,
        [project.id]
      );

      const openIncidentResult = await db.query(
        `SELECT
           id,
           message,
           "statusCode",
           "createdAt"
         FROM "Incident"
         WHERE "projectId" = $1
           AND status = 'open'
         ORDER BY id DESC
         LIMIT 1`,
        [project.id]
      );

      const latestAutoHealResult = await db.query(
        `SELECT
           id,
           command,
           success,
           output,
           "failureType",
           "statusCode",
           "createdAt"
         FROM "AutoHealLog"
         WHERE "projectId" = $1
         ORDER BY id DESC
         LIMIT 1`,
        [project.id]
      );

      const latestMetric = latestMetricResult.rows[0] || null;
      const integrityData = integrityResult.rows[0];
      const openIncident = openIncidentResult.rows[0] || null;
      const latestAutoHeal = latestAutoHealResult.rows[0] || null;

      const totalChecks = integrityData?.total || 0;
      const healthyChecks = integrityData?.healthy || 0;

      const integrity =
        totalChecks === 0 ? 0 : Math.round((healthyChecks / totalChecks) * 100);

      const hasOpenIncident = Boolean(openIncident);

      let recoveryStatus = "none";

      if (latestAutoHeal && latestAutoHeal.success && hasOpenIncident) {
        recoveryStatus = "attempted_but_not_recovered";
      } else if (latestAutoHeal && latestAutoHeal.success && !hasOpenIncident) {
        recoveryStatus = "recovered";
      } else if (latestAutoHeal && !latestAutoHeal.success) {
        recoveryStatus = "failed";
      }

      return {
        id: project.id,
        name: project.name,
        repoUrl: project.repoUrl,
        healthcheckUrl: project.healthcheckUrl,
        createdAt: project.createdAt,
        status: hasOpenIncident ? "alert" : "healthy",
        integrity,
        latestLatency: latestMetric?.responseTime ?? null,
        latestStatusCode: latestMetric?.statusCode ?? null,
        latestCheckAt: latestMetric?.createdAt ?? null,
        hasOpenIncident,
        openIncidentMessage: openIncident?.message ?? null,
        openIncidentStatusCode: openIncident?.statusCode ?? null,
        openIncidentCreatedAt: openIncident?.createdAt ?? null,
        latestFailureType: latestAutoHeal?.failureType ?? null,
        latestAutoHealCommand: latestAutoHeal?.command ?? null,
        latestAutoHealSuccess: latestAutoHeal?.success ?? null,
        latestAutoHealOutput: latestAutoHeal?.output ?? null,
        latestAutoHealAt: latestAutoHeal?.createdAt ?? null,
        recoveryStatus,
      };
    })
  );

  const summary = {
    totalProjects: enrichedProjects.length,
    healthyProjects: enrichedProjects.filter(
      (project) => project.status === "healthy"
    ).length,
    alertProjects: enrichedProjects.filter(
      (project) => project.status === "alert"
    ).length,
    autoHealAttempts: enrichedProjects.filter(
      (project) => project.latestAutoHealCommand !== null
    ).length,
  };

  return res.json({
    summary,
    projects: enrichedProjects,
  });
};
