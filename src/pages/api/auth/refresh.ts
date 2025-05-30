import type { APIRoute } from 'astro';
import { refreshTokenSchema } from '../../../lib/schemas/auth.schemas.js';
import { AuthService } from '../../../lib/services/auth.service.js';
import { createErrorResponse, createSuccessResponse } from '../../../lib/auth.utils.js';

// POST /api/auth/refresh - Refresh access token
export const POST: APIRoute = async ({ locals, request }) => {
  try {
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse(400, 'Invalid JSON body');
    }

    // Validate request body with Zod
    const validationResult = refreshTokenSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      return createErrorResponse(400, `Validation failed: ${errors}`);
    }

    const command = validationResult.data;

    // Refresh token using service
    const authService = new AuthService(locals.supabase);
    const result = await authService.refreshToken(command);

    return createSuccessResponse(result);
  } catch (error) {
    console.error('Token refresh error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
    
    if (errorMessage.includes('Token has expired') || 
        errorMessage.includes('invalid') || 
        errorMessage.includes('expired')) {
      return createErrorResponse(401, 'Refresh token is invalid or expired');
    }
    
    return createErrorResponse(500, 'Internal server error');
  }
}; 