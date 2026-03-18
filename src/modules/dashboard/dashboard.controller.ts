import { Request, Response } from "express";
import { db } from "../../lib/db";

type ProjectItem = {
  id: string;
  name: string;
  repoUrl?: string;
  healthUrl: string;
  command?: string;
  status?: string;
  createdAt?: string;
};

type IncidentItem = {
  id: string;
  projectId: string;
  message: string;
  status: string;
  createdAt?: string;
  resolvedAt?: string;
};

export async function getDashboardOverview(_req: Request, res: Response) {
  const projects = (db.getProjects() || []) as ProjectItem[];
  const incidents = (db.getIncidents() || []) as IncidentItem[];

  const enrichedProjects = projects.map((project: ProjectItem) => {
    const projectIncidents = incidents.filter(
      (incident: IncidentItem) => incident.projectId === project.id
    );

    const openIncidents = projectIncidents.filter(
      (incident: IncidentItem) => incident.status !== "resolved"
    );

    const healthy = openIncidents.length === 0;

    return {
      id: project.id,
      name: project.name,
      repoUrl: project.repoUrl || "",
      healthUrl: project.healthUrl,
      command: project.command || "",
      status: healthy ? "healthy" : "alert",
      integrity: healthy ? 100 : 0,
      latency: healthy ? 25 : 0,
      failure: healthy ? "--" : "API OFFLINE",
      severity: healthy ? "INFO" : "CRITICAL",
      recovery: project.command ? "ATTEMPTED" : "NONE",
      attempts: openIncidents.length,
      statusCode: healthy ? 200 : 0,
      lastCheck: new Date().toISOString(),
      latestAutoHealCommand: project.command || null,
    };
  });

  const healthyCount = enrichedProjects.filter(
    (project: any) => project.status === "healthy"
  ).length;

  const alertCount = enrichedProjects.filter(
    (project: any) => project.status === "alert"
  ).length;

  const autoHeals = enrichedProjects.filter(
    (project: any) => project.latestAutoHealCommand !== null
  ).length;

  const recentIncidents = incidents
    .slice()
    .reverse()
    .slice(0, 10)
    .map((incident: IncidentItem) => {
      const project = projects.find((p: ProjectItem) => p.id === incident.projectId);

      return {
        id: incident.id,
        projectId: incident.projectId,
        projectName: project?.name || "Projeto",
        type: incident.status === "resolved" ? "resolved" : "incident",
        message: incident.message,
        status: incident.status,
        createdAt: incident.createdAt || new Date().toISOString(),
      };
    });

  return res.status(200).json({
    summary: {
      totalProjects: enrichedProjects.length,
      healthyCount,
      alertCount,
      autoHeals,
    },
    projects: enrichedProjects,
    incidents: recentIncidents,
  });
}
