import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import * as service from "./label.service";

export const create = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 201,
		message: "Label created",
		data: await service.create(req.user!.id, req.body, req.ip),
	}),
);
export const list = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 200,
		message: "Labels retrieved",
		data: await service.list(
			req.user!.id,
			String(req.query.organizationId ?? ""),
		),
	}),
);
export const update = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 200,
		message: "Label updated",
		data: await service.update(
			req.user!.id,
			String(req.params.id),
			req.body,
			req.ip,
		),
	}),
);
export const remove = catchAsync(async (req: Request, res: Response) => {
	await service.remove(req.user!.id, String(req.params.id), req.ip);
	sendResponse(res, { statusCode: 200, message: "Label deleted", data: null });
});
export const assignToTask = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 201,
		message: "Label assigned",
		data: await service.assignToTask(
			req.user!.id,
			String(req.params.id),
			String(req.params.taskId),
			req.ip,
		),
	}),
);
export const removeFromTask = catchAsync(
	async (req: Request, res: Response) => {
		await service.removeFromTask(
			req.user!.id,
			String(req.params.id),
			String(req.params.taskId),
		);
		sendResponse(res, {
			statusCode: 200,
			message: "Label removed",
			data: null,
		});
	},
);
