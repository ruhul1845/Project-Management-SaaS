import { z } from "zod";
import { paginationQuery, searchQuery, uuid } from "../../validation/common";

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
		projectId: uuid,
		title: z.string().min(2).max(200),
		description: z.string().max(5000).optional(),
		priority: priority.optional(),
		dueDate: z.iso.datetime().optional(),
		sprintId: uuid.optional(),
		assigneeId: uuid.optional(),
		parentId: uuid.optional(),
	}),
});
export const updateTaskSchema = z.object({
	params: z.object({ id: uuid }),
	body: z.object({
		title: z.string().min(2).max(200).optional(),
		description: z.string().max(5000).nullable().optional(),
		priority: priority.optional(),
		dueDate: z.iso.datetime().nullable().optional(),
		sprintId: uuid.nullable().optional(),
		position: z.number().int().min(0).optional(),
	}),
});
export const taskStatusSchema = z.object({
	params: z.object({ id: uuid }),
	body: z.object({ status: taskStatus }),
});
export const assignTaskSchema = z.object({
	params: z.object({ id: uuid }),
	body: z.object({ assigneeId: uuid.nullable() }),
});

export const taskIdParamsSchema = z.object({
	params: z.object({ id: uuid }),
});

export const listTasksSchema = z.object({
	query: z.object({
		projectId: uuid,
		...paginationQuery,
		search: searchQuery,
		status: taskStatus.optional(),
		priority: priority.optional(),
		assigneeId: uuid.optional(),
		sprintId: uuid.optional(),
		labelId: uuid.optional(),
		sortBy: z
			.enum(["createdAt", "updatedAt", "dueDate", "priority", "position"])
			.optional(),
		sortOrder: z.enum(["asc", "desc"]).optional(),
	}),
});

export const myTasksQuerySchema = z.object({
	query: z.object({
		organizationId: uuid.optional(),
		status: taskStatus.optional(),
		...paginationQuery,
	}),
});

export const kanbanQuerySchema = z.object({
	query: z.object({
		projectId: uuid,
		sprintId: uuid.optional(),
		assigneeId: uuid.optional(),
		labelId: uuid.optional(),
	}),
});
