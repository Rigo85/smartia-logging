# Construir y desplegar contenedor.
- Crear red interna:
  - `docker network create mi-red`
- Desplegar REDIS:
  - `docker run --name mi-redis -p 6379:6379 --network mi-red -d redis` o `docker start mi-redis`
- Construir imagen: 
  - `sudo docker build -t smartia-logging-server .`
- Ejecutar contenedor con la imagen creado: 
  - `docker run -d -p 8000:8000 --name smartia-logging-server --network mi-red smartia-logging-server`
- Entrar al docker por temas de debugueo:
  - `sudo docker exec -ti smartia-logging-server /bin/bash`
- Actualizar el servicio al cual van a apuntar los logs:
  - `dokku logspout:server syslog+tls://logs3.papertrailapp.com:30612,syslog+tcp://54.207.200.52:8000`
  
# Configurar logspout.
- (*No es necesario*) Agregar al archivo `/home/dokku/.logspout/ENV` el siguiente formato para RAW_FORMAT:
  - `RAW_FORMAT={{ printf "@@@{\"Time\": %s, \"Data\": %s, \"Source\": \"%s\", \"Hostname\":\"%s\", \"AppName\":\"%s\"}@@@" (toJSON .Time) (toJSON .Data) .Source .Container.Config.Hostname (index .Container.Config.Labels "com.dokku.app-name") }}`
  - `SYSLOG_TCP_FRAMING=octet-counted`
- Reiniciar el contenedor de logspout:
  - `dokku logspout:stop && dokku logspout:start`
- Revisar logs del plugin logspout.
  - `sudo docker logs logspout`

# Ej. de log(*antes*).
````
{
    "Time":"2023-12-17T16:54:49.294161642Z",
    "Data":"query: SELECT \"AppConfiguration\".\"id\" AS \"AppConfiguration_id\", \"AppConfiguration\".\"dokkuApp\" AS \"AppConfiguration_dokkuApp\", \"AppConfiguration\".\"configName\" AS \"AppConfiguration_configName\", \"AppConfiguration\".\"configuration\" AS \"AppConfiguration_configuration\" FROM \"app_configuration\" \"AppConfiguration\" WHERE \"AppConfiguration\".\"dokkuApp\" = $\u001b[32m1\u001b[39m AND \"AppConfiguration\".\"configName\" = $\u001b[32m2\u001b[39m LIMIT \u001b[32m1\u001b[39m -- PARAMETERS: [\"supporting-services\",\"ID_CONFIRM_DISC\"]",
    "Source":"stdout",
    "Hostname":"dokku-smartia-services",
    "AppName":"supporting-services"
}
````
# Ej. de log
````
<14>1 2023-12-19T23:46:57Z dokku-smartia-services supporting-services.web.1 386017 - - IdentityConfirmationController Info: checkDialerEnqueuedTime """"
````
