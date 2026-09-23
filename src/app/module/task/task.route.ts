import { Router } from "express";
import { upload } from "../../lib/multer";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import * as controller from "./task.controller";
import {
	assignTaskSchema,
	createTaskSchema,
	taskStatusSchema,
	updateTaskSchema,
} from "./task.validation";

export const taskRoutes = Router();
taskRoutes.use(checkAuth);
taskRoutes.post("/", validateRequest(createTaskSchema), controller.create);
taskRoutes.get("/", controller.list);
taskRoutes.get("/mine", controller.myTasks);
taskRoutes.get("/:id", controller.getById);
taskRoutes.patch("/:id", validateRequest(updateTaskSchema), controller.update);
taskRoutes.patch(
	"/:id/status",
	validateRequest(taskStatusSchema),
	controller.changeStatus,
);
taskRoutes.patch(
	"/:id/assign",
	validateRequest(assignTaskSchema),
	controller.assign,
);
taskRoutes.post(
	"/:id/attachments",
	upload.single("file"),
	controller.addAttachment,
);
taskRoutes.delete("/:id", controller.remove);
