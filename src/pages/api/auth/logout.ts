import type { APIRoute } from 'astro';
import { AuthService } from '../../../lib/services/auth.service.js';
import { validateAuthToken, createErrorResponse, createSuccessResponse } from '../../../lib/auth.utils.js';

// POST /api/auth/logout - Sign out user
export const POST: APIRoute = async ({ locals, request }) => {
  try {
    // Validate authentication
    const authResult = await validateAuthToken(request, locals.supabase);
    if (!authResult.success) {
      return createErrorResponse(401, authResult.error || 'Unauthorized');
    }

    // Extract access token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const accessToken = authHeader?.replace('Bearer ', '') || '';

    // Logout user using service
    const authService = new AuthService(locals.supabase);
    const result = await authService.logout(accessToken);

    return createSuccessResponse(result);
  } catch (error) {
    console.error('Logout error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Logout failed';
    
    // Even if logout fails, we still consider it successful from client perspective
    return createSuccessResponse({
      message: 'Logout successful',
    });
  }
}; 