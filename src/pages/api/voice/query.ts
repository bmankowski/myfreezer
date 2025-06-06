import type { APIRoute } from "astro";
import type { VoiceQueryCommandDTO } from "../../../types.js";
import { CommandService } from "../../../lib/services/command.service.js";
import { createErrorResponse, createSuccessResponse, validateAuthToken } from "../../../lib/auth.utils.js";
import { createSupabaseServerClient } from "../../../lib/auth/supabase-server.js";
import { isValidString, isValidUUID } from "../../../lib/validation.utils.js";

// POST /api/voice/query - Process voice query
export const POST: APIRoute = async ({ request }) => {
  try {
    // Validate authentication
    const tokenValidation = await validateAuthToken(request);
    if (!tokenValidation.success || !tokenValidation.user_id) {
      return createErrorResponse(401, "Unauthorized");
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

    const command = {
      query: sanitizedQuery,
      context: body.context,
    };

    // Process voice query using service
    const supabase = createSupabaseServerClient(request);
    const commandService = new CommandService(supabase);
    const result = await commandService.processQuery({
      query: command.query,
      context: command.context,
    });

    return createSuccessResponse(result);
  } catch (error) {
    console.error("Process voice query error:", error);

    const errorMessage = error instanceof Error ? error.message : "Voice query processing failed";

    if (errorMessage.includes("invalid query")) {
      return createErrorResponse(400, "Invalid voice query format");
    }

    if (errorMessage.includes("not found")) {
      return createErrorResponse(404, "No matching items found");
    }

    return createErrorResponse(500, "Internal server error");
  }
};
