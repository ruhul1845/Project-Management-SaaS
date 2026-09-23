import { v2 as cloudinary } from "cloudinary";
import { config } from "../config";
import { AppError } from "../utils/AppError";

cloudinary.config({
	cloud_name: config.CLOUDINARY_CLOUD_NAME,
	api_key: config.CLOUDINARY_API_KEY,
	api_secret: config.CLOUDINARY_API_SECRET,
});

export const uploadBuffer = (buffer: Buffer, folder: string) => {
	if (!config.CLOUDINARY_CLOUD_NAME) {
		throw new AppError(503, "Cloudinary is not configured");
	}

	return new Promise<{ secure_url: string; public_id: string }>(
		(resolve, reject) => {
			const stream = cloudinary.uploader.upload_stream(
				{ folder, resource_type: "auto" },
				(error, result) => {
					if (error || !result)
						return reject(error ?? new Error("Upload failed"));
					resolve({
						secure_url: result.secure_url,
						public_id: result.public_id,
					});
				},
			);
			stream.end(buffer);
		},
	);
};
