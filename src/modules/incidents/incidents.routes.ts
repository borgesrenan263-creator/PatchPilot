import { Router } from "express";
import { listIncidents, listOpenIncidents } from "./incidents.controller";

export const incidentsRouter = Router();

incidentsRouter.get("/", listIncidents);
incidentsRouter.get("/open", listOpenIncidents);
