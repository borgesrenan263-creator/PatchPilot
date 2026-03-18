import express from "express";
import path from "path";

import healthRouter from "./routes/health";
import projectsRouter from "./routes/projects";
import incidentsRouter from "./routes/incidents";

const app = express();

app.use(express.json());

app.use(express.static(path.join(process.cwd(), "src/public")));

app.get("/", (_req, res) => {
  res.sendFile(path.join(process.cwd(), "src/public", "index.html"));
});

app.use("/health", healthRouter);
app.use("/projects", projectsRouter);
app.use("/incidents", incidentsRouter);

export default app;
