import { Router } from "express";
import { getStatusSummary } from "./status.controller";

export const statusRouter = Router();

statusRouter.get("/summary", getStatusSummary);
