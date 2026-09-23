import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import * as controller from "./auth.controller";
import {
	googleLoginSchema,
	loginSchema,
	refreshSchema,
	registerSchema,
} from "./auth.validation";

export const authRoutes = Router();
authRoutes.post(
	"/register",
	validateRequest(registerSchema),
	controller.register,
);
authRoutes.post("/login", validateRequest(loginSchema), controller.login);
authRoutes.post(
	"/google",
	validateRequest(googleLoginSchema),
	controller.googleLogin,
);
authRoutes.post(
	"/refresh-token",
	validateRequest(refreshSchema),
	controller.refresh,
);
authRoutes.post("/logout", checkAuth, controller.logout);
