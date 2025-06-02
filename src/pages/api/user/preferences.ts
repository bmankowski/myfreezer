import type { APIRoute } from "astro";
import type { SetDefaultShelfCommandDTO } from "../../../types.js";
import { UserPreferencesService } from "../../../lib/services/user-preferences.service.js";
import { validateAuthToken, createErrorResponse, createSuccessResponse } from "../../../lib/auth.utils.js";
import { isValidUUID } from "../../../lib/validation.utils.js";

// GET /api/user/preferences - Get user preferences
export const GET: APIRoute = async ({ locals, request }) => {
  try {
    // Validate authentication
    const authResult = await validateAuthToken(request, locals.supabase);
    if (!authResult.success) {
      return createErrorResponse(401, authResult.error || "Unauthorized");
    }

    // Get user preferences using service
    const userPreferencesService = new UserPreferencesService(locals.supabase);
    let preferences = await userPreferencesService.getUserPreferences(authResult.user_id!);

    // If no preferences exist, initialize them
    if (!preferences) {
      preferences = await userPreferencesService.initializeUserPreferences(authResult.user_id!);
    }

    return createSuccessResponse(preferences);
  } catch (error) {
    console.error("Get user preferences error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to get user preferences";
    return createErrorResponse(500, "Internal server error");
  }
};

// PUT /api/user/preferences - Update user preferences (set default shelf)
export const PUT: APIRoute = async ({ locals, request }) => {
  try {
    // Validate authentication
    const authResult = await validateAuthToken(request, locals.supabase);
    if (!authResult.success) {
      return createErrorResponse(401, authResult.error || "Unauthorized");
    }

    // Parse request body
    let body: SetDefaultShelfCommandDTO;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse(400, "Invalid JSON body");
    }

    // Validate shelf_id
    if (!body.shelf_id || !isValidUUID(body.shelf_id)) {
      return createErrorResponse(400, "Invalid shelf ID format");
    }

    // Set default shelf using service
    const userPreferencesService = new UserPreferencesService(locals.supabase);
    const result = await userPreferencesService.setDefaultShelf(authResult.user_id!, body);

    return createSuccessResponse(result);
  } catch (error) {
    console.error("Set default shelf error:", error);

    const errorMessage = error instanceof Error ? error.message : "Failed to set default shelf";

    if (errorMessage.includes("not found") || errorMessage.includes("access denied")) {
      return createErrorResponse(404, "Shelf not found or access denied");
    }

    return createErrorResponse(500, "Internal server error");
  }
};

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
    const result = await userPreferencesService.clearDefaultShelf(authResult.user_id!);

    return createSuccessResponse(result);
  } catch (error) {
    console.error("Clear default shelf error:", error);
    return createErrorResponse(500, "Internal server error");
  }
}; 