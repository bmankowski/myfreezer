import type { APIRoute } from "astro";
import type { UpdateItemQuantityCommandDTO } from "../../../../types.js";
import { ItemService } from "../../../../lib/services/item.service.js";
import { createErrorResponse, createSuccessResponse, validateAuthToken } from "../../../../lib/auth.utils.js";
import { createSupabaseServerClient } from "../../../../lib/auth/supabase-server.js";

// PUT /api/items/[item_id] - Update item quantity
export const PUT: APIRoute = async ({ request, params }) => {
  try {
    // Validate authentication
    const tokenValidation = await validateAuthToken(request);
    if (!tokenValidation.success || !tokenValidation.user_id) {
      return createErrorResponse(401, "Unauthorized");
    }

    const item_id = params.item_id;
    if (!item_id) {
      return createErrorResponse(400, "Item ID is required");
    }

    // Parse request body
    let body: UpdateItemQuantityCommandDTO;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse(400, "Invalid JSON body");
    }

    // Validate request body with Zod
    const validationResult = updateItemQuantitySchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join(", ");
      return createErrorResponse(400, `Validation failed: ${errors}`);
    }

    const command = validationResult.data;

    // Update item using service
    const supabase = createSupabaseServerClient(request);
    const itemService = new ItemService(supabase);
    const result = await itemService.updateItemQuantity(item_id, command, tokenValidation.user_id);

    if (result === null) {
      if (command.quantity === 0) {
        // Item was deleted due to zero quantity
        return createSuccessResponse({
          message: "Item deleted due to zero quantity",
        });
      } else {
        // Item not found
        return createErrorResponse(404, "Item not found");
      }
    }

    return createSuccessResponse(result);
  } catch (error) {
    console.error("Update item quantity error:", error);
    return createErrorResponse(500, "Internal server error");
  }
};

// DELETE /api/items/[item_id] - Delete item
export const DELETE: APIRoute = async ({ request, params }) => {
  try {
    // Validate authentication
    const tokenValidation = await validateAuthToken(request);
    if (!tokenValidation.success || !tokenValidation.user_id) {
      return createErrorResponse(401, "Unauthorized");
    }

    const item_id = params.item_id;
    if (!item_id) {
      return createErrorResponse(400, "Item ID is required");
    }

    // Delete item using service
    const supabase = createSupabaseServerClient(request);
    const itemService = new ItemService(supabase);
    const result = await itemService.deleteItem(item_id, tokenValidation.user_id);

    if (!result) {
      return createErrorResponse(404, "Item not found");
    }

    return createSuccessResponse(result);
  } catch (error) {
    console.error("Delete item error:", error);
    return createErrorResponse(500, "Internal server error");
  }
};
