import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import * as service from "./admin.service";

export const users = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 200,
		message: "Users retrieved",
		...(await service.users(req.query)),
	}),
);
export const organizations = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 200,
		message: "Organizations retrieved",
		...(await service.organizations(req.query)),
	}),
);
export const dashboard = catchAsync(async (_req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 200,
		message: "Admin dashboard retrieved",
		data: await service.dashboard(),
	}),
);
export const updateStatus = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 200,
		message: "User status updated",
		data: await service.updateStatus(
			req.user!.id,
			String(req.params.id),
			req.body.status,
		),
	}),
);
export const updateRole = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 200,
		message: "System role updated",
		data: await service.updateRole(
			req.user!.id,
			String(req.params.id),
			req.body.role,
		),
	}),
);
