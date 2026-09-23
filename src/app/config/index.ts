import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
	NODE_ENV: z
		.enum(["development", "test", "production"])
		.default("development"),
	PORT: z.coerce.number().default(5000),
	DATABASE_URL: z.string().min(1),
	FRONTEND_URL: z.string().default("http://localhost:3000"),
	BACKEND_URL: z.string().default("http://localhost:5000"),
	JWT_ACCESS_SECRET: z.string().min(32),
	JWT_REFRESH_SECRET: z.string().min(32),
	JWT_ACCESS_EXPIRES_IN: z.string().default("1d"),
	JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
	BCRYPT_SALT_ROUNDS: z.coerce.number().default(12),
	GOOGLE_CLIENT_ID: z.string().optional(),
	STRIPE_SECRET_KEY: z.string().optional(),
	STRIPE_WEBHOOK_SECRET: z.string().optional(),
	STRIPE_PRICE_MONTHLY_USD: z.coerce.number().int().positive().default(1900),
	CLOUDINARY_CLOUD_NAME: z.string().optional(),
	CLOUDINARY_API_KEY: z.string().optional(),
	CLOUDINARY_API_SECRET: z.string().optional(),
	REDIS_URL: z.string().optional(),
	DEMO_OWNER_NAME: z.string().default("Demo Owner"),
	DEMO_OWNER_EMAIL: z.email().default("owner@taskflow.dev"),
	DEMO_OWNER_PASSWORD: z.string().min(8).default("Owner@12345"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
	console.error(
		"Invalid environment variables:",
		z.flattenError(parsed.error).fieldErrors,
	);
	throw new Error("Environment configuration is invalid. Check .env.example.");
}

export const config = {
	...parsed.data,
	isProduction: parsed.data.NODE_ENV === "production",
};
