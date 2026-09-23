import { z } from "zod";
import { paginationQuery, searchQuery, uuid } from "../../validation/common";

const status = z.enum([
	"PLANNING",
	"ACTIVE",
	"ON_HOLD",
	"COMPLETED",
	"ARCHIVED",
]);
export const createProjectSchema = z.object({
	body: z.object({
		organizationId: uuid,
		name: z.string().min(2).max(120),
		key: z
			.string()
			.min(2)
			.max(10)
			.regex(/^[A-Z][A-Z0-9]*$/),
		description: z.string().max(2000).optional(),
		startDate: z.iso.datetime().optional(),
		dueDate: z.iso.datetime().optional(),
		teamId: uuid.optional(),
	}),
});
export const updateProjectSchema = z.object({
	params: z.object({ id: uuid }),
	body: z.object({
		name: z.string().min(2).max(120).optional(),
		description: z.string().max(2000).nullable().optional(),
		status: status.optional(),
		startDate: z.iso.datetime().nullable().optional(),
		dueDate: z.iso.datetime().nullable().optional(),
		teamId: uuid.nullable().optional(),
	}),
});

export const projectIdParamsSchema = z.object({
	params: z.object({ id: uuid }),
});

export const listProjectsSchema = z.object({
	query: z.object({
		organizationId: uuid,
		...paginationQuery,
		search: searchQuery,
		status: status.optional(),
		teamId: uuid.optional(),
		sortBy: z.enum(["createdAt", "updatedAt", "dueDate", "name"]).optional(),
		sortOrder: z.enum(["asc", "desc"]).optional(),
	}),
});
