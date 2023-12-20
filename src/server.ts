import * as dotenv from "dotenv";

import { Logger } from "digevo-logger";

import { MessageController } from "./MessageController";

dotenv.config({path: ".env"});

const logger = new Logger("server");

try {
	const messageController = new MessageController();
	messageController.listen();
	messageController.processMessages().catch((error) => logger.error(error));

	process.on("uncaughtException", (error) => {
		logger.error("Excepción no capturada:", error);
		// Aquí puedes manejar la excepción y decidir si reiniciar el servidor
	});

// process.on("SIGINT", () => {
// 	logger.info("Proceso interrumpido. Cerrando servidor...");
// 	server.close(() => {
// 		logger.info("Servidor cerrado exitosamente.");
// 		process.exit(0);
// 	});
// });
} catch (error) {
	logger.error("Core Server", error);
}


