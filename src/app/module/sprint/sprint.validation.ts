import { z } from "zod";
import { uuid } from "../../validation/common";

export const createSprintSchema = z.object({
	body: z.object({
		projectId: uuid,
		name: z.string().min(2).max(100),
		goal: z.string().max(500).optional(),
		startDate: z.iso.datetime(),
		endDate: z.iso.datetime(),
	}),
});

export const listSprintsSchema = z.object({
	query: z.object({ projectId: uuid }),
});

export const sprintIdParamsSchema = z.object({
	params: z.object({ id: uuid }),
});
