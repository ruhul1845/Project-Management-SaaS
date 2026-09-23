import type { NextFunction, Request, RequestHandler, Response } from "express";

export const catchAsync =
	(handler: RequestHandler) =>
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			await handler(req, res, next);
		} catch (error) {
			next(error);
		}
	};
