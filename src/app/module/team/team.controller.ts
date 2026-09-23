import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import * as service from "./team.service";

export const create = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 201,
		message: "Team created",
		data: await service.create(req.user!.id, req.body, req.ip),
	}),
);
export const list = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 200,
		message: "Teams retrieved",
		data: await service.list(
			req.user!.id,
			String(req.query.organizationId ?? ""),
			req.query,
		),
	}),
);
export const getById = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 200,
		message: "Team retrieved",
		data: await service.getById(req.user!.id, String(req.params.id)),
	}),
);
export const update = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 200,
		message: "Team updated",
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
	sendResponse(res, { statusCode: 200, message: "Team deleted", data: null });
});
export const addMember = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 201,
		message: "Team member added",
		data: await service.addMember(
			req.user!.id,
			String(req.params.id),
			req.body,
			req.ip,
		),
	}),
);
export const updateMember = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 200,
		message: "Team member updated",
		data: await service.updateMember(
			req.user!.id,
			String(req.params.id),
			String(req.params.memberId),
			req.body.role,
		),
	}),
);
export const removeMember = catchAsync(async (req: Request, res: Response) => {
	await service.removeMember(
		req.user!.id,
		String(req.params.id),
		String(req.params.memberId),
	);
	sendResponse(res, {
		statusCode: 200,
		message: "Team member removed",
		data: null,
	});
});
