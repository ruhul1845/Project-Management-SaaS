import { z } from "zod";
import { uuid } from "../../validation/common";

export const createCommentSchema = z.object({
	body: z.object({
		taskId: uuid,
		content: z.string().min(1).max(3000),
		mentionedUserIds: z.array(uuid).max(20).optional(),
	}),
});
export const updateCommentSchema = z.object({
	params: z.object({ id: uuid }),
	body: z.object({
		content: z.string().min(1).max(3000),
		mentionedUserIds: z.array(uuid).max(20).optional(),
	}),
});

export const listCommentsSchema = z.object({
	query: z.object({ taskId: uuid }),
});
