import { HttpApiBuilder } from "@effect/platform";
import { Cause, Effect } from "effect";
import { Api } from "../api.ts";

const extractCauseDetails = (cause: Cause.Cause<unknown>) => ({
  failures: Cause.failures(cause).pipe((chunk) => [...chunk]),
  defects: Cause.defects(cause).pipe((chunk) =>
    [...chunk].map((d) => (d instanceof Error ? { name: d.name, message: d.message, stack: d.stack } : d)),
  ),
  isInterrupted: Cause.isInterrupted(cause),
});

export const ErrorLogging = HttpApiBuilder.middleware(Api, (httpApp) =>
  Effect.tapErrorCause(httpApp, (cause) =>
    Effect.logError("Request failed").pipe(
      Effect.annotateLogs(extractCauseDetails(cause)),
    ),
  ),
);
