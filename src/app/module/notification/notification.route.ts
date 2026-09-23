import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import * as controller from "./notification.controller";

export const notificationRoutes = Router();
notificationRoutes.use(checkAuth);
notificationRoutes.get("/", controller.list);
notificationRoutes.get("/unread-count", controller.unreadCount);
notificationRoutes.patch("/read-all", controller.markAllRead);
notificationRoutes.patch("/:id/read", controller.markRead);
