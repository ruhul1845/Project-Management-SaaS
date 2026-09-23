import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import * as service from "./calendar.service";

export const getCalendar = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 200,
		message: "Calendar retrieved",
		data: await service.getCalendar(
			req.user!.id,
			String(req.query.organizationId ?? ""),
			req.query,
		),
	}),
);
