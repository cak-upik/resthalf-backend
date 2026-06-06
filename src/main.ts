import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Logger, ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
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
        process.env.SWAGGER_URL,
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
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  // --- Swagger / OpenAPI ---
  const swaggerConfig = new DocumentBuilder()
    .setTitle("Resthalf Core API")
    .setDescription(
      "Hotel half-day booking platform — direct (PEL/Redis/Ledger) and " +
        "wholesale lanes, staff dashboard, manual bookings, commissions and payments.",
    )
    .setVersion("1.0.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "Authorization",
        in: "header",
        description: "Paste the JWT returned by the auth endpoints.",
      },
      "access-token", // <- referenced by @ApiBearerAuth("access-token")
    )
    .addTag("Auth", "Guest & staff authentication")
    .addTag("Search", "Public availability search")
    .addTag("Bookings", "Direct & wholesale booking lanes")
    .addTag("My", "Guest's own bookings & stays")
    .addTag("Payment", "Midtrans Snap & webhooks")
    .addTag("Cancellation", "Refund preview & cancellation")
    .addTag("Reschedule", "Move an existing booking")
    .addTag("Vacate", "Guest-initiated room vacate")
    .addTag("Dashboard", "Staff live operations")
    .addTag("Manual Bookings", "Walk-in bookings by staff")
    .addTag("Commission", "Staff commission & payouts")
    .addTag("Admin", "Hotel / room / staff administration")
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  logger.log(`Resthalf backend running at: http://localhost:${port}`);
  logger.log(`Swagger docs available at: http://localhost:${port}/docs`);
}
bootstrap();
