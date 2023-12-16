# Construir y desplegar contenedor.
- sudo docker build -t smartia-logging-server .
- docker run -d -p 8000:8000 --name smartia-logging-server smartia-logging-server
- sudo docker run -ti smartia-logging-server /bin/bash
- sudo docker logs logspout 
- 