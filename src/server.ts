// Hack to get module importing from typescript correctly translated to Node.js (CommonJS)
const moduleAlias = require("module-alias");
moduleAlias.addAliases({
	"@root": __dirname + "/..",
	"(src)": __dirname,
});

import { Request, Response, NextFunction } from "express";
import errorHandler from "errorhandler";
import { Logger } from "digevo-logger";
import { default as chalk } from "chalk";

const logger = new Logger("server");

// Start bot Express server.
import { app } from "./app";

if (process.env.NODE_ENV === "development") {
	// 'Stack traces' y detalles del error para desarrollo
	app.use(errorHandler());
} else {
	// Manejo de errores para producción
	app.use((err: any, req: Request, res: Response, next: NextFunction) => {
		logger.error(err); // Registra el error internamente
		res.status(err.status || 500);
		res.send({error: "Ocurrió un error interno."});
	});
}

// Start server
const port = process.env.PORT || "3000";

const appServer = app.listen(port, () => {
	logger.success(`${chalk.blue("Server")} running on port ${chalk.bold(port)} in ${chalk.bold(process.env.NODE_ENV)} mode`);
});


