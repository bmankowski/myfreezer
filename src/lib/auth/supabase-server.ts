import { createServerClient } from "@supabase/ssr";
import type { Database } from "../db/database.types";

interface CookieOptions {
  maxAge?: number;
  expires?: Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: "strict" | "lax" | "none";
}

interface AstroCookies {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, options?: CookieOptions): void;
  delete(name: string, options?: CookieOptions): void;
}

/**
 * Primary server client factory - uses Astro cookies when available,
 * falls back to manual parsing for non-Astro contexts
 */
export function createSupabaseServerClient(request: Request, astroContext?: { cookies: AstroCookies }) {
  if (!import.meta.env.PUBLIC_SUPABASE_URL) {
    throw new Error("PUBLIC_SUPABASE_URL is required");
  }
  if (!import.meta.env.PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("PUBLIC_SUPABASE_ANON_KEY is required");
  }

  return createServerClient<Database>(import.meta.env.PUBLIC_SUPABASE_URL, import.meta.env.PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        // Prefer Astro cookies when available (most common case)
        if (astroContext?.cookies) {
          const value = astroContext.cookies.get(name)?.value;
          return value;
        }

        // Fallback: manual cookie parsing (for edge cases)
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) return undefined;

        const cookies = Object.fromEntries(
          cookieHeader.split("; ").map((cookie) => {
            const [key, value] = cookie.split("=");
            return [key, decodeURIComponent(value)];
          })
        );

        return cookies[name];
      },
      set(name: string, value: string, options: CookieOptions) {
        // Use Astro's cookie API when available (preferred)
        if (astroContext?.cookies) {
          astroContext.cookies.set(name, value, options);
        }
        // Note: Manual cookie setting should be handled at the API route level
        // This function doesn't directly set response headers
      },
      remove(name: string, options: CookieOptions) {
        // Use Astro's cookie API when available (preferred)
        if (astroContext?.cookies) {
          astroContext.cookies.delete(name, options);
        }
        // Note: Manual cookie removal should be handled at the API route level
      },
    },
  });
}
