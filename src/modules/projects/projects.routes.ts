import { Router } from "express";
import { createProject, listProjects } from "./projects.controller";

export const projectsRouter = Router();

projectsRouter.post("/", createProject);
projectsRouter.get("/", listProjects);
