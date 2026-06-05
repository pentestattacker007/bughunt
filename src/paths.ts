import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

/**
 * Absolute path to the bundled `skills/` directory.
 *
 * Resolved relative to the compiled module (via import.meta.url), NEVER
 * process.cwd(): an agent may spawn the CLI from any directory, and a global
 * install has no meaningful cwd. This keeps the markdown source-of-truth
 * locatable whether running from dist/ (prod) or src/ (dev) — both sit one
 * level below the package root.
 */
const moduleDir = dirname(fileURLToPath(import.meta.url));

export const SKILLS_DIR = resolve(moduleDir, "..", "skills");
