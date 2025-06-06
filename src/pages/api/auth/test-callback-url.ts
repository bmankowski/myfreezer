import type { APIRoute } from "astro";

// GET /api/auth/test-callback-url - Test callback URL construction
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);

    // Test the same logic as in the Google OAuth endpoint
    const siteUrl = import.meta.env.SITE_URL || import.meta.env.PUBLIC_SITE_URL;
    const origin = siteUrl || url.origin;
    const callbackUrl = `${origin}/api/auth/callback`;

    return new Response(
      JSON.stringify({
        environment: {
          SITE_URL: import.meta.env.SITE_URL,
          PUBLIC_SITE_URL: import.meta.env.PUBLIC_SITE_URL,
          NODE_ENV: import.meta.env.NODE_ENV,
          PROD: import.meta.env.PROD,
        },
        urls: {
          requestUrl: request.url,
          requestOrigin: url.origin,
          siteUrl,
          finalOrigin: origin,
          callbackUrl,
        },
        message: "Callback URL construction test",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Test endpoint error:", error);
    return new Response(
      JSON.stringify({
        error: `Test failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
