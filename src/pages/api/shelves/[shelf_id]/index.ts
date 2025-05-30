import type { APIRoute } from 'astro';
import type { UpdateShelfCommandDTO } from '../../../../types.js';
import { ShelfService } from '../../../../lib/services/shelf.service.js';
import { validateAuthToken, createErrorResponse, createSuccessResponse } from '../../../../lib/auth.utils.js';
import { isValidUUID, isNonEmptyString, isValidLength } from '../../../../lib/validation.utils.js';

// PUT /api/shelves/{shelf_id} - Update shelf
export const PUT: APIRoute = async ({ locals, request, params }) => {
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
    let body: UpdateShelfCommandDTO;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse(400, 'Invalid JSON body');
    }

    // Validate fields if provided
    if (body.name !== undefined) {
      if (!isNonEmptyString(body.name)) {
        return createErrorResponse(400, 'Name must be a non-empty string');
      }
      if (!isValidLength(body.name, 255)) {
        return createErrorResponse(400, 'Name cannot exceed 255 characters');
      }
    }

    if (body.position !== undefined) {
      if (typeof body.position !== 'number' || body.position < 1 || !Number.isInteger(body.position)) {
        return createErrorResponse(400, 'Position must be a positive integer');
      }
    }

    // Update shelf using service
    const shelfService = new ShelfService(locals.supabase);
    
    try {
      const updatedShelf = await shelfService.updateShelf(shelf_id, {
        name: body.name?.trim(),
        position: body.position,
      });

      if (!updatedShelf) {
        return createErrorResponse(404, 'Shelf not found');
      }

      return createSuccessResponse(updatedShelf);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('Position already exists')) {
        return createErrorResponse(400, 'Position already exists in this container');
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Update shelf error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
};

// DELETE /api/shelves/{shelf_id} - Delete shelf
export const DELETE: APIRoute = async ({ locals, request, params }) => {
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

    // Delete shelf using service
    const shelfService = new ShelfService(locals.supabase);
    
    try {
      const result = await shelfService.deleteShelf(shelf_id);
      
      if (!result) {
        return createErrorResponse(404, 'Shelf not found');
      }

      return createSuccessResponse(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('must be empty')) {
        return createErrorResponse(400, 'Shelf must be empty before deletion');
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Delete shelf error:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}; 