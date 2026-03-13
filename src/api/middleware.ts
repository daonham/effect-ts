import { HttpApp, HttpServerError, HttpServerRequest } from "@effect/platform";
import { Context, Effect } from "effect";

export const withLogging = (httpApp: HttpApp.Default): HttpApp.Default => {
  return Effect.withFiberRuntime((fiber) => {
    const request = Context.unsafeGet(
      fiber.currentContext,
      HttpServerRequest.HttpServerRequest,
    );
    const start = Date.now();

    return Effect.flatMap(Effect.exit(httpApp), (exit) => {
      const duration = Date.now() - start;

      if (exit._tag === "Failure") {
        const [response] = HttpServerError.causeResponseStripped(exit.cause);
        console.log(
          `${request.method} ${request.url} ${response.status} ${duration}ms`,
        );
        return exit;
      }

      console.log(
        `${request.method} ${request.url} ${exit.value.status} ${duration}ms`,
      );
      return exit;
    });
  });
};
