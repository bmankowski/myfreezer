import type { APIRoute } from "astro";
import { UserPreferencesService } from "../../../../lib/services/user-preferences.service.js";
import { createErrorResponse, createSuccessResponse, validateAuthToken } from "../../../../lib/auth.utils.js";
import { createSupabaseServerClient } from "../../../../lib/auth/supabase-server.js";

// DELETE /api/user/preferences/default-shelf - Clear default shelf
export const DELETE: APIRoute = async ({ request }) => {
  try {
    // Validate authentication
    const authResult = await validateAuthToken(request);
    if (!authResult.success) {
      return createErrorResponse(401, authResult.error || "Unauthorized");
    }

    // Clear default shelf using service
    const supabase = createSupabaseServerClient(request);
    const userPreferencesService = new UserPreferencesService(supabase);

    if (!authResult.user_id) {
      return createErrorResponse(401, "User ID not found in authentication result");
    }

    const result = await userPreferencesService.clearDefaultShelf(authResult.user_id);

    return createSuccessResponse(result);
  } catch (error) {
    console.error("Clear default shelf error:", error);
    return createErrorResponse(500, "Internal server error");
  }
};
