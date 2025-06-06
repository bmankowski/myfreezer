import type { APIRoute } from "astro";
import { updateProfileSchema } from "../../../lib/schemas/auth.schemas.js";
import { AuthService } from "../../../lib/services/auth.service.js";
import { createErrorResponse, createSuccessResponse, validateAuthToken } from "../../../lib/auth.utils.js";
import { createSupabaseServerClient } from "../../../lib/auth/supabase-server.js";

// GET /api/auth/profile - Get current user profile
export const GET: APIRoute = async ({ request }) => {
  try {
    // Validate authentication
    const authResult = await validateAuthToken(request);
    if (!authResult.success) {
      return createErrorResponse(401, authResult.error || "Unauthorized");
    }

    // Get user profile using service
    const supabase = createSupabaseServerClient(request);
    const authService = new AuthService(supabase);

    if (!authResult.user_id) {
      return createErrorResponse(401, "User ID not found in authentication result");
    }

    const userProfile = await authService.getCurrentUser(authResult.user_id);

    return createSuccessResponse(userProfile);
  } catch (error) {
    console.error("Get profile error:", error);

    const errorMessage = error instanceof Error ? error.message : "Failed to get user profile";

    if (errorMessage.includes("User not found")) {
      return createErrorResponse(404, "User profile not found");
    }

    return createErrorResponse(500, "Internal server error");
  }
};

// PUT /api/auth/profile - Update user profile
export const PUT: APIRoute = async ({ request }) => {
  try {
    // Validate authentication
    const authResult = await validateAuthToken(request);
    if (!authResult.success) {
      return createErrorResponse(401, authResult.error || "Unauthorized");
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse(400, "Invalid JSON body");
    }

    // Validate request body with Zod
    const validationResult = updateProfileSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join(", ");
      return createErrorResponse(400, `Validation failed: ${errors}`);
    }

    const command = validationResult.data;

    // Update profile using service
    const supabase = createSupabaseServerClient(request);
    const authService = new AuthService(supabase);

    if (!authResult.user_id) {
      return createErrorResponse(401, "User ID not found in authentication result");
    }

    const result = await authService.updateProfile(command, authResult.user_id);

    return createSuccessResponse(result);
  } catch (error) {
    console.error("Update profile error:", error);

    const errorMessage = error instanceof Error ? error.message : "Profile update failed";

    if (errorMessage.includes("invalid email")) {
      return createErrorResponse(400, "Please provide a valid email address");
    }

    if (errorMessage.includes("already exists") || errorMessage.includes("already registered")) {
      return createErrorResponse(409, "An account with this email already exists");
    }

    return createErrorResponse(500, "Internal server error");
  }
};
