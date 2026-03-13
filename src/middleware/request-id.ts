import type { HttpApp } from "@effect/platform";
import {
  HttpApp as HttpAppM,
  HttpServerRequest,
  HttpServerResponse,
} from "@effect/platform";
import { Effect } from "effect";

export const withRequestId = (httpApp: HttpApp.Default): HttpApp.Default =>
  Effect.gen(function* () {
    const request = yield* HttpServerRequest.HttpServerRequest;
    const clientId = request.headers["x-request-id"];
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const requestId =
      clientId && uuidPattern.test(clientId) ? clientId : crypto.randomUUID();
    yield* HttpAppM.appendPreResponseHandler((_req, response) =>
      Effect.succeed(
        HttpServerResponse.setHeader(response, "x-request-id", requestId),
      ),
    );
    return yield* httpApp.pipe(Effect.annotateLogs({ requestId }));
  });
