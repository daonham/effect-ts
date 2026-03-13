import { Layer } from "effect";
import { RootLive } from "./root/handlers.ts";
import { TodosLive } from "./todos/handlers.ts";
import { TodoStoreLive } from "./todos/store.ts";

export const HandlersLive = Layer.mergeAll(RootLive, TodosLive).pipe(
  Layer.provide(TodoStoreLive),
);
