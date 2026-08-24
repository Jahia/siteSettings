import { defineConfig } from "vite";
import { federation } from "@module-federation/vite";
import pkg from "./package.json" with { type: "json" };

const shared = {
  ...Object.fromEntries(
    Object.entries(pkg.peerDependencies).map(
      ([name, requiredVersion]) => [
        name,
        {
          singleton: true,
          import: false as const,
          requiredVersion,
          // Make sure the stub never gets picked against any other version
          //version: "0.0.0",
        },
      ],
    ),
  ),
  ...Object.fromEntries(
    Object.entries(pkg.dependencies).map(
      ([name, requiredVersion]) => [name, { requiredVersion }],
    ),
  ),
};

// React stuff
if (shared.react) {
  shared["react/jsx-runtime"] = shared.react;
  shared["react/jsx-dev-runtime"] = shared.react;
}
if (shared["react-dom"]) {
  shared["react-dom/client"] = shared["react-dom"];
}

export default defineConfig({
  input: "src/javascript/init.js",
  base: "",
  build: {
    outDir: "src/main/resources/javascript/apps",
    minify: false,
    sourcemap: true,
  },
  plugins: [
    {
      name: "jahia-federation-plugin",
      buildEnd() {
        // We assume these files are exposed under the "javascript/apps" path live,
        // regardless of the actual output directory configured in Vite.
        this.emitFile({
          type: "asset",
          fileName: "remoteEntry.js",
          source:
            'appShell.remotes.siteSettings={async init(...a){const m=await import("./index.js");await m.init(...a);Object.assign(this,m)}};',
        });
        this.emitFile({
          type: "asset",
          fileName: "package.json",
          source: JSON.stringify({
            jahia: {
              remotes: {
                jahia: "javascript/apps/remoteEntry.js",
              },
            },
          }),
        });
      },
    },
    federation({
      name: "siteSettings",
      dts: false,
      filename: "index.js",
      shared,
      exposes: {
        "./init": "./src/javascript/init.js",
      },
      remotes: {},
    }),
  ],
});
