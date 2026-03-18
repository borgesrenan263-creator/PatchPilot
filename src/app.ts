import express, { Request, Response } from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import * as healthRoutes from "./modules/health/health.routes";
import * as projectsRoutes from "./modules/projects/projects.routes";
import * as incidentsRoutes from "./modules/incidents/incidents.routes";
import * as dashboardRoutes from "./modules/dashboard/dashboard.routes";

const app = express();

const healthRouter =
  (healthRoutes as any).default ||
  (healthRoutes as any).healthRouter ||
  (healthRoutes as any).router;

const projectsRouter =
  (projectsRoutes as any).default ||
  (projectsRoutes as any).projectsRouter ||
  (projectsRoutes as any).router;

const incidentsRouter =
  (incidentsRoutes as any).default ||
  (incidentsRoutes as any).incidentsRouter ||
  (incidentsRoutes as any).router;

const dashboardRouter =
  (dashboardRoutes as any).default ||
  (dashboardRoutes as any).dashboardRouter ||
  (dashboardRoutes as any).router;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use(express.static(path.join(process.cwd(), "src/public")));

app.get("/", (_req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), "src/public", "index.html"));
});

if (healthRouter) app.use("/health", healthRouter);
if (projectsRouter) app.use("/projects", projectsRouter);
if (incidentsRouter) app.use("/incidents", incidentsRouter);
if (dashboardRouter) app.use("/dashboard", dashboardRouter);

export default app;
