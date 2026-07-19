import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react";

// file:// in Electron does not send CORS headers — crossorigin assets fail to load.
function removeCrossoriginPlugin(): Plugin {
  return {
    name: "remove-crossorigin",
    transformIndexHtml(html) {
      return html.replace(/\s*crossorigin(="[^"]*")?/gi, "");
    },
  };
}

/** Never embed OpenAI secrets in packaged renderer bundles (dev server only). */
function stripOpenAIKeyFromBuilds(): Plugin {
  return {
    name: "strip-openai-key-from-builds",
    config(_config, { command }) {
      if (command !== "build") return;
      return {
        define: {
          "import.meta.env.VITE_OPENAI_API_KEY": JSON.stringify(""),
        },
      };
    },
  };
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    base: "./",
    resolve: {
      alias: {
        "@": resolve("src/renderer/src"),
      },
    },
    plugins: [react(), removeCrossoriginPlugin(), stripOpenAIKeyFromBuilds()],
    build: {
      modulePreload: { polyfill: false },
    },
  },
});
