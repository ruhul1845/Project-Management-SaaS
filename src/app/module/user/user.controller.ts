import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import * as service from "./user.service";

export const getMe = catchAsync(async (req: Request, res: Response) => {
	sendResponse(res, {
		statusCode: 200,
		message: "Profile retrieved",
		data: await service.getMe(req.user!.id),
	});
});
export const updateMe = catchAsync(async (req: Request, res: Response) => {
	sendResponse(res, {
		statusCode: 200,
		message: "Profile updated",
		data: await service.updateMe(req.user!.id, req.body),
	});
});
