# Etapa de construcción (Build stage)
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# Copiamos el archivo pom.xml y descargamos las dependencias
# Esto ayuda al caché de Docker si no se ha modificado el pom.xml
COPY pom.xml .
RUN mvn dependency:go-offline

# Copiamos el código fuente de la aplicación
COPY src ./src

# Empaquetamos la aplicación (omitiendo los tests para mayor rápidez)
RUN mvn clean package -DskipTests

# Etapa de ejecución (Run stage)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copiamos el JAR generado desde la etapa de construcción anterior
COPY --from=builder /app/target/*.jar app.jar

# Informamos el puerto en el que la aplicación escucha
EXPOSE 8080

# Comando para ejecutar la aplicación
ENTRYPOINT ["java", "-jar", "app.jar"]
