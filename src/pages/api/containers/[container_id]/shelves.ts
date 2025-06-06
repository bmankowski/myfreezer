import type { APIRoute } from "astro";
import type { CreateShelfCommandDTO } from "../../../../types.js";
import { ShelfService } from "../../../../lib/services/shelf.service.js";
import { createErrorResponse, createSuccessResponse, validateAuthToken } from "../../../../lib/auth.utils.js";
import { createSupabaseServerClient } from "../../../../lib/auth/supabase-server.js";
import { isNonEmptyString, isValidLength, isValidUUID } from "../../../../lib/validation.utils.js";

// GET /api/containers/[container_id]/shelves - Get all shelves for a container
// POST /api/containers/[container_id]/shelves - Create new shelf in container
export const GET: APIRoute = async ({ params, request }) => {
  try {
    // Validate authentication
    const tokenValidation = await validateAuthToken(request);
    if (!tokenValidation.success || !tokenValidation.user_id) {
      return createErrorResponse(401, "Unauthorized");
    }

    const container_id = params.container_id;
    if (!container_id || !isValidUUID(container_id)) {
      return createErrorResponse(400, "Invalid container ID format");
    }

    // Get shelves using service
    const supabase = createSupabaseServerClient(request);
    const shelfService = new ShelfService(supabase);
    const shelves = await shelfService.getShelvesByContainer(container_id, tokenValidation.user_id);

    return createSuccessResponse(shelves);
  } catch (error) {
    console.error("Get shelves error:", error);
    return createErrorResponse(500, "Internal server error");
  }
};

export const POST: APIRoute = async ({ params, request }) => {
  try {
    // Validate authentication
    const tokenValidation = await validateAuthToken(request);
    if (!tokenValidation.success || !tokenValidation.user_id) {
      return createErrorResponse(401, "Unauthorized");
    }

    const container_id = params.container_id;
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
    const supabase = createSupabaseServerClient(request);
    const shelfService = new ShelfService(supabase);

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

    return createSuccessResponse(shelf);
  } catch (error) {
    console.error("Create shelf error:", error);

    const errorMessage = error instanceof Error ? error.message : "Shelf creation failed";

    if (errorMessage.includes("duplicate") || errorMessage.includes("unique")) {
      return createErrorResponse(409, "A shelf with this name already exists in this container");
    }

    return createErrorResponse(500, "Internal server error");
  }
};
