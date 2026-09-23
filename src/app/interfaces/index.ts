import type { Role } from "../../generated/prisma/client";

export type AuthUser = {
	id: string;
	email: string;
	role: Role;
};

declare global {
	namespace Express {
		interface Request {
			user?: AuthUser;
			organizationRole?: Role;
		}
	}
}

export type PaginationMeta = {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
};
