import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../db/database.types.js';

export interface AuthResult {
  success: boolean;
  user_id?: string;
  error?: string;
}

/**
 * Extract and validate JWT token from Authorization header
 */
export async function validateAuthToken(
  request: Request,
  supabase: SupabaseClient<Database>
): Promise<AuthResult> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      success: false,
      error: 'Missing or invalid Authorization header',
    };
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return {
        success: false,
        error: 'Invalid or expired token',
      };
    }

    return {
      success: true,
      user_id: user.id,
    };
  } catch (error) {
    console.error('Token validation error:', error);
    return {
      success: false,
      error: 'Token validation failed',
    };
  }
}

/**
 * Create standardized error responses
 */
export function createErrorResponse(status: number, message: string): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Create standardized success responses
 */
export function createSuccessResponse(data: any, status: number = 200): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
} 