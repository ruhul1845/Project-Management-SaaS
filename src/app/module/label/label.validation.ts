import { z } from "zod";

const color = z
	.string()
	.regex(/^#[0-9A-Fa-f]{6}$/, "Use a six-digit hex color");

export const createLabelSchema = z.object({
	body: z.object({
		organizationId: z.uuid(),
		name: z.string().min(1).max(40),
		color: color.optional(),
	}),
});

export const updateLabelSchema = z.object({
	body: z.object({
		name: z.string().min(1).max(40).optional(),
		color: color.optional(),
	}),
});
