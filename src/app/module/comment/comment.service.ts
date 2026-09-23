import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { requireTaskMembership } from "../../utils/access";
import { writeAuditLog } from "../../utils/audit";

export const create = async (
	userId: string,
	input: { taskId: string; content: string },
	ipAddress?: string,
) => {
	const { organizationId } = await requireTaskMembership(input.taskId, userId);
	const comment = await prisma.comment.create({
		data: { ...input, authorId: userId },
		include: { author: { select: { id: true, name: true, avatarUrl: true } } },
	});
	await writeAuditLog(prisma, {
		organizationId,
		actorId: userId,
		action: "COMMENT_ADDED",
		entity: "Comment",
		entityId: comment.id,
		ipAddress,
	});
	return comment;
};

export const list = async (userId: string, taskId: string) => {
	await requireTaskMembership(taskId, userId);
	return prisma.comment.findMany({
		where: { taskId, deletedAt: null },
		include: { author: { select: { id: true, name: true, avatarUrl: true } } },
		orderBy: { createdAt: "asc" },
	});
};

export const update = async (userId: string, id: string, content: string) => {
	const comment = await prisma.comment.findUnique({
		where: { id },
		include: { task: { select: { id: true } } },
	});
	if (!comment || comment.deletedAt)
		throw new AppError(404, "Comment not found");
	await requireTaskMembership(comment.task.id, userId);
	if (comment.authorId !== userId)
		throw new AppError(403, "Only the author can edit this comment");
	return prisma.comment.update({ where: { id }, data: { content } });
};

export const remove = async (
	userId: string,
	id: string,
	ipAddress?: string,
) => {
	const comment = await prisma.comment.findUnique({
		where: { id },
		include: {
			task: {
				select: { id: true, project: { select: { organizationId: true } } },
			},
		},
	});
	if (!comment || comment.deletedAt)
		throw new AppError(404, "Comment not found");
	const { membership } = await requireTaskMembership(comment.task.id, userId);
	if (comment.authorId !== userId && membership.role === "MEMBER")
		throw new AppError(
			403,
			"Only the author or a manager can delete this comment",
		);
	await prisma.comment.update({
		where: { id },
		data: { deletedAt: new Date() },
	});
	await writeAuditLog(prisma, {
		organizationId: comment.task.project.organizationId,
		actorId: userId,
		action: "COMMENT_DELETED",
		entity: "Comment",
		entityId: id,
		ipAddress,
	});
};
