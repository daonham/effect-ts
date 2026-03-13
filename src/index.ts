import { BunRuntime } from "@effect/platform-bun";
import { Layer } from "effect";
import { ServerLive } from "./server.ts";

console.log(`Server running on http://localhost:${process.env.PORT ?? 3000}`);
BunRuntime.runMain(Layer.launch(ServerLive));
