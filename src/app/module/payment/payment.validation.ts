import { z } from "zod";
import { uuid } from "../../validation/common";

export const checkoutSchema = z.object({
	body: z.object({ organizationId: uuid }),
});

export const paymentIdParamsSchema = z.object({
	params: z.object({ id: uuid }),
});

export const stripeEventSchema = z
	.object({
		id: z.string().min(1),
		type: z.string().min(1),
		data: z.object({
			object: z
				.object({
					id: z.string().min(1),
					payment_status: z.string().optional(),
				})
				.passthrough(),
		}),
	})
	.passthrough();
