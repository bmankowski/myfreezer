import type { APIRoute } from "astro";
import type { UpdateShelfCommandDTO } from "../../../../types.js";
import { isValidUUID, isNonEmptyString, isValidLength } from "../../../../lib/validation.utils.js";
import { ShelfService } from "../../../../lib/services/shelf.service.js";
import { createErrorResponse, createSuccessResponse, validateAuthToken } from "../../../../lib/auth.utils.js";
import { createSupabaseServerClient } from "../../../../lib/auth/supabase-server.js";

// GET /api/shelves/[shelf_id] - Get shelf by ID
// PUT /api/shelves/[shelf_id] - Update shelf
// DELETE /api/shelves/[shelf_id] - Delete shelf
export const GET: APIRoute = async ({ params, request }) => {
  try {
    // Validate authentication
    const tokenValidation = await validateAuthToken(request);
    if (!tokenValidation.success || !tokenValidation.user_id) {
      return createErrorResponse(401, "Unauthorized");
    }

    const shelf_id = params.shelf_id;
    if (!shelf_id || !isValidUUID(shelf_id)) {
      return createErrorResponse(400, "Invalid shelf ID format");
    }

    // Get shelf using service
    const supabase = createSupabaseServerClient(request);
    const shelfService = new ShelfService(supabase);
    const shelf = await shelfService.getShelf(shelf_id, tokenValidation.user_id);

    if (!shelf) {
      return createErrorResponse(404, "Shelf not found");
    }

    return createSuccessResponse(shelf);
  } catch (error) {
    console.error("Get shelf error:", error);
    return createErrorResponse(500, "Internal server error");
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    // Validate authentication
    const tokenValidation = await validateAuthToken(request);
    if (!tokenValidation.success || !tokenValidation.user_id) {
      return createErrorResponse(401, "Unauthorized");
    }

    const shelf_id = params.shelf_id;
    if (!shelf_id) {
      return createErrorResponse(400, "Shelf ID is required");
    }

    // Parse request body
    let body: UpdateShelfCommandDTO;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse(400, "Invalid JSON body");
    }

    // Validate fields if provided
    if (body.name !== undefined) {
      if (!isNonEmptyString(body.name)) {
        return createErrorResponse(400, "Name must be a non-empty string");
      }
      if (!isValidLength(body.name, 255)) {
        return createErrorResponse(400, "Name cannot exceed 255 characters");
      }
    }

    if (body.position !== undefined) {
      if (typeof body.position !== "number" || body.position < 1 || !Number.isInteger(body.position)) {
        return createErrorResponse(400, "Position must be a positive integer");
      }
    }

    // Update shelf using service
    const supabase = createSupabaseServerClient(request);
    const shelfService = new ShelfService(supabase);
    
    try {
      const updatedShelf = await shelfService.updateShelf(shelf_id, {
        name: body.name?.trim(),
        position: body.position,
      });

      if (!updatedShelf) {
        return createErrorResponse(404, "Shelf not found");
      }

      return createSuccessResponse(updatedShelf);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      if (errorMessage.includes("Position already exists")) {
        return createErrorResponse(400, "Position already exists in this container");
      }

      throw error;
    }

    return createSuccessResponse(shelf);
  } catch (error) {
    console.error("Update shelf error:", error);

    const errorMessage = error instanceof Error ? error.message : "Shelf update failed";

    if (errorMessage.includes("not found")) {
      return createErrorResponse(404, "Shelf not found");
    }

    if (errorMessage.includes("duplicate") || errorMessage.includes("unique")) {
      return createErrorResponse(409, "A shelf with this name already exists in this container");
    }

    return createErrorResponse(500, "Internal server error");
  }
};

export const DELETE: APIRoute = async ({ params, request }) => {
  try {
    // Validate authentication
    const tokenValidation = await validateAuthToken(request);
    if (!tokenValidation.success || !tokenValidation.user_id) {
      return createErrorResponse(401, "Unauthorized");
    }

    const shelf_id = params.shelf_id;
    if (!shelf_id) {
      return createErrorResponse(400, "Shelf ID is required");
    }

    // Delete shelf using service
    const supabase = createSupabaseServerClient(request);
    const shelfService = new ShelfService(supabase);
    await shelfService.deleteShelf(shelf_id, tokenValidation.user_id);

    return createSuccessResponse({ message: "Shelf deleted successfully" });
  } catch (error) {
    console.error("Delete shelf error:", error);

    const errorMessage = error instanceof Error ? error.message : "Shelf deletion failed";

    if (errorMessage.includes("not found")) {
      return createErrorResponse(404, "Shelf not found");
    }

    if (errorMessage.includes("has items")) {
      return createErrorResponse(400, "Cannot delete shelf that contains items");
    }

    return createErrorResponse(500, "Internal server error");
  }
};
