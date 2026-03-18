import { Request, Response } from "express";
import { db } from "../../lib/db";
import { createIncidentSchema } from "./incidents.schema";
import { runCommand } from "../../lib/executor";

export async function getIncidents(_req: Request, res: Response) {
  const incidents = db.getIncidents();
  return res.status(200).json(incidents);
}

export async function getOpenIncidents(_req: Request, res: Response) {
  const incidents = db.getIncidents();
  const open = incidents.filter((incident: any) => incident.status !== "resolved");
  return res.status(200).json(open);
}

export async function createIncident(req: Request, res: Response) {
  const { projectId, message, status } = req.body;

  if (!projectId || !message) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  const incidents = db.getIncidents();

  const incident = createIncidentSchema({
    projectId,
    message,
    status: status || "open",
  });

  incidents.push(incident);
  db.saveIncidents(incidents);

  return res.status(201).json(incident);
}

export async function resolveIncident(req: Request, res: Response) {
  const { id } = req.params;
  const incidents = db.getIncidents();

  const index = incidents.findIndex((incident: any) => incident.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Incidente não encontrado" });
  }

  incidents[index] = {
    ...incidents[index],
    status: "resolved",
    resolvedAt: new Date().toISOString(),
  };

  db.saveIncidents(incidents);

  return res.status(200).json(incidents[index]);
}

export async function runIncidentAutoHeal(req: Request, res: Response) {
  const { id } = req.params;

  const incidents = db.getIncidents();
  const projects = db.getProjects();

  const incidentIndex = incidents.findIndex((incident: any) => incident.id === id);

  if (incidentIndex === -1) {
    return res.status(404).json({ error: "Incidente não encontrado" });
  }

  const incident = incidents[incidentIndex];
  const project = projects.find((item: any) => item.id === incident.projectId);

  if (!project) {
    return res.status(404).json({ error: "Projeto do incidente não encontrado" });
  }

  if (!project.command || !project.command.trim()) {
    return res.status(400).json({ error: "Projeto sem comando de auto-heal" });
  }

  const execution = await runCommand(project.command);

  incidents[incidentIndex] = {
    ...incident,
    autoHeal: {
      attempted: true,
      success: execution.success,
      command: execution.command,
      stdout: execution.stdout,
      stderr: execution.stderr,
      error: execution.error,
      executedAt: execution.executedAt,
    },
  };

  db.saveIncidents(incidents);

  return res.status(200).json({
    incident: incidents[incidentIndex],
    execution,
  });
}
