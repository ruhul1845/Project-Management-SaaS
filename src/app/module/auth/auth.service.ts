import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import type { Role } from "../../../generated/prisma/client";
import { config } from "../../config";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { createToken, verifyToken } from "../../utils/jwt";

const googleClient = new OAuth2Client(config.GOOGLE_CLIENT_ID);

const safeUserSelect = {
	id: true,
	name: true,
	email: true,
	avatarUrl: true,
	role: true,
	emailVerified: true,
	createdAt: true,
} as const;

const issueTokens = async (user: { id: string; email: string; role: Role }) => {
	const payload = { id: user.id, email: user.email, role: user.role };
	const accessToken = createToken(
		payload,
		config.JWT_ACCESS_SECRET,
		config.JWT_ACCESS_EXPIRES_IN,
	);
	const refreshToken = createToken(
		payload,
		config.JWT_REFRESH_SECRET,
		config.JWT_REFRESH_EXPIRES_IN,
	);
	await prisma.user.update({
		where: { id: user.id },
		data: {
			refreshToken: await bcrypt.hash(refreshToken, config.BCRYPT_SALT_ROUNDS),
		},
	});
	return { accessToken, refreshToken };
};

export const register = async (input: {
	name: string;
	email: string;
	password: string;
}) => {
	const existing = await prisma.user.findUnique({
		where: { email: input.email.toLowerCase() },
	});
	if (existing) throw new AppError(409, "Email is already registered");
	const user = await prisma.user.create({
		data: {
			name: input.name,
			email: input.email.toLowerCase(),
			password: await bcrypt.hash(input.password, config.BCRYPT_SALT_ROUNDS),
		},
		select: safeUserSelect,
	});
	return { user, ...(await issueTokens(user)) };
};

export const login = async (input: { email: string; password: string }) => {
	const user = await prisma.user.findUnique({
		where: { email: input.email.toLowerCase() },
	});
	if (!user?.password || user.deletedAt || user.status !== "ACTIVE")
		throw new AppError(401, "Invalid email or password");
	if (!(await bcrypt.compare(input.password, user.password)))
		throw new AppError(401, "Invalid email or password");
	const publicUser = await prisma.user.findUniqueOrThrow({
		where: { id: user.id },
		select: safeUserSelect,
	});
	return { user: publicUser, ...(await issueTokens(user)) };
};

export const googleLogin = async (idToken: string) => {
	if (!config.GOOGLE_CLIENT_ID)
		throw new AppError(503, "Google authentication is not configured");
	const ticket = await googleClient.verifyIdToken({
		idToken,
		audience: config.GOOGLE_CLIENT_ID,
	});
	const payload = ticket.getPayload();
	if (!payload?.email || !payload.sub || !payload.email_verified)
		throw new AppError(401, "Invalid Google account");

	const user = await prisma.user.upsert({
		where: { email: payload.email.toLowerCase() },
		update: {
			googleId: payload.sub,
			emailVerified: true,
			avatarUrl: payload.picture,
		},
		create: {
			email: payload.email.toLowerCase(),
			name: payload.name ?? payload.email.split("@")[0],
			googleId: payload.sub,
			avatarUrl: payload.picture,
			authProvider: "GOOGLE",
			emailVerified: true,
		},
		select: safeUserSelect,
	});
	return { user, ...(await issueTokens(user)) };
};

export const refresh = async (refreshToken: string) => {
	let payload: ReturnType<typeof verifyToken>;
	try {
		payload = verifyToken(refreshToken, config.JWT_REFRESH_SECRET);
	} catch {
		throw new AppError(401, "Invalid refresh token");
	}
	const user = await prisma.user.findUnique({ where: { id: payload.id } });
	if (
		!user?.refreshToken ||
		!(await bcrypt.compare(refreshToken, user.refreshToken))
	) {
		throw new AppError(401, "Refresh token has been revoked");
	}
	return issueTokens(user);
};

export const logout = async (userId: string) => {
	await prisma.user.update({
		where: { id: userId },
		data: { refreshToken: null },
	});
};
