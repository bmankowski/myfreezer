import type { APIRoute } from "astro";
import type { CommandProcessDTO } from "../../../types.js";
import { CommandService } from "../../../lib/services/command.service.js";
import { validateAuthToken, createErrorResponse, createSuccessResponse } from "../../../lib/auth.utils.js";
import { isValidString } from "../../../lib/validation.utils.js";

// POST /api/command/process - Process text command with AI
export const POST: APIRoute = async ({ locals, request }) => {
  try {
    // Validate authentication
    const authResult = await validateAuthToken(request, locals.supabase);
    if (!authResult.success) {
      return createErrorResponse(401, authResult.error || "Unauthorized");
    }

    if (!authResult.user_id) {
      return createErrorResponse(401, "User ID not found");
    }

    // Parse request body
    let body: CommandProcessDTO;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse(400, "Invalid JSON body");
    }

    // Validate command
    if (!isValidString(body.command)) {
      return createErrorResponse(400, "Command is required and must be a non-empty string");
    }

    // Validate context if provided
    if (body.context?.default_container_id && !isValidString(body.context.default_container_id)) {
      return createErrorResponse(400, "Invalid default_container_id format");
    }

    // Sanitize command (basic cleanup)
    const sanitizedCommand = body.command.trim();
    if (sanitizedCommand.length === 0) {
      return createErrorResponse(400, "Command cannot be empty");
    }

    if (sanitizedCommand.length > 500) {
      return createErrorResponse(400, "Command too long (max 500 characters)");
    }

    // Process text command using service
    const commandService = new CommandService(locals.supabase);
    const result = await commandService.processCommand(
      {
        command: sanitizedCommand,
        context: body.context,
      },
      authResult.user_id
    );

    // Return appropriate status based on result
    if (!result.success && result.message.includes("clarification")) {
      return createErrorResponse(422, result.message);
    }

    return createSuccessResponse(result);
  } catch (error) {
    console.error("Text command processing error:", error);

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