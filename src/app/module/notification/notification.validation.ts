import { z } from "zod";
import { paginationQuery } from "../../validation/common";

export const listNotificationsSchema = z.object({
	query: z.object({
		...paginationQuery,
		unread: z.enum(["true", "false"]).optional(),
	}),
});
