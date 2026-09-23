import { z } from "zod";

export const checkoutSchema = z.object({
	body: z.object({ organizationId: z.uuid() }),
});
