import type { APIRoute } from "astro";
import { registerSchema } from "../../../lib/schemas/auth.schemas.js";
import { AuthService } from "../../../lib/services/auth.service.js";
import { createErrorResponse, createSuccessResponse } from "../../../lib/auth.utils.js";

// POST /api/auth/register - Register new user
export const POST: APIRoute = async ({ locals, request }) => {
  try {
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse(400, "Invalid JSON body");
    }

    // Validate request body with Zod
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join(", ");
      return createErrorResponse(400, `Validation failed: ${errors}`);
    }

    const command = validationResult.data;

    // Register user using service
    const authService = new AuthService(locals.supabase);
    const result = await authService.register(command);

    return createSuccessResponse(result, 201);
  } catch (error) {
    console.error("Registration error:", error);

    const errorMessage = error instanceof Error ? error.message : "Registration failed";

    // Handle specific error cases
    if (errorMessage.includes("already exists") || errorMessage.includes("already registered")) {
      return createErrorResponse(409, "An account with this email already exists");
    }

    if (errorMessage.includes("invalid email") || errorMessage.includes("Invalid email")) {
      return createErrorResponse(400, "Please provide a valid email address");
    }

    if (errorMessage.includes("password")) {
      return createErrorResponse(400, errorMessage);
    }

    return createErrorResponse(500, "Internal server error");
  }
};
