import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { AppError } from "../utils/AppError";

export const validateRequest =
	(schema: ZodType) => (req: Request, _res: Response, next: NextFunction) => {
		const result = schema.safeParse({
			body: req.body,
			query: req.query,
			params: req.params,
		});
		if (!result.success) {
			return next(new AppError(400, "Validation failed", result.error.issues));
		}
		const parsed = result.data as {
			body?: unknown;
			query?: unknown;
			params?: unknown;
		};
		if (parsed.body !== undefined) req.body = parsed.body;
		next();
	};
