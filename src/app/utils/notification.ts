import type {
	NotificationType,
	Prisma,
	PrismaClient,
} from "../../generated/prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

export const createNotification = async (
	db: Db,
	data: {
		userId: string;
		organizationId?: string;
		type: NotificationType;
		title: string;
		message: string;
		metadata?: Prisma.InputJsonValue;
	},
) =>
	db.notification.create({
		data: {
			userId: data.userId,
			organizationId: data.organizationId,
			type: data.type,
			title: data.title,
			message: data.message,
			data: data.metadata,
		},
	});
