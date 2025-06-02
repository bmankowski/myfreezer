import type { APIRoute } from "astro";
import type { CreateShelfCommandDTO } from "../../../../types.js";
import { ShelfService } from "../../../../lib/services/shelf.service.js";
import { validateAuthToken, createErrorResponse, createSuccessResponse } from "../../../../lib/auth.utils.js";
import { isValidUUID, isNonEmptyString, isValidLength } from "../../../../lib/validation.utils.js";

// POST /api/containers/{container_id}/shelves - Create new shelf
export const POST: APIRoute = async ({ locals, request, params }) => {
  try {
    // Validate authentication
    const authResult = await validateAuthToken(request, locals.supabase);
    if (!authResult.success) {
      return createErrorResponse(401, authResult.error || "Unauthorized");
    }

    // Validate container_id
    const { container_id } = params;
    if (!container_id || !isValidUUID(container_id)) {
      return createErrorResponse(400, "Invalid container ID format");
    }

    // Parse request body
    let body: CreateShelfCommandDTO;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse(400, "Invalid JSON body");
    }

    // Validate required fields
    if (!isNonEmptyString(body.name)) {
      return createErrorResponse(400, "Name is required and cannot be empty");
    }

    if (!isValidLength(body.name, 255)) {
      return createErrorResponse(400, "Name cannot exceed 255 characters");
    }

    if (typeof body.position !== "number" || body.position < 1 || !Number.isInteger(body.position)) {
      return createErrorResponse(400, "Position must be a positive integer");
    }

    // Create shelf using service
    const shelfService = new ShelfService(locals.supabase);

    try {
      const shelf = await shelfService.createShelf(container_id, {
        name: body.name.trim(),
        position: body.position,
      });

      return createSuccessResponse(shelf, 201);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      if (errorMessage.includes("Container not found")) {
        return createErrorResponse(404, "Container not found");
      }

      if (errorMessage.includes("Position already exists")) {
        return createErrorResponse(400, "Position already exists in this container");
      }

      throw error;
    }
  } catch (error) {
    console.error("Create shelf error:", error);
    return createErrorResponse(500, "Internal server error");
  }
};
