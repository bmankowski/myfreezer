/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate string is not empty after trimming
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validate string is a non-empty string (alias for isNonEmptyString)
 */
export function isValidString(value: unknown): value is string {
  return isNonEmptyString(value);
}

/**
 * Validate string length
 */
export function isValidLength(value: string, maxLength: number): boolean {
  return value.length <= maxLength;
}

/**
 * Validate container type
 */
export function isValidContainerType(type: unknown): type is "freezer" | "fridge" {
  return type === "freezer" || type === "fridge";
}
