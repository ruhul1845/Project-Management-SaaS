import { z } from "zod";
import { paginationQuery, searchQuery, uuid } from "../../validation/common";

export const usersQuerySchema = z.object({
	query: z.object({
		...paginationQuery,
		search: searchQuery,
		status: z.enum(["ACTIVE", "BLOCKED"]).optional(),
	}),
});

export const organizationsQuerySchema = z.object({
	query: z.object({
		...paginationQuery,
		search: searchQuery,
	}),
});

export const updateUserStatusSchema = z.object({
	params: z.object({ id: uuid }),
	body: z.object({ status: z.enum(["ACTIVE", "BLOCKED"]) }),
});

export const updateSystemRoleSchema = z.object({
	params: z.object({ id: uuid }),
	body: z.object({ role: z.enum(["ADMIN", "MEMBER"]) }),
});
