import { z } from "zod";
import { uuid } from "../../validation/common";

const color = z
	.string()
	.regex(/^#[0-9A-Fa-f]{6}$/, "Use a six-digit hex color");

export const createLabelSchema = z.object({
	body: z.object({
		organizationId: uuid,
		name: z.string().min(1).max(40),
		color: color.optional(),
	}),
});

export const updateLabelSchema = z.object({
	params: z.object({ id: uuid }),
	body: z.object({
		name: z.string().min(1).max(40).optional(),
		color: color.optional(),
	}),
});

export const labelIdParamsSchema = z.object({
	params: z.object({ id: uuid }),
});

export const labelTaskParamsSchema = z.object({
	params: z.object({ id: uuid, taskId: uuid }),
});

export const listLabelsSchema = z.object({
	query: z.object({ organizationId: uuid }),
});
