export function castObjectValuesToString<T extends Record<string, unknown>>(
  obj: T,
): Record<keyof T, string> {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, String(value)]),
  ) as Record<keyof T, string>;
}
