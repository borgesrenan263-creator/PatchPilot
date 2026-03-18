import { db } from "../lib/db";
import { runCommand } from "../lib/executor";
import { createIncidentSchema } from "../modules/incidents/incidents.schema";

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
  status: "open" | "resolved";
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

const LOOP_MS = 15000;
const COOLDOWN_MS = 60000;

declare global {
  var __PATCHPILOT_MONITOR_STARTED__: boolean | undefined;
}

const lastExecutionByProject: Record<string, number> = {};

async function checkHealth(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    return response.ok;
  } catch {
    return false;
  }
}

function getOpenIncidentForProject(
  incidents: IncidentItem[],
  projectId: string
): IncidentItem | undefined {
  return incidents.find(
    (incident) => incident.projectId === projectId && incident.status !== "resolved"
  );
}

async function processProject(project: ProjectItem) {
  const isHealthy = await checkHealth(project.healthUrl);

  const incidents = (db.getIncidents() || []) as IncidentItem[];
  const projects = (db.getProjects() || []) as ProjectItem[];

  const openIncident = getOpenIncidentForProject(incidents, project.id);

  if (isHealthy) {
    if (openIncident) {
      const updatedIncidents = incidents.map((incident) =>
        incident.id === openIncident.id
          ? {
              ...incident,
              status: "resolved" as const,
              resolvedAt: new Date().toISOString(),
            }
          : incident
      );

      db.saveIncidents(updatedIncidents);
      console.log("✅ Incidente resolvido automaticamente:", project.name);
    }

    const updatedProjects = projects.map((item) =>
      item.id === project.id ? { ...item, status: "healthy" } : item
    );

    db.saveProjects(updatedProjects);
    console.log("✅ OK:", project.name);
    return;
  }

  const updatedProjects = projects.map((item) =>
    item.id === project.id ? { ...item, status: "alert" } : item
  );
  db.saveProjects(updatedProjects);

  let workingIncidents = incidents;
  let currentIncident = openIncident;

  if (!currentIncident) {
    currentIncident = createIncidentSchema({
      projectId: project.id,
      message: "API OFFLINE",
      status: "open",
      autoHeal: {
        attempted: false,
        success: false,
        command: "",
        stdout: "",
        stderr: "",
        error: null,
        executedAt: null,
      },
    });

    workingIncidents = [...incidents, currentIncident];
    db.saveIncidents(workingIncidents);
    console.log("🚨 Incidente criado:", project.name);
  }

  if (!project.command || !project.command.trim()) {
    console.log("⏸️ Sem comando de auto-heal:", project.name);
    return;
  }

  const now = Date.now();
  const lastExecution = lastExecutionByProject[project.id] || 0;

  if (now - lastExecution < COOLDOWN_MS) {
    console.log("⏳ Cooldown ativo:", project.name);
    return;
  }

  lastExecutionByProject[project.id] = now;

  console.log("🛠️ Auto-heal automático:", project.name);

  const execution = await runCommand(project.command);

  const freshIncidents = (db.getIncidents() || []) as IncidentItem[];

  const savedIncident = freshIncidents.find((incident) => incident.id === currentIncident?.id);

  if (!savedIncident) {
    console.log("⚠️ Incidente não encontrado para atualizar:", project.name);
    return;
  }

  const updatedIncidents = freshIncidents.map((incident) =>
    incident.id === savedIncident.id
      ? {
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
        }
      : incident
  );

  db.saveIncidents(updatedIncidents);

  if (execution.success) {
    console.log("✅ Auto-heal executado:", project.name, "-", execution.stdout || "sem stdout");
  } else {
    console.log("❌ Auto-heal falhou:", project.name, "-", execution.error || "erro desconhecido");
  }
}

export function startAutoHealMonitor() {
  if (global.__PATCHPILOT_MONITOR_STARTED__) {
    console.log("ℹ️ Monitor automático já iniciado");
    return;
  }

  global.__PATCHPILOT_MONITOR_STARTED__ = true;
  console.log("🚀 Monitor automático iniciado");

  setInterval(async () => {
    try {
      const projects = (db.getProjects() || []) as ProjectItem[];

      for (const project of projects) {
        await processProject(project);
      }
    } catch (error) {
      console.log("❌ Erro no monitor automático:", error);
    }
  }, LOOP_MS);
}
