import type { Dictionary } from "./dictionary";

type Params = Record<string, string | number>;

function getNested(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

/** Resolve a dot-path key from the dictionary with optional `{param}` interpolation. */
export function translate(
  dict: Dictionary,
  key: string,
  params?: Params,
): string {
  const value = getNested(dict, key);
  if (typeof value !== "string") return key;
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (_, name: string) =>
    params[name] !== undefined ? String(params[name]) : `{${name}}`,
  );
}
