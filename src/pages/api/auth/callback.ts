import type { APIRoute } from "astro";
import { createSupabaseServerClientWithCookies } from "../../../lib/auth/supabase-server.js";

// GET /api/auth/callback - Handle OAuth callback from Google
export const GET: APIRoute = async ({ request, redirect, cookies }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  // Handle OAuth errors
  if (error) {
    console.error("OAuth callback error:", error);
    return redirect("/login?error=oauth_failed");
  }

  if (!code) {
    console.error("No authorization code received");
    return redirect("/login?error=oauth_failed");
  }

  try {
    console.log("🔄 Processing OAuth callback with code");

    // Create Supabase client with proper cookie handling via Astro
    const supabase = createSupabaseServerClientWithCookies(request, { cookies });

    // Exchange code for session - this should work with the PKCE flow
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      console.error("Code exchange error:", exchangeError);
      console.log("Available cookies:", request.headers.get('cookie'));
      return redirect("/login?error=oauth_failed&reason=code_exchange");
    }

    if (!data.session || !data.user) {
      console.error("No session or user data returned");
      return redirect("/login?error=oauth_failed&reason=no_session");
    }

    console.log("✅ OAuth successful for user:", data.user.email);

    // Set session cookies using Astro's cookie API for better reliability
    cookies.set('sb-access-token', data.session.access_token, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/'
    });

    cookies.set('sb-refresh-token', data.session.refresh_token, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/'
    });

    console.log("🍪 Session cookies set via Astro cookies API, redirecting to index");

    return redirect("/");
  } catch (error) {
    console.error("OAuth callback processing error:", error);
    return redirect("/login?error=oauth_failed&reason=processing_error");
  }
}; 