import { HttpApiBuilder } from "@effect/platform";
import { Effect } from "effect";
import { Api } from "../../api.ts";
import { TodoStore } from "./store.ts";

export const TodosLive = HttpApiBuilder.group(Api, "Todos", (handlers) =>
  handlers
    .handle("getTodos", () => Effect.flatMap(TodoStore, (s) => s.getAll()))
    .handle("getTodo", ({ path }) => Effect.flatMap(TodoStore, (s) => s.getById(path.id)))
    .handle("createTodo", ({ payload }) => Effect.flatMap(TodoStore, (s) => s.create(payload.title)))
    .handle("toggleTodo", ({ path }) => Effect.flatMap(TodoStore, (s) => s.toggle(path.id)))
    .handle("deleteTodo", ({ path }) => Effect.flatMap(TodoStore, (s) => s.remove(path.id))),
);
