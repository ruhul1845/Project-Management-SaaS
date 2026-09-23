import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import * as service from "./payment.service";

export const createCheckout = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 201,
		message: "Stripe Checkout session created",
		data: await service.createCheckout(req.user!.id, req.body.organizationId),
	}),
);
export const webhook = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 200,
		message: "Webhook processed",
		data: await service.handleWebhook(
			req.body as Buffer,
			req.headers["stripe-signature"] as string | undefined,
		),
	}),
);
export const getPayment = catchAsync(async (req: Request, res: Response) =>
	sendResponse(res, {
		statusCode: 200,
		message: "Payment retrieved",
		data: await service.getPayment(req.user!.id, String(req.params.id)),
	}),
);
