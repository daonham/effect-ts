import { HttpApiBuilder } from "@effect/platform";
import { Effect } from "effect";
import { Api } from "../../api.ts";

export const RootLive = HttpApiBuilder.group(Api, "Root", (handlers) =>
  handlers.handle("root", () =>
    Effect.succeed({
      name: "Hello API",
      version: "1.0.0",
    }),
  ),
);
