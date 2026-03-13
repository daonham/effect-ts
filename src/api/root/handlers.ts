import { HttpApiBuilder } from "@effect/platform";
import { Effect } from "effect";
import { Api } from "../../api.ts";

export const RootLive = HttpApiBuilder.group(Api, "Root", (handlers) =>
  handlers.handle("root", () =>
    Effect.succeed({
      name: process.env.API_NAME,
      version: process.env.API_VERSION,
    }),
  ),
);
