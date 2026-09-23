import { Router } from "express";
import { upload } from "../../lib/multer";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import * as controller from "./task.controller";
import {
	assignTaskSchema,
	createTaskSchema,
	kanbanQuerySchema,
	listTasksSchema,
	myTasksQuerySchema,
	taskIdParamsSchema,
	taskStatusSchema,
	updateTaskSchema,
} from "./task.validation";

export const taskRoutes = Router();
taskRoutes.use(checkAuth);
taskRoutes.post("/", validateRequest(createTaskSchema), controller.create);
taskRoutes.get("/", validateRequest(listTasksSchema), controller.list);
taskRoutes.get(
	"/mine",
	validateRequest(myTasksQuerySchema),
	controller.myTasks,
);
taskRoutes.get(
	"/kanban",
	validateRequest(kanbanQuerySchema),
	controller.kanban,
);
taskRoutes.get("/:id", validateRequest(taskIdParamsSchema), controller.getById);
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
	validateRequest(taskIdParamsSchema),
	upload.single("file"),
	controller.addAttachment,
);
taskRoutes.delete(
	"/:id",
	validateRequest(taskIdParamsSchema),
	controller.remove,
);
