import { Request, Response, NextFunction } from "express";

import { Logger } from "digevo-logger";

const logger = new Logger("LoggingController");

export async function messages(req: Request, res: Response, next: NextFunction) {
	logger.info("messages", req.body);

	res.end("Ok");
}
