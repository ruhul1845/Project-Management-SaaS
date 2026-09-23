import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import * as controller from "./analytics.controller";
import {
	auditLogsQuerySchema,
	dashboardQuerySchema,
} from "./analytics.validation";

export const analyticsRoutes = Router();
analyticsRoutes.use(checkAuth);
analyticsRoutes.get(
	"/dashboard",
	validateRequest(dashboardQuerySchema),
	controller.dashboard,
);
analyticsRoutes.get(
	"/audit-logs",
	validateRequest(auditLogsQuerySchema),
	controller.auditLogs,
);
