import type { APIRoute } from "astro";
import type { MoveItemCommandDTO } from "../../../../types.js";
import { ItemService } from "../../../../lib/services/item.service.js";
import { createErrorResponse, createSuccessResponse, validateAuthToken } from "../../../../lib/auth.utils.js";
import { createSupabaseServerClient } from "../../../../lib/auth/supabase-server.js";

// PUT /api/items/[item_id]/move - Move item to different shelf
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
    let body: MoveItemCommandDTO;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse(400, "Invalid JSON body");
    }

    // Validate request body with Zod
    const validationResult = moveItemSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join(", ");
      return createErrorResponse(400, `Validation failed: ${errors}`);
    }

    const command = validationResult.data;

    // Move item using service
    const supabase = createSupabaseServerClient(request);
    const itemService = new ItemService(supabase);
    const result = await itemService.moveItem(item_id, command, tokenValidation.user_id);

    if (!result) {
      return createErrorResponse(404, "Item not found");
    }

    return createSuccessResponse(result);
  } catch (error) {
    console.error("Move item error:", error);

    const errorMessage = error instanceof Error ? error.message : "Item move failed";

    if (errorMessage.includes("not found")) {
      return createErrorResponse(404, "Item or target shelf not found");
    }

    if (errorMessage.includes("same shelf")) {
      return createErrorResponse(400, "Item is already in the target shelf");
    }

    if (errorMessage.includes("duplicate") || errorMessage.includes("unique")) {
      return createErrorResponse(409, "An item with this name already exists in the target shelf");
    }

    return createErrorResponse(500, "Internal server error");
  }
};
