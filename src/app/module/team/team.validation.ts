import { z } from "zod";
import { searchQuery, uuid } from "../../validation/common";

const teamRole = z.enum(["LEAD", "MEMBER", "VIEWER"]);

export const createTeamSchema = z.object({
	body: z.object({
		organizationId: uuid,
		name: z.string().min(2).max(100),
		description: z.string().max(500).optional(),
	}),
});

export const updateTeamSchema = z.object({
	params: z.object({ id: uuid }),
	body: z.object({
		name: z.string().min(2).max(100).optional(),
		description: z.string().max(500).nullable().optional(),
	}),
});

export const addTeamMemberSchema = z.object({
	params: z.object({ id: uuid }),
	body: z.object({ email: z.email(), role: teamRole.default("MEMBER") }),
});

export const updateTeamMemberSchema = z.object({
	params: z.object({ id: uuid, memberId: uuid }),
	body: z.object({ role: teamRole }),
});

export const teamIdParamsSchema = z.object({
	params: z.object({ id: uuid }),
});

export const teamMemberParamsSchema = z.object({
	params: z.object({ id: uuid, memberId: uuid }),
});

export const listTeamsSchema = z.object({
	query: z.object({
		organizationId: uuid,
		search: searchQuery,
	}),
});
