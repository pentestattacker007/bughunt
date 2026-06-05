# bughunt

A security-testing **methodology CLI + skills** for AI agents. It ships four
battle-tested playbooks — recon, app analysis, AI-exploit-assist, and the full
PortSwigger attack engine — and serves them to any agent that can run a shell
command, the same way [`vercel-labs/agent-browser`](https://github.com/vercel-labs/agent-browser)
serves browser automation.

It is a **defensive knowledge layer**: it returns guidance, never runs attacks.

```
recon-asset-discovery  →  ai-exploit-assist  →  app-analysis-testing  →  portswigger-attacks
   (discover)               (prioritize)            (test)                  (deepen)
```

## Install

```bash
npm install -g @pentestattacker007/bughunt      # global
# or run without installing:
npx -y @pentestattacker007/bughunt skills list
```

## Use (agent or human)

```bash
bughunt skills list                                    # catalog + section TOCs
bughunt skills get recon                               # overview + sections (progressive disclosure)
bughunt skills get portswigger --section sql-injection # one section, full detail
bughunt skills search "idor access control"            # find relevant sections
bughunt skills path ps                                 # filesystem path to a methodology
```

Add `--json` to any command for machine-readable output on stdout:

```bash
bughunt skills get app-test --json
```

Methodology ids (and aliases): `recon-asset-discovery` (`recon`),
`app-analysis-testing` (`app-test`, `app`), `ai-exploit-assist` (`ai-assist`,
`ai`), `portswigger-attacks` (`portswigger`, `ps`).

## Wire it into your agent

Drop a thin, version-current skill stub into your agent's skills directory. The
stub points the agent back at the CLI, so guidance always matches the installed
version:

```bash
bughunt install --agent claude     # ~/.claude/skills/bughunt/SKILL.md
bughunt install --agent cursor
bughunt install --dir ./.claude/skills/bughunt   # explicit path
```

Or install the full skills via the Vercel skills ecosystem:

```bash
npx skills add fahad/bughunt
```

## Scope guardrails

`bughunt` is a knowledge layer; it does not perform live actions in v1. The
authorization model is already wired in for any future live helpers:

```bash
bughunt scope check app.example.com --scope "*.example.com"   # IN SCOPE ✅
bughunt scope check evil.com --scope "*.example.com"          # OUT OF SCOPE ❌
```

## Acceptable use

For **authorized** security testing only — signed engagements or in-scope bug
bounty programs. Every payload must be validated and every finding reproduced
with real tools before reporting. See [SECURITY.md](./SECURITY.md).

## Develop

```bash
npm install
npm run dev -- skills list     # run from source
npm test                        # vitest
npm run build                   # tsup → dist/
```

## Releasing

CI (`.github/workflows/ci.yml`) runs lint + tests + build on Node 18/20/22 for
every push and PR. Versioning and publishing are handled by
[Changesets](https://github.com/changesets/changesets).

**When you make a change**, record its impact:

```bash
npm run changeset      # pick patch/minor/major + write a summary
git add .changeset && git commit -m "..."   # commit the changeset with your work
```

**Releasing is automatic** via `.github/workflows/release.yml`:

1. Pushing changesets to `master` opens (or updates) a **"Version Packages"**
   PR that bumps the version and updates `CHANGELOG.md`.
2. Merging that PR publishes to npm with
   [provenance](https://docs.npmjs.com/generating-provenance-statements)
   (`changeset publish`, `--access public`) and creates the git tag + GitHub
   release.

**One-time setup:** add an `NPM_TOKEN` secret (an npm automation/granular token
with publish rights to the `@pentestattacker007` scope) to the repository's
Actions secrets. The workflow already grants the `id-token` permission needed
for provenance.

## License

MIT
