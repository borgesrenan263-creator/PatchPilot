import { Router } from "express";
import { getDashboardOverview } from "./dashboard.controller";

export const dashboardRouter = Router();

dashboardRouter.get("/overview", getDashboardOverview);
