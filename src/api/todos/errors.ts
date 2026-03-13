import { Schema } from "effect";

export const TodoNotFound = Schema.Struct({
  _tag: Schema.Literal("TodoNotFound"),
  message: Schema.String,
});
