export interface Incident {
  id: string;
  projectId: string;
  message: string;
  status: "open" | "resolved";
  createdAt: string;
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
}

export function createIncidentSchema(data: any): Incident {
  return {
    id: data.id || Date.now().toString(),
    projectId: data.projectId,
    message: data.message || "Unknown error",
    status: data.status || "open",
    createdAt: data.createdAt || new Date().toISOString(),
    resolvedAt: data.resolvedAt,
    autoHeal: data.autoHeal || {
      attempted: false,
      success: false,
      command: "",
      stdout: "",
      stderr: "",
      error: null,
      executedAt: null,
    },
  };
}
