import { createClient, RedisClientType } from "redis";

export class LogCache {
	private static instance: RedisClientType;

	private constructor() {}

	public static async getInstance(): Promise<RedisClientType> {
		if (!LogCache.instance) {
			LogCache.instance = createClient({
				url: process.env.REDIS_URL
			});
			await LogCache.instance.connect();
		}

		return LogCache.instance;
	}
}
