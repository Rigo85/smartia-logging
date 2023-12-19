// let serverIsClosing = false;
//
// // ...
//
// server.on('close', () => {
// 	console.log('El servidor se ha cerrado.');
//
// 	if (!serverIsClosing) {
// 		console.log('Intentando reiniciar el servidor en 5 segundos...');
// 		setTimeout(() => {
// 			server.listen(PORT, HOST, () => {
// 				console.log(`Servidor reiniciado y escuchando en ${HOST}:${PORT}`);
// 			});
// 		}, 5000); // Espera 5 segundos antes de intentar reiniciar
// 	}
// });
//
// process.on('SIGINT', () => {
// 	console.log('Proceso interrumpido. Cerrando servidor...');
// 	serverIsClosing = true;
// 	server.close(() => {
// 		console.log('Servidor cerrado exitosamente.');
// 		process.exit(0);
// 	});
// });
