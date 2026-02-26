import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { Logger as PinoLogger } from "nestjs-pino";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { json, urlencoded } from "express";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // Use structured Pino logger
  app.useLogger(app.get(PinoLogger));

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", process.env.WEB_URL || "http://localhost:3000"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Request size limits
  app.use(json({ limit: "10mb" }));
  app.use(urlencoded({ limit: "10mb", extended: true }));

  // Cookie parser for JWT in cookies
  app.use(cookieParser());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.WEB_URL || "http://localhost:3000",
    credentials: true,
  });

  // API prefix
  app.setGlobalPrefix("v1");

  // Swagger documentation
  if (process.env.NODE_ENV !== "production") {
    const config = new DocumentBuilder()
      .setTitle("AVALA API")
      .setDescription(
        "API for Alineamiento y Verificación de Aprendizajes y Logros Acreditables",
      )
      .setVersion("0.1.0")
      .addBearerAuth()
      .addTag("tenants")
      .addTag("users")
      .addTag("competency")
      .addTag("courses")
      .addTag("assessments")
      .addTag("portfolios")
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("docs", app, document);
  }

  const port = process.env.PORT || 4000;
  await app.listen(port);

  const logger = new Logger("Bootstrap");
  logger.log(`AVALA API running on: http://localhost:${port}/v1`);
  if (process.env.NODE_ENV !== "production") {
    logger.log(`Swagger docs: http://localhost:${port}/docs`);
  }
}

bootstrap();
