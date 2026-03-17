import { Request, Response } from "express";
import { db } from "../../lib/db";

type CreateIncidentInput = {
  projectId: number;
  message: string;
  statusCode?: number;
};

export const createIncident = async (data: CreateIncidentInput) => {
  const open = await db.query(
    `SELECT id FROM "Incident"
     WHERE "projectId" = $1 AND status = 'open'
     LIMIT 1`,
    [data.projectId]
  );

  if (open.rows.length > 0) {
    return null;
  }

  const result = await db.query(
    `INSERT INTO "Incident" ("projectId", status, message, "statusCode")
     VALUES ($1, 'open', $2, $3)
     RETURNING *`,
    [data.projectId, data.message, data.statusCode ?? null]
  );

  return result.rows[0];
};

export const resolveIncident = async (projectId: number) => {
  await db.query(
    `UPDATE "Incident"
     SET status = 'resolved',
         "resolvedAt" = NOW()
     WHERE "projectId" = $1
       AND status = 'open'`,
    [projectId]
  );
};

export const listIncidents = async (_req: Request, res: Response) => {
  const result = await db.query(
    `SELECT
       i.id,
       i."projectId",
       p.name AS "projectName",
       i.status,
       i.message,
       i."statusCode",
       i."createdAt",
       i."resolvedAt"
     FROM "Incident" i
     JOIN "Project" p ON p.id = i."projectId"
     ORDER BY i.id DESC`
  );

  return res.json(result.rows);
};

export const listOpenIncidents = async (_req: Request, res: Response) => {
  const result = await db.query(
    `SELECT
       i.id,
       i."projectId",
       p.name AS "projectName",
       i.status,
       i.message,
       i."statusCode",
       i."createdAt"
     FROM "Incident" i
     JOIN "Project" p ON p.id = i."projectId"
     WHERE i.status = 'open'
     ORDER BY i.id DESC`
  );

  return res.json(result.rows);
};
