import { Router } from "express";
import { getDashboardOverview } from "./dashboard.controller";

const router = Router();

router.get("/overview", getDashboardOverview);

export default router;
export { router as dashboardRouter };
