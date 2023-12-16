import * as dotenv from "dotenv";

dotenv.config({path: ".env"});

import express from "express";
import { Request, Response, NextFunction } from "express";
import compression from "compression";
import lusca from "lusca";
import helmet from "helmet";
import cors from "cors";
import path from "path";

import { Logger, isTrue } from "digevo-logger";

const logger = new Logger("app");

import { AppRoutes } from "./routes"; // Routes file

// Create Express server
const app = express();

// Express configuration
app.set("port", process.env.PORT || 3000);
app.use(compression());
app.use(express.json()); // parse application/json type post data
app.use(express.urlencoded({extended: true})); // parse application/x-www-form-urlencoded post data
app.use(express.static(path.join(__dirname, "public"), {maxAge: 31557600000}));
app.use(lusca.xframe("SAMEORIGIN"));
app.use(lusca.xssProtection(true));
app.use(helmet());
app.use(cors());


// Connect to Postgres
import { connect as pgConnect } from "(src)/services/pg-provider";

pgConnect(process.env.DATABASE_URL, {
	synchronize: isTrue(process.env.TYPEORM_SYNCHRONIZE),
	logging: isTrue(process.env.TYPEORM_LOGGING),
	entities: ["dist/models/*.js"],
	subscribers: [
		"dist/subscribers/*.js"
	],
	migrations: [
		"dist/migrations/*.js"
	],
	cli: {
		entitiesDir: "dist/models",
		migrationsDir: "dist/migrations",
		subscribersDir: "dist/subscribers"
	}
}).then(() => {
	AppRoutes.forEach(route => {
		(app as any)[route.method](route.path, (request: Request, response: Response, next: NextFunction) => {
			route.action(request, response, next)
				.then(() => next)
				.catch((err: any) => next(err));
		});
	});
}).then(async () => {
	//
}).catch((err: any) => logger.error(err));

export { app };



