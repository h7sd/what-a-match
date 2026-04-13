import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    // IMPORTANT: Ensure all backend traffic goes through the public API domain
    // so the underlying provider URL is never visible in browser devtools.
    alias: [
      {
        find: "@/integrations/supabase/client",
        replacement: path.resolve(__dirname, "./src/lib/supabase-proxy-client.ts"),
      },
      {
        find: "@",
        replacement: path.resolve(__dirname, "./src"),
      },
    ],
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": ["framer-motion", "lucide-react", "@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-tabs", "@radix-ui/react-tooltip"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-charts": ["recharts"],
          "vendor-three": ["three", "ogl"],
          "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],
          "vendor-dnd": ["@dnd-kit/core", "@dnd-kit/sortable", "@dnd-kit/utilities"],
          "vendor-gsap": ["gsap", "@gsap/react"],
        },
      },
    },
  },
}));
