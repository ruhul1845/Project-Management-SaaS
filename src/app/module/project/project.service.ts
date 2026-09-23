import type { Prisma, ProjectStatus } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { clearOrganizationCache, redisClient } from "../../lib/redis";
import { AppError } from "../../utils/AppError";
import {
	requireOrganizationMembership,
	requireProjectMembership,
} from "../../utils/access";
import { writeAuditLog } from "../../utils/audit";
import { getPagination } from "../../utils/query";

type ProjectInput = {
	organizationId: string;
	name: string;
	key: string;
	description?: string;
	startDate?: string;
	dueDate?: string;
	teamId?: string;
};

export const create = async (
	userId: string,
	input: ProjectInput,
	ipAddress?: string,
) => {
	await requireOrganizationMembership(input.organizationId, userId, [
		"OWNER",
		"MANAGER",
	]);
	if (input.teamId) {
		const team = await prisma.team.findFirst({
			where: { id: input.teamId, organizationId: input.organizationId },
		});
		if (!team)
			throw new AppError(400, "Team does not belong to this organization");
	}
	if (
		input.startDate &&
		input.dueDate &&
		new Date(input.dueDate) <= new Date(input.startDate)
	)
		throw new AppError(400, "dueDate must be after startDate");
	const { organizationId, startDate, dueDate, ...rest } = input;
	const project = await prisma.project.create({
		data: { ...rest, organizationId, createdById: userId, startDate, dueDate },
	});
	await writeAuditLog(prisma, {
		organizationId,
		actorId: userId,
		action: "PROJECT_CREATED",
		entity: "Project",
		entityId: project.id,
		ipAddress,
	});
	await clearOrganizationCache(organizationId);
	return project;
};

export const list = async (userId: string, query: Record<string, unknown>) => {
	const organizationId = String(query.organizationId ?? "");
	const membership = await requireOrganizationMembership(
		organizationId,
		userId,
	);
	const { page, limit, skip } = getPagination(query);
	const search = typeof query.search === "string" ? query.search : undefined;
	const status =
		typeof query.status === "string"
			? (query.status as ProjectStatus)
			: undefined;
	const teamId = typeof query.teamId === "string" ? query.teamId : undefined;
	const sortBy = ["createdAt", "updatedAt", "dueDate", "name"].includes(
		String(query.sortBy),
	)
		? String(query.sortBy)
		: "createdAt";
	const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";
	const accessAndSearch: Prisma.ProjectWhereInput[] = [];
	if (membership.role === "GUEST")
		accessAndSearch.push({ team: { members: { some: { userId } } } });
	if (membership.role === "MEMBER")
		accessAndSearch.push({
			OR: [{ teamId: null }, { team: { members: { some: { userId } } } }],
		});
	if (search)
		accessAndSearch.push({
			OR: [
				{ name: { contains: search, mode: "insensitive" } },
				{ key: { contains: search, mode: "insensitive" } },
			],
		});
	const where: Prisma.ProjectWhereInput = {
		organizationId,
		deletedAt: null,
		...(status ? { status } : {}),
		...(teamId ? { teamId } : {}),
		...(accessAndSearch.length ? { AND: accessAndSearch } : {}),
	};
	const cacheKey = `org:${organizationId}:projects:${JSON.stringify({ page, limit, search, status, teamId, userId, sortBy, sortOrder })}`;
	if (redisClient?.isOpen) {
		const cached = await redisClient.get(cacheKey);
		if (cached) return JSON.parse(cached);
	}
	const [data, total] = await prisma.$transaction([
		prisma.project.findMany({
			where,
			skip,
			take: limit,
			orderBy: { [sortBy]: sortOrder },
			include: {
				team: { select: { id: true, name: true } },
				_count: { select: { tasks: true, sprints: true } },
			},
		}),
		prisma.project.count({ where }),
	]);
	const result = {
		data,
		meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
	};
	if (redisClient?.isOpen)
		await redisClient.set(cacheKey, JSON.stringify(result), { EX: 60 });
	return result;
};

export const getById = async (userId: string, id: string) => {
	await requireProjectMembership(id, userId);
	return prisma.project.findUniqueOrThrow({
		where: { id },
		include: {
			createdBy: { select: { id: true, name: true, email: true } },
			_count: { select: { tasks: true, sprints: true } },
		},
	});
};

export const update = async (
	userId: string,
	id: string,
	input: Record<string, unknown>,
	ipAddress?: string,
) => {
	const { project } = await requireProjectMembership(id, userId, [
		"OWNER",
		"MANAGER",
	]);
	const data = { ...input } as Record<string, unknown>;
	if (typeof data.teamId === "string") {
		const team = await prisma.team.findFirst({
			where: { id: data.teamId, organizationId: project.organizationId },
		});
		if (!team)
			throw new AppError(400, "Team does not belong to this organization");
	}
	if (typeof data.startDate === "string")
		data.startDate = new Date(data.startDate);
	if (typeof data.dueDate === "string") data.dueDate = new Date(data.dueDate);
	const updated = await prisma.project.update({ where: { id }, data });
	await writeAuditLog(prisma, {
		organizationId: project.organizationId,
		actorId: userId,
		action: "PROJECT_UPDATED",
		entity: "Project",
		entityId: id,
		ipAddress,
	});
	await clearOrganizationCache(project.organizationId);
	return updated;
};

export const softDelete = async (
	userId: string,
	id: string,
	ipAddress?: string,
) => {
	const { project } = await requireProjectMembership(id, userId, [
		"OWNER",
		"MANAGER",
	]);
	await prisma.$transaction(async (tx) => {
		await tx.task.updateMany({
			where: { projectId: id, deletedAt: null },
			data: { deletedAt: new Date() },
		});
		await tx.project.update({ where: { id }, data: { deletedAt: new Date() } });
		await writeAuditLog(tx, {
			organizationId: project.organizationId,
			actorId: userId,
			action: "PROJECT_DELETED",
			entity: "Project",
			entityId: id,
			ipAddress,
		});
	});
	await clearOrganizationCache(project.organizationId);
};
