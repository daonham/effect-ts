import { BunRuntime } from "@effect/platform-bun";
import { Layer } from "effect";
import { ServerLive, port } from "./server.ts";

console.log(`Server running on http://localhost:${port}`);
BunRuntime.runMain(Layer.launch(ServerLive));
