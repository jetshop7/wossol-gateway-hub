// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // The generated route tree is written atomically by TanStack's generator.
  // Watching that output feeds its own write back into Vite's route-generator
  // hook on Windows, which can start concurrent generations and oscillate the
  // otherwise identical route ordering.
  vite: {
    server: {
      watch: {
        ignored: ["**/src/routeTree.gen.ts"],
      },
    },
  },
  // Force Nitro output when building outside Lovable, such as on Vercel.
  nitro: true,
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
