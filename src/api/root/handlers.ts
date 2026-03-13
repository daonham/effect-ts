import { HttpApiBuilder } from "@effect/platform";
import { Effect } from "effect";
import { Api } from "../../api.ts";
import { config } from "../../config.ts";

export const RootLive = HttpApiBuilder.group(Api, "Root", (handlers) =>
  handlers.handle("root", () =>
    Effect.succeed({
      name: config.API_NAME,
      version: config.API_VERSION,
    }),
  ),
);
