import "dotenv/config";
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import fetch from "node-fetch";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(process.cwd(), "src/public")));

const PROJECTS_FILE = path.join(process.cwd(), "src/data/projects.json");
const INCIDENTS_FILE = path.join(process.cwd(), "src/data/incidents.json");

const LOOP_MS = 20000;
const COOLDOWN_MS = 30000;
const MAX_ATTEMPTS = 3;

const lastRun: Record<string, number> = {};
const running: Record<string, boolean> = {};
const attempts: Record<string, number> = {};
const failedLocked: Record<string, boolean> = {};
const lockLogged: Record<string, boolean> = {};
const lastStatus: Record<string, string> = {};

function ensureFile(filePath: string, initial: string) {
  const dir = path.dirname(filePath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, initial);
  }
}

function loadProjects() {
  ensureFile(PROJECTS_FILE, "[]");
  return JSON.parse(fs.readFileSync(PROJECTS_FILE, "utf-8"));
}

function saveProjects(projects: any[]) {
  ensureFile(PROJECTS_FILE, "[]");
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2));
}

function loadIncidents() {
  ensureFile(INCIDENTS_FILE, "[]");
  return JSON.parse(fs.readFileSync(INCIDENTS_FILE, "utf-8"));
}

function saveIncidents(incidents: any[]) {
  ensureFile(INCIDENTS_FILE, "[]");
  fs.writeFileSync(INCIDENTS_FILE, JSON.stringify(incidents, null, 2));
}

function addIncident(incident: any) {
  const incidents = loadIncidents();
  incidents.unshift(incident);
  saveIncidents(incidents.slice(0, 300));
}

async function sendTelegram(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return;
  }

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message
      })
    });

    console.log("Telegram enviado");
  } catch (error: any) {
    console.log("Erro Telegram:", error?.message || error);
  }
}

async function checkHealth(url: string) {
  const startedAt = Date.now();

  try {
    const response = await fetch(url);
    const latency = Date.now() - startedAt;

    return {
      online: response.ok,
      statusCode: response.status,
      latency,
      error: response.ok ? "--" : `HTTP_${response.status}`
    };
  } catch {
    const latency = Date.now() - startedAt;

    return {
      online: false,
      statusCode: 0,
      latency,
      error: "API OFFLINE"
    };
  }
}

function runFix(command?: string) {
  return new Promise<string>((resolve) => {
    if (!command || !command.trim()) {
      resolve("NO_COMMAND");
      return;
    }

    exec(command, (error, stdout, stderr) => {
      if (error) {
        resolve(`ERROR: ${error.message}`);
        return;
      }

      if (stderr && stderr.trim()) {
        resolve(stderr.trim());
        return;
      }

      resolve((stdout || "OK").trim());
    });
  });
}

async function buildProjectStatus(project: any) {
  const health = await checkHealth(project.healthUrl);
  const healthy = health.online;
  const locked = !!failedLocked[project.id];

  return {
    id: project.id,
    name: project.name,
    repoUrl: project.repoUrl || "",
    healthUrl: project.healthUrl,
    command: project.command || "",
    integrity: healthy ? 100 : 0,
    latency: health.latency,
    failure: healthy ? "--" : health.error,
    statusCode: health.statusCode,
    status: healthy ? "healthy" : "alert",
    severity: healthy ? "INFO" : locked ? "FAILED" : "CRITICAL",
    recovery: healthy ? "NONE" : locked ? "BLOCKED" : "ATTEMPTED",
    attempts: attempts[project.id] || 0,
    locked,
    lastCheckAt: new Date().toISOString()
  };
}

app.get("/", (_req, res) => {
  res.sendFile(path.join(process.cwd(), "src/public", "index.html"));
});

app.get("/dashboard", (_req, res) => {
  res.sendFile(path.join(process.cwd(), "src/public", "index.html"));
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "patchpilot"
  });
});

app.get("/projects", (_req, res) => {
  res.json(loadProjects());
});

app.post("/projects", (req, res) => {
  const { name, repoUrl, healthUrl, command } = req.body;

  if (!name || !healthUrl) {
    res.status(400).json({ error: "Dados inválidos" });
    return;
  }

  const projects = loadProjects();

  const project = {
    id: String(Date.now()),
    name,
    repoUrl: repoUrl || "",
    healthUrl,
    command: command || ""
  };

  projects.push(project);
  saveProjects(projects);

  res.json({
    success: true,
    project
  });
});

