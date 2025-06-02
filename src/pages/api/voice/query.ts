import type { APIRoute } from "astro";
import type { VoiceQueryCommandDTO } from "../../../types.js";
import { VoiceService } from "../../../lib/services/voice.service.js";
import { validateAuthToken, createErrorResponse, createSuccessResponse } from "../../../lib/auth.utils.js";
import { isValidString, isValidUUID } from "../../../lib/validation.utils.js";

// POST /api/voice/query - Process voice query with AI search
export const POST: APIRoute = async ({ locals, request }) => {
  try {
    // Validate authentication
    const authResult = await validateAuthToken(request, locals.supabase);
    if (!authResult.success) {
      return createErrorResponse(401, authResult.error || "Unauthorized");
    }

    // Parse request body
    let body: VoiceQueryCommandDTO;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse(400, "Invalid JSON body");
    }

    // Validate query
    if (!isValidString(body.query)) {
      return createErrorResponse(400, "Query is required and must be a non-empty string");
    }

    // Validate context containers if provided
    if (body.context?.containers) {
      if (!Array.isArray(body.context.containers)) {
        return createErrorResponse(400, "Context containers must be an array");
      }

      for (const containerId of body.context.containers) {
        if (!isValidUUID(containerId)) {
          return createErrorResponse(400, "Invalid container ID format in context");
        }
      }
    }

    // Sanitize query (basic cleanup)
    const sanitizedQuery = body.query.trim();
    if (sanitizedQuery.length === 0) {
      return createErrorResponse(400, "Query cannot be empty");
    }

    if (sanitizedQuery.length > 200) {
      return createErrorResponse(400, "Query too long (max 200 characters)");
    }

    // Process voice query using service
    const voiceService = new VoiceService(locals.supabase);
    const result = await voiceService.processQuery({
      query: sanitizedQuery,
      context: body.context,
    });

    return createSuccessResponse(result);
  } catch (error) {
    console.error("Voice query processing error:", error);

    // Handle specific error types
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    if (errorMessage.includes("AI service") || errorMessage.includes("OpenRouter")) {
      return createErrorResponse(503, "AI service temporarily unavailable");
    }

    if (errorMessage.includes("rate limit")) {
      return createErrorResponse(429, "Too many requests, please try again later");
    }

    return createErrorResponse(500, "Internal server error");
  }
};
