import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import * as controller from "./calendar.controller";

export const calendarRoutes = Router();
calendarRoutes.use(checkAuth);
calendarRoutes.get("/", controller.getCalendar);
