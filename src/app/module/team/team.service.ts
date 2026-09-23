import type { TeamRole } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { requireOrganizationMembership } from "../../utils/access";
import { writeAuditLog } from "../../utils/audit";
import { createNotification } from "../../utils/notification";

const requireTeamAccess = async (
	teamId: string,
	userId: string,
	manage = false,
) => {
	const team = await prisma.team.findUnique({
		where: { id: teamId },
		include: { members: { where: { userId }, select: { role: true } } },
	});
	if (!team) throw new AppError(404, "Team not found");
	const organizationMembership = await requireOrganizationMembership(
		team.organizationId,
		userId,
	);
	const teamRole = team.members[0]?.role;
	const organizationManager = ["OWNER", "MANAGER"].includes(
		organizationMembership.role,
	);
	if (!organizationManager && !teamRole)
		throw new AppError(403, "Team access denied");
	if (manage && !organizationManager && teamRole !== "LEAD")
		throw new AppError(403, "Team management permission required");
	return { team, organizationMembership, teamRole };
};

export const create = async (
	userId: string,
	input: { organizationId: string; name: string; description?: string },
	ipAddress?: string,
) => {
	await requireOrganizationMembership(input.organizationId, userId, [
		"OWNER",
		"MANAGER",
	]);
	const team = await prisma.team.create({
		data: {
			...input,
			members: { create: { userId, role: "LEAD" } },
		},
		include: { members: true },
	});
	await writeAuditLog(prisma, {
		organizationId: input.organizationId,
		actorId: userId,
		action: "TEAM_CREATED",
		entity: "Team",
		entityId: team.id,
		ipAddress,
	});
	return team;
};

export const list = async (
	userId: string,
	organizationId: string,
	query: Record<string, unknown>,
) => {
	const membership = await requireOrganizationMembership(
		organizationId,
		userId,
	);
	const canSeeAll = ["OWNER", "MANAGER"].includes(membership.role);
	const search = typeof query.search === "string" ? query.search : undefined;
	return prisma.team.findMany({
		where: {
			organizationId,
			...(canSeeAll ? {} : { members: { some: { userId } } }),
			...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
		},
		include: {
			_count: { select: { members: true, projects: true } },
			members: { where: { userId }, select: { role: true } },
		},
		orderBy: { name: "asc" },
	});
};

export const getById = async (userId: string, id: string) => {
	await requireTeamAccess(id, userId);
	return prisma.team.findUniqueOrThrow({
		where: { id },
		include: {
			members: {
				include: {
					user: {
						select: { id: true, name: true, email: true, avatarUrl: true },
					},
				},
			},
			projects: { where: { deletedAt: null } },
		},
	});
};

export const update = async (
	userId: string,
	id: string,
	input: { name?: string; description?: string | null },
	ipAddress?: string,
) => {
	const { team } = await requireTeamAccess(id, userId, true);
	const updated = await prisma.team.update({ where: { id }, data: input });
	await writeAuditLog(prisma, {
		organizationId: team.organizationId,
		actorId: userId,
		action: "TEAM_UPDATED",
		entity: "Team",
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
	const { team, organizationMembership } = await requireTeamAccess(
		id,
		userId,
		true,
	);
	if (!["OWNER", "MANAGER"].includes(organizationMembership.role))
		throw new AppError(403, "Only organization managers can delete teams");
	await prisma.$transaction(async (tx) => {
		await tx.team.delete({ where: { id } });
		await writeAuditLog(tx, {
			organizationId: team.organizationId,
			actorId: userId,
			action: "TEAM_DELETED",
			entity: "Team",
			entityId: id,
			ipAddress,
		});
	});
};

export const addMember = async (
	userId: string,
	teamId: string,
	input: { email: string; role: TeamRole },
	ipAddress?: string,
) => {
	const { team } = await requireTeamAccess(teamId, userId, true);
	const target = await prisma.user.findUnique({
		where: { email: input.email.toLowerCase() },
	});
	if (!target || target.deletedAt) throw new AppError(404, "User not found");
	await requireOrganizationMembership(team.organizationId, target.id);
	const member = await prisma.teamMember.create({
		data: { teamId, userId: target.id, role: input.role },
		include: { user: { select: { id: true, name: true, email: true } } },
	});
	await prisma.$transaction(async (tx) => {
		await createNotification(tx, {
			userId: target.id,
			organizationId: team.organizationId,
			type: "MEMBER_ADDED",
			title: "Added to team",
			message: `You were added to ${team.name}`,
			metadata: { teamId, role: input.role },
		});
		await writeAuditLog(tx, {
			organizationId: team.organizationId,
			actorId: userId,
			action: "TEAM_MEMBER_ADDED",
			entity: "TeamMember",
			entityId: member.id,
			metadata: { teamId, targetUserId: target.id, role: input.role },
			ipAddress,
		});
	});
	return member;
};

export const updateMember = async (
	userId: string,
	teamId: string,
	memberId: string,
	role: TeamRole,
) => {
	await requireTeamAccess(teamId, userId, true);
	const member = await prisma.teamMember.findFirst({
		where: { id: memberId, teamId },
	});
	if (!member) throw new AppError(404, "Team member not found");
	return prisma.teamMember.update({ where: { id: memberId }, data: { role } });
};

export const removeMember = async (
	userId: string,
	teamId: string,
	memberId: string,
) => {
	await requireTeamAccess(teamId, userId, true);
	const member = await prisma.teamMember.findFirst({
		where: { id: memberId, teamId },
	});
	if (!member) throw new AppError(404, "Team member not found");
	await prisma.teamMember.delete({ where: { id: memberId } });
};
