import type { APIRoute } from "astro";
import type { RefreshTokenCommandDTO } from "../../../types.js";
import { AuthService } from "../../../lib/services/auth.service.js";
import { createErrorResponse, createSuccessResponse } from "../../../lib/auth.utils.js";

// POST /api/auth/refresh - Refresh access token
export const POST: APIRoute = async ({ locals, request }) => {
  try {
    // Parse request body
    let body: RefreshTokenCommandDTO;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse(400, "Invalid JSON body");
    }

    // Validate refresh token
    if (!body.refreshToken || typeof body.refreshToken !== "string") {
      return createErrorResponse(400, "Refresh token is required");
    }

    // Refresh token using service
    const authService = new AuthService(locals.supabase);
    const result = await authService.refreshToken(body);

    return createSuccessResponse(result);
  } catch (error) {
    console.error("Refresh token error:", error);
    
    const errorMessage = error instanceof Error ? error.message : "Token refresh failed";
    
    // Handle specific auth errors
    if (errorMessage.includes("Invalid") || errorMessage.includes("expired")) {
      return createErrorResponse(401, "Invalid or expired refresh token");
    }
    
    return createErrorResponse(500, "Internal server error");
  }
};
