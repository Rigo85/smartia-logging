# Construir y desplegar contenedor.
- Crear red interna:
  - `docker network create mi-red`
- Desplegar REDIS:
  - `docker run --name mi-redis -p 6379:6379 --network mi-red -d redis` o `docker start mi-redis`
- Entrar a REDIS para revisar estado de las colas:
  - `docker exec -it mi-redis /bin/bash`
  - `redis-cli`
  - `llen logsMessagesQueue`, revisar en la configuración del container el nombre correcto de la cola. 
  - `llen retriesLogsMessagesQueue`, revisar en la configuración del container el nombre correcto de la cola.
- Construir imagen (**eliminar/mover el archivo .env** para que no quede dentro de la imagen): 
  - `sudo docker build -t smartia-logging-server .`
- Ejecutar contenedor con la imagen creado (**retornar el archivo .env**): 
  - `docker run -d -p 8000:8000 --env-file=./.env --name smartia-logging-server --network mi-red smartia-logging-server`
- Entrar al docker por temas de depuración:
  - `sudo docker exec -ti smartia-logging-server /bin/bash`
- Revisar logs del backend:
  - `sudo docker logs smartia-logger-server -t`
- Actualizar el servicio al cual van a apuntar los logs:
  - `dokku logspout:server syslog+tls://logs3.papertrailapp.com:30612,syslog+tcp://54.207.200.52:8000`
  
# Configurar logspout.
- Reiniciar el contenedor de logspout:
  - `dokku logspout:stop && dokku logspout:start`
- Revisar logs del plugin logspout.
  - `sudo docker logs logspout`

# Ej. de log
````
<14>1 2023-12-19T23:46:57Z dokku-smartia-services supporting-services.web.1 386017 - - IdentityConfirmationController Info: checkDialerEnqueuedTime """"
````
