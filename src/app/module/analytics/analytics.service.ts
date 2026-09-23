import { prisma } from "../../lib/prisma";
import { requireOrganizationMembership } from "../../utils/access";
import { getPagination } from "../../utils/query";

export const dashboard = async (userId: string, organizationId: string) => {
	await requireOrganizationMembership(organizationId, userId, [
		"OWNER",
		"MANAGER",
	]);
	const [members, projects, tasks, taskGroups, paidRevenue] =
		await prisma.$transaction([
			prisma.membership.count({ where: { organizationId } }),
			prisma.project.count({ where: { organizationId, deletedAt: null } }),
			prisma.task.count({
				where: {
					project: { organizationId, deletedAt: null },
					deletedAt: null,
				},
			}),
			prisma.task.groupBy({
				by: ["status"],
				where: {
					project: { organizationId, deletedAt: null },
					deletedAt: null,
				},
				_count: true,
			}),
			prisma.payment.aggregate({
				where: { organizationId, status: "PAID" },
				_sum: { amount: true },
			}),
		]);
	return {
		members,
		projects,
		tasks,
		tasksByStatus: Object.fromEntries(
			taskGroups.map((item) => [item.status, item._count]),
		),
		paidRevenue: paidRevenue._sum.amount ?? 0,
	};
};

export const auditLogs = async (
	userId: string,
	organizationId: string,
	query: Record<string, unknown>,
) => {
	await requireOrganizationMembership(organizationId, userId, [
		"OWNER",
		"MANAGER",
	]);
	const { page, limit, skip } = getPagination(query);
	const [data, total] = await prisma.$transaction([
		prisma.auditLog.findMany({
			where: { organizationId },
			skip,
			take: limit,
			include: { actor: { select: { id: true, name: true, email: true } } },
			orderBy: { createdAt: "desc" },
		}),
		prisma.auditLog.count({ where: { organizationId } }),
	]);
	return {
		data,
		meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
	};
};
