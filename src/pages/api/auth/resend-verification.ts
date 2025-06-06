import type { APIRoute } from "astro";
import { resetPasswordRequestSchema } from "../../../lib/schemas/auth.schemas.js";
import { AuthService } from "../../../lib/services/auth.service.js";
import { createErrorResponse, createSuccessResponse } from "../../../lib/auth.utils.js";
import { createSupabaseServerClient } from "../../../lib/auth/supabase-server.js";

// POST /api/auth/resend-verification - Resend email verification
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
    const validationResult = resetPasswordRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join(", ");
      return createErrorResponse(400, `Validation failed: ${errors}`);
    }

    const command = validationResult.data;

    // Resend verification email using service
    const supabase = createSupabaseServerClient(request);
    const authService = new AuthService(supabase);
    const result = await authService.resendVerification(command);

    return createSuccessResponse(result);
  } catch (error) {
    console.error("Resend verification error:", error);
    return createErrorResponse(500, "Internal server error");
  }
};
