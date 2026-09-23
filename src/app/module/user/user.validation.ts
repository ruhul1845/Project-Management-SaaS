import { z } from "zod";

export const updateProfileSchema = z.object({
	body: z
		.object({
			name: z.string().min(2).max(80).optional(),
			avatarUrl: z.url().nullable().optional(),
		})
		.refine(
			(value) => Object.keys(value).length > 0,
			"At least one field is required",
		),
});
