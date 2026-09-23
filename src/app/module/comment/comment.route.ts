import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import * as controller from "./comment.controller";
import { createCommentSchema, updateCommentSchema } from "./comment.validation";

export const commentRoutes = Router();
commentRoutes.use(checkAuth);
commentRoutes.post(
	"/",
	validateRequest(createCommentSchema),
	controller.create,
);
commentRoutes.get("/", controller.list);
commentRoutes.patch(
	"/:id",
	validateRequest(updateCommentSchema),
	controller.update,
);
commentRoutes.delete("/:id", controller.remove);
