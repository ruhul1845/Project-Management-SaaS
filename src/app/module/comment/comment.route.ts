import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { idParamsSchema } from "../../validation/common";
import * as controller from "./comment.controller";
import {
	createCommentSchema,
	listCommentsSchema,
	updateCommentSchema,
} from "./comment.validation";

export const commentRoutes = Router();
commentRoutes.use(checkAuth);
commentRoutes.post(
	"/",
	validateRequest(createCommentSchema),
	controller.create,
);
commentRoutes.get("/", validateRequest(listCommentsSchema), controller.list);
commentRoutes.patch(
	"/:id",
	validateRequest(updateCommentSchema),
	controller.update,
);
commentRoutes.delete(
	"/:id",
	validateRequest(idParamsSchema),
	controller.remove,
);
