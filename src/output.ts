/**
 * Output helpers. JSON goes to stdout as a single line for agents; text goes to
 * stdout for humans. Diagnostics never come through here (see logger.ts).
 */
export function emit(json: boolean, data: unknown, text: () => string): void {
  if (json) {
    process.stdout.write(JSON.stringify(data) + "\n");
  } else {
    process.stdout.write(text() + "\n");
  }
}

export function fail(json: boolean, message: string, code = 1): never {
  if (json) {
    process.stdout.write(JSON.stringify({ ok: false, error: message }) + "\n");
  } else {
    process.stderr.write(`[error] ${message}\n`);
  }
  process.exit(code);
}
