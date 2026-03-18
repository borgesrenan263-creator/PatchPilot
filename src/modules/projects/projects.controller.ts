import { Request, Response } from "express";
import { db } from "../../lib/db";
import { createProjectSchema } from "./projects.schema";

export async function getProjects(_req: Request, res: Response) {
  const projects = db.getProjects();
  return res.status(200).json(projects);
}

export async function createProject(req: Request, res: Response) {
  const { name, repoUrl, healthUrl, command } = req.body;

  if (!name || !healthUrl) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  const projects = db.getProjects();

  const project = createProjectSchema({
    name,
    repoUrl,
    healthUrl,
    command,
  });

  projects.push(project);
  db.saveProjects(projects);

  return res.status(201).json(project);
}
