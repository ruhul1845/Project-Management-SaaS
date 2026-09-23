import { prisma } from "../../lib/prisma";

const select = {
	id: true,
	name: true,
	email: true,
	avatarUrl: true,
	role: true,
	emailVerified: true,
	createdAt: true,
} as const;

export const getMe = (id: string) =>
	prisma.user.findUniqueOrThrow({ where: { id }, select });
export const updateMe = (
	id: string,
	data: { name?: string; avatarUrl?: string | null },
) => prisma.user.update({ where: { id }, data, select });
