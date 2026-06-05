import { Command } from "commander";
import { mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { emit, fail } from "../output.js";

interface GlobalOpts {
  json?: boolean;
}

/**
 * The thin, version-current stub written into an agent's skills dir. It does NOT
 * embed methodology content — it points the agent at `bughunt skills get`, so the
 * instructions always match the installed CLI version (the agent-browser pattern).
 */
const STUB = `---
name: bughunt
description: Security-testing methodology library (recon, app analysis, AI-exploit-assist, PortSwigger attacks) for AUTHORIZED bug bounty / pentest work. TRIGGER on recon, attack-surface mapping, IDOR/SQLi/SSRF/XSS testing, payload generation, or "how do I test X". Defensive knowledge layer — no autonomous attacks.
---

# bughunt — security-testing methodologies

Always fetch live, version-matched guidance from the CLI rather than relying on this stub.

## Start here

\`\`\`bash
bughunt skills list                          # catalog of all methodologies + sections
bughunt skills get <id>                       # overview + section TOC (progressive disclosure)
bughunt skills get <id> --section <slug>      # one section, full detail
bughunt skills search "<query>"               # find relevant sections
\`\`\`

Methodology ids: \`recon-asset-discovery\` (recon), \`app-analysis-testing\` (app), \`ai-exploit-assist\` (ai), \`portswigger-attacks\` (ps).

## Rules

- Only operate on assets you are explicitly authorized to test.
- This is guidance: validate every payload and reproduce every finding with real tools before reporting.
`;

const AGENT_DIRS: Record<string, string> = {
  claude: join(homedir(), ".claude", "skills", "bughunt"),
  cursor: join(homedir(), ".cursor", "skills", "bughunt"),
  codex: join(homedir(), ".codex", "skills", "bughunt"),
};

export function registerInstallCommand(program: Command): void {
  program
    .command("install")
    .description("Install the bughunt skill stub into an AI agent's skills directory")
    .option("-a, --agent <name>", "claude | cursor | codex", "claude")
    .option("-d, --dir <path>", "explicit target directory (overrides --agent)")
    .action(function (this: Command, opts: { agent: string; dir?: string }) {
      const json = Boolean((this.optsWithGlobals() as GlobalOpts).json);
      const target = opts.dir ?? AGENT_DIRS[opts.agent];
      if (!target) {
        return fail(json, `Unknown agent "${opts.agent}". Use one of: ${Object.keys(AGENT_DIRS).join(", ")} or --dir.`);
      }
      try {
        mkdirSync(target, { recursive: true });
        const file = join(target, "SKILL.md");
        writeFileSync(file, STUB, "utf8");
        emit(json, { ok: true, installed: file }, () => `Installed bughunt skill stub → ${file}`);
      } catch (err) {
        return fail(json, `Failed to write stub: ${(err as Error).message}`);
      }
    });
}
