import { z } from "zod";

export const uuid = z.uuid();

export const paginationQuery = {
	page: z.coerce.number().int().min(1).optional(),
	limit: z.coerce.number().int().min(1).max(100).optional(),
};

export const searchQuery = z.string().trim().max(200).optional();

export const idParamsSchema = z.object({
	params: z.object({ id: uuid }),
});
