export interface Project {
  id: string;
  name: string;
  url: string;
  status: "ok" | "error";
  lastCheck: number;
}

export function createProject(data: any): Project {
  return {
    id: data.id || Date.now().toString(),
    name: data.name || "Unnamed",
    url: data.url || "",
    status: "ok",
    lastCheck: Date.now(),
  };
}