app.get("/projects/status", async (_req, res) => {
  const projects = loadProjects();
  const result = await Promise.all(projects.map(buildProjectStatus));

  const totalProjects = result.length;
  const healthyCount = result.filter((p) => p.status === "healthy").length;
  const alertCount = result.filter((p) => p.status === "alert").length;
  const autoHeals = result.filter(
    (p) => p.recovery === "ATTEMPTED" || p.recovery === "BLOCKED"
  ).length;

  res.json({
    summary: {
      totalProjects,
      healthyCount,
      alertCount,
      autoHeals
    },
    projects: result
  });
});

app.get("/incidents", (_req, res) => {
  res.json(loadIncidents());
});

app.post("/projects/:id/unlock", (req, res) => {
  const id = req.params.id;

  failedLocked[id] = false;
  attempts[id] = 0;
  lockLogged[id] = false;
  lastRun[id] = 0;
  lastStatus[id] = "";

  addIncident({
    id: String(Date.now()),
    type: "manual_unlock",
    projectId: id,
    createdAt: new Date().toISOString()
  });

  res.json({
    success: true,
    id
  });
});

setInterval(async () => {
  const projects = loadProjects();
  const alertBuffer: string[] = [];

  for (const p of projects) {
    const health = await checkHealth(p.healthUrl);

    if (health.online) {
      if (lastStatus[p.id] !== "OK") {
        console.log("OK:", p.name);
        lastStatus[p.id] = "OK";
      }

      attempts[p.id] = 0;
      failedLocked[p.id] = false;
      lockLogged[p.id] = false;
      continue;
    }

    if (failedLocked[p.id]) {
      if (!lockLogged[p.id]) {
        console.log("BLOQUEADO:", p.name);
        lockLogged[p.id] = true;
        lastStatus[p.id] = "BLOQUEADO";
      }
      continue;
    }

    const now = Date.now();

    if (lastRun[p.id] && now - lastRun[p.id] < COOLDOWN_MS) {
      if (lastStatus[p.id] !== "COOLDOWN") {
        console.log("Cooldown:", p.name);
        lastStatus[p.id] = "COOLDOWN";
      }
      continue;
    }

    if (running[p.id]) {
      if (lastStatus[p.id] !== "RUNNING") {
        console.log("Executando:", p.name);
        lastStatus[p.id] = "RUNNING";
      }
      continue;
    }

    running[p.id] = true;

    try {
      attempts[p.id] = (attempts[p.id] || 0) + 1;

      console.log("Auto-heal:", p.name);
      const result = await runFix(p.command);
      console.log("Resultado:", result);
      lastStatus[p.id] = "HEAL";

      addIncident({
        id: String(Date.now()),
        type: "auto_heal",
        projectId: p.id,
        projectName: p.name,
        healthUrl: p.healthUrl,
        command: p.command || "",
        result,
        statusCode: health.statusCode,
        error: health.error,
        latency: health.latency,
        attempt: attempts[p.id],
        createdAt: new Date().toISOString()
      });

      if (attempts[p.id] === 1) {
        alertBuffer.push(p.name);
      }

      if (attempts[p.id] >= MAX_ATTEMPTS) {
        failedLocked[p.id] = true;
        lockLogged[p.id] = false;
        lastStatus[p.id] = "FAILED";

        console.log("LIMITE ATINGIDO:", p.name);

        addIncident({
          id: String(Date.now()),
          type: "failed_locked",
          projectId: p.id,
          projectName: p.name,
          healthUrl: p.healthUrl,
          command: p.command || "",
          result: "MAX_ATTEMPTS_REACHED",
          attempt: attempts[p.id],
          createdAt: new Date().toISOString()
        });

        await sendTelegram(
          "PATCHPILOT FAIL\n\nProjeto: " +
            p.name +
            "\nTentativas: " +
            attempts[p.id]
        );
      }

      lastRun[p.id] = Date.now();
    } finally {
      running[p.id] = false;
    }
  }

  if (alertBuffer.length > 0) {
    await sendTelegram(
      "PATCHPILOT ALERTA\n\n" +
        alertBuffer.map((name) => "- " + name).join("\n")
    );
  }
}, LOOP_MS);

app.listen(3000, () => {
  console.log("PatchPilot rodando na 3000");
});
