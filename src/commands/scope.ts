import { Command } from "commander";
import { z } from "zod";
import { DEFAULT_POLICY, inScope, type ActionPolicy } from "../guardrails.js";
import { emit, fail } from "../output.js";

interface GlobalOpts {
  json?: boolean;
}

/**
 * Action surface scaffold.
 *
 * v1 ships exactly ONE local, read-only action — `scope check` — to exercise the
 * guardrail layer end to end. It performs NO network/FS I/O; it only evaluates a
 * host against an authorization allowlist. New live actions must route through
 * guardrails.assertActionAllowed before doing anything.
 */

const hostSchema = z
  .string()
  .min(1)
  .transform((v) => v.replace(/^https?:\/\//, "").split("/")[0].toLowerCase())
  .refine((h) => /^[a-z0-9.-]+$/.test(h), "invalid host");

export function registerScopeCommand(program: Command): void {
  const scope = program
    .command("scope")
    .description("Authorization-scope helpers for live actions (guardrail layer)");

  scope
    .command("check <host>")
    .description("Check whether a host is within an authorized scope allowlist (no network)")
    .option("-s, --scope <rule...>", "allowlist rule(s): host or *.suffix", [])
    .action(function (this: Command, host: string, opts: { scope: string[] }) {
      const json = Boolean((this.optsWithGlobals() as GlobalOpts).json);
      const parsed = hostSchema.safeParse(host);
      if (!parsed.success) {
        return fail(json, `Invalid host: ${parsed.error.issues[0]?.message ?? "parse error"}`);
      }
      const policy: ActionPolicy = { ...DEFAULT_POLICY, scope: opts.scope ?? [] };
      const allowed = inScope(parsed.data, policy.scope);
      emit(
        json,
        { ok: true, host: parsed.data, inScope: allowed, scope: policy.scope },
        () =>
          policy.scope.length === 0
            ? `${parsed.data}: NO scope provided (pass --scope). Live actions remain disabled.`
            : `${parsed.data}: ${allowed ? "IN SCOPE ✅" : "OUT OF SCOPE ❌"} (allowlist: ${policy.scope.join(", ")})`,
      );
    });
}
