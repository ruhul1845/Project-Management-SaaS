import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import * as service from "./task.service";

export const create = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 201,
		message: "Task created",
		data: await service.create(req.user!.id, req.body, req.ip),
	}),
);
export const list = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 200,
		message: "Tasks retrieved",
		...(await service.list(req.user!.id, req.query)),
	}),
);
export const myTasks = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 200,
		message: "Assigned tasks retrieved",
		...(await service.myTasks(req.user!.id, req.query)),
	}),
);
export const getById = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 200,
		message: "Task retrieved",
		data: await service.getById(req.user!.id, String(req.params.id)),
	}),
);
export const update = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 200,
		message: "Task updated",
		data: await service.update(
			req.user!.id,
			String(req.params.id),
			req.body,
			req.ip,
		),
	}),
);
export const changeStatus = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 200,
		message: "Task status updated",
		data: await service.changeStatus(
			req.user!.id,
			String(req.params.id),
			req.body.status,
			req.ip,
		),
	}),
);
export const assign = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 200,
		message: "Task assignment updated",
		data: await service.assign(
			req.user!.id,
			String(req.params.id),
			req.body.assigneeId,
			req.ip,
		),
	}),
);
export const remove = catchAsync(async (req: Request, res: Response) => {
	await service.softDelete(req.user!.id, String(req.params.id), req.ip);
	sendResponse(res, { statusCode: 200, message: "Task deleted", data: null });
});
export const addAttachment = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 201,
		message: "Attachment uploaded",
		data: await service.addAttachment(
			req.user!.id,
			String(req.params.id),
			req.file,
			req.ip,
		),
	}),
);
