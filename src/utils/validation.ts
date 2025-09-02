import { t } from "elysia";

export function paramsWithId<Key extends string = "id">(key?: Key) {
  const actualKey = key ?? ("id" as Key);

  return t.Object({
    [actualKey]: t.Number({ description: "ID of the resource to operate on" }),
  });
}
