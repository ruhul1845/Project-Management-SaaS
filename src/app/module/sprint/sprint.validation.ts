import { z } from "zod";

export const createSprintSchema = z.object({
	body: z.object({
		projectId: z.uuid(),
		name: z.string().min(2).max(100),
		goal: z.string().max(500).optional(),
		startDate: z.iso.datetime(),
		endDate: z.iso.datetime(),
	}),
});
