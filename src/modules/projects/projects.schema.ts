export interface Project {
  id: string;
  name: string;
  repoUrl?: string;
  healthUrl: string;
  command?: string;
  status?: "healthy" | "alert";
  createdAt?: string;
}

export function createProjectSchema(data: any): Project {
  return {
    id: data.id || Date.now().toString(),
    name: data.name || "Unnamed",
    repoUrl: data.repoUrl || "",
    healthUrl: data.healthUrl || "",
    command: data.command || "",
    status: data.status || "alert",
    createdAt: data.createdAt || new Date().toISOString(),
  };
}
