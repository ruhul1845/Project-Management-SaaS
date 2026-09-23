import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { config } from "./app/config";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import { analyticsRoutes } from "./app/module/analytics/analytics.route";
import { adminRoutes } from "./app/module/admin/admin.route";
import { authRoutes } from "./app/module/auth/auth.route";
import { calendarRoutes } from "./app/module/calendar/calendar.route";
import { commentRoutes } from "./app/module/comment/comment.route";
import { labelRoutes } from "./app/module/label/label.route";
import { notificationRoutes } from "./app/module/notification/notification.route";
import { organizationRoutes } from "./app/module/organization/organization.route";
import { webhook } from "./app/module/payment/payment.controller";
import { paymentRoutes } from "./app/module/payment/payment.route";
import { projectRoutes } from "./app/module/project/project.route";
import { sprintRoutes } from "./app/module/sprint/sprint.route";
import { taskRoutes } from "./app/module/task/task.route";
import { teamRoutes } from "./app/module/team/team.route";
import { userRoutes } from "./app/module/user/user.route";

const app = express();
app.set("trust proxy", 1);
app.use(helmet());
app.use(
	cors({
		origin: config.FRONTEND_URL.split(",").map((origin) => origin.trim()),
		credentials: true,
	}),
);
app.use(
	rateLimit({
		windowMs: 15 * 60 * 1000,
		limit: 300,
		standardHeaders: "draft-8",
		legacyHeaders: false,
	}),
);

// Stripe requires the unmodified request body for signature verification.
app.post(
	"/api/v1/payments/webhook",
	express.raw({ type: "application/json" }),
	webhook,
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (_req, res) =>
	res.status(200).json({
		success: true,
		message: "TaskFlow Project Management API",
		data: { version: "v1", health: "/health" },
	}),
);
app.get("/health", (_req, res) =>
	res.status(200).json({
		success: true,
		message: "API is healthy",
		data: { uptime: process.uptime(), timestamp: new Date().toISOString() },
	}),
);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/organizations", organizationRoutes);
app.use("/api/v1/teams", teamRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/sprints", sprintRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/comments", commentRoutes);
app.use("/api/v1/labels", labelRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/calendar", calendarRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/analytics", analyticsRoutes);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
