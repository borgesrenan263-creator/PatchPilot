import fs from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "src/data");
const projectsFile = path.join(dataDir, "projects.json");
const incidentsFile = path.join(dataDir, "incidents.json");

beforeEach(() => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(projectsFile, "[]");
  fs.writeFileSync(incidentsFile, "[]");
});
