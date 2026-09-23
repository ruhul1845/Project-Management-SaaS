import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { checkRole } from "../../middleware/checkRole";
import { validateRequest } from "../../middleware/validateRequest";
import * as controller from "./admin.controller";
import {
	updateSystemRoleSchema,
	updateUserStatusSchema,
} from "./admin.validation";

export const adminRoutes = Router();
adminRoutes.use(checkAuth, checkRole("ADMIN"));
adminRoutes.get("/dashboard", controller.dashboard);
adminRoutes.get("/users", controller.users);
adminRoutes.get("/organizations", controller.organizations);
adminRoutes.patch(
	"/users/:id/status",
	validateRequest(updateUserStatusSchema),
	controller.updateStatus,
);
adminRoutes.patch(
	"/users/:id/role",
	validateRequest(updateSystemRoleSchema),
	controller.updateRole,
);
