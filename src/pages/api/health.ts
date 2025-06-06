import type { APIRoute } from "astro";
import type { HealthCheckResponseDTO } from "../../types.js";
import { validateAuthToken } from "../../lib/auth.utils.js";

export const GET: APIRoute = async ({ request }) => {
  try {
    // Initialize response with default values
    let authenticated = false;
    let user_id: string | null = null;

    // Check authentication using cookie-based validation
    try {
      const authResult = await validateAuthToken(request);
      if (authResult.success && authResult.user_id) {
        authenticated = true;
        user_id = authResult.user_id;
      }
    } catch (authError) {
      // Authentication validation failed - log but don't error out
      console.warn("Authentication validation failed in health check:", authError);
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
