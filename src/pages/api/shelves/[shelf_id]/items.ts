import type { APIRoute } from 'astro';
import type { AddItemCommandDTO } from '../../../../types.js';
import { ItemService } from '../../../../lib/services/item.service.js';
import { validateAuthToken, createErrorResponse, createSuccessResponse } from '../../../../lib/auth.utils.js';
import { isValidUUID, isNonEmptyString, isValidLength } from '../../../../lib/validation.utils.js';

// POST /api/shelves/{shelf_id}/items - Add item to shelf
export const POST: APIRoute = async ({ locals, request, params }) => {
  try {
    // Validate authentication
    const authResult = await validateAuthToken(request, locals.supabase);
    if (!authResult.success) {
      return createErrorResponse(401, authResult.error || 'Unauthorized');
    }

    // Validate shelf_id
    const { shelf_id } = params;
    if (!shelf_id || !isValidUUID(shelf_id)) {
      return createErrorResponse(400, 'Invalid shelf ID format');
    }

    // Parse request body
    let body: AddItemCommandDTO;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse(400, 'Invalid JSON body');
    }

    // Validate required fields
    if (!isNonEmptyString(body.name)) {
      return createErrorResponse(400, 'Name is required and cannot be empty');
    }

    if (!isValidLength(body.name, 255)) {
      return createErrorResponse(400, 'Name cannot exceed 255 characters');
    }

    if (typeof body.quantity !== 'number' || body.quantity < 0) {
      return createErrorResponse(400, 'Quantity must be a non-negative number');
    }

    // Add item using service
    const itemService = new ItemService(locals.supabase);
    
    try {
      const result = await itemService.addItem(shelf_id, {
        name: body.name.trim(),
        quantity: body.quantity,
      });

      // Return 201 for new items, 200 for updated quantities
      const statusCode = result.action === 'created' ? 201 : 200;
      return createSuccessResponse(result, statusCode);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('Shelf not found')) {
        return createErrorResponse(404, 'Shelf not found');
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Add item error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}; 