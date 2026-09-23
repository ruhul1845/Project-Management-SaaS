import { z } from "zod";

export const createCommentSchema = z.object({
	body: z.object({
		taskId: z.uuid(),
		content: z.string().min(1).max(3000),
		mentionedUserIds: z.array(z.uuid()).max(20).optional(),
	}),
});
export const updateCommentSchema = z.object({
	body: z.object({
		content: z.string().min(1).max(3000),
		mentionedUserIds: z.array(z.uuid()).max(20).optional(),
	}),
});
