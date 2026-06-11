import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // Message returned to the client (don't leak internals on 500s).
    const httpBody = isHttp ? exception.getResponse() : undefined;
    const clientMessage = isHttp
      ? typeof httpBody === "string"
        ? httpBody
        : (httpBody as { message?: unknown }).message
      : "Internal server error";

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: req.url,
      method: req.method,
      message: clientMessage,
    };

    const where = `${req.method} ${req.url}`;

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      // Unhandled / server error — log the FULL stack trace + request context
      // so the real root cause is visible in Railway logs.
      const stack = exception instanceof Error ? exception.stack : undefined;
      const detail =
        exception instanceof Error
          ? `${exception.name}: ${exception.message}`
          : JSON.stringify(exception);

      this.logger.error(`${where} -> ${status} ${detail}`, stack);
      this.logger.error(`  request body: ${this.safeBody(req.body)}`);
    } else {
      // Expected client error (4xx) — concise, no stack noise.
      this.logger.warn(`${where} -> ${status} ${JSON.stringify(clientMessage)}`);
    }

    res.status(status).json(errorResponse);
  }

  /** Stringify the request body with obvious secrets redacted. */
  private safeBody(body: unknown): string {
    if (!body || typeof body !== "object") return String(body ?? "");
    const SENSITIVE = [
      "password",
      "token",
      "authorization",
      "secret",
      "accountdetails",
    ];
    const redacted: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
      redacted[k] = SENSITIVE.includes(k.toLowerCase()) ? "***" : v;
    }
    try {
      return JSON.stringify(redacted);
    } catch {
      return "[unserializable body]";
    }
  }
}
