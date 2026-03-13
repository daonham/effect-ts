# Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 8 security issues: request body limit, input validation, X-Request-ID sanitize, stack trace strip, CORS restrict, env validation, concurrency-safe store, TLS config.

**Architecture:** Each fix is independent and can be done in any order. The store refactor (Task 6) is the largest change — it replaces mutable module-level state with Effect `Ref` for atomic concurrent access. All other tasks are small, targeted edits.

**Tech Stack:** Effect (Ref, Schema), @effect/platform (HttpMiddleware), @effect/platform-bun (BunHttpServer, TLSServeOptions), Bun

---

## Task 1: Request body size limit

**Files:**
- Modify: `src/server.ts:13-15`

- [ ] **Step 1: Add maxRequestBodySize to BunHttpServer.layer**

```ts
// src/server.ts — change BunHttpServer.layer options
BunHttpServer.layer({
  port: Number(process.env.PORT ?? 3000),
  maxRequestBodySize: 1024 * 1024, // 1 MB
}),
```

- [ ] **Step 2: Verify server starts**

Run: `PORT=3001 bun run src/index.ts`
Expected: Server starts without errors.

- [ ] **Step 3: Test body limit**

Run: `dd if=/dev/zero bs=2M count=1 | curl -s -X POST -H "Content-Type: application/json" -d @- http://localhost:3001/todos`
Expected: 413 or connection reset (payload exceeds 1MB).

---

## Task 2: Input validation (title maxLength, TodoId range)

**Files:**
- Modify: `src/api/todos/schemas.ts`

- [ ] **Step 1: Add constraints to schemas**

```ts
// src/api/todos/schemas.ts
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
```

- [ ] **Step 2: Test validation rejects bad input**

Run: `curl -s -X POST -H "Content-Type: application/json" -d '{"title":""}' http://localhost:3001/todos`
Expected: 400 error (empty title rejected).

Run: `curl -s -X POST -H "Content-Type: application/json" -d "{\"title\":\"$(python3 -c "print('a'*501)")\"}" http://localhost:3001/todos`
Expected: 400 error (title too long).

---

## Task 3: X-Request-ID sanitize

**Files:**
- Modify: `src/middleware/request-id.ts`

- [ ] **Step 1: Add UUID validation**

```ts
// src/middleware/request-id.ts
import type { HttpApp } from "@effect/platform";
import { HttpApp as HttpAppM, HttpServerRequest, HttpServerResponse } from "@effect/platform";
import { Effect } from "effect";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const withRequestId = (httpApp: HttpApp.Default): HttpApp.Default =>
  Effect.gen(function* () {
    const request = yield* HttpServerRequest.HttpServerRequest;
    const clientId = request.headers["x-request-id"];
    const requestId = clientId && uuidPattern.test(clientId) ? clientId : crypto.randomUUID();
    yield* HttpAppM.appendPreResponseHandler((_req, response) =>
      Effect.succeed(HttpServerResponse.setHeader(response, "x-request-id", requestId)),
    );
    return yield* httpApp.pipe(Effect.annotateLogs({ requestId }));
  });
```

- [ ] **Step 2: Test valid UUID passthrough**

Run: `curl -sI -H "x-request-id: 550e8400-e29b-41d4-a716-446655440000" http://localhost:3001/todos | grep x-request-id`
Expected: `x-request-id: 550e8400-e29b-41d4-a716-446655440000`

- [ ] **Step 3: Test invalid value rejected (new UUID generated)**

Run: `curl -sI -H "x-request-id: malicious\r\nX-Injected: evil" http://localhost:3001/todos | grep x-request-id`
Expected: `x-request-id: <new-uuid>` (not the malicious value)

---

## Task 4: Strip stack traces in production

**Files:**
- Modify: `src/middleware/error-logging.ts`

- [ ] **Step 1: Gate stack on environment**

```ts
// src/middleware/error-logging.ts
import { HttpApiBuilder } from "@effect/platform";
import { Cause, Effect } from "effect";
import { Api } from "../api.ts";

const isProduction = process.env.NODE_ENV === "production";

const extractCauseDetails = (cause: Cause.Cause<unknown>) => ({
  failures: Cause.failures(cause).pipe((chunk) => [...chunk]),
  defects: Cause.defects(cause).pipe((chunk) =>
    [...chunk].map((d) =>
      d instanceof Error
        ? { name: d.name, message: d.message, ...(isProduction ? {} : { stack: d.stack }) }
        : d,
    ),
  ),
  isInterrupted: Cause.isInterrupted(cause),
});

export const ErrorLogging = HttpApiBuilder.middleware(Api, (httpApp) =>
  Effect.tapErrorCause(httpApp, (cause) =>
    Effect.logError("Request failed").pipe(
      Effect.annotateLogs(extractCauseDetails(cause)),
    ),
  ),
);
```

