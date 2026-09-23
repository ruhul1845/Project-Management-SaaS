import { z } from "zod";

const taskStatus = z.enum([
	"TODO",
	"IN_PROGRESS",
	"IN_REVIEW",
	"DONE",
	"CANCELLED",
]);
const priority = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const createTaskSchema = z.object({
	body: z.object({
		projectId: z.uuid(),
		title: z.string().min(2).max(200),
		description: z.string().max(5000).optional(),
		priority: priority.optional(),
		dueDate: z.iso.datetime().optional(),
		sprintId: z.uuid().optional(),
		assigneeId: z.uuid().optional(),
		parentId: z.uuid().optional(),
	}),
});
export const updateTaskSchema = z.object({
	body: z.object({
		title: z.string().min(2).max(200).optional(),
		description: z.string().max(5000).nullable().optional(),
		priority: priority.optional(),
		dueDate: z.iso.datetime().nullable().optional(),
		sprintId: z.uuid().nullable().optional(),
		position: z.number().int().min(0).optional(),
	}),
});
export const taskStatusSchema = z.object({
	body: z.object({ status: taskStatus }),
});
export const assignTaskSchema = z.object({
	body: z.object({ assigneeId: z.uuid().nullable() }),
});
