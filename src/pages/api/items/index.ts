import type { APIRoute } from 'astro';
import type { ItemSearchParams } from '../../../types.js';
import { ItemService } from '../../../lib/services/item.service.js';
import { validateAuthToken, createErrorResponse, createSuccessResponse } from '../../../lib/auth.utils.js';
import { isValidUUID } from '../../../lib/validation.utils.js';

// GET /api/items - Search items with filters and pagination
export const GET: APIRoute = async ({ locals, request, url }) => {
  try {
    // Validate authentication
    const authResult = await validateAuthToken(request, locals.supabase);
    if (!authResult.success) {
      return createErrorResponse(401, authResult.error || 'Unauthorized');
    }

    // Parse query parameters
    const searchParams = url.searchParams;
    const params: ItemSearchParams = {};

    // Parse search query
    const q = searchParams.get('q');
    if (q) {
      params.q = q;
    }

    // Parse container_id filter
    const containerId = searchParams.get('container_id');
    if (containerId) {
      if (!isValidUUID(containerId)) {
        return createErrorResponse(400, 'Invalid container_id format');
      }
      params.container_id = containerId;
    }

    // Parse shelf_id filter
    const shelfId = searchParams.get('shelf_id');
    if (shelfId) {
      if (!isValidUUID(shelfId)) {
        return createErrorResponse(400, 'Invalid shelf_id format');
      }
      params.shelf_id = shelfId;
    }

    // Parse pagination parameters
    const limitParam = searchParams.get('limit');
    if (limitParam) {
      const limit = parseInt(limitParam, 10);
      if (!isNaN(limit) && limit > 0) {
        params.limit = limit;
      }
    }

    const offsetParam = searchParams.get('offset');
    if (offsetParam) {
      const offset = parseInt(offsetParam, 10);
      if (!isNaN(offset) && offset >= 0) {
        params.offset = offset;
      }
    }

    // Search items using service
    const itemService = new ItemService(locals.supabase);
    const result = await itemService.searchItems(params);

    return createSuccessResponse(result);
  } catch (error) {
    console.error('Search items error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}; 