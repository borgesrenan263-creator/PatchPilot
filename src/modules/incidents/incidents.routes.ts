import { Router } from "express";
import {
  createIncident,
  getIncidents,
  getOpenIncidents,
  resolveIncident,
} from "./incidents.controller";

const router = Router();

router.get("/", getIncidents);
router.get("/open", getOpenIncidents);
router.post("/", createIncident);
router.patch("/:id/resolve", resolveIncident);

export default router;
export { router as incidentsRouter };
