import type { APIRoute } from "astro";
import type { MoveItemCommandDTO } from "../../../../types.js";
import { ItemService } from "../../../../lib/services/item.service.js";
import { validateAuthToken, createErrorResponse, createSuccessResponse } from "../../../../lib/auth.utils.js";
import { isValidUUID } from "../../../../lib/validation.utils.js";

// PATCH /api/items/{item_id}/move - Move item to different shelf
export const PATCH: APIRoute = async ({ locals, request, params }) => {
  try {
    // Validate authentication
    const authResult = await validateAuthToken(request, locals.supabase);
    if (!authResult.success) {
      return createErrorResponse(401, authResult.error || "Unauthorized");
    }

    // Validate item_id
    const { item_id } = params;
    if (!item_id || !isValidUUID(item_id)) {
      return createErrorResponse(400, "Invalid item ID format");
    }

    // Parse request body
    let body: MoveItemCommandDTO;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse(400, "Invalid JSON body");
    }

    // Validate shelf_id
    if (!body.shelf_id || !isValidUUID(body.shelf_id)) {
      return createErrorResponse(400, "Invalid shelf ID format");
    }

    // Move item using service
    const itemService = new ItemService(locals.supabase);

    try {
      const result = await itemService.moveItem(item_id, body);

      if (!result) {
        return createErrorResponse(404, "Item not found");
      }

      return createSuccessResponse(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      if (errorMessage.includes("already on this shelf")) {
        return createErrorResponse(400, "Item is already on this shelf");
      }

      if (errorMessage.includes("Destination shelf not found")) {
        return createErrorResponse(404, "Destination shelf not found");
      }

      throw error;
    }
  } catch (error) {
    console.error("Move item error:", error);
    return createErrorResponse(500, "Internal server error");
  }
};
