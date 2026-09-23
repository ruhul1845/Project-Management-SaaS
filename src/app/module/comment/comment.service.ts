import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { requireTaskMembership } from "../../utils/access";
import { writeAuditLog } from "../../utils/audit";
import { createNotification } from "../../utils/notification";

type CommentInput = {
	taskId: string;
	content: string;
	mentionedUserIds?: string[];
};

const validateMentions = async (
	organizationId: string,
	userId: string,
	mentionedUserIds: string[] = [],
) => {
	const ids = [...new Set(mentionedUserIds)].filter((id) => id !== userId);
	if (!ids.length) return ids;
	const count = await prisma.membership.count({
		where: { organizationId, userId: { in: ids } },
	});
	if (count !== ids.length)
		throw new AppError(400, "Mentioned users must belong to the organization");
	return ids;
};

export const create = async (
	userId: string,
	input: CommentInput,
	ipAddress?: string,
) => {
	const { organizationId } = await requireTaskMembership(input.taskId, userId, [
		"OWNER",
		"MANAGER",
		"MEMBER",
	]);
	const mentionIds = await validateMentions(
		organizationId,
		userId,
		input.mentionedUserIds,
	);
	return prisma.$transaction(async (tx) => {
		const comment = await tx.comment.create({
			data: {
				taskId: input.taskId,
				content: input.content,
				authorId: userId,
				mentions: {
					create: mentionIds.map((mentionedId) => ({ userId: mentionedId })),
				},
			},
			include: {
				author: { select: { id: true, name: true, avatarUrl: true } },
				mentions: {
					include: {
						user: { select: { id: true, name: true, email: true } },
					},
				},
			},
		});
		for (const mentionedId of mentionIds)
			await createNotification(tx, {
				userId: mentionedId,
				organizationId,
				type: "COMMENT_MENTION",
				title: "Mentioned in a comment",
				message: "You were mentioned in a task comment",
				metadata: { taskId: input.taskId, commentId: comment.id },
			});
		await writeAuditLog(tx, {
			organizationId,
			actorId: userId,
			action: "COMMENT_ADDED",
			entity: "Comment",
			entityId: comment.id,
			ipAddress,
		});
		return comment;
	});
};

export const list = async (userId: string, taskId: string) => {
	await requireTaskMembership(taskId, userId);
	return prisma.comment.findMany({
		where: { taskId, deletedAt: null },
		include: {
			author: { select: { id: true, name: true, avatarUrl: true } },
			mentions: {
				include: {
					user: { select: { id: true, name: true, email: true } },
				},
			},
		},
		orderBy: { createdAt: "asc" },
	});
};

export const update = async (
	userId: string,
	id: string,
	input: { content: string; mentionedUserIds?: string[] },
) => {
	const comment = await prisma.comment.findUnique({
		where: { id },
		include: { task: { select: { id: true } } },
	});
	if (!comment || comment.deletedAt)
		throw new AppError(404, "Comment not found");
	const { organizationId } = await requireTaskMembership(
		comment.task.id,
		userId,
		["OWNER", "MANAGER", "MEMBER"],
	);
	if (comment.authorId !== userId)
		throw new AppError(403, "Only the author can edit this comment");
	const mentionIds = await validateMentions(
		organizationId,
		userId,
		input.mentionedUserIds,
	);
	return prisma.$transaction(async (tx) => {
		if (input.mentionedUserIds) {
			await tx.mention.deleteMany({ where: { commentId: id } });
			if (mentionIds.length)
				await tx.mention.createMany({
					data: mentionIds.map((mentionedId) => ({
						commentId: id,
						userId: mentionedId,
					})),
				});
			for (const mentionedId of mentionIds)
				await createNotification(tx, {
					userId: mentionedId,
					organizationId,
					type: "COMMENT_MENTION",
					title: "Mentioned in an updated comment",
					message: "You were mentioned in a task comment",
					metadata: { taskId: comment.task.id, commentId: id },
				});
		}
		return tx.comment.update({
			where: { id },
			data: { content: input.content },
			include: {
				mentions: {
					include: { user: { select: { id: true, name: true } } },
				},
			},
		});
	});
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
	const { membership } = await requireTaskMembership(comment.task.id, userId, [
		"OWNER",
		"MANAGER",
		"MEMBER",
	]);
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
