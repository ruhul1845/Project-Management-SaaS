import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import * as controller from "./label.controller";
import { createLabelSchema, updateLabelSchema } from "./label.validation";

export const labelRoutes = Router();
labelRoutes.use(checkAuth);
labelRoutes.post("/", validateRequest(createLabelSchema), controller.create);
labelRoutes.get("/", controller.list);
labelRoutes.patch(
	"/:id",
	validateRequest(updateLabelSchema),
	controller.update,
);
labelRoutes.delete("/:id", controller.remove);
labelRoutes.post("/:id/tasks/:taskId", controller.assignToTask);
labelRoutes.delete("/:id/tasks/:taskId", controller.removeFromTask);
