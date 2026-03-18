import { Router } from "express";
import {
  createIncident,
  getIncidents,
  getOpenIncidents,
  resolveIncident,
  runIncidentAutoHeal,
} from "./incidents.controller";

const router = Router();

router.get("/", getIncidents);
router.get("/open", getOpenIncidents);
router.post("/", createIncident);
router.patch("/:id/resolve", resolveIncident);
router.post("/:id/auto-heal", runIncidentAutoHeal);

export default router;
export { router as incidentsRouter };
