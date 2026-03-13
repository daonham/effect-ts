import { Effect } from "effect";
import { Todo, TodoId } from "./schemas.ts";

let todos: Array<typeof Todo.Type> = [
  { id: 1 as typeof TodoId.Type, title: "Learn Effect", completed: false },
  { id: 2 as typeof TodoId.Type, title: "Build an API", completed: false },
];
let nextId = 3;

const notFound = (id: number) =>
  Effect.fail({ _tag: "TodoNotFound" as const, message: `Todo ${id} not found` });

export const getAll = () => Effect.succeed(todos);

export const getById = (id: number) => {
  const todo = todos.find((t) => t.id === id);
  return todo ? Effect.succeed(todo) : notFound(id);
};

export const create = (title: string) => {
  const todo = {
    id: nextId++ as typeof TodoId.Type,
    title,
    completed: false,
  };
  todos.push(todo);
  return Effect.succeed(todo);
};

export const toggle = (id: number) => {
  const todo = todos.find((t) => t.id === id);
  if (!todo) return notFound(id);
  todo.completed = !todo.completed;
  return Effect.succeed(todo);
};

export const remove = (id: number) => {
  const index = todos.findIndex((t) => t.id === id);
  if (index === -1) return notFound(id);
  todos.splice(index, 1);
  return Effect.succeed(undefined as void);
};
