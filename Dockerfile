# Stage 1: Build application with Maven
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

# Copy Maven files first for caching
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B || true

# Copy source code and build jar
COPY src src
RUN ./mvnw clean package -DskipTests

# Stage 2: Minimal JRE runtime
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create uploads directory
RUN mkdir -p /app/uploads/documents

# Copy built artifact
COPY --from=build /app/target/DataVault-0.0.1-SNAPSHOT.jar app.jar

# Expose default port (Railway supplies PORT dynamically)
EXPOSE 8080
ENV PORT=8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]
