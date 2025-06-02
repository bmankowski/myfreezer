import type { APIRoute } from "astro";
import type { HealthCheckResponseDTO } from "../../types.js";

export const GET: APIRoute = async ({ locals, request }) => {
  try {
    // Initialize response with default values
    let authenticated = false;
    let user_id: string | null = null;

    // Check if Authorization header is present
    const authHeader = request.headers.get("Authorization");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        // Extract token from Bearer authorization
        const token = authHeader.replace("Bearer ", "");

        // Validate JWT token with Supabase
        const {
          data: { user },
          error,
        } = await locals.supabase.auth.getUser(token);

        if (!error && user) {
          authenticated = true;
          user_id = user.id;
        }
      } catch (tokenError) {
        // Token validation failed - log but don't error out
        console.warn("Token validation failed in health check:", tokenError);
      }
    }

    // Construct response
    const response: HealthCheckResponseDTO = {
      status: "ok",
      authenticated,
      user_id,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Log the error for monitoring
    console.error("Health check endpoint error:", error);

    // Return 500 error response
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
