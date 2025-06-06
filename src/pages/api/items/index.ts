import type { APIRoute } from "astro";
import type { ItemSearchParams } from "../../../types.js";
import { ItemService } from "../../../lib/services/item.service.js";
import { createErrorResponse, createSuccessResponse, validateAuthToken } from "../../../lib/auth.utils.js";
import { createSupabaseServerClient } from "../../../lib/auth/supabase-server.js";

// GET /api/items - Get all items for authenticated user
export const GET: APIRoute = async ({ request }) => {
  try {
    // Validate authentication
    const tokenValidation = await validateAuthToken(request);
    if (!tokenValidation.success || !tokenValidation.user_id) {
      return createErrorResponse(401, "Unauthorized");
    }

    // Get items using service
    const supabase = createSupabaseServerClient(request);
    const itemService = new ItemService(supabase);
    const items = await itemService.searchItems({});

    return createSuccessResponse(items);
  } catch (error) {
    console.error("Get items error:", error);
    return createErrorResponse(500, "Internal server error");
  }
};


