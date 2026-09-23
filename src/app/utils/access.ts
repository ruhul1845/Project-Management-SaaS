import type { Role } from "../../generated/prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "./AppError";

export const requireOrganizationMembership = async (
	organizationId: string,
	userId: string,
	roles: Role[] = [],
) => {
	const membership = await prisma.membership.findUnique({
		where: { userId_organizationId: { userId, organizationId } },
		include: { organization: { select: { deletedAt: true } } },
	});
	if (!membership || membership.organization.deletedAt)
		throw new AppError(403, "Organization access denied");
	if (roles.length && !roles.includes(membership.role))
		throw new AppError(403, "Insufficient organization role");
	return membership;
};

export const requireProjectMembership = async (
	projectId: string,
	userId: string,
	roles: Role[] = [],
) => {
	const project = await prisma.project.findFirst({
		where: {
			id: projectId,
			deletedAt: null,
			organization: { deletedAt: null },
		},
		select: { id: true, organizationId: true, teamId: true },
	});
	if (!project) throw new AppError(404, "Project not found");
	const membership = await requireOrganizationMembership(
		project.organizationId,
		userId,
		roles,
	);
	if (membership.role === "MEMBER" || membership.role === "GUEST") {
		if (!project.teamId) {
			if (membership.role === "GUEST")
				throw new AppError(403, "Guest project access denied");
			return { project, membership };
		}
		const teamMember = await prisma.teamMember.findUnique({
			where: { teamId_userId: { teamId: project.teamId, userId } },
		});
		if (!teamMember) throw new AppError(403, "Team project access denied");
	}
	return { project, membership };
};

export const requireTaskMembership = async (
	taskId: string,
	userId: string,
	roles: Role[] = [],
) => {
	const task = await prisma.task.findFirst({
		where: { id: taskId, deletedAt: null, project: { deletedAt: null } },
		select: {
			id: true,
			projectId: true,
			project: { select: { organizationId: true } },
		},
	});
	if (!task) throw new AppError(404, "Task not found");
	const { membership } = await requireProjectMembership(
		task.projectId,
		userId,
		roles,
	);
	return { task, membership, organizationId: task.project.organizationId };
};
