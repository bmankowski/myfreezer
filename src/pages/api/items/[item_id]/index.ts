import type { APIRoute } from 'astro';
import type { UpdateItemQuantityCommandDTO } from '../../../../types.js';
import { ItemService } from '../../../../lib/services/item.service.js';
import { validateAuthToken, createErrorResponse, createSuccessResponse } from '../../../../lib/auth.utils.js';
import { isValidUUID } from '../../../../lib/validation.utils.js';

// PUT /api/items/{item_id} - Update item quantity
export const PUT: APIRoute = async ({ locals, request, params }) => {
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
    let body: UpdateItemQuantityCommandDTO;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse(400, 'Invalid JSON body');
    }

    // Validate quantity
    if (typeof body.quantity !== 'number' || body.quantity < 0) {
      return createErrorResponse(400, 'Quantity must be a non-negative number');
    }

    // Update item using service
    const itemService = new ItemService(locals.supabase);
    const result = await itemService.updateItemQuantity(item_id, body);

    if (result === null) {
      if (body.quantity === 0) {
        // Item was deleted due to zero quantity
        return createSuccessResponse({
          message: 'Item deleted due to zero quantity',
        });
      } else {
        // Item not found
        return createErrorResponse(404, 'Item not found');
      }
    }

    return createSuccessResponse(result);
  } catch (error) {
    console.error('Update item quantity error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

// DELETE /api/items/{item_id} - Delete item
export const DELETE: APIRoute = async ({ locals, request, params }) => {
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

    // Delete item using service
    const itemService = new ItemService(locals.supabase);
    const result = await itemService.deleteItem(item_id);

    if (!result) {
      return createErrorResponse(404, 'Item not found');
    }

    return createSuccessResponse(result);
  } catch (error) {
    console.error('Delete item error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}; 