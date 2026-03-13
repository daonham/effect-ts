import { HttpApiBuilder } from "@effect/platform";
import { BunHttpServer } from "@effect/platform-bun";
import { Layer, Logger } from "effect";
import { Api } from "./api.ts";
import { HandlersLive } from "./api/handlers.ts";
import { config } from "./config.ts";
import { MiddlewareLive, withHttpMiddleware } from "./middleware/index.ts";

const LoggerLive =
  config.NODE_ENV === "production" ? Logger.json : Logger.pretty;

export const ServerLive = HttpApiBuilder.serve(withHttpMiddleware).pipe(
  Layer.provide(HttpApiBuilder.api(Api)),
  Layer.provide(HandlersLive),
  Layer.provide(MiddlewareLive),
  Layer.provide(LoggerLive),
  Layer.provide(
    BunHttpServer.layer({
      port: config.PORT,
      maxRequestBodySize: 1024 * 1024, // 1 MB
    }),
  ),
);
