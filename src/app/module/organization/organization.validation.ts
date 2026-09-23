import { z } from "zod";

export const createOrganizationSchema = z.object({
	body: z.object({
		name: z.string().min(2).max(100),
		description: z.string().max(500).optional(),
	}),
});

export const updateOrganizationSchema = z.object({
	body: z.object({
		name: z.string().min(2).max(100).optional(),
		description: z.string().max(500).nullable().optional(),
		logoUrl: z.url().nullable().optional(),
	}),
});

export const addMemberSchema = z.object({
	body: z.object({
		email: z.email(),
		role: z.enum(["MANAGER", "MEMBER", "GUEST"]).default("MEMBER"),
	}),
});

export const updateMemberRoleSchema = z.object({
	body: z.object({ role: z.enum(["MANAGER", "MEMBER", "GUEST"]) }),
});
