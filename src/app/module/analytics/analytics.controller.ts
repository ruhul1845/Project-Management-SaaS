import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import * as service from "./analytics.service";

export const dashboard = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 200,
		message: "Dashboard analytics retrieved",
		data: await service.dashboard(
			req.user!.id,
			String(req.query.organizationId ?? ""),
		),
	}),
);
export const auditLogs = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 200,
		message: "Audit logs retrieved",
		...(await service.auditLogs(
			req.user!.id,
			String(req.query.organizationId ?? ""),
			req.query,
		)),
	}),
);
