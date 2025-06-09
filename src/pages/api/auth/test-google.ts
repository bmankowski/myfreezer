import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../../lib/auth/supabase-server.js";
import { createErrorResponse, createSuccessResponse } from "../../../lib/auth.utils.js";

// GET /api/auth/test-google - Test Google OAuth configuration
export const GET: APIRoute = async ({ request }) => {
  try {
    console.log("🧪 Testing Google OAuth configuration");

    // Create Supabase server client
    const supabase = createSupabaseServerClient(request);

    // Check environment variables
    const hasGoogleClientId = !!import.meta.env.GOOGLE_CLIENT_ID;
    const hasGoogleClientSecret = !!import.meta.env.GOOGLE_CLIENT_SECRET;
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;

    console.log("Environment check:", {
      hasGoogleClientId,
      hasGoogleClientSecret,
      supabaseUrl: supabaseUrl?.substring(0, 30) + "...",
    });

    // Try to initiate OAuth to see what error we get
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${new URL(request.url).origin}/api/auth/callback`,
      },
    });

    return createSuccessResponse({
      environment: {
        hasGoogleClientId,
        hasGoogleClientSecret,
        supabaseUrl: supabaseUrl?.substring(0, 30) + "...",
      },
      oauthTest: {
        success: !error,
        error: error?.message || null,
        hasUrl: !!data?.url,
        url: data?.url?.substring(0, 50) + "..." || null,
      },
    });
  } catch (error) {
    console.error("Test endpoint error:", error);
    return createErrorResponse(500, `Test failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
};
