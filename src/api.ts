import { HttpApi } from "@effect/platform";
import { RootGroup } from "./api/root/endpoints.ts";
import { TodosGroup } from "./api/todos/endpoints.ts";

export const Api = HttpApi.make("TodoApi").add(RootGroup).add(TodosGroup);
