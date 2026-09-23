import type { NextFunction, Request, Response } from "express";
import { config } from "../config";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { verifyToken } from "../utils/jwt";
import { catchAsync } from "../utils/catchAsync";

export const checkAuth = catchAsync(
	async (req: Request, _res: Response, next: NextFunction) => {
		const authorization = req.headers.authorization;
		if (!authorization?.startsWith("Bearer "))
			throw new AppError(401, "Authentication required");

		const payload = verifyToken(
			authorization.slice(7),
			config.JWT_ACCESS_SECRET,
		);
		const user = await prisma.user.findFirst({
			where: { id: payload.id, status: "ACTIVE", deletedAt: null },
			select: { id: true, email: true, role: true },
		});
		if (!user) throw new AppError(401, "Invalid or expired user session");
		req.user = user;
		next();
	},
);
