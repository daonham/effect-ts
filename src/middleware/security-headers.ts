import type { HttpApp } from "@effect/platform";
import { HttpApp as HttpAppM, HttpServerResponse } from "@effect/platform";
import { Effect } from "effect";

const securityHeaders = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "x-xss-protection": "0",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  "content-security-policy": "default-src 'self'; frame-ancestors 'none'",
};

export const withSecurityHeaders = (
  httpApp: HttpApp.Default,
): HttpApp.Default =>
  Effect.zipRight(
    HttpAppM.appendPreResponseHandler((_request, response) =>
      Effect.succeed(HttpServerResponse.setHeaders(response, securityHeaders)),
    ),
    httpApp,
  );
