import type { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { requireOrganizationMembership } from "../../utils/access";

export const getCalendar = async (
	userId: string,
	organizationId: string,
	query: Record<string, unknown>,
) => {
	const membership = await requireOrganizationMembership(
		organizationId,
		userId,
	);
	const from = new Date(String(query.from ?? new Date().toISOString()));
	const defaultTo = new Date(from);
	defaultTo.setDate(defaultTo.getDate() + 30);
	const to = new Date(String(query.to ?? defaultTo.toISOString()));
	if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to <= from)
		throw new AppError(400, "Provide a valid calendar range");
	if (to.getTime() - from.getTime() > 366 * 24 * 60 * 60 * 1000)
		throw new AppError(400, "Calendar range cannot exceed one year");
	const projectId =
		typeof query.projectId === "string" ? query.projectId : undefined;
	const projectWhere: Prisma.ProjectWhereInput = {
		organizationId,
		deletedAt: null,
		...(projectId ? { id: projectId } : {}),
		...(membership.role === "GUEST"
			? { team: { members: { some: { userId } } } }
			: membership.role === "MEMBER"
				? {
						OR: [{ teamId: null }, { team: { members: { some: { userId } } } }],
					}
				: {}),
	};
	const [tasks, sprints, projects] = await prisma.$transaction([
		prisma.task.findMany({
			where: {
				deletedAt: null,
				dueDate: { gte: from, lte: to },
				project: projectWhere,
			},
			select: {
				id: true,
				title: true,
				dueDate: true,
				status: true,
				priority: true,
				projectId: true,
			},
			orderBy: { dueDate: "asc" },
		}),
		prisma.sprint.findMany({
			where: {
				startDate: { lte: to },
				endDate: { gte: from },
				project: projectWhere,
			},
			select: {
				id: true,
				name: true,
				startDate: true,
				endDate: true,
				status: true,
				projectId: true,
			},
			orderBy: { startDate: "asc" },
		}),
		prisma.project.findMany({
			where: {
				AND: [
					projectWhere,
					{
						OR: [
							{ startDate: { gte: from, lte: to } },
							{ dueDate: { gte: from, lte: to } },
						],
					},
				],
			},
			select: {
				id: true,
				name: true,
				key: true,
				startDate: true,
				dueDate: true,
				status: true,
			},
		}),
	]);
	return { range: { from, to }, tasks, sprints, projects };
};
