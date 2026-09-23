import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { requireProjectMembership } from "../../utils/access";
import { writeAuditLog } from "../../utils/audit";

export const create = async (
	userId: string,
	input: {
		projectId: string;
		name: string;
		goal?: string;
		startDate: string;
		endDate: string;
	},
	ipAddress?: string,
) => {
	const { project } = await requireProjectMembership(input.projectId, userId, [
		"OWNER",
		"MANAGER",
	]);
	if (new Date(input.endDate) <= new Date(input.startDate))
		throw new AppError(400, "Sprint endDate must be after startDate");
	const sprint = await prisma.sprint.create({ data: { ...input } });
	await writeAuditLog(prisma, {
		organizationId: project.organizationId,
		actorId: userId,
		action: "SPRINT_CREATED",
		entity: "Sprint",
		entityId: sprint.id,
		ipAddress,
	});
	return sprint;
};

export const list = async (userId: string, projectId: string) => {
	await requireProjectMembership(projectId, userId);
	return prisma.sprint.findMany({
		where: { projectId },
		include: { _count: { select: { tasks: true } } },
		orderBy: { startDate: "desc" },
	});
};

export const start = async (userId: string, id: string, ipAddress?: string) =>
	prisma.$transaction(
		async (tx) => {
			const sprint = await tx.sprint.findUnique({
				where: { id },
				include: { project: { select: { organizationId: true } } },
			});
			if (!sprint) throw new AppError(404, "Sprint not found");
			await requireProjectMembership(sprint.projectId, userId, [
				"OWNER",
				"MANAGER",
			]);
			if (sprint.status !== "PLANNED")
				throw new AppError(409, "Only a planned sprint can be started");
			const active = await tx.sprint.findFirst({
				where: {
					projectId: sprint.projectId,
					status: "ACTIVE",
					id: { not: id },
				},
			});
			if (active)
				throw new AppError(409, "This project already has an active sprint");
			const updated = await tx.sprint.update({
				where: { id },
				data: { status: "ACTIVE" },
			});
			await writeAuditLog(tx, {
				organizationId: sprint.project.organizationId,
				actorId: userId,
				action: "SPRINT_STARTED",
				entity: "Sprint",
				entityId: id,
				ipAddress,
			});
			return updated;
		},
		{ isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
	);

export const complete = async (
	userId: string,
	id: string,
	ipAddress?: string,
) =>
	prisma.$transaction(async (tx) => {
		const sprint = await tx.sprint.findUnique({
			where: { id },
			include: { project: { select: { organizationId: true } } },
		});
		if (!sprint) throw new AppError(404, "Sprint not found");
		await requireProjectMembership(sprint.projectId, userId, [
			"OWNER",
			"MANAGER",
		]);
		if (sprint.status !== "ACTIVE")
			throw new AppError(409, "Only an active sprint can be completed");
		const updated = await tx.sprint.update({
			where: { id },
			data: { status: "COMPLETED" },
		});
		await tx.task.updateMany({
			where: { sprintId: id, status: { notIn: ["DONE", "CANCELLED"] } },
			data: { sprintId: null },
		});
		await writeAuditLog(tx, {
			organizationId: sprint.project.organizationId,
			actorId: userId,
			action: "SPRINT_COMPLETED",
			entity: "Sprint",
			entityId: id,
			ipAddress,
		});
		return updated;
	});
