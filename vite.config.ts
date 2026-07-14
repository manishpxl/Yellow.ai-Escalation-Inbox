import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect the bundled server entry to src/server.ts (our SSR error wrapper).
    server: { entry: "server" },
  },
});
