import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";

import { healthRouter } from "./modules/health/health.routes";
import { projectsRouter } from "./modules/projects/projects.routes";
import { incidentsRouter } from "./modules/incidents/incidents.routes";
import { statusRouter } from "./modules/status/status.routes";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use(express.static(path.join(process.cwd(), "src/public")));

app.get("/", (_req, res) => {
  res.sendFile(path.join(process.cwd(), "src/public", "index.html"));
});

app.use("/health", healthRouter);
app.use("/projects", projectsRouter);
app.use("/incidents", incidentsRouter);
app.use("/status", statusRouter);
app.use("/dashboard", dashboardRouter);
