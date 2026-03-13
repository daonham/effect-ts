import type { HttpApp } from "@effect/platform";
import { HttpMiddleware } from "@effect/platform";
import { Layer } from "effect";
import { ErrorLogging } from "./error-logging.ts";

// API-level middleware (runs inside HttpApi pipeline, can see errors)
export const MiddlewareLive = Layer.mergeAll(ErrorLogging);

// HTTP-level middleware (wraps the entire HTTP app)
export const withHttpMiddleware = (httpApp: HttpApp.Default): HttpApp.Default =>
  HttpMiddleware.logger(httpApp);
