import type { APIRoute } from "astro";
import { UserPreferencesService } from "../../../../lib/services/user-preferences.service.js";
import { validateAuthToken, createErrorResponse, createSuccessResponse } from "../../../../lib/auth.utils.js";

// DELETE /api/user/preferences/default-shelf - Clear default shelf
export const DELETE: APIRoute = async ({ locals, request }) => {
  try {
    // Validate authentication
    const authResult = await validateAuthToken(request, locals.supabase);
    if (!authResult.success) {
      return createErrorResponse(401, authResult.error || "Unauthorized");
    }

    // Clear default shelf using service
    const userPreferencesService = new UserPreferencesService(locals.supabase);

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