- [ ] **Step 2: Verify dev mode still shows stack**

Run: `PORT=3001 bun run src/index.ts` then trigger a defect. Logs should include `stack`.

- [ ] **Step 3: Verify production strips stack**

Run: `NODE_ENV=production PORT=3001 bun run src/index.ts` then trigger same defect. Logs should NOT include `stack`.

---

## Task 5: CORS restrict

**Files:**
- Modify: `src/middleware/index.ts`
- Modify: `.env` and `.env.example`

- [ ] **Step 1: Add CORS_ORIGIN to .env**

```
# .env and .env.example
CORS_ORIGIN=http://localhost:5173
```

- [ ] **Step 2: Read CORS_ORIGIN and configure middleware**

```ts
// src/middleware/index.ts
import type { HttpApp } from "@effect/platform";
import { HttpMiddleware } from "@effect/platform";
import { Layer, pipe } from "effect";
import { ErrorLogging } from "./error-logging.ts";
import { withRequestId } from "./request-id.ts";
import { withSecurityHeaders } from "./security-headers.ts";

const corsOrigins = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// API-level middleware (runs inside HttpApi pipeline, can see errors)
export const MiddlewareLive = Layer.mergeAll(ErrorLogging);

// HTTP-level middleware (wraps the entire HTTP app)
export const withHttpMiddleware = (httpApp: HttpApp.Default): HttpApp.Default =>
  pipe(
    httpApp,
    withSecurityHeaders,
    withRequestId,
    HttpMiddleware.cors({
      allowedOrigins: corsOrigins.length > 0 ? corsOrigins : undefined,
      allowedMethods: ["GET", "HEAD", "POST", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
      maxAge: 86400,
    }),
    HttpMiddleware.logger,
  );
```

- [ ] **Step 3: Test CORS with allowed origin**

Run: `curl -sI -H "Origin: http://localhost:5173" http://localhost:3001/todos | grep access-control`
Expected: `access-control-allow-origin: http://localhost:5173`

- [ ] **Step 4: Test CORS with disallowed origin**

Run: `curl -sI -H "Origin: https://evil.com" http://localhost:3001/todos | grep access-control`
Expected: No `access-control-allow-origin` header.

---

## Task 6: Env vars validate at startup

**Files:**
- Create: `src/config.ts`
- Modify: `src/api/root/handlers.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Create config module with validation**

```ts
// src/config.ts
import { Schema } from "effect";

const AppConfig = Schema.Struct({
  PORT: Schema.NumberFromString.pipe(Schema.int(), Schema.between(1, 65535)),
  API_NAME: Schema.String.pipe(Schema.minLength(1)),
  API_VERSION: Schema.String.pipe(Schema.minLength(1)),
  NODE_ENV: Schema.optional(Schema.Literal("development", "production")).pipe(
    Schema.withDefaults({ constructor: () => "development" as const, decoding: () => "development" as const }),
  ),
  CORS_ORIGIN: Schema.optional(Schema.String).pipe(
    Schema.withDefaults({ constructor: () => "", decoding: () => "" }),
  ),
});

const parsed = Schema.decodeUnknownSync(AppConfig)({
  PORT: process.env.PORT ?? "3000",
  API_NAME: process.env.API_NAME,
  API_VERSION: process.env.API_VERSION,
  NODE_ENV: process.env.NODE_ENV,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
});

export const config = parsed;
```

- [ ] **Step 2: Use config in root handler**

```ts
// src/api/root/handlers.ts
import { HttpApiBuilder } from "@effect/platform";
import { Effect } from "effect";
import { Api } from "../../api.ts";
import { config } from "../../config.ts";

export const RootLive = HttpApiBuilder.group(Api, "Root", (handlers) =>
  handlers.handle("root", () =>
    Effect.succeed({
      name: config.API_NAME,
      version: config.API_VERSION,
    }),
  ),
);
```

- [ ] **Step 3: Use config in server.ts**

Replace `process.env.PORT`, `process.env.NODE_ENV` references with `config.PORT`, `config.NODE_ENV`.

- [ ] **Step 4: Use config in middleware/index.ts**

Replace `process.env.CORS_ORIGIN` with `config.CORS_ORIGIN`.

- [ ] **Step 5: Use config in middleware/error-logging.ts**

Replace `process.env.NODE_ENV` with `config.NODE_ENV`.

- [ ] **Step 6: Test missing env var**

Run: Remove `API_NAME` from `.env`, then `bun run src/index.ts`
Expected: Startup fails with a clear Schema validation error.

---

## Task 7: Concurrency-safe store with Ref

**Files:**
- Create: `src/api/todos/store.ts`
- Modify: `src/api/todos/services.ts`
- Modify: `src/api/todos/handlers.ts`
- Modify: `src/api/handlers.ts`

- [ ] **Step 1: Create TodoStore using Ref**

```ts
// src/api/todos/store.ts
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
    readonly getById: (id: number) => Effect.Effect<typeof Todo.Type, { _tag: "TodoNotFound"; message: string }>;
    readonly create: (title: string) => Effect.Effect<typeof Todo.Type>;
    readonly toggle: (id: number) => Effect.Effect<typeof Todo.Type, { _tag: "TodoNotFound"; message: string }>;
    readonly remove: (id: number) => Effect.Effect<void, { _tag: "TodoNotFound"; message: string }>;
  }
