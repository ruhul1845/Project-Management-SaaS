import { createClient } from "redis";
import { config } from "../config";

export const redisClient = config.REDIS_URL
	? createClient({ url: config.REDIS_URL })
	: null;

export const connectRedis = async () => {
	if (!redisClient || redisClient.isOpen) return;
	redisClient.on("error", (error) => console.error("Redis error:", error));
	await redisClient.connect();
};

export const clearOrganizationCache = async (organizationId: string) => {
	if (!redisClient?.isOpen) return;
	const keys = await redisClient.keys(`org:${organizationId}:*`);
	if (keys.length) await redisClient.del(keys);
};
