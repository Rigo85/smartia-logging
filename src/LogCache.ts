import { createClient, RedisClientType } from "redis";

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
	throw new Error("The environment variable 'REDIS_URL' is not defined.");
}

export class LogCache {
	private static instance: RedisClientType;

	private constructor() {}

	public static async getInstance(): Promise<RedisClientType> {
		if (!LogCache.instance) {
			LogCache.instance = createClient({
				url: REDIS_URL
			});
			await LogCache.instance.connect();
		}

		return LogCache.instance;
	}
}
