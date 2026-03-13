import { HttpApiBuilder } from "@effect/platform";
import { Api } from "../../api.ts";
import * as TodoService from "./services.ts";

export const TodosLive = HttpApiBuilder.group(Api, "Todos", (handlers) =>
  handlers
    .handle("getTodos", () => TodoService.getAll())
    .handle("getTodo", ({ path }) => TodoService.getById(path.id))
    .handle("createTodo", ({ payload }) => TodoService.create(payload.title))
    .handle("toggleTodo", ({ path }) => TodoService.toggle(path.id))
    .handle("deleteTodo", ({ path }) => TodoService.remove(path.id)),
);
