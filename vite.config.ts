import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins: PluginOption[] = [react()];

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins,
    resolve: {
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
  };
});
