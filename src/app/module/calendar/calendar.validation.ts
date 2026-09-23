import { z } from "zod";
import { uuid } from "../../validation/common";

export const calendarQuerySchema = z.object({
	query: z
		.object({
			organizationId: uuid,
			from: z.iso.datetime().optional(),
			to: z.iso.datetime().optional(),
			projectId: uuid.optional(),
		})
		.refine(
			(query) =>
				!query.from || !query.to || new Date(query.to) > new Date(query.from),
			{
				message: "to must be after from",
				path: ["to"],
			},
		),
});
