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

const lineBuffers = new Map<net.Socket, string>();

export class MessageController {
	private server: net.Server;

	constructor() {
		this.server = net.createServer();

		this.server.on("connection", (socket: net.Socket) => {
			logger.info("Client connected.");

			socket.on("data", (data: Buffer) => this.sendDataToCache(data, socket));

			socket.on("end", () => {
				logger.info("Client disconnected.");
				lineBuffers.delete(socket);
			});

			socket.on("close", () => {
				logger.info("Socket closed.");
				lineBuffers.delete(socket);
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
			const chunk = data.toString("utf8");
			if (!chunk) return;

			// acumula por socket
			const prev = lineBuffers.get(socket) ?? "";
			let buf = prev + chunk;

			const lines: string[] = [];
			let idx: number;

			// extrae líneas completas terminadas en \n
			while ((idx = buf.indexOf("\n")) >= 0) {
				let line = buf.slice(0, idx);
				buf = buf.slice(idx + 1);
				// quita CR opcional
				if (line.endsWith("\r")) line = line.slice(0, -1);
				if (!line) continue;
				if (line === "PING") {
					socket.write("PONG");
					continue;
				}
				lines.push(line);
			}

			// guarda el resto incompleto para el siguiente 'data'
			lineBuffers.set(socket, buf);

			if (lines.length) {
				const client = await LogCache.getInstance();
				await client.lPush(LOGS_MESSAGE_QUEUE, lines);
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

	private parseSyslogToJSON(syslogMsg: string) {
		if (!syslogMsg) return undefined;

		try {
			// RFC5424: <PRI>VERSION SP TIMESTAMP SP HOSTNAME SP APP-NAME SP PROCID SP MSGID SP STRUCTURED-DATA [SP MSG]
			const re = /^<(?<pri>\d{1,3})>(?<ver>[1-9]\d{0,2})\s+(?<ts>(?:-|(?:\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+\-]\d{2}:\d{2}))))\s+(?<host>\S+)\s+(?<app>\S+)\s+(?<procid>\S+)\s+(?<msgid>\S+|-)\s+(?<sd>-(?=\s|$)|\[[^\]]*\](?:\s*\[[^\]]*\])*)\s*(?<msg>.*)$/;
			const match = syslogMsg.match(re);

			if (!match || !match.groups) {
				logger.info("=======---> Failed to parse syslog message:", syslogMsg);
				return undefined;
			}

			/* eslint-disable @typescript-eslint/naming-convention */
			return {
				Time: match.groups.ts,
				Hostname: match.groups.host,
				AppName: match.groups.app,
				Data: match.groups.msg,
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
