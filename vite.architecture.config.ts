import { defineConfig } from "vite";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { generateArchitectureMap } from "./scripts/generate-architecture-map.mjs";

function figmaAssetResolver() {
  return {
    name: "figma-asset-resolver",
    resolveId(id: string) {
      if (id.startsWith("figma:asset/")) {
        const filename = id.replace("figma:asset/", "");
        return path.resolve(__dirname, "src/assets", filename);
      }
    },
  };
}

function architectureMapGenerator() {
  return {
    name: "architecture-map-generator",
    buildStart() {
      generateArchitectureMap();
    },
  };
}

export default defineConfig(({ command }) => ({
  base: command === "build" ? "./" : "/",
  server: { port: 5175, host: "127.0.0.1", strictPort: true },
  define: {
    __GXP_BUILD_ID__: JSON.stringify(
      process.env.VITE_BUILD_ID ||
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.GITHUB_SHA ||
      new Date().toISOString(),
    ),
  },
  plugins: [
    figmaAssetResolver(),
    architectureMapGenerator(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist-architecture",
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "architecture.html"),
    },
  },
  assetsInclude: ["**/*.svg", "**/*.csv"],
}));
