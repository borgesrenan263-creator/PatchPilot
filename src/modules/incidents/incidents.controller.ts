import { Request, Response } from "express";
import { db } from "../../lib/db";

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

  const incident = {
    id: Date.now().toString(),
    projectId,
    message,
    status: status || "open",
    createdAt: new Date().toISOString(),
  };

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
