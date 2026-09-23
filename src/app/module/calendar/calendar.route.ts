import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import * as controller from "./calendar.controller";
import { calendarQuerySchema } from "./calendar.validation";

export const calendarRoutes = Router();
calendarRoutes.use(checkAuth);
calendarRoutes.get(
	"/",
	validateRequest(calendarQuerySchema),
	controller.getCalendar,
);
