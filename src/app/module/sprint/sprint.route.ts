import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import * as controller from "./sprint.controller";
import {
	createSprintSchema,
	listSprintsSchema,
	sprintIdParamsSchema,
} from "./sprint.validation";

export const sprintRoutes = Router();
sprintRoutes.use(checkAuth);
sprintRoutes.post("/", validateRequest(createSprintSchema), controller.create);
sprintRoutes.get("/", validateRequest(listSprintsSchema), controller.list);
sprintRoutes.patch(
	"/:id/start",
	validateRequest(sprintIdParamsSchema),
	controller.start,
);
sprintRoutes.patch(
	"/:id/complete",
	validateRequest(sprintIdParamsSchema),
	controller.complete,
);
