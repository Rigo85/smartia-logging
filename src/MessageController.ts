import net from "net";
import * as dotenv from "dotenv";
import * as process from "process";

import { Logger } from "digevo-logger";

import { LogCache } from "./LogCache";
import { checkRetries, insertLog, MessageLog } from "./dbHelper";

dotenv.config({path: ".env"});

const PORT = parseInt(process.env.PORT);
const HOST = process.env.HOST;
const TIMEOUT = parseInt(process.env.TIMEOUT || "200");
const REDIS_COUNT = parseInt(process.env.REDIS_COUNT || "10");

const logger = new Logger("Message Controller");
const LOGS_MESSAGE_QUEUE = process.env.LOGS_MESSAGE_QUEUE;

export class MessageController {
	private server: net.Server;

	constructor() {
		this.server = net.createServer();

		this.server.on("connection", (socket: net.Socket) => {
			logger.info("Client connected.");

			socket.on("data", (data: Buffer) => this.sendDataToCache(data, socket));

			socket.on("end", () => {
				logger.info("Client disconnected.");
			});

			socket.on("error", (err: Error) => {
				logger.error("Socket error:", err);
			});
		});

		this.server.on("error", (error: Error) => {
			logger.error("Server Error:", error);
			// Aquí puedes implementar lógica de reintento o notificación
		});

		this.server.on("close", () => {
			logger.info("Server has shut down. Attempting to restart...");
			// Aquí puedes implementar lógica para reiniciar el servidor
		});
	}

	private async sendDataToCache(data: Buffer, socket: net.Socket) {
		try {
			const _data = data.toString();
			if (_data) {
				if (_data === "PING") {
					socket.write("PONG");
				} else {
					const client = await LogCache.getInstance();
					client.lPush(LOGS_MESSAGE_QUEUE, _data);
				}
			}
		} catch (error) {
			logger.error("sendDataToCache", error);
		}
	}

	private async processRedisQueue() {
		try {
			const client = await LogCache.getInstance();
			const messages = await client.lRange(LOGS_MESSAGE_QUEUE, 0, REDIS_COUNT);
			if (messages?.length) {
				await client.lTrim(LOGS_MESSAGE_QUEUE, messages.length, -1);
				for (const message of messages) {
					const syslogJson = this.parseSyslogToJSON(message);
					if (syslogJson) {
						this.logToDb(syslogJson);
					}
				}
			}
		} catch (error) {
			logger.error("Error reading message from Redis:", error);
		}
	}

	// private parseSyslogToJSON(syslogMsg: string) {
	// 	if (!syslogMsg) return undefined;
	//
	// 	try {
	// 		const regex = /<\d+>\d+ (\S+) (\S+) (\S+) \d+ - - (.+)/;
	// 		const match = syslogMsg.match(regex);
	//
	// 		/* eslint-disable @typescript-eslint/naming-convention */
	// 		return match ? {
	// 			Time: match[1],
	// 			Hostname: match[2],
	// 			AppName: match[3],
	// 			Data: match[4],
	// 			Source: ""
	// 		} : undefined;
	// 		/* eslint-enable @typescript-eslint/naming-convention */
	// 	} catch (error) {
	// 		logger.error("parseSyslogToJSON", error);
	// 		return undefined;
	// 	}
	// }

	private parseSyslogToJSON(syslogMsg: string) {
		if (!syslogMsg) return undefined;

		try {
			// RFC5424: <PRI>VERSION SP TIMESTAMP SP HOSTNAME SP APP-NAME SP PROCID SP MSGID SP STRUCTURED-DATA [SP MSG]
			// STRUCTURED-DATA puede ser "-" o una o más secciones [id params]
			const re = /^<(?<pri>\d+)>(?<ver>\d+)\s+(?<ts>\S+)\s+(?<host>\S+)\s+(?<app>\S+)\s+(?<procid>\S+)\s+(?<msgid>\S+)\s+(?<sd>-(?:|\s*\[[^\]]*\](?:\s*\[[^\]]*\])*)|\[[^\]]*\](?:\s*\[[^\]]*\])*)\s*(?<msg>.*)$/;

			const m = syslogMsg.match(re);
			if (!m || !m.groups) return undefined;

			/* eslint-disable @typescript-eslint/naming-convention */
			return {
				// Pri: Number(m.groups.pri),
				// Version: Number(m.groups.ver),
				Time: m.groups.ts,                 // RFC3339
				Hostname: m.groups.host,
				AppName: m.groups.app,
				// ProcId: m.groups.procid,           // puede ser "-"
				// MsgId: m.groups.msgid,             // puede ser "-"
				// StructuredData: m.groups.sd === "-" ? undefined : m.groups.sd,
				Data: m.groups.msg ?? "",          // el mensaje (puede ser vacío)
				Source: ""
			};
			/* eslint-enable @typescript-eslint/naming-convention */
		} catch (error) {
			logger.error("parseSyslogToJSON", error);
			return undefined;
		}
	}


	private async logToDb(messageLog: MessageLog) {
		insertLog(messageLog.Time, messageLog.Data, messageLog.Source, messageLog.Hostname, messageLog.AppName);
	}

	public listen() {
		this.server.listen(PORT, HOST, () => {
			logger.info(`Server listening on ${HOST}:${PORT}`);
		});
	}

	public async processMessages() {
		try {
			await LogCache.getInstance();
		} catch (error) {
			logger.error("processMessage", error);
		}

		setInterval(this.processRedisQueue.bind(this), TIMEOUT);
		checkRetries();
	}
}
