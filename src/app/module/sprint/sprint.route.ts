import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import * as controller from "./sprint.controller";
import { createSprintSchema } from "./sprint.validation";

export const sprintRoutes = Router();
sprintRoutes.use(checkAuth);
sprintRoutes.post("/", validateRequest(createSprintSchema), controller.create);
sprintRoutes.get("/", controller.list);
sprintRoutes.patch("/:id/start", controller.start);
sprintRoutes.patch("/:id/complete", controller.complete);
