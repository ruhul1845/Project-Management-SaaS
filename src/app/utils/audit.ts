import type { Prisma, PrismaClient } from "../../generated/prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

export const writeAuditLog = async (
	db: Db,
	data: {
		organizationId: string;
		actorId: string;
		action: string;
		entity: string;
		entityId?: string;
		metadata?: Prisma.InputJsonValue;
		ipAddress?: string;
	},
) => db.auditLog.create({ data });
