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

export function createSupabaseServerClient(request: Request, responseHeaders?: Headers) {
  // Create a headers object to collect cookies that need to be set
  const cookiesToSet = new Map<string, { value: string; options: CookieOptions }>();

  if (!import.meta.env.PUBLIC_SUPABASE_URL) {
    throw new Error("PUBLIC_SUPABASE_URL is required");
  }
  if (!import.meta.env.PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("PUBLIC_SUPABASE_ANON_KEY is required");
  }

  return createServerClient<Database>(import.meta.env.PUBLIC_SUPABASE_URL, import.meta.env.PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) return undefined;

        const cookies = Object.fromEntries(
          cookieHeader.split("; ").map((cookie) => {
            const [key, value] = cookie.split("=");
            return [key, decodeURIComponent(value)];
          })
        );

        // Only log main cookies and successful chunk finds
        if (!name.includes(".") || cookies[name]) {
          console.log("🍪 Getting cookie:", name, "->", cookies[name] ? "found" : "not found");
        }
        return cookies[name];
      },
      set(name: string, value: string, options: CookieOptions) {
        console.log("🍪 Set cookie called:", name, "options:", options);

        // Store cookie info for later setting in response
        cookiesToSet.set(name, { value, options });

        // If responseHeaders is provided, set the cookie immediately
        if (responseHeaders) {
          const cookieString = serializeCookie(name, value, options);
          responseHeaders.append("Set-Cookie", cookieString);
        }
      },
      remove(name: string, options: CookieOptions) {
        console.log("🍪 Remove cookie called:", name, "options:", options);

        // Set cookie to empty with past expiration
        const removeOptions = { ...options, expires: new Date(0), maxAge: 0 };
        cookiesToSet.set(name, { value: "", options: removeOptions });

        if (responseHeaders) {
          const cookieString = serializeCookie(name, "", removeOptions);
          responseHeaders.append("Set-Cookie", cookieString);
        }
      },
    },
  });
}

// Helper function to serialize cookies
function serializeCookie(name: string, value: string, options: CookieOptions): string {
  let cookie = `${name}=${encodeURIComponent(value)}`;

  if (options.maxAge !== undefined) {
    cookie += `; Max-Age=${options.maxAge}`;
  }

  if (options.expires) {
    cookie += `; Expires=${options.expires.toUTCString()}`;
  }

  if (options.path) {
    cookie += `; Path=${options.path}`;
  }

  if (options.domain) {
    cookie += `; Domain=${options.domain}`;
  }

  if (options.secure) {
    cookie += "; Secure";
  }

  if (options.httpOnly) {
    cookie += "; HttpOnly";
  }

  if (options.sameSite) {
    cookie += `; SameSite=${options.sameSite}`;
  }

  return cookie;
}

interface AstroCookies {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, options?: CookieOptions): void;
  delete(name: string, options?: CookieOptions): void;
}

export function createSupabaseServerClientWithCookies(request: Request, astroContext?: { cookies: AstroCookies }) {
  if (!import.meta.env.PUBLIC_SUPABASE_URL) {
    throw new Error("PUBLIC_SUPABASE_URL is required");
  }
  if (!import.meta.env.PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("PUBLIC_SUPABASE_ANON_KEY is required");
  }

  return createServerClient<Database>(import.meta.env.PUBLIC_SUPABASE_URL, import.meta.env.PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        if (astroContext?.cookies) {
          const value = astroContext.cookies.get(name)?.value;
          console.log("🍪 Getting cookie via Astro:", name, "->", value ? "found" : "not found");
          return value;
        }

        // Fallback to manual parsing
        const cookieHeader = request.headers.get("cookie");
        if (!cookieHeader) return undefined;

        const cookies = Object.fromEntries(
          cookieHeader.split("; ").map((cookie) => {
            const [key, value] = cookie.split("=");
            return [key, decodeURIComponent(value)];
          })
        );

        console.log("🍪 Getting cookie manually:", name, "->", cookies[name] ? "found" : "not found");
        return cookies[name];
      },
      set(name: string, value: string, options: CookieOptions) {
        console.log("🍪 Set cookie called:", name, "options:", options);
        if (astroContext?.cookies) {
          astroContext.cookies.set(name, value, options);
        }
      },
      remove(name: string, options: CookieOptions) {
        console.log("🍪 Remove cookie called:", name, "options:", options);
        if (astroContext?.cookies) {
          astroContext.cookies.delete(name, options);
        }
      },
    },
  });
}

export function createSupabaseAdminClient() {
  if (!import.meta.env.PUBLIC_SUPABASE_URL) {
    throw new Error("PUBLIC_SUPABASE_URL is required");
  }
  if (!import.meta.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required");
  }

  return createServerClient<Database>(import.meta.env.PUBLIC_SUPABASE_URL, import.meta.env.SUPABASE_SERVICE_ROLE_KEY, {
    cookies: {
      get: () => undefined,
      set: () => {
        // No-op for admin client
      },
      remove: () => {
        // No-op for admin client
      },
    },
  });
}
