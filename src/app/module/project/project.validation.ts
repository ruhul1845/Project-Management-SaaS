import { z } from "zod";

const status = z.enum([
	"PLANNING",
	"ACTIVE",
	"ON_HOLD",
	"COMPLETED",
	"ARCHIVED",
]);
export const createProjectSchema = z.object({
	body: z.object({
		organizationId: z.uuid(),
		name: z.string().min(2).max(120),
		key: z
			.string()
			.min(2)
			.max(10)
			.regex(/^[A-Z][A-Z0-9]*$/),
		description: z.string().max(2000).optional(),
		startDate: z.iso.datetime().optional(),
		dueDate: z.iso.datetime().optional(),
		teamId: z.uuid().optional(),
	}),
});
export const updateProjectSchema = z.object({
	body: z.object({
		name: z.string().min(2).max(120).optional(),
		description: z.string().max(2000).nullable().optional(),
		status: status.optional(),
		startDate: z.iso.datetime().nullable().optional(),
		dueDate: z.iso.datetime().nullable().optional(),
		teamId: z.uuid().nullable().optional(),
	}),
});
