import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import * as service from "./organization.service";

export const create = catchAsync(async (req: Request, res: Response) => {
	const data = await service.create(req.user!.id, req.body, req.ip);
	sendResponse(res, { statusCode: 201, message: "Organization created", data });
});
export const getMine = catchAsync(async (req: Request, res: Response) => {
	sendResponse(res, {
		statusCode: 200,
		message: "Organizations retrieved",
		data: await service.getMine(req.user!.id),
	});
});
export const getById = catchAsync(async (req: Request, res: Response) => {
	sendResponse(res, {
		statusCode: 200,
		message: "Organization retrieved",
		data: await service.getById(String(req.params.organizationId)),
	});
});
export const update = catchAsync(async (req: Request, res: Response) => {
	sendResponse(res, {
		statusCode: 200,
		message: "Organization updated",
		data: await service.update(
			String(req.params.organizationId),
			req.user!.id,
			req.body,
			req.ip,
		),
	});
});
export const remove = catchAsync(async (req: Request, res: Response) => {
	await service.softDelete(
		String(req.params.organizationId),
		req.user!.id,
		req.ip,
	);
	sendResponse(res, {
		statusCode: 200,
		message: "Organization deleted",
		data: null,
	});
});
export const addMember = catchAsync(async (req: Request, res: Response) => {
	const data = await service.addMember(
		String(req.params.organizationId),
		req.user!.id,
		req.body,
		req.ip,
	);
	sendResponse(res, { statusCode: 201, message: "Member added", data });
});
export const listMembers = catchAsync(async (req: Request, res: Response) => {
	const result = await service.listMembers(
		String(req.params.organizationId),
		req.query,
	);
	sendResponse(res, {
		statusCode: 200,
		message: "Members retrieved",
		...result,
	});
});
export const updateMemberRole = catchAsync(
	async (req: Request, res: Response) => {
		const data = await service.updateMemberRole(
			String(req.params.organizationId),
			String(req.params.memberId),
			req.user!.id,
			req.body.role,
			req.ip,
		);
		sendResponse(res, {
			statusCode: 200,
			message: "Member role updated",
			data,
		});
	},
);
export const removeMember = catchAsync(async (req: Request, res: Response) => {
	await service.removeMember(
		String(req.params.organizationId),
		String(req.params.memberId),
		req.user!.id,
		req.organizationRole!,
		req.ip,
	);
	sendResponse(res, { statusCode: 200, message: "Member removed", data: null });
});
