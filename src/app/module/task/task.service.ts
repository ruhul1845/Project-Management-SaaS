import type {
	Prisma,
	Priority,
	TaskStatus,
} from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { uploadBuffer } from "../../lib/cloudinary";
import { AppError } from "../../utils/AppError";
import {
	requireOrganizationMembership,
	requireProjectMembership,
	requireTaskMembership,
} from "../../utils/access";
import { writeAuditLog } from "../../utils/audit";
import { getPagination } from "../../utils/query";
import { createNotification } from "../../utils/notification";

type TaskInput = {
	projectId: string;
	title: string;
	description?: string;
	priority?: Priority;
	dueDate?: string;
	sprintId?: string;
	assigneeId?: string;
	parentId?: string;
};

const verifyRelations = async (input: {
	projectId: string;
	sprintId?: string | null;
	assigneeId?: string | null;
	parentId?: string | null;
}) => {
	if (input.sprintId) {
		const sprint = await prisma.sprint.findFirst({
			where: { id: input.sprintId, projectId: input.projectId },
		});
		if (!sprint)
			throw new AppError(400, "Sprint does not belong to this project");
	}
	if (input.parentId) {
		const parent = await prisma.task.findFirst({
			where: {
				id: input.parentId,
				projectId: input.projectId,
				deletedAt: null,
			},
		});
		if (!parent)
			throw new AppError(400, "Parent task does not belong to this project");
	}
	if (input.assigneeId)
		await requireProjectMembership(input.projectId, input.assigneeId, [
			"OWNER",
			"MANAGER",
			"MEMBER",
		]);
};

export const create = async (
	userId: string,
	input: TaskInput,
	ipAddress?: string,
) => {
	const { project } = await requireProjectMembership(input.projectId, userId, [
		"OWNER",
		"MANAGER",
		"MEMBER",
	]);
	await verifyRelations(input);
	const task = await prisma.task.create({
		data: { ...input, reporterId: userId },
	});
	await writeAuditLog(prisma, {
		organizationId: project.organizationId,
		actorId: userId,
		action: "TASK_CREATED",
		entity: "Task",
		entityId: task.id,
		metadata: { title: task.title },
		ipAddress,
	});
	return task;
};

export const list = async (userId: string, query: Record<string, unknown>) => {
	const projectId = String(query.projectId ?? "");
	await requireProjectMembership(projectId, userId);
	const { page, limit, skip } = getPagination(query);
	const search = typeof query.search === "string" ? query.search : undefined;
	const status =
		typeof query.status === "string" ? (query.status as TaskStatus) : undefined;
	const priority =
		typeof query.priority === "string"
			? (query.priority as Priority)
			: undefined;
	const assigneeId =
		typeof query.assigneeId === "string" ? query.assigneeId : undefined;
	const sprintId =
		typeof query.sprintId === "string" ? query.sprintId : undefined;
	const labelId = typeof query.labelId === "string" ? query.labelId : undefined;
	const sortBy = [
		"createdAt",
		"updatedAt",
		"dueDate",
		"priority",
		"position",
	].includes(String(query.sortBy))
		? String(query.sortBy)
		: "createdAt";
	const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";
	const where: Prisma.TaskWhereInput = {
		projectId,
		deletedAt: null,
		...(status ? { status } : {}),
		...(priority ? { priority } : {}),
		...(assigneeId ? { assigneeId } : {}),
		...(sprintId ? { sprintId } : {}),
		...(labelId ? { labels: { some: { labelId } } } : {}),
		...(search
			? {
					OR: [
						{ title: { contains: search, mode: "insensitive" } },
						{ description: { contains: search, mode: "insensitive" } },
					],
				}
			: {}),
	};
	const [data, total] = await prisma.$transaction([
		prisma.task.findMany({
			where,
			skip,
			take: limit,
			orderBy: { [sortBy]: sortOrder },
			include: {
				assignee: { select: { id: true, name: true, avatarUrl: true } },
				reporter: { select: { id: true, name: true } },
				labels: { include: { label: true } },
				_count: {
					select: { comments: true, subtasks: true, attachments: true },
				},
			},
		}),
		prisma.task.count({ where }),
	]);
	return {
		data,
		meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
	};
};

