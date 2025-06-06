import type { APIRoute } from "astro";
import type { AddItemCommandDTO } from "../../../../types.js";
import { ItemService } from "../../../../lib/services/item.service.js";
import { createErrorResponse, createSuccessResponse, validateAuthToken } from "../../../../lib/auth.utils.js";
import { createSupabaseServerClient } from "../../../../lib/auth/supabase-server.js";
import { isNonEmptyString, isValidLength, isValidUUID } from "../../../../lib/validation.utils.js";

// GET /api/shelves/[shelf_id]/items - Get all items for a shelf
// POST /api/shelves/[shelf_id]/items - Create new item in shelf
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

    // Get items using service
    const supabase = createSupabaseServerClient(request);
    const itemService = new ItemService(supabase);
    const items = await itemService.getItemsByShelf(shelf_id, tokenValidation.user_id);

    return createSuccessResponse(items);
  } catch (error) {
    console.error("Get items error:", error);
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

    const shelf_id = params.shelf_id;
    if (!shelf_id || !isValidUUID(shelf_id)) {
      return createErrorResponse(400, "Invalid shelf ID format");
    }

    // Parse request body
    let body: AddItemCommandDTO;
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

    if (typeof body.quantity !== "number" || body.quantity < 0) {
      return createErrorResponse(400, "Quantity must be a non-negative number");
    }

    // Add item using service
    const supabase = createSupabaseServerClient(request);
    const itemService = new ItemService(supabase);

    try {
      const result = await itemService.addItem(shelf_id, {
        name: body.name.trim(),
        quantity: body.quantity,
      });

      // Return 201 for new items, 200 for updated quantities
      const statusCode = result.action === "created" ? 201 : 200;
      return createSuccessResponse(result, statusCode);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      if (errorMessage.includes("Shelf not found")) {
        return createErrorResponse(404, "Shelf not found");
      }

      throw error;
    }

    return createSuccessResponse(item);
  } catch (error) {
    console.error("Create item error:", error);

    const errorMessage = error instanceof Error ? error.message : "Item creation failed";

    if (errorMessage.includes("Shelf not found")) {
      return createErrorResponse(404, "Shelf not found");
    }

    if (errorMessage.includes("duplicate") || errorMessage.includes("unique")) {
      return createErrorResponse(409, "An item with this name already exists in this shelf");
    }

    return createErrorResponse(500, "Internal server error");
  }
};
