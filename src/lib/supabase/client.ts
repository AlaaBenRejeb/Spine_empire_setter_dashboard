import { createBrowserClient } from "@supabase/ssr";
import { createClient as createRawClient } from "@supabase/supabase-js";

let clientInstance: any = null;
let isInitializing = false;

export function createClient() {
  // During SSR/build, use the raw client
  if (typeof window === "undefined") {
    return createRawClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  // In the browser, return a shared singleton instance
  if (!clientInstance) {
    clientInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: "spine-setter-auth-v1",
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      }
    );
  }

  return clientInstance;
}
