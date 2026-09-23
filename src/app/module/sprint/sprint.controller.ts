import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import * as service from "./sprint.service";

export const create = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 201,
		message: "Sprint created",
		data: await service.create(req.user!.id, req.body, req.ip),
	}),
);
export const list = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 200,
		message: "Sprints retrieved",
		data: await service.list(req.user!.id, String(req.query.projectId ?? "")),
	}),
);
export const start = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 200,
		message: "Sprint started",
		data: await service.start(req.user!.id, String(req.params.id), req.ip),
	}),
);
export const complete = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 200,
		message: "Sprint completed",
		data: await service.complete(req.user!.id, String(req.params.id), req.ip),
	}),
);
