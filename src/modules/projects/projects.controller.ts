import { Request, Response } from "express";
import { db } from "../../lib/db";
import { createProjectSchema } from "./projects.schema";

export const createProject = async (req: Request, res: Response) => {
  const parsed = createProjectSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid project data",
      details: parsed.error.format(),
    });
  }

  const { name, repoUrl, healthcheckUrl, autoHealCommand } = parsed.data;

  const result = await db.query(
    `INSERT INTO "Project" (name, "repoUrl", "healthcheckUrl", "autoHealCommand")
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name, repoUrl, healthcheckUrl, autoHealCommand]
  );

  return res.status(201).json(result.rows[0]);
};

export const listProjects = async (_req: Request, res: Response) => {
  const result = await db.query(
    `SELECT * FROM "Project" ORDER BY id ASC`
  );

  return res.json(result.rows);
};

export const getAllProjects = async () => {
  const result = await db.query(
    `SELECT * FROM "Project" ORDER BY id ASC`
  );

  return result.rows;
};
