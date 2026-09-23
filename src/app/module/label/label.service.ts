import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
	requireOrganizationMembership,
	requireTaskMembership,
} from "../../utils/access";
import { writeAuditLog } from "../../utils/audit";

export const create = async (
	userId: string,
	input: { organizationId: string; name: string; color?: string },
	ipAddress?: string,
) => {
	await requireOrganizationMembership(input.organizationId, userId, [
		"OWNER",
		"MANAGER",
	]);
	const label = await prisma.label.create({ data: input });
	await writeAuditLog(prisma, {
		organizationId: input.organizationId,
		actorId: userId,
		action: "LABEL_CREATED",
		entity: "Label",
		entityId: label.id,
		ipAddress,
	});
	return label;
};

export const list = async (userId: string, organizationId: string) => {
	await requireOrganizationMembership(organizationId, userId);
	return prisma.label.findMany({
		where: { organizationId },
		include: { _count: { select: { tasks: true } } },
		orderBy: { name: "asc" },
	});
};

export const update = async (
	userId: string,
	id: string,
	input: { name?: string; color?: string },
	ipAddress?: string,
) => {
	const label = await prisma.label.findUnique({ where: { id } });
	if (!label) throw new AppError(404, "Label not found");
	await requireOrganizationMembership(label.organizationId, userId, [
		"OWNER",
		"MANAGER",
	]);
	const updated = await prisma.label.update({ where: { id }, data: input });
	await writeAuditLog(prisma, {
		organizationId: label.organizationId,
		actorId: userId,
		action: "LABEL_UPDATED",
		entity: "Label",
		entityId: id,
		ipAddress,
	});
	return updated;
};

export const remove = async (
	userId: string,
	id: string,
	ipAddress?: string,
) => {
	const label = await prisma.label.findUnique({ where: { id } });
	if (!label) throw new AppError(404, "Label not found");
	await requireOrganizationMembership(label.organizationId, userId, [
		"OWNER",
		"MANAGER",
	]);
	await prisma.$transaction(async (tx) => {
		await tx.label.delete({ where: { id } });
		await writeAuditLog(tx, {
			organizationId: label.organizationId,
			actorId: userId,
			action: "LABEL_DELETED",
			entity: "Label",
			entityId: id,
			ipAddress,
		});
	});
};

export const assignToTask = async (
	userId: string,
	labelId: string,
	taskId: string,
	ipAddress?: string,
) => {
	const { organizationId } = await requireTaskMembership(taskId, userId, [
		"OWNER",
		"MANAGER",
		"MEMBER",
	]);
	const label = await prisma.label.findFirst({
		where: { id: labelId, organizationId },
	});
	if (!label) throw new AppError(404, "Label not found in this organization");
	const taskLabel = await prisma.taskLabel.upsert({
		where: { taskId_labelId: { taskId, labelId } },
		update: {},
		create: { taskId, labelId },
		include: { label: true },
	});
	await writeAuditLog(prisma, {
		organizationId,
		actorId: userId,
		action: "TASK_LABEL_ADDED",
		entity: "Task",
		entityId: taskId,
		metadata: { labelId },
		ipAddress,
	});
	return taskLabel;
};

export const removeFromTask = async (
	userId: string,
	labelId: string,
	taskId: string,
) => {
	await requireTaskMembership(taskId, userId, ["OWNER", "MANAGER", "MEMBER"]);
	await prisma.taskLabel.deleteMany({ where: { taskId, labelId } });
};
