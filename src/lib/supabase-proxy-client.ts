import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Use the real Supabase URL for auth (required for auth flows to work)
// Edge functions and other API calls go through the proxy
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Proxy URL for edge functions (hides Supabase project ID in network tab)
export const PUBLIC_API_URL = "https://api.uservault.cc";

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      // Override fetch for functions to use proxy
      fetch: (url, options) => {
        const urlString = url.toString();
        // Route edge function calls through the proxy
        if (urlString.includes('/functions/v1/')) {
          const proxyUrl = urlString.replace(
            /https:\/\/[a-z0-9]+\.supabase\.co/i,
            PUBLIC_API_URL
          );
          return fetch(proxyUrl, options);
        }
        // All other requests (auth, rest, storage) use original URL
        return fetch(url, options);
      },
    },
  },
);
