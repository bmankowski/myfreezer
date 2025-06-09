import type { APIRoute } from "astro";
import { ItemService } from "../../../lib/services/item.service.js";
import { createErrorResponse, createSuccessResponse, validateAuthToken } from "../../../lib/auth.utils.js";
import { createSupabaseServerClient } from "../../../lib/auth/supabase-server.js";
import type { ItemSearchParams } from "../../../types.js";

// GET /api/items - Get all items for authenticated user with search support
export const GET: APIRoute = async ({ request }) => {
  try {
    // Validate authentication
    const tokenValidation = await validateAuthToken(request);
    if (!tokenValidation.success || !tokenValidation.user_id) {
      return createErrorResponse(401, "Unauthorized");
    }

    // Extract search parameters from URL
    const url = new URL(request.url);
    const limitParam = url.searchParams.get("limit");
    const offsetParam = url.searchParams.get("offset");

    const searchParams: ItemSearchParams = {
      q: url.searchParams.get("q") || undefined,
      container_id: url.searchParams.get("container_id") || undefined,
      shelf_id: url.searchParams.get("shelf_id") || undefined,
      limit: limitParam ? parseInt(limitParam) : undefined,
      offset: offsetParam ? parseInt(offsetParam) : undefined,
    };

    // Get items using service with search parameters
    const supabase = createSupabaseServerClient(request);
    const itemService = new ItemService(supabase);
    const items = await itemService.searchItems(searchParams);

    return createSuccessResponse(items);
  } catch (error) {
    console.error("Get items error:", error);
    return createErrorResponse(500, "Internal server error");
  }
};
