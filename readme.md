# Construir y desplegar contenedor.
- Desplegar REDIS:
  - `docker run --name mi-redis -p 6379:6379 -d redis` o `docker start mi-redis`
- Construir imagen: 
  - `sudo docker build -t smartia-logging-server .`
- Ejecutar contenedor con la imagen creado: 
  - `docker run -d -p 8000:8000 --name smartia-logging-server smartia-logging-server`
- Entrar al docker por temas de debugueo:
  - `sudo docker run -ti smartia-logging-server /bin/bash`
- Revisar logs del plugin logspout en el host dokku:
  - `sudo docker logs logspout`
- Actualizar el servicio al cual van a apuntar los logs:
  - `dokku logspout:server tcp://2.tcp.ngrok.io:17722`
  - dokku logspout:server syslog+tls://logs3.papertrailapp.com:30612,syslog+tcp://0.tcp.sa.ngrok.io:18328
  
# Configurar logspout(innecesario).
- Agregar al archivo `/home/dokku/.logspout/ENV` el siguiente formato para RAW_FORMAT:
  - `RAW_FORMAT={{ printf "@@@{\"Time\": %s, \"Data\": %s, \"Source\": \"%s\", \"Hostname\":\"%s\", \"AppName\":\"%s\"}@@@" (toJSON .Time) (toJSON .Data) .Source .Container.Config.Hostname (index .Container.Config.Labels "com.dokku.app-name") }}`
  - `SYSLOG_TCP_FRAMING=octet-counted`
- Reiniciar el contenedor de logspout:
  - `dokku logspout:stop && dokku logspout:start`
- Revisar logs del plugin logspout.

# Ej. de log(ahora llega de otra forma).
````
{
    "Time":"2023-12-17T16:54:49.294161642Z",
    "Data":"query: SELECT \"AppConfiguration\".\"id\" AS \"AppConfiguration_id\", \"AppConfiguration\".\"dokkuApp\" AS \"AppConfiguration_dokkuApp\", \"AppConfiguration\".\"configName\" AS \"AppConfiguration_configName\", \"AppConfiguration\".\"configuration\" AS \"AppConfiguration_configuration\" FROM \"app_configuration\" \"AppConfiguration\" WHERE \"AppConfiguration\".\"dokkuApp\" = $\u001b[32m1\u001b[39m AND \"AppConfiguration\".\"configName\" = $\u001b[32m2\u001b[39m LIMIT \u001b[32m1\u001b[39m -- PARAMETERS: [\"supporting-services\",\"ID_CONFIRM_DISC\"]",
    "Source":"stdout",
    "Hostname":"dokku-smartia-services",
    "AppName":"supporting-services"
}
````