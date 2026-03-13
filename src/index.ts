import { BunRuntime } from "@effect/platform-bun";
import { Layer } from "effect";
import { config } from "./config.ts";
import { ServerLive } from "./server.ts";

console.log(`Server running on http://localhost:${config.PORT}`);

BunRuntime.runMain(Layer.launch(ServerLive));
