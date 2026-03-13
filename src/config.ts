import { Schema } from "effect";

const AppConfig = Schema.Struct({
  PORT: Schema.NumberFromString.pipe(Schema.int(), Schema.between(1, 65535)),
  API_NAME: Schema.String.pipe(Schema.minLength(1)),
  API_VERSION: Schema.String.pipe(Schema.minLength(1)),
  NODE_ENV: Schema.optional(Schema.Literal("development", "production")).pipe(
    Schema.withDefaults({
      constructor: () => "development" as const,
      decoding: () => "development" as const,
    }),
  ),
  CORS_ORIGIN: Schema.optional(Schema.String).pipe(
    Schema.withDefaults({ constructor: () => "", decoding: () => "" }),
  ),
});

export const config = Schema.decodeUnknownSync(AppConfig)({
  PORT: process.env.PORT ?? "3000",
  API_NAME: process.env.API_NAME,
  API_VERSION: process.env.API_VERSION,
  NODE_ENV: process.env.NODE_ENV,
  CORS_ORIGIN: process.env.CORS_ORIGIN,
});
