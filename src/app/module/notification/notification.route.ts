import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { idParamsSchema } from "../../validation/common";
import * as controller from "./notification.controller";
import { listNotificationsSchema } from "./notification.validation";

export const notificationRoutes = Router();
notificationRoutes.use(checkAuth);
notificationRoutes.get(
	"/",
	validateRequest(listNotificationsSchema),
	controller.list,
);
notificationRoutes.get("/unread-count", controller.unreadCount);
notificationRoutes.patch("/read-all", controller.markAllRead);
notificationRoutes.patch(
	"/:id/read",
	validateRequest(idParamsSchema),
	controller.markRead,
);
