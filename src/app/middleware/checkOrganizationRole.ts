import type { Role } from "../../generated/prisma/client";
import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";

const getOrganizationId = (req: Request) => {
	const value =
		req.params.organizationId ??
		req.body.organizationId ??
		req.query.organizationId;
	return Array.isArray(value) ? value[0] : value;
};

export const checkOrganizationRole = (...allowedRoles: Role[]) =>
	catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
		if (!req.user) throw new AppError(401, "Authentication required");
		const organizationId = getOrganizationId(req);
		if (!organizationId) throw new AppError(400, "organizationId is required");

		const membership = await prisma.membership.findFirst({
			where: {
				userId: req.user.id,
				organizationId,
				organization: { deletedAt: null },
			},
			select: { role: true },
		});
		if (!membership) throw new AppError(403, "Organization access denied");
		if (allowedRoles.length && !allowedRoles.includes(membership.role)) {
			throw new AppError(403, "You do not have permission for this action");
		}
		req.organizationRole = membership.role;
		next();
	});
