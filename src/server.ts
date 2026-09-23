import app from "./app";
import { config } from "./app/config";
import { prisma } from "./app/lib/prisma";
import { connectRedis, redisClient } from "./app/lib/redis";

const start = async () => {
	await prisma.$connect();
	await connectRedis();
	const server = app.listen(config.PORT, () =>
		console.log(`TaskFlow API running on port ${config.PORT}`),
	);

	const shutdown = async () => {
		server.close();
		if (redisClient?.isOpen) await redisClient.quit();
		await prisma.$disconnect();
		process.exit(0);
	};
	process.on("SIGTERM", shutdown);
	process.on("SIGINT", shutdown);
};

start().catch(async (error) => {
	console.error("Failed to start server:", error);
	await prisma.$disconnect();
	process.exit(1);
});

export default app;
