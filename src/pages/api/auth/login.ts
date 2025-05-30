import type { APIRoute } from 'astro';
import { loginSchema } from '../../../lib/schemas/auth.schemas.js';
import { AuthService } from '../../../lib/services/auth.service.js';
import { createErrorResponse, createSuccessResponse } from '../../../lib/auth.utils.js';

// POST /api/auth/login - Sign in user
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
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      return createErrorResponse(400, `Validation failed: ${errors}`);
    }

    const command = validationResult.data;

    // Login user using service
    const authService = new AuthService(locals.supabase);
    const result = await authService.login(command);

    return createSuccessResponse(result);
  } catch (error) {
    console.error('Login error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Login failed';
    
    // Handle specific error cases
    if (errorMessage.includes('Invalid email or password') || 
        errorMessage.includes('Invalid login credentials')) {
      return createErrorResponse(401, 'Invalid email or password');
    }
    
    if (errorMessage.includes('Email not confirmed')) {
      return createErrorResponse(403, 'Please verify your email address before signing in');
    }
    
    if (errorMessage.includes('invalid email')) {
      return createErrorResponse(400, 'Please provide a valid email address');
    }
    
    return createErrorResponse(500, 'Internal server error');
  }
}; 