import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node18",
  clean: true,
  dts: false,
  sourcemap: true,
  minify: false,
  // Guarantee the CLI shebang survives bundling.
  banner: { js: "#!/usr/bin/env node" },
  // Keep runtime deps external; they install from node_modules.
  external: ["commander", "zod"],
});
