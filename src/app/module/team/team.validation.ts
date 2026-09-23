import { z } from "zod";

const teamRole = z.enum(["LEAD", "MEMBER", "VIEWER"]);

export const createTeamSchema = z.object({
	body: z.object({
		organizationId: z.uuid(),
		name: z.string().min(2).max(100),
		description: z.string().max(500).optional(),
	}),
});

export const updateTeamSchema = z.object({
	body: z.object({
		name: z.string().min(2).max(100).optional(),
		description: z.string().max(500).nullable().optional(),
	}),
});

export const addTeamMemberSchema = z.object({
	body: z.object({ email: z.email(), role: teamRole.default("MEMBER") }),
});

export const updateTeamMemberSchema = z.object({
	body: z.object({ role: teamRole }),
});
