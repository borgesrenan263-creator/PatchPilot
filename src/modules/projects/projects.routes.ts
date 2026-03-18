import { Router } from "express";
import { createProject, getProjects } from "./projects.controller";

const router = Router();

router.get("/", getProjects);
router.post("/", createProject);

export default router;
export { router as projectsRouter };
