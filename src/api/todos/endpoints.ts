import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema } from "effect";
import { TodoNotFound } from "./errors.ts";
import { CreateTodo, Todo } from "./schemas.ts";

export const TodosGroup = HttpApiGroup.make("Todos")
  .add(HttpApiEndpoint.get("getTodos", "/todos").addSuccess(Schema.Array(Todo)))
  .add(
    HttpApiEndpoint.get("getTodo", "/todos/:id")
      .setPath(Schema.Struct({ id: Schema.NumberFromString }))
      .addSuccess(Todo)
      .addError(TodoNotFound, { status: 404 }),
  )
  .add(
    HttpApiEndpoint.post("createTodo", "/todos")
      .setPayload(CreateTodo)
      .addSuccess(Todo, { status: 201 }),
  )
  .add(
    HttpApiEndpoint.patch("toggleTodo", "/todos/:id")
      .setPath(Schema.Struct({ id: Schema.NumberFromString }))
      .addSuccess(Todo)
      .addError(TodoNotFound, { status: 404 }),
  )
  .add(
    HttpApiEndpoint.del("deleteTodo", "/todos/:id")
      .setPath(Schema.Struct({ id: Schema.NumberFromString }))
      .addSuccess(Schema.Void)
      .addError(TodoNotFound, { status: 404 }),
  );
