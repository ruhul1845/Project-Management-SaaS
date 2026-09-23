import type { Response } from "express";
import type { PaginationMeta } from "../interfaces";

type ApiResponse<T> = {
	statusCode: number;
	message: string;
	data: T;
	meta?: PaginationMeta;
};

export const sendResponse = <T>(res: Response, payload: ApiResponse<T>) => {
	const { statusCode, ...body } = payload;
	res.status(statusCode).json({ success: true, ...body });
};
