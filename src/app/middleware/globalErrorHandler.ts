import type { ErrorRequestHandler } from "express";
import { Prisma } from "../../generated/prisma/client";
import { config } from "../config";
import { AppError } from "../utils/AppError";

export const globalErrorHandler: ErrorRequestHandler = (
	error,
	_req,
	res,
	_next,
) => {
	let statusCode = 500;
	let message = "Internal server error";
	let errors: unknown[] = [];

	if (error instanceof AppError) {
		statusCode = error.statusCode;
		message = error.message;
		errors = error.errors;
	} else if (error instanceof Prisma.PrismaClientKnownRequestError) {
		if (error.code === "P2002") {
			statusCode = 409;
			message = "A record with this value already exists";
		} else if (error.code === "P2025") {
			statusCode = 404;
			message = "Requested record was not found";
		} else {
			message = "Database operation failed";
		}
	} else if (error instanceof Error) {
		message = config.isProduction ? "Internal server error" : error.message;
	}

	if (!config.isProduction) console.error(error);
	res.status(statusCode).json({ success: false, message, errors });
};
