/**
 * Authorization + safety guardrails.
 *
 * This CLI is a DEFENSIVE knowledge layer. Methodology output is always
 * prefixed with an authorization banner, and the (future) live-action surface
 * is gated behind an explicit scope + safe-mode model wired up here so it
 * exists before any action ever shells out.
 */

export const AUTH_BANNER = `⚠️  AUTHORIZED USE ONLY — DEFENSIVE METHODOLOGY GUIDANCE
Only test assets you are explicitly authorized to test (signed engagement or
in-scope bug bounty program). This content is guidance, not a license. You must
validate every payload and reproduce every finding with real tools before
reporting. No autonomous attacks.`;

/** Prefix a content payload with the banner (skipped in --json; see commands). */
export function withBanner(body: string): string {
  return `${AUTH_BANNER}\n\n---\n\n${body}`;
}

/**
 * Safe-mode policy for live actions. v1 ships NO live actions, but the gate is
 * here so the moment an action that touches the network/FS is added, it must
 * pass through `assertActionAllowed` first.
 */
export interface ActionPolicy {
  /** master switch; live actions are refused unless explicitly enabled */
  enabled: boolean;
  /** in-scope host allowlist (exact host or *.suffix) */
  scope: string[];
  /** when true, mutating/active actions are blocked; read-only allowed */
  safeMode: boolean;
}

export const DEFAULT_POLICY: ActionPolicy = {
  enabled: false,
  scope: [],
  safeMode: true,
};

export class ScopeError extends Error {}

/** Is `host` covered by the allowlist (exact or wildcard suffix)? */
export function inScope(host: string, scope: string[]): boolean {
  const h = host.toLowerCase();
  return scope.some((rule) => {
    const r = rule.toLowerCase();
    if (r.startsWith("*.")) return h === r.slice(2) || h.endsWith(r.slice(1));
    return h === r;
  });
}

/**
 * Guard a live action. Throws ScopeError unless actions are enabled and the
 * target host is in the authorized scope. `mutating` actions also require
 * safe-mode to be off. Pure policy check — no I/O.
 */
export function assertActionAllowed(
  policy: ActionPolicy,
  targetHost: string,
  opts: { mutating?: boolean } = {},
): void {
  if (!policy.enabled) {
    throw new ScopeError(
      "Live actions are disabled. This build is a knowledge layer; enable actions only within an authorized engagement.",
    );
  }
  if (!inScope(targetHost, policy.scope)) {
    throw new ScopeError(`Target "${targetHost}" is not in the authorized scope allowlist.`);
  }
  if (opts.mutating && policy.safeMode) {
    throw new ScopeError("Safe-mode is on: active/mutating actions are blocked.");
  }
}
