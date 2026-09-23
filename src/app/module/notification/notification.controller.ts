import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import * as service from "./notification.service";

export const list = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 200,
		message: "Notifications retrieved",
		...(await service.list(req.user!.id, req.query)),
	}),
);
export const unreadCount = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 200,
		message: "Unread count retrieved",
		data: { count: await service.unreadCount(req.user!.id) },
	}),
);
export const markRead = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 200,
		message: "Notification marked as read",
		data: await service.markRead(req.user!.id, String(req.params.id)),
	}),
);
export const markAllRead = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 200,
		message: "Notifications marked as read",
		data: await service.markAllRead(req.user!.id),
	}),
);
