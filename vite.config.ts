import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default {
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@/integrations/supabase/client": path.resolve("src/lib/supabase-proxy-client.ts"),
      "@": path.resolve("src"),
    },
  },
};
