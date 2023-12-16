import { Request, Response, NextFunction } from "express";
import { Logger } from "digevo-logger";

const logger = new Logger("Home");

export const index = async (req: Request, res: Response, next: NextFunction) => {
	logger.info("index", {body: req.body, params: req.params});
	res.statusCode = 200;
	return Promise.resolve(res.send("OK"));
};
