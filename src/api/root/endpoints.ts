import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema } from "effect";

const RootResponse = Schema.Struct({
  name: Schema.String,
  version: Schema.String,
});

export const RootGroup = HttpApiGroup.make("Root").add(
  HttpApiEndpoint.get("root", "/").addSuccess(RootResponse),
);
