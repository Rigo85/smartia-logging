import { Pool } from "pg";
import m from "moment-timezone";
import * as dotenv from "dotenv";

import { Logger } from "digevo-logger";
import { revertEscapedString } from "./utils";

dotenv.config({path: ".env"});

const logger = new Logger("DB Helper");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error("The environment variable 'DATABASE_URL' is not defined.");
}

const pool = new Pool({
	connectionString: databaseUrl,
	ssl: {rejectUnauthorized: false}
});

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
	}
}
