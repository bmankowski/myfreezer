import type { APIRoute } from 'astro';
import { resetPasswordRequestSchema } from '../../../lib/schemas/auth.schemas.js'; // Reuse schema since it's just email
import { AuthService } from '../../../lib/services/auth.service.js';
import { createErrorResponse, createSuccessResponse } from '../../../lib/auth.utils.js';

// POST /api/auth/resend-verification - Resend email verification
export const POST: APIRoute = async ({ locals, request }) => {
  try {
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse(400, 'Invalid JSON body');
    }

    // Validate request body with Zod (reusing resetPasswordRequestSchema for email validation)
    const validationResult = resetPasswordRequestSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');
      return createErrorResponse(400, `Validation failed: ${errors}`);
    }

    const command = validationResult.data;

    // Resend verification email using service
    const authService = new AuthService(locals.supabase);
    const result = await authService.resendVerificationEmail(command);

    return createSuccessResponse(result);
  } catch (error) {
    console.error('Resend verification error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Resend verification failed';
    
    if (errorMessage.includes('invalid email')) {
      return createErrorResponse(400, 'Please provide a valid email address');
    }
    
    // Always return success for security reasons, even if email doesn't exist
    return createSuccessResponse({
      message: 'If an account with this email exists, a verification email has been sent.',
    });
  }
}; 