import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "src/data");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function read(file: string) {
  const filePath = path.join(dataDir, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "[]");
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function write(file: string, data: any) {
  const filePath = path.join(dataDir, file);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export const db = {
  getProjects: () => read("projects.json"),
  saveProjects: (data: any) => write("projects.json", data),

  getIncidents: () => read("incidents.json"),
  saveIncidents: (data: any) => write("incidents.json", data),
};
