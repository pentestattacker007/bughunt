import { Command } from "commander";
import { registerSkillsCommand } from "./commands/skills.js";
import { registerInstallCommand } from "./commands/install.js";
import { registerScopeCommand } from "./commands/scope.js";

export const VERSION = "0.1.0";

export function buildProgram(): Command {
  const program = new Command();

  program
    .name("bughunt")
    .description(
      "Security-testing methodology CLI + skills for AI agents.\n" +
        "Defensive, authorized-use knowledge layer (recon → app analysis → AI-assist → PortSwigger).",
    )
    .version(VERSION, "-v, --version")
    .option("--json", "machine-readable JSON output on stdout")
    .showHelpAfterError();

  registerSkillsCommand(program);
  registerInstallCommand(program);
  registerScopeCommand(program);

  return program;
}
