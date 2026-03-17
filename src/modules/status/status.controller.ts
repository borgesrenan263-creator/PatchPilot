import { Request, Response } from "express";
import { db } from "../../lib/db";

export const getStatusSummary = async (_req: Request, res: Response) => {
  const projectsResult = await db.query(
    `SELECT COUNT(*)::int AS total FROM "Project"`
  );

  const openIncidentsResult = await db.query(
    `SELECT COUNT(*)::int AS total FROM "Incident" WHERE status = 'open'`
  );

  const resolvedIncidentsResult = await db.query(
    `SELECT COUNT(*)::int AS total FROM "Incident" WHERE status = 'resolved'`
  );

  const latestOpenResult = await db.query(
    `SELECT
       i.id,
       i."projectId",
       p.name AS "projectName",
       i.message,
       i."statusCode",
       i."createdAt"
     FROM "Incident" i
     JOIN "Project" p ON p.id = i."projectId"
     WHERE i.status = 'open'
     ORDER BY i.id DESC
     LIMIT 5`
  );

  return res.json({
    projects: projectsResult.rows[0].total,
    openIncidents: openIncidentsResult.rows[0].total,
    resolvedIncidents: resolvedIncidentsResult.rows[0].total,
    hasActiveAlert: openIncidentsResult.rows[0].total > 0,
    latestOpenIncidents: latestOpenResult.rows,
  });
};
