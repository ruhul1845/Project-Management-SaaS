import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { getPagination } from "../../utils/query";

export const list = async (userId: string, query: Record<string, unknown>) => {
	const { page, limit, skip } = getPagination(query);
	const unreadOnly = query.unread === "true";
	const where = { userId, ...(unreadOnly ? { readAt: null } : {}) };
	const [data, total] = await prisma.$transaction([
		prisma.notification.findMany({
			where,
			skip,
			take: limit,
			orderBy: { createdAt: "desc" },
		}),
		prisma.notification.count({ where }),
	]);
	return {
		data,
		meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
	};
};

export const unreadCount = (userId: string) =>
	prisma.notification.count({ where: { userId, readAt: null } });

export const markRead = async (userId: string, id: string) => {
	const notification = await prisma.notification.findFirst({
		where: { id, userId },
	});
	if (!notification) throw new AppError(404, "Notification not found");
	return prisma.notification.update({
		where: { id },
		data: { readAt: notification.readAt ?? new Date() },
	});
};

export const markAllRead = async (userId: string) => {
	const result = await prisma.notification.updateMany({
		where: { userId, readAt: null },
		data: { readAt: new Date() },
	});
	return { updated: result.count };
};
