import { describe, it, expect } from "vitest";
import { Catalog } from "../src/content/catalog.js";
import { parseSections, slugify, extractOverview } from "../src/content/sections.js";
import { inScope, assertActionAllowed, DEFAULT_POLICY, ScopeError } from "../src/guardrails.js";
import { parseFrontmatter } from "../src/content/frontmatter.js";

describe("frontmatter parser", () => {
  it("handles unquoted colons in values (the gray-matter footgun)", () => {
    const raw = "---\nname: x\ndescription: Decision tree: maps A to B. Run with /x against <t>.\n---\n# Body\ntext";
    const { data, body } = parseFrontmatter(raw);
    expect(data.name).toBe("x");
    expect(data.description).toBe("Decision tree: maps A to B. Run with /x against <t>.");
    expect(body).toBe("# Body\ntext");
  });

  it("returns empty data when no frontmatter", () => {
    const { data, body } = parseFrontmatter("# Just a doc\nhi");
    expect(data).toEqual({});
    expect(body).toBe("# Just a doc\nhi");
  });

  it("unwraps surrounding quotes", () => {
    expect(parseFrontmatter('---\nname: "y"\n---\nb').data.name).toBe("y");
  });
});

describe("section parser", () => {
  const md = [
    "Intro paragraph before any heading.",
    "",
    "## Phase One",
    "alpha",
    "### Sub A",
    "beta",
    "## Phase Two",
    "gamma",
    "```",
    "## not a heading (in fence)",
    "```",
  ].join("\n");

  it("extracts the overview before the first heading", () => {
    expect(extractOverview(md)).toBe("Intro paragraph before any heading.");
  });

  it("splits on ## and ### and nests children under parents", () => {
    const sections = parseSections(md);
    const slugs = sections.map((s) => s.slug);
    expect(slugs).toEqual(["phase-one", "sub-a", "phase-two"]);
    const phaseOne = sections.find((s) => s.slug === "phase-one")!;
    expect(phaseOne.body).toContain("### Sub A"); // parent includes its child
    expect(phaseOne.body).not.toContain("Phase Two");
  });

  it("ignores headings inside code fences", () => {
    const sections = parseSections(md);
    expect(sections.some((s) => s.title.includes("in fence"))).toBe(false);
  });

  it("slugify is url-safe and bounded", () => {
    expect(slugify("SQL INJECTION (union/blind)")).toBe("sql-injection-unionblind");
  });
});

describe("catalog (bundled skills)", () => {
  const catalog = new Catalog();

  it("loads the four methodologies", () => {
    expect(catalog.methodologies.length).toBe(4);
    expect(catalog.ids().sort()).toEqual(
      ["ai-exploit-assist", "app-analysis-testing", "portswigger-attacks", "recon-asset-discovery"].sort(),
    );
  });

  it("resolves aliases", () => {
    expect(catalog.resolve("recon")?.id).toBe("recon-asset-discovery");
    expect(catalog.resolve("ps")?.id).toBe("portswigger-attacks");
    expect(catalog.resolve("nope")).toBeUndefined();
  });

  it("every methodology has sections and a description", () => {
    for (const m of catalog.methodologies) {
      expect(m.sections.length).toBeGreaterThan(0);
      expect(m.description.length).toBeGreaterThan(0);
    }
  });

  it("search returns ranked matches", () => {
    const matches = catalog.search("subdomain enumeration");
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].score).toBeGreaterThanOrEqual(matches[matches.length - 1].score);
  });

  it("search can scope to one skill", () => {
    const matches = catalog.search("injection", "portswigger");
    expect(matches.every((m) => m.skill === "portswigger-attacks")).toBe(true);
  });
});

describe("guardrails", () => {
  it("inScope handles exact and wildcard rules", () => {
    expect(inScope("app.example.com", ["*.example.com"])).toBe(true);
    expect(inScope("example.com", ["*.example.com"])).toBe(true);
    expect(inScope("evil.com", ["*.example.com"])).toBe(false);
    expect(inScope("api.test.io", ["api.test.io"])).toBe(true);
  });

  it("refuses actions when disabled", () => {
    expect(() => assertActionAllowed(DEFAULT_POLICY, "app.example.com")).toThrow(ScopeError);
  });

  it("allows in-scope read-only action when enabled, blocks mutating in safe-mode", () => {
    const policy = { enabled: true, scope: ["*.example.com"], safeMode: true };
    expect(() => assertActionAllowed(policy, "app.example.com")).not.toThrow();
    expect(() => assertActionAllowed(policy, "app.example.com", { mutating: true })).toThrow(ScopeError);
    expect(() => assertActionAllowed(policy, "evil.com")).toThrow(ScopeError);
  });
});
