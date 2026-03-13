import { HttpApiBuilder } from "@effect/platform";
import { Cause, Effect } from "effect";
import { Api } from "../api.ts";

export const ErrorLogging = HttpApiBuilder.middleware(Api, (httpApp) =>
  Effect.tapErrorCause(httpApp, (cause) =>
    Effect.logError("Request failed").pipe(
      Effect.annotateLogs({ cause: Cause.pretty(cause) }),
    ),
  ),
);
