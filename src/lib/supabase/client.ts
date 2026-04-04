import { createBrowserClient } from "@supabase/ssr";
import { createClient as createRawClient } from "@supabase/supabase-js";

let clientInstance: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  // During SSR/build (no window), use the raw client which works in Node.js
  if (typeof window === "undefined") {
    return createRawClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  // In the browser, return a shared singleton SSR client to prevent lock contention
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
