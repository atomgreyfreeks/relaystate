import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  server: { host: "0.0.0.0", port: 5184 },
  preview: { host: "0.0.0.0", port: 5184 },
  build: {
    rollupOptions: {
      input: {
        hub: fileURLToPath(new URL("./index.html", import.meta.url)),
        rescueworld: fileURLToPath(new URL("./rescueworld.html", import.meta.url)),
      },
    },
  },
});
