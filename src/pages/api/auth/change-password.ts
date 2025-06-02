import type { APIRoute } from "astro";
import { changePasswordSchema } from "../../../lib/schemas/auth.schemas.js";
import { AuthService } from "../../../lib/services/auth.service.js";
import { validateAuthToken, createErrorResponse, createSuccessResponse } from "../../../lib/auth.utils.js";

// POST /api/auth/change-password - Change password for authenticated user
export const POST: APIRoute = async ({ locals, request }) => {
  try {
    // Validate authentication
    const authResult = await validateAuthToken(request, locals.supabase);
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
    const validationResult = changePasswordSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join(", ");
      return createErrorResponse(400, `Validation failed: ${errors}`);
    }

    const command = validationResult.data;

    // Change password using service
    const authService = new AuthService(locals.supabase);

    if (!authResult.user_id) {
      return createErrorResponse(401, "User ID not found in authentication result");
    }

    const result = await authService.changePassword(command, authResult.user_id);

    return createSuccessResponse(result);
  } catch (error) {
    console.error("Change password error:", error);

    const errorMessage = error instanceof Error ? error.message : "Password change failed";

    if (errorMessage.includes("User not authenticated")) {
      return createErrorResponse(401, "User authentication required");
    }

    if (
      errorMessage.includes("different from current password") ||
      errorMessage.includes("different from the old password")
    ) {
      return createErrorResponse(400, "New password must be different from current password");
    }

    if (errorMessage.includes("password")) {
      return createErrorResponse(400, errorMessage);
    }

    return createErrorResponse(500, "Internal server error");
  }
};
