import jwt, { type SignOptions } from "jsonwebtoken";
import type { AuthUser } from "../interfaces";

export const createToken = (
	payload: AuthUser,
	secret: string,
	expiresIn: string,
) => jwt.sign(payload, secret, { expiresIn } as SignOptions);

export const verifyToken = (token: string, secret: string) =>
	jwt.verify(token, secret) as AuthUser;
