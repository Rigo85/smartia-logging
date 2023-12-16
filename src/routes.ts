import { Express, Request, Response, NextFunction } from "express";

// Controllers
import * as homeController from "(src)/controllers/home";
import * as loggingController from "(src)/controllers/LoggingController";

declare class AppRoute {
	path: string;
	method: keyof Express;
	action(request: Request, response: Response, next: NextFunction): Promise<any>;
}

// Define all routes and map their handlers here

export const AppRoutes: AppRoute[] = [
	{
		path: "/",
		method: "get",
		action: homeController.index
	},
	{
		path: "/api/messages",
		method: "post",
		action: loggingController.messages
	}
];

