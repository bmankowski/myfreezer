import type { APIRoute } from "astro";
import { AuthService } from "../../../lib/services/auth.service.js";
import { validateAuthToken, createErrorResponse, createSuccessResponse } from "../../../lib/auth.utils.js";
import { createSupabaseServerClient } from "../../../lib/auth/supabase-server.js";

// POST /api/auth/logout - Sign out user
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Validate authentication (optional - we want to clear cookies even if invalid)
    const authResult = await validateAuthToken(request);
    
    if (authResult.success) {
      // If user is authenticated, perform server-side logout
      const supabase = createSupabaseServerClient(request);
      const authService = new AuthService(supabase);
      
      try {
        await authService.logout("");
      } catch (error) {
        console.error("Server-side logout error:", error);
        // Continue with cookie clearing even if server logout fails
      }
    }

    // Clear session cookies (always do this regardless of auth status)
    cookies.delete('sb-access-token', { path: '/' });
    cookies.delete('sb-refresh-token', { path: '/' });

    return createSuccessResponse({
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);

    // Always clear cookies and return success for security
    cookies.delete('sb-access-token', { path: '/' });
    cookies.delete('sb-refresh-token', { path: '/' });
    
    return createSuccessResponse({
      message: "Logout successful",
    });
  }
};
