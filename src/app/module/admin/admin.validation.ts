import { z } from "zod";

export const updateUserStatusSchema = z.object({
	body: z.object({ status: z.enum(["ACTIVE", "BLOCKED"]) }),
});

export const updateSystemRoleSchema = z.object({
	body: z.object({ role: z.enum(["ADMIN", "MEMBER"]) }),
});
