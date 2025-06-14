import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../../lib/auth/supabase-server.js";

// GET /api/auth/google - Initiate Google OAuth flow
export const GET: APIRoute = async ({ request, redirect, cookies }) => {
  try {
    // Get the current URL to determine the correct callback URL
    const url = new URL(request.url);

    // Force localhost for development environment
    const isDevelopment = import.meta.env.DEV || url.hostname === "localhost";
    const origin = isDevelopment
      ? "http://localhost:3000"
      : import.meta.env.SITE_URL || import.meta.env.PUBLIC_SITE_URL || url.origin;
    const callbackUrl = `${origin}/api/auth/callback`;

    console.log("🔗 Initiating Google OAuth with callback:", callbackUrl);
    console.log("🌐 Origin sources:", {
      isDevelopment,
      requestOrigin: url.origin,
      finalOrigin: origin,
    });

    // Create Supabase server client with Astro cookies integration
    const supabase = createSupabaseServerClient(request, { cookies });

    // Initiate OAuth flow with Google
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
        scopes: "email profile",
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    // Debug logging
    console.log("Google OAuth response:", { data, error });

    if (error) {
      console.error("Google OAuth initiation error:", error);
      // Check if it's a configuration error
      if (error.message?.includes("Provider") || error.message?.includes("disabled")) {
        return redirect("/login?error=google_oauth_not_configured");
      }
      return redirect("/login?error=oauth_init_failed");
    }

    if (!data.url) {
      console.error("No OAuth URL returned from Supabase");
      return redirect("/login?error=oauth_init_failed");
    }

    console.log("✅ Google OAuth URL generated, redirecting to Google");
    console.log("🍪 PKCE cookies should now be set via Astro cookies API");

    // Redirect to Google OAuth - cookies should be automatically included in response
    return redirect(data.url);
  } catch (error) {
    console.error("Google OAuth endpoint error:", error);
    return redirect("/login?error=oauth_init_failed");
  }
};
