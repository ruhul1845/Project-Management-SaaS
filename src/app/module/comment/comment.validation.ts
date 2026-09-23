import { z } from "zod";

export const createCommentSchema = z.object({
	body: z.object({ taskId: z.uuid(), content: z.string().min(1).max(3000) }),
});
export const updateCommentSchema = z.object({
	body: z.object({ content: z.string().min(1).max(3000) }),
});
