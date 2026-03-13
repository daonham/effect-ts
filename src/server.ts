import { HttpApiBuilder } from "@effect/platform";
import { BunHttpServer } from "@effect/platform-bun";
import { Layer } from "effect";
import { Api } from "./api.ts";
import { HandlersLive } from "./api/handlers.ts";
import { withLogging } from "./api/middleware.ts";

export const ServerLive = HttpApiBuilder.serve(withLogging).pipe(
  Layer.provide(HttpApiBuilder.api(Api)),
  Layer.provide(HandlersLive),
  Layer.provide(
    BunHttpServer.layer({ port: Number(process.env.PORT ?? 3000) }),
  ),
);
