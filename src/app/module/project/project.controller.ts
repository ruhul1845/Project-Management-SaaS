import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import * as service from "./project.service";

export const create = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 201,
		message: "Project created",
		data: await service.create(req.user!.id, req.body, req.ip),
	}),
);
export const list = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 200,
		message: "Projects retrieved",
		...(await service.list(req.user!.id, req.query)),
	}),
);
export const getById = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 200,
		message: "Project retrieved",
		data: await service.getById(req.user!.id, String(req.params.id)),
	}),
);
export const update = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 200,
		message: "Project updated",
		data: await service.update(
			req.user!.id,
			String(req.params.id),
			req.body,
			req.ip,
		),
	}),
);
export const remove = catchAsync(async (req: Request, res: Response) => {
	await service.softDelete(req.user!.id, String(req.params.id), req.ip);
	sendResponse(res, {
		statusCode: 200,
		message: "Project deleted",
		data: null,
	});
});
