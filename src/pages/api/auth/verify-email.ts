import type { APIRoute } from "astro";
import { verifyEmailSchema } from "../../../lib/schemas/auth.schemas.js";
import { AuthService } from "../../../lib/services/auth.service.js";
import { createErrorResponse, createSuccessResponse } from "../../../lib/auth.utils.js";
import { createSupabaseServerClient } from "../../../lib/auth/supabase-server.js";

// POST /api/auth/verify-email - Verify email with token
export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse(400, "Invalid JSON body");
    }

    // Validate request body with Zod
    const validationResult = verifyEmailSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join(", ");
      return createErrorResponse(400, `Validation failed: ${errors}`);
    }

    const command = validationResult.data;

    // Verify email using service
    const supabase = createSupabaseServerClient(request);
    const authService = new AuthService(supabase);
    const result = await authService.verifyEmail(command);

    return createSuccessResponse(result);
  } catch (error) {
    console.error("Email verification error:", error);

    const errorMessage = error instanceof Error ? error.message : "Email verification failed";

    if (
      errorMessage.includes("Token has expired") ||
      errorMessage.includes("invalid") ||
      errorMessage.includes("expired")
    ) {
      return createErrorResponse(400, "Verification token is invalid or expired");
    }

    return createErrorResponse(500, "Internal server error");
  }
};
