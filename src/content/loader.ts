import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { parseFrontmatter } from "./frontmatter.js";
import { SKILLS_DIR } from "../paths.js";
import { extractOverview, parseSections, type Section } from "./sections.js";

export interface Methodology {
  /** canonical id = skill directory name, e.g. "recon-asset-discovery" */
  id: string;
  /** short aliases, e.g. ["recon"] */
  aliases: string[];
  /** frontmatter `name` */
  name: string;
  /** frontmatter `description` */
  description: string;
  /** intro text before the first `##` */
  overview: string;
  /** addressable sections */
  sections: Section[];
  /** full markdown body (frontmatter stripped) */
  body: string;
  /** absolute path to the SKILL.md */
  path: string;
}

/** Short, memorable aliases per canonical id. */
const ALIASES: Record<string, string[]> = {
  "recon-asset-discovery": ["recon"],
  "app-analysis-testing": ["app-test", "app"],
  "ai-exploit-assist": ["ai-assist", "ai"],
  "portswigger-attacks": ["portswigger", "ps"],
};

/**
 * Read every `<skill>/SKILL.md` under the bundled skills dir, parse frontmatter
 * and sections once. Pure read of our own bundled data — no network, no host FS
 * traversal outside SKILLS_DIR.
 */
export function loadMethodologies(): Methodology[] {
  const entries = readdirSync(SKILLS_DIR, { withFileTypes: true });
  const result: Methodology[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const skillPath = join(SKILLS_DIR, entry.name, "SKILL.md");
    try {
      if (!statSync(skillPath).isFile()) continue;
    } catch {
      continue; // dir without a SKILL.md — skip
    }

    const raw = readFileSync(skillPath, "utf8");
    const { data, body } = parseFrontmatter(raw);

    result.push({
      id: entry.name,
      aliases: ALIASES[entry.name] ?? [],
      name: typeof data.name === "string" ? data.name : entry.name,
      description: typeof data.description === "string" ? data.description : "",
      overview: extractOverview(body),
      sections: parseSections(body),
      body,
      path: skillPath,
    });
  }

  result.sort((a, b) => a.id.localeCompare(b.id));
  return result;
}
