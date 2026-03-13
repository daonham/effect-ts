import { Context, Effect, Layer, Ref } from "effect";
import type { Todo, TodoId } from "./schemas.ts";

interface TodoState {
  todos: Array<typeof Todo.Type>;
  nextId: number;
}

export class TodoStore extends Context.Tag("TodoStore")<
  TodoStore,
  {
    readonly getAll: () => Effect.Effect<Array<typeof Todo.Type>>;
    readonly getById: (
      id: number,
    ) => Effect.Effect<
      typeof Todo.Type,
      { _tag: "TodoNotFound"; message: string }
    >;
    readonly create: (title: string) => Effect.Effect<typeof Todo.Type>;
    readonly toggle: (
      id: number,
    ) => Effect.Effect<
      typeof Todo.Type,
      { _tag: "TodoNotFound"; message: string }
    >;
    readonly remove: (
      id: number,
    ) => Effect.Effect<void, { _tag: "TodoNotFound"; message: string }>;
  }
>() {}

const notFound = (id: number) =>
  Effect.fail({
    _tag: "TodoNotFound" as const,
    message: `Todo ${id} not found`,
  });

export const TodoStoreLive = Layer.effect(
  TodoStore,
  Effect.gen(function* () {
    const ref = yield* Ref.make<TodoState>({
      todos: [
        {
          id: 1 as typeof TodoId.Type,
          title: "Learn Effect",
          completed: false,
        },
        {
          id: 2 as typeof TodoId.Type,
          title: "Build an API",
          completed: false,
        },
      ],
      nextId: 3,
    });

    return {
      getAll: () => Ref.get(ref).pipe(Effect.map((s) => s.todos)),

      getById: (id: number) =>
        Effect.gen(function* () {
          const { todos } = yield* Ref.get(ref);
          const todo = todos.find((t) => t.id === id);
          if (!todo) {
            yield* Effect.logWarning("Todo not found").pipe(
              Effect.annotateLogs({ id }),
            );
            return yield* notFound(id);
          }
          return todo;
        }),

      create: (title: string) =>
        Ref.modify(ref, (state) => {
          const todo = {
            id: state.nextId as typeof TodoId.Type,
            title,
            completed: false,
          };
          return [
            todo,
            { todos: [...state.todos, todo], nextId: state.nextId + 1 },
          ];
        }).pipe(
          Effect.tap((todo) =>
            Effect.log("Todo created").pipe(
              Effect.annotateLogs({ id: todo.id, title }),
            ),
          ),
        ),

      toggle: (id: number) =>
        Effect.gen(function* () {
          const result = yield* Ref.modify(ref, (state) => {
            const index = state.todos.findIndex((t) => t.id === id);
            if (index === -1) return [undefined, state];
            const updated = {
              ...state.todos[index],
              completed: !state.todos[index].completed,
            };
            const todos = [...state.todos];
            todos[index] = updated;
            return [updated, { ...state, todos }];
          });
          if (!result) {
            yield* Effect.logWarning("Todo not found for toggle").pipe(
              Effect.annotateLogs({ id }),
            );
            return yield* notFound(id);
          }
          yield* Effect.log("Todo toggled").pipe(
            Effect.annotateLogs({ id, completed: result.completed }),
          );
          return result;
        }),

      remove: (id: number) =>
        Effect.gen(function* () {
          const found = yield* Ref.modify(ref, (state) => {
            const index = state.todos.findIndex((t) => t.id === id);
            if (index === -1) return [false, state];
            return [
              true,
              { ...state, todos: state.todos.filter((t) => t.id !== id) },
            ];
          });
          if (!found) {
            yield* Effect.logWarning("Todo not found for delete").pipe(
              Effect.annotateLogs({ id }),
            );
            return yield* notFound(id);
          }
          yield* Effect.log("Todo deleted").pipe(Effect.annotateLogs({ id }));
        }),
    };
  }),
);
