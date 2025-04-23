const DateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3,6}|)Z$/;

/**
 * Parses the given `input` as JSON, and converts string with date-time formats
 * to Javascript Date objects.
 *
 * @param input String to parse to JSON
 * @returns JSON with date times converted to Date objects
 */
export function parseJson<T>(input: string) {
  return JSON.parse(input, (_, value) => {
    if (typeof value === 'string' && DateTimeRegex.test(value)) {
      return new Date(value);
    }
    return value;
  }) as T;
}
