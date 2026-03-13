import { Effect } from "effect";
import { Todo, TodoId } from "./schemas.ts";

let todos: Array<typeof Todo.Type> = [
  { id: 1 as typeof TodoId.Type, title: "Learn Effect", completed: false },
  { id: 2 as typeof TodoId.Type, title: "Build an API", completed: false },
];
let nextId = 3;

const notFound = (id: number) =>
  Effect.fail({
    _tag: "TodoNotFound" as const,
    message: `Todo ${id} not found`,
  });

export const getAll = () => Effect.succeed(todos);

export const getById = (id: number) =>
  Effect.gen(function* () {
    const todo = todos.find((t) => t.id === id);
    if (!todo) {
      yield* Effect.logWarning("Todo not found").pipe(Effect.annotateLogs({ id }));
      return yield* notFound(id);
    }
    return todo;
  });

export const create = (title: string) =>
  Effect.gen(function* () {
    const todo = {
      id: nextId++ as typeof TodoId.Type,
      title,
      completed: false,
    };
    todos.push(todo);
    yield* Effect.log("Todo created").pipe(Effect.annotateLogs({ id: todo.id, title }));
    return todo;
  });

export const toggle = (id: number) =>
  Effect.gen(function* () {
    const todo = todos.find((t) => t.id === id);
    if (!todo) {
      yield* Effect.logWarning("Todo not found for toggle").pipe(Effect.annotateLogs({ id }));
      return yield* notFound(id);
    }
    todo.completed = !todo.completed;
    yield* Effect.log("Todo toggled").pipe(Effect.annotateLogs({ id, completed: todo.completed }));
    return todo;
  });

export const remove = (id: number) =>
  Effect.gen(function* () {
    const index = todos.findIndex((t) => t.id === id);
    if (index === -1) {
      yield* Effect.logWarning("Todo not found for delete").pipe(Effect.annotateLogs({ id }));
      return yield* notFound(id);
    }
    todos.splice(index, 1);
    yield* Effect.log("Todo deleted").pipe(Effect.annotateLogs({ id }));
  });
