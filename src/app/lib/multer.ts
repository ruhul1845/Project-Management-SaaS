import multer from "multer";

export const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 10 * 1024 * 1024, files: 1 },
	fileFilter: (_req, file, callback) => {
		const allowed = [
			"image/jpeg",
			"image/png",
			"image/webp",
			"application/pdf",
			"text/plain",
		];
		callback(null, allowed.includes(file.mimetype));
	},
});