export const myTasks = async (
	userId: string,
	query: Record<string, unknown>,
) => {
	const { page, limit, skip } = getPagination(query);
	const organizationId =
		typeof query.organizationId === "string" ? query.organizationId : undefined;
	if (organizationId)
		await requireOrganizationMembership(organizationId, userId);
	const where: Prisma.TaskWhereInput = {
		assigneeId: userId,
		deletedAt: null,
		project: { deletedAt: null, ...(organizationId ? { organizationId } : {}) },
	};
	const [data, total] = await prisma.$transaction([
		prisma.task.findMany({
			where,
			skip,
			take: limit,
			include: {
				project: {
					select: { id: true, name: true, key: true, organizationId: true },
				},
			},
			orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
		}),
		prisma.task.count({ where }),
	]);
	return {
		data,
		meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
	};
};

export const getById = async (userId: string, id: string) => {
	const { organizationId } = await requireTaskMembership(id, userId);
	const [task, activity] = await prisma.$transaction([
		prisma.task.findUniqueOrThrow({
			where: { id },
			include: {
				assignee: {
					select: { id: true, name: true, email: true, avatarUrl: true },
				},
				reporter: { select: { id: true, name: true, email: true } },
				subtasks: { where: { deletedAt: null } },
				comments: {
					where: { deletedAt: null },
					include: {
						author: { select: { id: true, name: true, avatarUrl: true } },
						mentions: {
							include: { user: { select: { id: true, name: true } } },
						},
					},
				},
				attachments: true,
				labels: { include: { label: true } },
			},
		}),
		prisma.auditLog.findMany({
			where: { organizationId, entity: "Task", entityId: id },
			include: {
				actor: { select: { id: true, name: true, avatarUrl: true } },
			},
			orderBy: { createdAt: "desc" },
			take: 100,
		}),
	]);
	return { ...task, activity };
};

export const update = async (
	userId: string,
	id: string,
	input: Record<string, unknown>,
	ipAddress?: string,
) => {
	const { membership, organizationId } = await requireTaskMembership(
		id,
		userId,
		["OWNER", "MANAGER", "MEMBER"],
	);
	const existing = await prisma.task.findUniqueOrThrow({ where: { id } });
	if (
		membership.role === "MEMBER" &&
		existing.reporterId !== userId &&
		existing.assigneeId !== userId
	)
		throw new AppError(403, "Members can only edit their own tasks");
	await verifyRelations({
		projectId: existing.projectId,
		sprintId: input.sprintId as string | null | undefined,
	});
	const data = { ...input } as Record<string, unknown>;
	if (typeof data.dueDate === "string") data.dueDate = new Date(data.dueDate);
	const task = await prisma.task.update({ where: { id }, data });
	await writeAuditLog(prisma, {
		organizationId,
		actorId: userId,
		action: "TASK_UPDATED",
		entity: "Task",
		entityId: id,
		ipAddress,
	});
	return task;
};

const transitions: Record<TaskStatus, TaskStatus[]> = {
	TODO: ["IN_PROGRESS", "CANCELLED"],
	IN_PROGRESS: ["TODO", "IN_REVIEW", "CANCELLED"],
	IN_REVIEW: ["IN_PROGRESS", "DONE", "CANCELLED"],
	DONE: ["IN_PROGRESS"],
	CANCELLED: ["TODO"],
};

export const changeStatus = async (
	userId: string,
	id: string,
	status: TaskStatus,
	ipAddress?: string,
) => {
	const { membership, organizationId } = await requireTaskMembership(
		id,
		userId,
		["OWNER", "MANAGER", "MEMBER"],
	);
	const task = await prisma.task.findUniqueOrThrow({ where: { id } });
	if (
		membership.role === "MEMBER" &&
		task.assigneeId !== userId &&
		task.reporterId !== userId
	)
		throw new AppError(
			403,
			"Only the assignee or reporter can change this task",
		);
	if (!transitions[task.status].includes(status))
		throw new AppError(
			409,
			`Cannot move task from ${task.status} to ${status}`,
		);
	const updated = await prisma.task.update({ where: { id }, data: { status } });
	await writeAuditLog(prisma, {
		organizationId,
		actorId: userId,
		action: "TASK_STATUS_CHANGED",
		entity: "Task",
		entityId: id,
		metadata: { from: task.status, to: status },
		ipAddress,
	});
	return updated;
};

