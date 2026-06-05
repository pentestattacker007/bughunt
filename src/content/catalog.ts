import { loadMethodologies, type Methodology } from "./loader.js";

export interface SearchMatch {
  skill: string;
  slug: string;
  title: string;
  score: number;
  snippet: string;
}

/**
 * In-memory index over the bundled methodologies. Built once per process.
 */
export class Catalog {
  private readonly byId = new Map<string, Methodology>();
  readonly methodologies: Methodology[];

  constructor(methodologies: Methodology[] = loadMethodologies()) {
    this.methodologies = methodologies;
    for (const m of methodologies) {
      this.byId.set(m.id, m);
      for (const a of m.aliases) this.byId.set(a, m);
    }
  }

  /** Resolve a canonical id or alias to a methodology. */
  resolve(idOrAlias: string): Methodology | undefined {
    return this.byId.get(idOrAlias.toLowerCase());
  }

  ids(): string[] {
    return this.methodologies.map((m) => m.id);
  }

  /** Substring/keyword search over section titles + bodies. No network. */
  search(query: string, skillId?: string): SearchMatch[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    const terms = q.split(/\s+/);

    const scope = skillId
      ? this.methodologies.filter((m) => m.id === this.resolve(skillId)?.id)
      : this.methodologies;

    const matches: SearchMatch[] = [];
    for (const m of scope) {
      for (const s of m.sections) {
        const hayTitle = s.title.toLowerCase();
        const hayBody = s.body.toLowerCase();
        let score = 0;
        for (const t of terms) {
          if (hayTitle.includes(t)) score += 5;
          const occurrences = hayBody.split(t).length - 1;
          score += Math.min(occurrences, 5);
        }
        if (score > 0) {
          matches.push({
            skill: m.id,
            slug: s.slug,
            title: s.title,
            score,
            snippet: makeSnippet(s.body, terms),
          });
        }
      }
    }

    return matches.sort((a, b) => b.score - a.score).slice(0, 25);
  }
}

function makeSnippet(body: string, terms: string[]): string {
  const lower = body.toLowerCase();
  let at = -1;
  for (const t of terms) {
    const i = lower.indexOf(t);
    if (i !== -1 && (at === -1 || i < at)) at = i;
  }
  if (at === -1) at = 0;
  const start = Math.max(0, at - 60);
  const end = Math.min(body.length, at + 140);
  return (start > 0 ? "…" : "") + body.slice(start, end).replace(/\s+/g, " ").trim() + (end < body.length ? "…" : "");
}
