# Stage 1: Build the application
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom.xml and download dependencies (for caching)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:17-jre
WORKDIR /app

# Copy the built jar from the build stage
COPY --from=build /app/target/*.jar app.jar

# Cloud Run sẽ tự động truyền biến môi trường PORT (mặc định 8080)
ENV PORT=8080
EXPOSE ${PORT}

# Khởi chạy Spring Boot
CMD ["sh", "-c", "java -jar app.jar --server.port=${PORT}"]