>() {}

const notFound = (id: number) =>
  Effect.fail({ _tag: "TodoNotFound" as const, message: `Todo ${id} not found` });

export const TodoStoreLive = Layer.effect(
  TodoStore,
  Effect.gen(function* () {
    const ref = yield* Ref.make<TodoState>({
      todos: [
        { id: 1 as typeof TodoId.Type, title: "Learn Effect", completed: false },
        { id: 2 as typeof TodoId.Type, title: "Build an API", completed: false },
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
            yield* Effect.logWarning("Todo not found").pipe(Effect.annotateLogs({ id }));
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
          return [todo, { todos: [...state.todos, todo], nextId: state.nextId + 1 }];
        }).pipe(
          Effect.tap((todo) =>
            Effect.log("Todo created").pipe(Effect.annotateLogs({ id: todo.id, title })),
          ),
        ),

      toggle: (id: number) =>
        Effect.gen(function* () {
          const result = yield* Ref.modify(ref, (state) => {
            const index = state.todos.findIndex((t) => t.id === id);
            if (index === -1) return [undefined, state];
            const updated = { ...state.todos[index], completed: !state.todos[index].completed };
            const todos = [...state.todos];
            todos[index] = updated;
            return [updated, { ...state, todos }];
          });
          if (!result) {
            yield* Effect.logWarning("Todo not found for toggle").pipe(Effect.annotateLogs({ id }));
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
            return [true, { ...state, todos: state.todos.filter((t) => t.id !== id) }];
          });
          if (!found) {
            yield* Effect.logWarning("Todo not found for delete").pipe(Effect.annotateLogs({ id }));
            return yield* notFound(id);
          }
          yield* Effect.log("Todo deleted").pipe(Effect.annotateLogs({ id }));
        }),
    };
  }),
);
```

- [ ] **Step 2: Update services.ts to delegate to TodoStore**

```ts
// src/api/todos/services.ts
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
```

- [ ] **Step 3: Provide TodoStoreLive in handlers**

```ts
// src/api/todos/handlers.ts — add Layer.provide
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
```

- [ ] **Step 4: Test CRUD still works**

Run:
```bash
curl -s http://localhost:3001/todos                                          # GET all
curl -s -X POST -H "Content-Type: application/json" -d '{"title":"Test"}' http://localhost:3001/todos  # CREATE
curl -s -X PATCH http://localhost:3001/todos/1                               # TOGGLE
curl -s -X DELETE http://localhost:3001/todos/1                              # DELETE
curl -s http://localhost:3001/todos                                          # verify state
```

---

## Task 8: TLS config

**Files:**
- Modify: `src/server.ts`
- Modify: `.env` and `.env.example`

- [ ] **Step 1: Add TLS env vars**

```
# .env.example (add)
# TLS_CERT_PATH=./certs/cert.pem
# TLS_KEY_PATH=./certs/key.pem
```

- [ ] **Step 2: Conditionally enable TLS in server.ts**

```ts
// In src/server.ts — build server options dynamically
import { config } from "./config.ts";

const serverOptions: Record<string, unknown> = {
  port: config.PORT,
  maxRequestBodySize: 1024 * 1024,
};

if (process.env.TLS_CERT_PATH && process.env.TLS_KEY_PATH) {
  serverOptions.tls = {
    cert: Bun.file(process.env.TLS_CERT_PATH),
    key: Bun.file(process.env.TLS_KEY_PATH),
  };
}
```

- [ ] **Step 3: Conditionally apply HSTS**

Modify `src/middleware/security-headers.ts` to only include `strict-transport-security` when TLS is configured or `NODE_ENV === "production"`.

- [ ] **Step 4: Test without TLS**

Run: `bun run src/index.ts`
Expected: Server starts on HTTP, no HSTS header.

- [ ] **Step 5: Test with TLS (optional)**

Generate self-signed cert, set env vars, verify HTTPS works.
