import type { Request, Response } from "express";
import { config } from "../../config";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import * as authService from "./auth.service";

const setRefreshCookie = (res: Response, token: string) => {
	res.cookie("refreshToken", token, {
		httpOnly: true,
		secure: config.isProduction,
		sameSite: config.isProduction ? "none" : "lax",
		maxAge: 7 * 24 * 60 * 60 * 1000,
	});
};

export const register = catchAsync(async (req: Request, res: Response) => {
	const result = await authService.register(req.body);
	setRefreshCookie(res, result.refreshToken);
	sendResponse(res, {
		statusCode: 201,
		message: "Registration successful",
		data: result,
	});
});

export const login = catchAsync(async (req: Request, res: Response) => {
	const result = await authService.login(req.body);
	setRefreshCookie(res, result.refreshToken);
	sendResponse(res, {
		statusCode: 200,
		message: "Login successful",
		data: result,
	});
});

export const googleLogin = catchAsync(async (req: Request, res: Response) => {
	const result = await authService.googleLogin(req.body.idToken);
	setRefreshCookie(res, result.refreshToken);
	sendResponse(res, {
		statusCode: 200,
		message: "Google login successful",
		data: result,
	});
});

export const refresh = catchAsync(async (req: Request, res: Response) => {
	const token = req.cookies.refreshToken ?? req.body.refreshToken;
	if (!token) throw new AppError(401, "Refresh token is required");
	const result = await authService.refresh(token);
	setRefreshCookie(res, result.refreshToken);
	sendResponse(res, {
		statusCode: 200,
		message: "Token refreshed",
		data: result,
	});
});

export const logout = catchAsync(async (req: Request, res: Response) => {
	await authService.logout(req.user!.id);
	res.clearCookie("refreshToken");
	sendResponse(res, {
		statusCode: 200,
		message: "Logged out successfully",
		data: null,
	});
});
