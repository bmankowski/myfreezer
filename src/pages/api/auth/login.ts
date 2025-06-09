import type { APIRoute } from "astro";
import { loginSchema } from "../../../lib/schemas/auth.schemas.js";
import { AuthService } from "../../../lib/services/auth.service.js";
import { createErrorResponse } from "../../../lib/auth.utils.js";
import { createSupabaseServerClient } from "../../../lib/auth/supabase-server.js";

// POST /api/auth/login - Sign in user
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse(400, "Invalid JSON body");
    }

    // Validate request body with Zod
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join(", ");
      return createErrorResponse(400, `Validation failed: ${errors}`);
    }

    const command = validationResult.data;

    // Login user using service with server client and set cookies
    const supabase = createSupabaseServerClient(request, { cookies });
    const authService = new AuthService(supabase);
    const result = await authService.login(command);

    // Set HTTP-only cookies for session persistence
    cookies.set("sb-access-token", result.session.access_token, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour
      path: "/",
    });

    cookies.set("sb-refresh-token", result.session.refresh_token, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    // Return user data without exposing session tokens in response
    return new Response(
      JSON.stringify({
        user: result.user,
        message: "Login successful",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Login failed";

    // Handle specific error cases
    if (errorMessage.includes("Invalid email or password") || errorMessage.includes("Invalid login credentials")) {
      return createErrorResponse(401, "Invalid email or password");
    }

    if (errorMessage.includes("Email not confirmed")) {
      return createErrorResponse(403, "Please verify your email address before signing in");
    }

    if (errorMessage.includes("invalid email")) {
      return createErrorResponse(400, "Please provide a valid email address");
    }

    return createErrorResponse(500, "Internal server error");
  }
};
