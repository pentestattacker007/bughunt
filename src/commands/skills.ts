import { Command } from "commander";
import { Catalog } from "../content/catalog.js";
import { withBanner } from "../guardrails.js";
import { emit, fail } from "../output.js";

interface GlobalOpts {
  json?: boolean;
}

function isJson(cmd: Command): boolean {
  return Boolean((cmd.optsWithGlobals() as GlobalOpts).json);
}

function tocText(catalog: Catalog): string {
  const lines: string[] = ["Available methodologies:\n"];
  for (const m of catalog.methodologies) {
    const aliases = m.aliases.length ? ` (aliases: ${m.aliases.join(", ")})` : "";
    lines.push(`• ${m.id}${aliases}`);
    lines.push(`  ${m.name}`);
    lines.push(`  ${m.sections.length} sections`);
  }
  lines.push("\nNext: `bughunt skills get <id>` for the overview + section list.");
  return lines.join("\n");
}

export function registerSkillsCommand(program: Command): void {
  const skills = program.command("skills").description("Browse the bundled security-testing methodologies");

  skills
    .command("list")
    .description("List all methodologies with their section table of contents")
    .action(function (this: Command) {
      const json = isJson(this);
      const catalog = new Catalog();
      const data = {
        ok: true,
        docs: catalog.methodologies.map((m) => ({
          id: m.id,
          aliases: m.aliases,
          name: m.name,
          description: m.description,
          sections: m.sections.map((s) => ({ slug: s.slug, title: s.title, level: s.level })),
        })),
      };
      emit(json, data, () => tocText(catalog));
    });

  skills
    .command("get <id>")
    .description("Get a methodology overview, or one section with --section")
    .option("-s, --section <slug>", "return a single section by slug")
    .action(function (this: Command, id: string, opts: { section?: string }) {
      const json = isJson(this);
      const catalog = new Catalog();
      const m = catalog.resolve(id);
      if (!m) {
        return fail(json, `Unknown methodology "${id}". Try: ${catalog.ids().join(", ")}`);
      }

      if (opts.section) {
        const section = m.sections.find((s) => s.slug === opts.section);
        if (!section) {
          return fail(
            json,
            `Unknown section "${opts.section}" in ${m.id}. Run \`bughunt skills get ${m.id}\` for the list.`,
          );
        }
        return emit(
          json,
          { ok: true, skill: m.id, slug: section.slug, title: section.title, content: section.body },
          () => withBanner(section.body),
        );
      }

      // No section → progressive-disclosure overview + section TOC, never the full doc.
      const toc = m.sections.map((s) => `${"  ".repeat(s.level - 2)}- ${s.slug} — ${s.title}`).join("\n");
      const overviewText = `# ${m.name}\n\n${m.overview}\n\n## Sections (call \`bughunt skills get ${m.id} --section <slug>\`)\n\n${toc}`;
      emit(
        json,
        {
          ok: true,
          skill: m.id,
          name: m.name,
          description: m.description,
          overview: m.overview,
          sections: m.sections.map((s) => ({ slug: s.slug, title: s.title, level: s.level })),
        },
        () => withBanner(overviewText),
      );
    });

  skills
    .command("search <query>")
    .description("Search section titles and bodies across methodologies")
    .option("-k, --skill <id>", "limit search to one methodology")
    .action(function (this: Command, query: string, opts: { skill?: string }) {
      const json = isJson(this);
      const catalog = new Catalog();
      const matches = catalog.search(query, opts.skill);
      emit(
        json,
        { ok: true, query, matches },
        () =>
          matches.length === 0
            ? `No matches for "${query}".`
            : matches
                .map(
                  (mt) =>
                    `• [${mt.skill}] ${mt.slug} — ${mt.title}  (score ${mt.score})\n    ${mt.snippet}`,
                )
                .join("\n"),
      );
    });

  skills
    .command("path [id]")
    .description("Print the filesystem path of a methodology (or the skills dir)")
    .action(function (this: Command, id?: string) {
      const json = isJson(this);
      const catalog = new Catalog();
      if (!id) {
        const data = catalog.methodologies.map((m) => ({ id: m.id, path: m.path }));
        return emit(json, { ok: true, paths: data }, () => data.map((d) => `${d.id}\t${d.path}`).join("\n"));
      }
      const m = catalog.resolve(id);
      if (!m) return fail(json, `Unknown methodology "${id}".`);
      emit(json, { ok: true, id: m.id, path: m.path }, () => m.path);
    });
}
