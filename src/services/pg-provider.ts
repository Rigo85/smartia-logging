import { DataSource } from "typeorm";
import { parse } from "pg-connection-string";

export const connect = async (databaseConnectionString: string, options: any): Promise<DataSource> => {
	const connectionOptions = parse(databaseConnectionString);

	const dataSource = new DataSource({
		type: "postgres",
		host: connectionOptions.host,
		port: parseInt(connectionOptions.port),
		username: connectionOptions.user,
		password: connectionOptions.password,
		database: connectionOptions.database,
		ssl: {rejectUnauthorized: false},
		...options // Si tienes opciones adicionales, se propagarán aquí
	});

	await dataSource.initialize();
	return dataSource;
};
