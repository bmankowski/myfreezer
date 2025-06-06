import type { APIRoute } from "astro";
import type { RemoveItemCommandDTO } from "../../../../types.js";
import { ItemService } from "../../../../lib/services/item.service.js";
import { createErrorResponse, createSuccessResponse, validateAuthToken } from "../../../../lib/auth.utils.js";
import { createSupabaseServerClient } from "../../../../lib/auth/supabase-server.js";

// PUT /api/items/[item_id]/remove - Remove quantity from item
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
    let body: RemoveItemCommandDTO;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse(400, "Invalid JSON body");
    }

    // Validate request body with Zod
    const validationResult = removeItemSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join(", ");
      return createErrorResponse(400, `Validation failed: ${errors}`);
    }

    const command = validationResult.data;

    // Remove item quantity using service
    const supabase = createSupabaseServerClient(request);
    const itemService = new ItemService(supabase);
    const result = await itemService.removeItem(item_id, command, tokenValidation.user_id);

    if (result === null) {
      return createErrorResponse(404, "Item not found or insufficient quantity");
    }

    if (result.deleted) {
      return createSuccessResponse({
        message: "Item deleted (quantity reached zero)",
        deleted: true,
      });
    }

    return createSuccessResponse(result);
  } catch (error) {
    console.error("Remove item error:", error);

    const errorMessage = error instanceof Error ? error.message : "Item removal failed";

    if (errorMessage.includes("not found")) {
      return createErrorResponse(404, "Item not found");
    }

    if (errorMessage.includes("insufficient")) {
      return createErrorResponse(400, "Insufficient quantity to remove");
    }

    return createErrorResponse(500, "Internal server error");
  }
};
