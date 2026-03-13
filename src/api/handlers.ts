import { Layer } from "effect";
import { RootLive } from "./root/handlers.ts";
import { TodosLive } from "./todos/handlers.ts";

export const HandlersLive = Layer.mergeAll(RootLive, TodosLive);
