import type { APIRoute } from "astro";
import type { ProcessVoiceCommandDTO } from "../../../types.js";
import { CommandService } from "../../../lib/services/command.service.js";
import { createErrorResponse, createSuccessResponse, validateAuthToken } from "../../../lib/auth.utils.js";
import { createSupabaseServerClient } from "../../../lib/auth/supabase-server.js";
import { isValidString } from "../../../lib/validation.utils.js";

// POST /api/voice/process - Process voice command
export const POST: APIRoute = async ({ request }) => {
  try {
    // Validate authentication
    const tokenValidation = await validateAuthToken(request);
    if (!tokenValidation.success || !tokenValidation.user_id) {
      return createErrorResponse(401, "Unauthorized");
    }

    // Parse request body
    let body: ProcessVoiceCommandDTO;
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

    const command = {
      command: sanitizedCommand,
      context: body.context,
    };

    // Process voice command using service
    const supabase = createSupabaseServerClient(request);
    const commandService = new CommandService(supabase);
    const result = await commandService.processCommand(
      {
        command: command.command,
        context: command.context,
      },
      tokenValidation.user_id
    );

    return createSuccessResponse(result);
  } catch (error) {
    console.error("Process voice command error:", error);

    const errorMessage = error instanceof Error ? error.message : "Voice command processing failed";

    if (errorMessage.includes("invalid command")) {
      return createErrorResponse(400, "Invalid voice command format");
    }

    if (errorMessage.includes("not found")) {
      return createErrorResponse(404, "Requested resource not found");
    }

    return createErrorResponse(500, "Internal server error");
  }
};
