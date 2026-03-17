import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "patchpilot-api",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});
