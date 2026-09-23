import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import * as controller from "./payment.controller";
import { checkoutSchema, paymentIdParamsSchema } from "./payment.validation";

export const paymentRoutes = Router();
paymentRoutes.use(checkAuth);
paymentRoutes.post(
	"/checkout",
	validateRequest(checkoutSchema),
	controller.createCheckout,
);
paymentRoutes.get(
	"/:id",
	validateRequest(paymentIdParamsSchema),
	controller.getPayment,
);
