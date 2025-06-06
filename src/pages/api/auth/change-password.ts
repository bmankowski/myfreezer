import type { APIRoute } from "astro";
import { changePasswordSchema } from "../../../lib/schemas/auth.schemas.js";
import { AuthService } from "../../../lib/services/auth.service.js";
import { createErrorResponse, createSuccessResponse, validateAuthToken } from "../../../lib/auth.utils.js";
import { createSupabaseServerClient } from "../../../lib/auth/supabase-server.js";

// POST /api/auth/change-password - Change user password
export const POST: APIRoute = async ({ request }) => {
  try {
    // Validate authentication token
    const tokenValidation = await validateAuthToken(request);
    if (!tokenValidation.success || !tokenValidation.user_id) {
      return createErrorResponse(401, "Unauthorized");
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
    const supabase = createSupabaseServerClient(request);
    const authService = new AuthService(supabase);
    const result = await authService.changePassword(command, tokenValidation.user_id);

    return createSuccessResponse(result);
  } catch (error) {
    console.error("Change password error:", error);

    const errorMessage = error instanceof Error ? error.message : "Password change failed";

    if (errorMessage.includes("New password should be different")) {
      return createErrorResponse(400, "New password must be different from current password");
    }

    if (errorMessage.includes("Password should be at least")) {
      return createErrorResponse(400, "Password must be at least 6 characters long");
    }

    return createErrorResponse(500, "Internal server error");
  }
};
