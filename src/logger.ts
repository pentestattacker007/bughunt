/**
 * stderr-only logger.
 *
 * stdout is reserved for command output (especially `--json`, which agents
 * parse). Every diagnostic / progress / error line goes to stderr so it never
 * corrupts a machine-readable payload.
 */
export const log = {
  info: (...args: unknown[]) => console.error(...args),
  warn: (...args: unknown[]) => console.error("[warn]", ...args),
  error: (...args: unknown[]) => console.error("[error]", ...args),
};
