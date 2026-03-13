import type { HttpApp } from "@effect/platform";
import { HttpServerRequest } from "@effect/platform";
import { Effect } from "effect";

export const withRequestId = (httpApp: HttpApp.Default): HttpApp.Default =>
  Effect.gen(function* () {
    const request = yield* HttpServerRequest.HttpServerRequest;
    const requestId = request.headers["x-request-id"] ?? crypto.randomUUID();
    return yield* httpApp.pipe(Effect.annotateLogs({ requestId }));
  });
