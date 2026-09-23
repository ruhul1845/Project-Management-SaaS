import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import * as controller from "./user.controller";
import { updateProfileSchema } from "./user.validation";

export const userRoutes = Router();
userRoutes.use(checkAuth);
userRoutes.get("/me", controller.getMe);
userRoutes.patch(
	"/me",
	validateRequest(updateProfileSchema),
	controller.updateMe,
);
