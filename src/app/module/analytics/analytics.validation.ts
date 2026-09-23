import { z } from "zod";
import { paginationQuery, uuid } from "../../validation/common";

export const dashboardQuerySchema = z.object({
	query: z.object({ organizationId: uuid }),
});

export const auditLogsQuerySchema = z.object({
	query: z.object({
		organizationId: uuid,
		...paginationQuery,
	}),
});
