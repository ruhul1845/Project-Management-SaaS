import { z } from "zod";

const password = z
	.string()
	.min(8)
	.regex(/[A-Z]/, "Password needs an uppercase letter")
	.regex(/[a-z]/, "Password needs a lowercase letter")
	.regex(/[0-9]/, "Password needs a number");

export const registerSchema = z.object({
	body: z.object({
		name: z.string().min(2).max(80),
		email: z.email(),
		password,
	}),
});

export const loginSchema = z.object({
	body: z.object({ email: z.email(), password: z.string().min(1) }),
});

export const googleLoginSchema = z.object({
	body: z.object({ idToken: z.string().min(20) }),
});
export const refreshSchema = z.object({
	body: z.object({ refreshToken: z.string().optional() }),
});
