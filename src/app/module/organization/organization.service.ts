import { randomUUID } from "node:crypto";
import type { Role } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { clearOrganizationCache } from "../../lib/redis";
import { AppError } from "../../utils/AppError";
import { writeAuditLog } from "../../utils/audit";
import { getPagination } from "../../utils/query";

const slugify = (name: string) =>
	name
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");

export const create = async (
	userId: string,
	input: { name: string; description?: string },
	ipAddress?: string,
) => {
	let slug = slugify(input.name);
	if (!slug) slug = "workspace";
	if (await prisma.organization.findUnique({ where: { slug } }))
		slug = `${slug}-${randomUUID().slice(0, 6)}`;

	return prisma.$transaction(async (tx) => {
		const organization = await tx.organization.create({
			data: { ...input, slug, ownerId: userId },
		});
		await tx.membership.create({
			data: { organizationId: organization.id, userId, role: "OWNER" },
		});
		await tx.user.update({ where: { id: userId }, data: { role: "OWNER" } });
		await writeAuditLog(tx, {
			organizationId: organization.id,
			actorId: userId,
			action: "ORGANIZATION_CREATED",
			entity: "Organization",
			entityId: organization.id,
			ipAddress,
		});
		return organization;
	});
};

export const getMine = (userId: string) =>
	prisma.organization.findMany({
		where: { deletedAt: null, memberships: { some: { userId } } },
		include: {
			_count: { select: { memberships: true, projects: true } },
			memberships: { where: { userId }, select: { role: true } },
		},
		orderBy: { createdAt: "desc" },
	});

export const getById = (id: string) =>
	prisma.organization.findFirstOrThrow({
		where: { id, deletedAt: null },
		include: { _count: { select: { memberships: true, projects: true } } },
	});

export const update = async (
	id: string,
	actorId: string,
	input: {
		name?: string;
		description?: string | null;
		logoUrl?: string | null;
	},
	ipAddress?: string,
) => {
	const organization = await prisma.organization.update({
		where: { id },
		data: input,
	});
	await writeAuditLog(prisma, {
		organizationId: id,
		actorId,
		action: "ORGANIZATION_UPDATED",
		entity: "Organization",
		entityId: id,
		ipAddress,
	});
	await clearOrganizationCache(id);
	return organization;
};

export const softDelete = async (
	id: string,
	actorId: string,
	ipAddress?: string,
) =>
	prisma.$transaction(async (tx) => {
		await writeAuditLog(tx, {
			organizationId: id,
			actorId,
			action: "ORGANIZATION_DELETED",
			entity: "Organization",
			entityId: id,
			ipAddress,
		});
		await tx.project.updateMany({
			where: { organizationId: id, deletedAt: null },
			data: { deletedAt: new Date() },
		});
		return tx.organization.update({
			where: { id },
			data: { deletedAt: new Date() },
		});
	});

export const addMember = async (
	organizationId: string,
	actorId: string,
	input: { email: string; role: "MANAGER" | "MEMBER" },
	ipAddress?: string,
) => {
	const user = await prisma.user.findUnique({
		where: { email: input.email.toLowerCase() },
	});
	if (!user || user.deletedAt)
		throw new AppError(404, "User must register before being added");
	const member = await prisma.membership.create({
		data: { organizationId, userId: user.id, role: input.role },
		include: {
			user: { select: { id: true, name: true, email: true, avatarUrl: true } },
		},
	});
	await writeAuditLog(prisma, {
		organizationId,
		actorId,
		action: "MEMBER_ADDED",
		entity: "Membership",
		entityId: member.id,
		metadata: { userId: user.id, role: input.role },
		ipAddress,
	});
	return member;
};

export const listMembers = async (
	organizationId: string,
	query: Record<string, unknown>,
) => {
	const { page, limit, skip } = getPagination(query);
	const search = typeof query.search === "string" ? query.search : undefined;
	const where = {
		organizationId,
		...(search
			? {
					user: {
						OR: [
							{ name: { contains: search, mode: "insensitive" as const } },
							{ email: { contains: search, mode: "insensitive" as const } },
						],
					},
				}
			: {}),
	};
	const [data, total] = await prisma.$transaction([
		prisma.membership.findMany({
			where,
			skip,
			take: limit,
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						avatarUrl: true,
						status: true,
					},
				},
			},
			orderBy: { joinedAt: "asc" },
		}),
		prisma.membership.count({ where }),
	]);
	return {
		data,
		meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
	};
};

export const updateMemberRole = async (
	organizationId: string,
	memberId: string,
	actorId: string,
	role: Role,
	ipAddress?: string,
) => {
	const membership = await prisma.membership.findFirst({
		where: { id: memberId, organizationId },
	});
	if (!membership) throw new AppError(404, "Membership not found");
	if (membership.role === "OWNER")
		throw new AppError(400, "Owner role cannot be changed");
	const updated = await prisma.membership.update({
		where: { id: memberId },
		data: { role },
	});
	await writeAuditLog(prisma, {
		organizationId,
		actorId,
		action: "MEMBER_ROLE_CHANGED",
		entity: "Membership",
		entityId: memberId,
		metadata: { from: membership.role, to: role },
		ipAddress,
	});
	return updated;
};

export const removeMember = async (
	organizationId: string,
	memberId: string,
	actorId: string,
	actorRole: Role,
	ipAddress?: string,
) => {
	const membership = await prisma.membership.findFirst({
		where: { id: memberId, organizationId },
	});
	if (!membership) throw new AppError(404, "Membership not found");
	if (membership.role === "OWNER")
		throw new AppError(400, "Organization owner cannot be removed");
	if (actorRole === "MANAGER" && membership.role === "MANAGER")
		throw new AppError(403, "Managers cannot remove other managers");
	await prisma.membership.delete({ where: { id: memberId } });
	await writeAuditLog(prisma, {
		organizationId,
		actorId,
		action: "MEMBER_REMOVED",
		entity: "Membership",
		entityId: memberId,
		metadata: { userId: membership.userId },
		ipAddress,
	});
};