export const assign = async (
	userId: string,
	id: string,
	assigneeId: string | null,
	ipAddress?: string,
) => {
	const { task, organizationId } = await requireTaskMembership(id, userId, [
		"OWNER",
		"MANAGER",
	]);
	if (assigneeId)
		await requireProjectMembership(task.projectId, assigneeId, [
			"OWNER",
			"MANAGER",
			"MEMBER",
		]);
	const updated = await prisma.task.update({
		where: { id: task.id },
		data: { assigneeId },
	});
	if (assigneeId && assigneeId !== userId)
		await createNotification(prisma, {
			userId: assigneeId,
			organizationId,
			type: "TASK_ASSIGNED",
			title: "Task assigned",
			message: "A task was assigned to you",
			metadata: { taskId: id },
		});
	await writeAuditLog(prisma, {
		organizationId,
		actorId: userId,
		action: "TASK_ASSIGNED",
		entity: "Task",
		entityId: id,
		metadata: { assigneeId },
		ipAddress,
	});
	return updated;
};

export const softDelete = async (
	userId: string,
	id: string,
	ipAddress?: string,
) => {
	const { membership, organizationId } = await requireTaskMembership(
		id,
		userId,
		["OWNER", "MANAGER", "MEMBER"],
	);
	const task = await prisma.task.findUniqueOrThrow({ where: { id } });
	if (membership.role === "MEMBER" && task.reporterId !== userId)
		throw new AppError(
			403,
			"Only the reporter or a manager can delete this task",
		);
	await prisma.task.update({ where: { id }, data: { deletedAt: new Date() } });
	await writeAuditLog(prisma, {
		organizationId,
		actorId: userId,
		action: "TASK_DELETED",
		entity: "Task",
		entityId: id,
		ipAddress,
	});
};

export const addAttachment = async (
	userId: string,
	taskId: string,
	file: Express.Multer.File | undefined,
	ipAddress?: string,
) => {
	if (!file) throw new AppError(400, "A supported file is required");
	const { organizationId } = await requireTaskMembership(taskId, userId, [
		"OWNER",
		"MANAGER",
		"MEMBER",
	]);
	const uploaded = await uploadBuffer(
		file.buffer,
		`taskflow/${organizationId}/${taskId}`,
	);
	const attachment = await prisma.attachment.create({
		data: {
			taskId,
			uploaderId: userId,
			name: file.originalname,
			mimeType: file.mimetype,
			size: file.size,
			url: uploaded.secure_url,
			publicId: uploaded.public_id,
		},
	});
	await writeAuditLog(prisma, {
		organizationId,
		actorId: userId,
		action: "ATTACHMENT_ADDED",
		entity: "Attachment",
		entityId: attachment.id,
		ipAddress,
	});
	return attachment;
};

export const kanban = async (
	userId: string,
	query: Record<string, unknown>,
) => {
	const projectId = String(query.projectId ?? "");
	await requireProjectMembership(projectId, userId);
	const sprintId =
		typeof query.sprintId === "string" ? query.sprintId : undefined;
	const assigneeId =
		typeof query.assigneeId === "string" ? query.assigneeId : undefined;
	const labelId = typeof query.labelId === "string" ? query.labelId : undefined;
	const tasks = await prisma.task.findMany({
		where: {
			projectId,
			deletedAt: null,
			parentId: null,
			...(sprintId ? { sprintId } : {}),
			...(assigneeId ? { assigneeId } : {}),
			...(labelId ? { labels: { some: { labelId } } } : {}),
		},
		include: {
			assignee: { select: { id: true, name: true, avatarUrl: true } },
			labels: { include: { label: true } },
			_count: { select: { subtasks: true, comments: true, attachments: true } },
		},
		orderBy: [{ status: "asc" }, { position: "asc" }, { createdAt: "asc" }],
	});
	const columns = Object.fromEntries(
		(
			["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"] as TaskStatus[]
		).map((status) => [status, tasks.filter((task) => task.status === status)]),
	);
	return {
		projectId,
		sprintId: sprintId ?? null,
		filters: { assigneeId: assigneeId ?? null, labelId: labelId ?? null },
		columns,
	};
};
