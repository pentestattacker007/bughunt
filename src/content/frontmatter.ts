/**
 * Tolerant frontmatter parser.
 *
 * SKILL.md descriptions routinely contain unquoted `: ` (colon-space) and other
 * characters that strict YAML 1.1 (js-yaml) rejects. Claude's own skill loader
 * is lenient, so we match that: split each frontmatter line on its FIRST colon
 * only and keep the rest verbatim. No YAML dependency, no surprise crashes on
 * real-world skill files.
 */
export interface Frontmatter {
  data: Record<string, string>;
  body: string;
}

export function parseFrontmatter(raw: string): Frontmatter {
  const text = raw.replace(/^﻿/, ""); // strip BOM
  if (!/^---\r?\n/.test(text)) {
    return { data: {}, body: text.trim() };
  }

  const lines = text.split(/\r?\n/);
  // lines[0] === "---"; find the closing fence.
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      end = i;
      break;
    }
  }
  if (end === -1) {
    return { data: {}, body: text.trim() };
  }

  const data: Record<string, string> = {};
  for (let i = 1; i < end; i++) {
    const line = lines[i];
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    // Unwrap a single matching pair of surrounding quotes, if present.
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
      (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
    ) {
      value = value.slice(1, -1);
    }
    if (key) data[key] = value;
  }

  return { data, body: lines.slice(end + 1).join("\n").trim() };
}
