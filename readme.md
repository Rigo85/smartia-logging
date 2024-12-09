# Construir y desplegar contenedor.
- Ejecutar lo relacionado con *smartia-logging-postgresql*.
- Desplegar REDIS:
  - `docker run --name mi-redis -p 6379:6379 --network mi-red -d redis`
- Entrar a REDIS para revisar estado de las colas:
  - `docker exec -it mi-redis /bin/bash`
  - `redis-cli`
  - `llen logsMessagesQueue`, revisar en la configuración del container el nombre correcto de la cola. 
  - `llen retriesLogsMessagesQueue`, revisar en la configuración del container el nombre correcto de la cola.
- Construir imagen: 
  - `docker build -t smartia-logging-server .`
- Ejecutar contenedor con la imagen creado: 
  - `docker run -d -p 8000:8000 --env-file=./.env --name smartia-logging-server --network mi-red smartia-logging-server`
- Entrar al docker por temas de depuración:
  - `sudo docker exec -ti smartia-logging-server /bin/bash`
- Revisar logs del backend:
  - `sudo docker logs smartia-logger-server -t`
- Actualizar el servicio al cual van a apuntar los logs:
  - `dokku logspout:server syslog+tls://logs3.papertrailapp.com:30612,syslog+tcp://172.206.27.86:8000`

# Desplegar en PM2
- Instalar PM2.
- Clonar el repo *https://github.com/Rigo85/smartia-logging.git*.
- Moverse a *smartia-logging*.
- Construir: `npm run build`.
- Iniciar: `pm2 start dist/server.js --name smartia-logging --log /home/azureuser/smartia-logging.log --time`

## Hacer que PM2 inicie con el sistema
- `pm2 save`.
- `pm2 startup`.
- Ejecutar el comando entregado por el paso anterior.

# Configurar logspout.
- Reiniciar el contenedor de logspout:
  - `dokku logspout:stop && dokku logspout:start`
- Revisar logs del plugin logspout.
  - `sudo docker logs logspout`

# Ej. de log
````
<14>1 2023-12-19T23:46:57Z dokku-smartia-services supporting-services.web.1 386017 - - IdentityConfirmationController Info: checkDialerEnqueuedTime """"
````
