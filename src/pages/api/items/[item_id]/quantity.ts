import type { APIRoute } from "astro";
import type { UpdateItemQuantityCommandDTO } from "../../../../types.js";
import { ItemService } from "../../../../lib/services/item.service.js";
import { createErrorResponse, createSuccessResponse, validateAuthToken } from "../../../../lib/auth.utils.js";
import { createSupabaseServerClient } from "../../../../lib/auth/supabase-server.js";
import { z } from "zod";

// Quantity update schema
const updateQuantitySchema = z.object({
  quantity: z.number().int().min(0, "Quantity must be a non-negative integer"),
});

// PATCH /api/items/[item_id]/quantity - Update item quantity specifically
export const PATCH: APIRoute = async ({ request, params }) => {
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
    let body: { quantity: number };
    try {
      body = await request.json();
    } catch {
      return createErrorResponse(400, "Invalid JSON body");
    }

    // Validate request body with Zod
    const validationResult = updateQuantitySchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join(", ");
      return createErrorResponse(400, `Validation failed: ${errors}`);
    }

    const command: UpdateItemQuantityCommandDTO = validationResult.data;

    // Update item quantity using service
    const supabase = createSupabaseServerClient(request);
    const itemService = new ItemService(supabase);
    const result = await itemService.updateItemQuantity(item_id, command);

    if (result === null) {
      if (command.quantity === 0) {
        // Item was deleted due to zero quantity
        return createSuccessResponse({
          message: "Item deleted due to zero quantity",
          item_id,
        });
      } else {
        // Item not found
        return createErrorResponse(404, "Item not found");
      }
    }

    return createSuccessResponse({
      item: result,
      message: "Quantity updated successfully",
    });
  } catch (error) {
    console.error("Update item quantity error:", error);
    return createErrorResponse(500, "Internal server error");
  }
};
