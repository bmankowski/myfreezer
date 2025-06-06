import { createServerClient } from "@supabase/ssr";
import type { Database } from "../db/database.types.js";

export function createSupabaseServerClient(request: Request, responseHeaders?: Headers) {
  // Create a headers object to collect cookies that need to be set
  const cookiesToSet = new Map<string, { value: string; options: any }>();

  return createServerClient<Database>(import.meta.env.PUBLIC_SUPABASE_URL!, import.meta.env.PUBLIC_SUPABASE_ANON_KEY!, {
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
      set(name: string, value: string, options: any) {
        console.log("🍪 Set cookie called:", name, "options:", options);

        // Store cookie info for later setting in response
        cookiesToSet.set(name, { value, options });

        // If responseHeaders is provided, set the cookie immediately
        if (responseHeaders) {
          const cookieString = serializeCookie(name, value, options);
          responseHeaders.append("Set-Cookie", cookieString);
        }
      },
      remove(name: string, options: any) {
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
function serializeCookie(name: string, value: string, options: any): string {
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

export function createSupabaseAdminClient() {
  return createServerClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL!,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get: () => undefined,
        set: () => {},
        remove: () => {},
      },
    }
  );
}
