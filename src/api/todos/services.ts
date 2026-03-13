import { Effect } from "effect";
import { TodoStore } from "./store.ts";

export const getAll = () =>
  Effect.flatMap(TodoStore, (store) => store.getAll());

export const getById = (id: number) =>
  Effect.flatMap(TodoStore, (store) => store.getById(id));

export const create = (title: string) =>
  Effect.flatMap(TodoStore, (store) => store.create(title));

export const toggle = (id: number) =>
  Effect.flatMap(TodoStore, (store) => store.toggle(id));

export const remove = (id: number) =>
  Effect.flatMap(TodoStore, (store) => store.remove(id));
