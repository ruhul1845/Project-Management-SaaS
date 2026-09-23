import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "../../config";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { requireOrganizationMembership } from "../../utils/access";
import { writeAuditLog } from "../../utils/audit";
import { stripeEventSchema } from "./payment.validation";

export const createCheckout = async (
	userId: string,
	organizationId: string,
) => {
	if (!config.STRIPE_SECRET_KEY)
		throw new AppError(503, "Stripe is not configured");
	const membership = await requireOrganizationMembership(
		organizationId,
		userId,
		["OWNER"],
	);
	const organization = await prisma.organization.findUniqueOrThrow({
		where: { id: organizationId },
	});
	const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
	const params = new URLSearchParams({
		mode: "payment",
		success_url: `${config.FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
		cancel_url: `${config.FRONTEND_URL}/billing/cancelled`,
		customer_email: user.email,
		"line_items[0][quantity]": "1",
		"line_items[0][price_data][currency]": "usd",
		"line_items[0][price_data][unit_amount]": String(
			config.STRIPE_PRICE_MONTHLY_USD,
		),
		"line_items[0][price_data][product_data][name]": `TaskFlow Pro - ${organization.name}`,
		"metadata[organizationId]": organizationId,
		"metadata[userId]": userId,
	});
	const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${config.STRIPE_SECRET_KEY}`,
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: params,
	});
	const session = (await response.json()) as {
		id?: string;
		url?: string;
		error?: { message?: string };
	};
	if (!response.ok || !session.id)
		throw new AppError(
			502,
			session.error?.message ?? "Stripe checkout creation failed",
		);
	const payment = await prisma.payment.create({
		data: {
			organizationId,
			userId: membership.userId,
			amount: config.STRIPE_PRICE_MONTHLY_USD / 100,
			stripeSessionId: session.id,
			gatewayResponse: session as never,
		},
	});
	return {
		paymentId: payment.id,
		sessionId: session.id,
		checkoutUrl: session.url,
	};
};

const verifySignature = (payload: Buffer, signature: string) => {
	if (!config.STRIPE_WEBHOOK_SECRET)
		throw new AppError(503, "Stripe webhook is not configured");
	const parts = Object.fromEntries(
		signature.split(",").map((part) => part.split("=", 2)),
	);
	const timestamp = parts.t;
	const received = parts.v1;
	if (
		!timestamp ||
		!received ||
		Math.abs(Date.now() / 1000 - Number(timestamp)) > 300
	)
		return false;
	const expected = createHmac("sha256", config.STRIPE_WEBHOOK_SECRET)
		.update(`${timestamp}.${payload.toString("utf8")}`)
		.digest("hex");
	return (
		received.length === expected.length &&
		timingSafeEqual(Buffer.from(received), Buffer.from(expected))
	);
};

export const handleWebhook = async (
	payload: Buffer,
	signature: string | undefined,
) => {
	if (!signature || !verifySignature(payload, signature))
		throw new AppError(400, "Invalid Stripe signature");
	let rawEvent: unknown;
	try {
		rawEvent = JSON.parse(payload.toString("utf8"));
	} catch {
		throw new AppError(400, "Invalid Stripe event payload");
	}
	const parsedEvent = stripeEventSchema.safeParse(rawEvent);
	if (!parsedEvent.success) {
		throw new AppError(
			400,
			"Invalid Stripe event payload",
			parsedEvent.error.issues,
		);
	}
	const event = parsedEvent.data;
	const session = event.data.object;
	if (
		event.type === "checkout.session.completed" &&
		session.payment_status === "paid"
	) {
		const payment = await prisma.payment.findUnique({
			where: { stripeSessionId: session.id },
		});
		if (payment && payment.status !== "PAID")
			await prisma.$transaction(async (tx) => {
				await tx.payment.update({
					where: { id: payment.id },
					data: {
						status: "PAID",
						paidAt: new Date(),
						gatewayResponse: event as never,
					},
				});
				await tx.organization.update({
					where: { id: payment.organizationId },
					data: { subscriptionStatus: "ACTIVE" },
				});
				await writeAuditLog(tx, {
					organizationId: payment.organizationId,
					actorId: payment.userId,
					action: "PAYMENT_COMPLETED",
					entity: "Payment",
					entityId: payment.id,
					metadata: { stripeEventId: event.id },
				});
			});
	}
	if (event.type === "checkout.session.async_payment_failed") {
		await prisma.payment.updateMany({
			where: { stripeSessionId: session.id },
			data: { status: "FAILED" },
		});
	}
	if (event.type === "checkout.session.expired") {
		await prisma.payment.updateMany({
			where: { stripeSessionId: session.id, status: "PENDING" },
			data: { status: "CANCELLED" },
		});
	}
	return { received: true };
};

export const getPayment = async (userId: string, id: string) => {
	const payment = await prisma.payment.findUnique({ where: { id } });
	if (!payment) throw new AppError(404, "Payment not found");
	await requireOrganizationMembership(payment.organizationId, userId, [
		"OWNER",
		"MANAGER",
	]);
	return payment;
};
