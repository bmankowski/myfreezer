import type { APIRoute } from "astro";
import { ItemService } from "../../../../lib/services/item.service.js";
import { createErrorResponse, createSuccessResponse, validateAuthToken } from "../../../../lib/auth.utils.js";
import { createSupabaseServerClient } from "../../../../lib/auth/supabase-server.js";

// DELETE /api/items/[item_id]/remove - Delete item completely
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

    // Delete item using service (no request body needed for DELETE)
    const supabase = createSupabaseServerClient(request);
    const itemService = new ItemService(supabase);
    const result = await itemService.deleteItem(item_id);

    if (result === null) {
      return createErrorResponse(404, "Item not found");
    }

    return createSuccessResponse(result);
  } catch (error) {
    console.error("Delete item error:", error);

    const errorMessage = error instanceof Error ? error.message : "Item deletion failed";

    if (errorMessage.includes("not found")) {
      return createErrorResponse(404, "Item not found");
    }

    return createErrorResponse(500, "Internal server error");
  }
};
