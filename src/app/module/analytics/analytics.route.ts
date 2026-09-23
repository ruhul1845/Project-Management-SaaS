import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import * as controller from "./analytics.controller";

export const analyticsRoutes = Router();
analyticsRoutes.use(checkAuth);
analyticsRoutes.get("/dashboard", controller.dashboard);
analyticsRoutes.get("/audit-logs", controller.auditLogs);
