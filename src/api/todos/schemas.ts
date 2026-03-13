import { Schema } from "effect";

export const TodoId = Schema.Number.pipe(Schema.brand("TodoId"));

export const Todo = Schema.Struct({
  id: TodoId,
  title: Schema.String,
  completed: Schema.Boolean,
});

export const CreateTodo = Schema.Struct({
  title: Schema.String,
});
