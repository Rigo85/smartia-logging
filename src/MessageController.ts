import net from "net";
import * as dotenv from "dotenv";
import * as process from "process";
import { createClient } from "redis";

import { Logger } from "digevo-logger";

import { insertLog } from "./dbHelper";

dotenv.config({path: ".env"});

const PORT = parseInt(process.env.PORT);
const HOST = process.env.HOST;
const TIMEOUT = parseInt(process.env.TIMEOUT || "200");

const logger = new Logger("Message Controller");
const MESSAGE_QUEUE = "logsMessagesQueue";
const DELIMITER = "@@@";
const client = createClient({url: process.env.REDIS_URL});
let incompleteMessage = "";

/* eslint-disable @typescript-eslint/naming-convention */
export interface MessageLog {
	Time: string;
	Data: string;
	Source: string;
	Hostname: string;
	AppName: string;
}
/* eslint-enable @typescript-eslint/naming-convention */

export class MessageController {
	private server: net.Server;

	constructor() {
		this.server = net.createServer();

		this.server.on("connection", (socket: net.Socket) => {
			logger.info("Client connected.");

			socket.on("data", this.sendDataToCache.bind(this));

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

	private cleanData(data: string | Buffer): string {
		return data.toString().replace(/\u001b\[\d+m/g, "").replace(/(\r\n|\n|\r|\t)/gm, " ");
	}

	private async sendDataToCache(data: Buffer) {
		try {
			// await client.lPush(MESSAGE_QUEUE, this.cleanData(data));
			client.lPush(MESSAGE_QUEUE, this.cleanData(data));
		} catch (error) {
			logger.error("sendDataToCache", error);
		}
	}

	private async ensureRedisConnection(): Promise<void> {
		if (!client.isReady && !client.isOpen) {
			try {
				await client.connect();
			} catch (error) {
				logger.error("Error connecting to Redis:", error);
			}
		}
	}

	private async processRedisQueue() {
		try {
			let message = await client.rPop(MESSAGE_QUEUE);
			if (message) {
				if (incompleteMessage) {
					message = incompleteMessage + message;
					incompleteMessage = "";
				}
				// await this.processMessage(message);
				this.processMessage(message);
			}
		} catch (error) {
			logger.error("Error reading message from Redis:", error);
		}
	}

	private async processMessage(message: string) {
		let startIndex = 0;
		let endIndex = 0;
		let lastProcessedIndex = 0;

		while ((startIndex = message.indexOf(DELIMITER, endIndex)) !== -1) {
			endIndex = message.indexOf(DELIMITER, startIndex + DELIMITER.length);
			if (endIndex === -1) {
				incompleteMessage = message.substring(startIndex);
				break;
			}

			const jsonMessage = message.substring(startIndex + DELIMITER.length, endIndex);
			try {
				if (jsonMessage.trim()) {
					// logger.info(`---------> '${jsonMessage}'`);
					const jsonData = JSON.parse(jsonMessage);
					// await this.logToDb(jsonData as MessageLog);
					this.logToDb(jsonData as MessageLog);
				}
			} catch (error) {
				logger.error(`Invalid JSON('${jsonMessage}'):`, error);
			}

			lastProcessedIndex = endIndex + DELIMITER.length;
		}

		if (endIndex === -1 && lastProcessedIndex < message.length) {
			incompleteMessage = message.substring(lastProcessedIndex);
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
			await this.ensureRedisConnection();
		} catch (error) {
			logger.error("processMessage", error);
		}

		setInterval(this.processRedisQueue.bind(this), TIMEOUT);
	}
}
