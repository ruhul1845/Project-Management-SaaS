import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import * as controller from "./project.controller";
import {
	createProjectSchema,
	listProjectsSchema,
	projectIdParamsSchema,
	updateProjectSchema,
} from "./project.validation";

export const projectRoutes = Router();
projectRoutes.use(checkAuth);
projectRoutes.post(
	"/",
	validateRequest(createProjectSchema),
	controller.create,
);
projectRoutes.get("/", validateRequest(listProjectsSchema), controller.list);
projectRoutes.get(
	"/:id",
	validateRequest(projectIdParamsSchema),
	controller.getById,
);
projectRoutes.patch(
	"/:id",
	validateRequest(updateProjectSchema),
	controller.update,
);
projectRoutes.delete(
	"/:id",
	validateRequest(projectIdParamsSchema),
	controller.remove,
);
