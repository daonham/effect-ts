import type { HttpApp } from "@effect/platform";
import { HttpMiddleware } from "@effect/platform";
import { Layer, pipe } from "effect";
import { config } from "../config.ts";
import { ErrorLogging } from "./error-logging.ts";
import { withRequestId } from "./request-id.ts";
import { withSecurityHeaders } from "./security-headers.ts";

const corsOrigins = config.CORS_ORIGIN.split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// API-level middleware (runs inside HttpApi pipeline, can see errors)
export const MiddlewareLive = Layer.mergeAll(ErrorLogging);

// HTTP-level middleware (wraps the entire HTTP app)
export const withHttpMiddleware = (httpApp: HttpApp.Default): HttpApp.Default =>
  pipe(
    httpApp,
    withSecurityHeaders,
    withRequestId,
    HttpMiddleware.cors({
      allowedOrigins: corsOrigins.length > 0 ? corsOrigins : undefined,
      allowedMethods: ["GET", "HEAD", "POST", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
      maxAge: 86400,
    }),
    HttpMiddleware.logger,
  );
