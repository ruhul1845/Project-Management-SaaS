import { z } from "zod";
import { paginationQuery, searchQuery, uuid } from "../../validation/common";

export const createOrganizationSchema = z.object({
	body: z.object({
		name: z.string().min(2).max(100),
		description: z.string().max(500).optional(),
	}),
});

export const updateOrganizationSchema = z.object({
	params: z.object({ organizationId: uuid }),
	body: z.object({
		name: z.string().min(2).max(100).optional(),
		description: z.string().max(500).nullable().optional(),
		logoUrl: z.url().nullable().optional(),
	}),
});

export const addMemberSchema = z.object({
	params: z.object({ organizationId: uuid }),
	body: z.object({
		email: z.email(),
		role: z.enum(["MANAGER", "MEMBER", "GUEST"]).default("MEMBER"),
	}),
});

export const updateMemberRoleSchema = z.object({
	params: z.object({ organizationId: uuid, memberId: uuid }),
	body: z.object({ role: z.enum(["MANAGER", "MEMBER", "GUEST"]) }),
});

export const organizationIdParamsSchema = z.object({
	params: z.object({ organizationId: uuid }),
});

export const organizationMemberParamsSchema = z.object({
	params: z.object({ organizationId: uuid, memberId: uuid }),
});

export const listMembersSchema = z.object({
	params: z.object({ organizationId: uuid }),
	query: z.object({
		...paginationQuery,
		search: searchQuery,
	}),
});
