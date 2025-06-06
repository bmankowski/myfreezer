import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../../lib/auth/supabase-server.js";
import { createErrorResponse, createSuccessResponse } from "../../../lib/auth.utils.js";

// GET /api/auth/status - Check current authentication status
export const GET: APIRoute = async ({ request }) => {
  try {
    console.log("🔍 Checking authentication status");

    const supabase = createSupabaseServerClient(request);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      console.log("❌ Auth status check error:", error.message);
      return createSuccessResponse({
        authenticated: false,
        user: null,
        error: error.message,
      });
    }

    if (!user) {
      console.log("👤 No authenticated user found");
      return createSuccessResponse({
        authenticated: false,
        user: null,
      });
    }

    // Determine authentication provider
    const authProvider = user.app_metadata?.provider || "email";
    const isGoogleAuth = authProvider === "google";
    const isEmailAuth = authProvider === "email";

    console.log(`✅ User authenticated via ${authProvider}:`, user.email);

    return createSuccessResponse({
      authenticated: true,
      user: {
        user_id: user.id,
        email: user.email,
        firstName: user.user_metadata?.firstName || user.user_metadata?.first_name,
        lastName: user.user_metadata?.lastName || user.user_metadata?.last_name,
        avatar_url: user.user_metadata?.avatar_url,
        provider: authProvider,
        email_confirmed: user.email_confirmed_at !== null,
        created_at: user.created_at,
      },
      auth_methods: {
        google: isGoogleAuth,
        email: isEmailAuth,
      },
    });
  } catch (error) {
    console.error("Auth status endpoint error:", error);
    return createErrorResponse(500, "Failed to check authentication status");
  }
};
