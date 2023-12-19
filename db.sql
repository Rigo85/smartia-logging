-- Crear una nueva configuración de búsqueda de texto multilingüe
CREATE TEXT SEARCH CONFIGURATION multilingual ( COPY = pg_catalog.simple );

-- Agregar diccionarios de inglés y español
ALTER TEXT SEARCH CONFIGURATION multilingual
    ALTER MAPPING FOR word, asciiword
    WITH english_stem, spanish_stem;

-- Crear una tabla de ejemplo para almacenar logs
CREATE TABLE logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    data TEXT not null,
    source VARCHAR(255) not null,
    hostname VARCHAR(255) not null,
    appname VARCHAR(255) not null,
    tsvector_multilingual tsvector
);

-- Crear un índice GIN en la columna tsvector
CREATE INDEX logs_tsvector_idx ON logs USING gin(tsvector_multilingual);

-- Función para actualizar automáticamente el tsvector multilingüe
CREATE OR REPLACE FUNCTION logs_tsvector_trigger() RETURNS trigger AS $$
BEGIN
    NEW.tsvector_multilingual := to_tsvector('multilingual', coalesce(NEW.data, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar el tsvector en cada inserción o actualización
CREATE TRIGGER logs_tsvector_update BEFORE INSERT OR UPDATE
ON logs FOR EACH ROW EXECUTE FUNCTION logs_tsvector_trigger();

-- (Opcional) Insertar datos de ejemplo en la tabla
INSERT INTO logs (timestamp, data, source, hostname, appname) VALUES
(NOW(), 'This is a test message in English', 'web', 'server01', 'myapp'),
(NOW(), 'Este es un mensaje de prueba en español', 'database', 'server02', 'myapp');

---------------------------------------------------------------------------
SELECT * FROM logs
WHERE
    tsvector_multilingual @@ to_tsquery('multilingual', 'tu_búsqueda') AND
    hostname = 'hostname_específico' AND
    appname = 'appname_específico';

SELECT * FROM logs
WHERE
    tsvector_multilingual @@ to_tsquery('multilingual', 'tu_búsqueda')
    AND (hostname = 'hostname_específico' OR 'hostname_específico' IS NULL)
    AND (appname = 'appname_específico' OR 'appname_específico' IS NULL);
---------------------------------------------------------------------------
CREATE INDEX idx_hostname ON logs (hostname);
CREATE INDEX idx_appname ON logs (appname);

-- Monitoreo y Ajuste
-- Después de indexar estos campos, es una buena práctica monitorizar
-- el rendimiento de tu base de datos. Puedes usar herramientas como 'EXPLAIN'
-- para analizar tus consultas y ajustar tu estrategia de indexación según sea necesario.
--
-- En resumen, indexar hostname y appname puede ser una buena idea si estos campos
-- se utilizan a menudo en filtros y si tienes una base de datos de gran tamaño.
-- Sin embargo, es importante equilibrar los beneficios de los índices con
-- su costo en términos de rendimiento de escritura y uso de espacio.
