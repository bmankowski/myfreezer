import type { APIRoute } from 'astro';
import type { RemoveItemQuantityCommandDTO } from '../../../../types.js';
import { ItemService } from '../../../../lib/services/item.service.js';
import { validateAuthToken, createErrorResponse, createSuccessResponse } from '../../../../lib/auth.utils.js';
import { isValidUUID } from '../../../../lib/validation.utils.js';

// PATCH /api/items/{item_id}/remove - Remove quantity from item
export const PATCH: APIRoute = async ({ locals, request, params }) => {
  try {
    // Validate authentication
    const authResult = await validateAuthToken(request, locals.supabase);
    if (!authResult.success) {
      return createErrorResponse(401, authResult.error || 'Unauthorized');
    }

    // Validate item_id
    const { item_id } = params;
    if (!item_id || !isValidUUID(item_id)) {
      return createErrorResponse(400, 'Invalid item ID format');
    }

    // Parse request body
    let body: RemoveItemQuantityCommandDTO;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse(400, 'Invalid JSON body');
    }

    // Validate quantity
    if (typeof body.quantity !== 'number' || body.quantity <= 0) {
      return createErrorResponse(400, 'Quantity must be a positive number');
    }

    // Remove quantity using service
    const itemService = new ItemService(locals.supabase);
    const result = await itemService.removeItemQuantity(item_id, body);

    if (!result) {
      return createErrorResponse(404, 'Item not found');
    }

    return createSuccessResponse(result);
  } catch (error) {
    console.error('Remove item quantity error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}; 