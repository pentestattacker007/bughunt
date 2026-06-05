# Security & Acceptable Use

`bughunt` is a **defensive knowledge layer** for authorized security testing. It
distributes methodology guidance; it does not scan, exploit, or attack anything.

## Acceptable use

- Use only against assets you are **explicitly authorized** to test: a signed
  penetration-testing engagement or an in-scope public/private bug bounty
  program.
- Treat all output as **guidance, not authorization**. Validate every payload
  and reproduce every finding with real tools before reporting.
- Do not use this content for unauthorized access, mass targeting, denial of
  service, or any activity outside an agreed scope.

## Security posture of the tool itself

- **No code execution.** The CLI never shells out (`child_process` is not
  imported) and never performs network requests. It only reads its own bundled
  markdown under `skills/`.
- **No secrets, no host traversal.** It reads files only within its packaged
  `skills/` directory, resolved relative to the module — not from arbitrary
  paths or `process.cwd()`.
- **Input validation.** Methodology ids are resolved against a fixed set;
  unknown ids/sections are rejected. Host inputs to scope helpers are validated
  and normalized.
- **Gated actions.** The live-action surface is disabled by default and gated
  behind an explicit scope allowlist + safe-mode (`src/guardrails.ts`). No
  action runs without passing `assertActionAllowed`.
- **stdout discipline.** All diagnostics go to stderr; stdout carries only
  command output / JSON.

## Reporting a vulnerability

Open a private security advisory on the repository, or email the maintainer.
Please do not file public issues for security reports.
