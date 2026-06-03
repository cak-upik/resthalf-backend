import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Logger, ValidationPipe } from "@nestjs/common";
import { HttpExceptionFilter } from "./common/http-exception.filter";

async function bootstrap() {
  const logger = new Logger("bootstrap");
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:8080",
        "http://10.0.2.2:3000", // Android emulator
        process.env.FRONTEND_URL,
      ];

      // Allow requests with no origin (mobile apps, Postman)
      if (!origin) {
        callback(null, true);
        return;
      }

      // Check allowed origins
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      }
      // Allow mobile deep links
      else if (/^travelapp:\/\//i.test(origin)) {
        callback(null, true);
      }
      // Reject others
      else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"), false);
      }
    },
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(process.env.PORT ?? 3001);

  logger.log(`Resthalf backend running at: ${process.env.PORT}`);
}
bootstrap();
