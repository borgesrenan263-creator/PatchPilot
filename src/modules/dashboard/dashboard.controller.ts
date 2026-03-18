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
  autoHeal?: {
    attempted: boolean;
    success: boolean;
    command: string;
    stdout: string;
    stderr: string;
    error: string | null;
    executedAt: string | null;
  };
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

    const latestIncident =
      projectIncidents.length > 0 ? projectIncidents[projectIncidents.length - 1] : null;

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
      failure: healthy ? "--" : latestIncident?.message || "API OFFLINE",
      severity: healthy ? "INFO" : "CRITICAL",
      recovery:
        latestIncident?.autoHeal?.attempted
          ? latestIncident.autoHeal.success
            ? "SUCCESS"
            : "ATTEMPTED"
          : project.command
            ? "AVAILABLE"
            : "NONE",
      attempts: openIncidents.length,
      statusCode: healthy ? 200 : 0,
      lastCheck: new Date().toISOString(),
      latestAutoHealCommand: latestIncident?.autoHeal?.command || project.command || null,
      latestAutoHealOutput: latestIncident?.autoHeal?.stdout || "",
      latestAutoHealError: latestIncident?.autoHeal?.error || null,
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
        autoHeal: incident.autoHeal || null,
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
