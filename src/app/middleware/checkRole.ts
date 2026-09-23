import type { Role } from "../../generated/prisma/client";
import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";

export const checkRole =
	(...allowedRoles: Role[]) =>
	(req: Request, _res: Response, next: NextFunction) => {
		if (!req.user || !allowedRoles.includes(req.user.role))
			return next(new AppError(403, "Insufficient system role"));
		next();
	};
