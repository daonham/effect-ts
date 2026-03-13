import { Schema } from "effect";

export const TodoId = Schema.Number.pipe(
  Schema.int(),
  Schema.positive(),
  Schema.brand("TodoId"),
);

export const Todo = Schema.Struct({
  id: TodoId,
  title: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(500)),
  completed: Schema.Boolean,
});

export const CreateTodo = Schema.Struct({
  title: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(500)),
});
