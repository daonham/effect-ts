import { HttpApiBuilder } from "@effect/platform";
import { Layer } from "effect";
import { Api } from "../../api.ts";
import * as TodoService from "./services.ts";
import { TodoStoreLive } from "./store.ts";

export const TodosLive = HttpApiBuilder.group(Api, "Todos", (handlers) =>
  handlers
    .handle("getTodos", () => TodoService.getAll())
    .handle("getTodo", ({ path }) => TodoService.getById(path.id))
    .handle("createTodo", ({ payload }) => TodoService.create(payload.title))
    .handle("toggleTodo", ({ path }) => TodoService.toggle(path.id))
    .handle("deleteTodo", ({ path }) => TodoService.remove(path.id)),
).pipe(Layer.provide(TodoStoreLive));
