import { HttpApiBuilder } from "@effect/platform";
import { BunHttpServer } from "@effect/platform-bun";
import { Layer, Logger } from "effect";
import { Api } from "./api.ts";
import { HandlersLive } from "./api/handlers.ts";
import { MiddlewareLive, withHttpMiddleware } from "./middleware/index.ts";

export const ServerLive = HttpApiBuilder.serve(withHttpMiddleware).pipe(
  Layer.provide(HttpApiBuilder.api(Api)),
  Layer.provide(HandlersLive),
  Layer.provide(MiddlewareLive),
  Layer.provide(Logger.pretty),
  Layer.provide(
    BunHttpServer.layer({ port: Number(process.env.PORT ?? 3000) }),
  ),
);
