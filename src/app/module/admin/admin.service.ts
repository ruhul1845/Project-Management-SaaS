import type {
	Prisma,
	Role,
	UserStatus,
} from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { getPagination } from "../../utils/query";

export const users = async (query: Record<string, unknown>) => {
	const { page, limit, skip } = getPagination(query);
	const search = typeof query.search === "string" ? query.search : undefined;
	const status =
		typeof query.status === "string" ? (query.status as UserStatus) : undefined;
	const where: Prisma.UserWhereInput = {
		deletedAt: null,
		...(status ? { status } : {}),
		...(search
			? {
					OR: [
						{ name: { contains: search, mode: "insensitive" } },
						{ email: { contains: search, mode: "insensitive" } },
					],
				}
			: {}),
	};
	const [data, total] = await prisma.$transaction([
		prisma.user.findMany({
			where,
			skip,
			take: limit,
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				status: true,
				createdAt: true,
			},
			orderBy: { createdAt: "desc" },
		}),
		prisma.user.count({ where }),
	]);
	return {
		data,
		meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
	};
};

export const organizations = async (query: Record<string, unknown>) => {
	const { page, limit, skip } = getPagination(query);
	const search = typeof query.search === "string" ? query.search : undefined;
	const where: Prisma.OrganizationWhereInput = {
		deletedAt: null,
		...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
	};
	const [data, total] = await prisma.$transaction([
		prisma.organization.findMany({
			where,
			skip,
			take: limit,
			include: {
				owner: { select: { id: true, name: true, email: true } },
				_count: { select: { memberships: true, projects: true, teams: true } },
			},
			orderBy: { createdAt: "desc" },
		}),
		prisma.organization.count({ where }),
	]);
	return {
		data,
		meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
	};
};

export const dashboard = async () => {
	const [users, blockedUsers, organizations, projects, tasks] =
		await prisma.$transaction([
			prisma.user.count({ where: { deletedAt: null } }),
			prisma.user.count({ where: { status: "BLOCKED", deletedAt: null } }),
			prisma.organization.count({ where: { deletedAt: null } }),
			prisma.project.count({ where: { deletedAt: null } }),
			prisma.task.count({ where: { deletedAt: null } }),
		]);
	return { users, blockedUsers, organizations, projects, tasks };
};

export const updateStatus = async (
	actorId: string,
	id: string,
	status: UserStatus,
) => {
	if (actorId === id && status === "BLOCKED")
		throw new AppError(400, "Administrators cannot block themselves");
	return prisma.user.update({
		where: { id },
		data: { status },
		select: { id: true, name: true, email: true, role: true, status: true },
	});
};

export const updateRole = async (actorId: string, id: string, role: Role) => {
	if (actorId === id && role !== "ADMIN")
		throw new AppError(
			400,
			"Administrators cannot remove their own admin role",
		);
	return prisma.user.update({
		where: { id },
		data: { role },
		select: { id: true, name: true, email: true, role: true, status: true },
	});
};
