import { Pool } from "pg";
import m from "moment-timezone";
import * as dotenv from "dotenv";

import { Logger } from "digevo-logger";

import { revertEscapedString } from "./utils";
import { LogCache } from "./LogCache";

dotenv.config({path: ".env"});

const logger = new Logger("DB Helper");

const databaseUrl = process.env.DATABASE_URL;
const RETRIES_MESSAGE_QUEUE = process.env.RETRIES_MESSAGE_QUEUE;
const TIMEOUT = parseInt(process.env.TIMEOUT_RETRIES || "1000");

if (!databaseUrl) {
	throw new Error("The environment variable 'DATABASE_URL' is not defined.");
}

const pool = new Pool({
	connectionString: databaseUrl,
	ssl: process.env.NODE_ENV === "production" ? {rejectUnauthorized: false} : false
});

/* eslint-disable @typescript-eslint/naming-convention */
export interface MessageLog {
	Time: string;
	Data: string;
	Source: string;
	Hostname: string;
	AppName: string;
}

/* eslint-enable @typescript-eslint/naming-convention */

export async function insertLog(timestamp: string, data: string, source: string, hostname: string, appName: string): Promise<void> {
	try {
		const timestampMoment = m(timestamp);
		const _data = revertEscapedString(data);
		if (timestampMoment.isValid() && _data?.trim() && hostname?.trim()) {
			const query = "INSERT INTO smartia_logs (timestamp, data, source, hostname, appName) VALUES ($1, $2, $3, $4, $5)";
			const values = [timestampMoment.toDate(), _data, source || "", hostname, appName || ""];

			await pool.query(query, values);
		}
	} catch (error) {
		logger.error("insertLog: ", error);

		// eslint-disable-next-line @typescript-eslint/naming-convention
		retriesProcess({Time: timestamp, Data: data, AppName: appName, Hostname: hostname, Source: source});
	}
}

async function retriesProcess(log: MessageLog) {
	try {
		const client = await LogCache.getInstance();
		client.lPush(RETRIES_MESSAGE_QUEUE, JSON.stringify(log));
	} catch (error) {
		logger.error("retriesProcess", error);
	}
}

async function processRetriesCache() {
	try {
		const client = await LogCache.getInstance();
		const messageStr = await client.rPop(RETRIES_MESSAGE_QUEUE);
		const message = JSON.parse(messageStr) as MessageLog;
		if (message) {
			insertLog(message.Time, message.Data, message.Source, message.Hostname, message.AppName);
		}
	} catch (error) {
		logger.error("processRetriesCache", error);
	}
}

export async function checkRetries() {
	setInterval(processRetriesCache, TIMEOUT);
}
