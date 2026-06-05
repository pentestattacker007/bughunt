/**
 * Markdown section parser.
 *
 * Splits a methodology body into addressable sections at `##` and `###`
 * headings. A section spans from its heading until the next heading of an
 * equal-or-shallower level, so requesting a `##` section returns its nested
 * `###` children too (progressive disclosure), while a `###` returns just
 * itself.
 */

export interface Section {
  /** url-safe identifier derived from the heading text, unique within a doc */
  slug: string;
  /** heading text, verbatim */
  title: string;
  /** 2 for `##`, 3 for `###` */
  level: number;
  /** full markdown of the section, heading line included */
  body: string;
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60) || "section";
}

interface Heading {
  level: number;
  title: string;
  line: number;
}

/**
 * The intro text that precedes the first `##` heading (after frontmatter has
 * already been stripped by the loader). Used as a doc's "overview".
 */
export function extractOverview(body: string): string {
  const lines = body.split("\n");
  const out: string[] = [];
  for (const line of lines) {
    if (/^#{2,3}\s/.test(line)) break;
    out.push(line);
  }
  return out.join("\n").trim();
}

export function parseSections(body: string): Section[] {
  const lines = body.split("\n");
  const headings: Heading[] = [];

  let inFence = false;
  lines.forEach((line, idx) => {
    // Ignore headings inside fenced code blocks.
    if (/^\s*```/.test(line)) inFence = !inFence;
    if (inFence) return;
    const m = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (m) headings.push({ level: m[1].length, title: m[2], line: idx });
  });

  const seen = new Map<string, number>();
  const sections: Section[] = [];

  headings.forEach((h, i) => {
    // End at the next heading whose level is <= this one's.
    let end = lines.length;
    for (let j = i + 1; j < headings.length; j++) {
      if (headings[j].level <= h.level) {
        end = headings[j].line;
        break;
      }
    }

    let slug = slugify(h.title);
    const dupes = seen.get(slug) ?? 0;
    seen.set(slug, dupes + 1);
    if (dupes > 0) slug = `${slug}-${dupes + 1}`;

    sections.push({
      slug,
      title: h.title,
      level: h.level,
      body: lines.slice(h.line, end).join("\n").trim(),
    });
  });

  return sections;
}
