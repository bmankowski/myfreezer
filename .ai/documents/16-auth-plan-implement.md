# Authentication Implementation Analysis - What Needs to Change

## Executive Summary

After analyzing the current authentication implementation and the proposed plan in `15-auth-plan.md`, there are **critical incompatibilities** between the current Bearer token-based approach and Supabase Row Level Security (RLS) policies. The current implementation will **fail to work** with the existing RLS policies because it uses manual JWT validation instead of Supabase's server-side session management.

**Implementation Goals:**
1. **Consistent Authentication**: Migrate all authentication to HTTP-only cookies
2. **Account Linking**: Support both email/password AND Google OAuth with automatic account linking
3. **RLS Compatibility**: Fix authentication to work with existing RLS policies
4. **Preserve Logic**: Keep existing AuthService business logic, only change session management

## Current Implementation Issues

### 1. **RLS Policy Incompatibility (CRITICAL)**

**Current Approach:**
```typescript
// Current auth.utils.ts - lines 11-48
export async function validateAuthToken(request: Request, supabase: SupabaseClient<Database>): Promise<AuthResult> {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);
  // Returns user_id but RLS policies don't work
}
```

**Problem:**
- Manual Bearer token validation doesn't establish proper Supabase session context
- RLS policies use `auth.uid()` which requires server-side session cookies
- Current approach bypasses Supabase's session management entirely

**Impact:**
- ALL container operations will fail with RLS violations
- Users won't be able to create, read, update, or delete their data
- Database queries will return empty results even for owned data

### 2. **Authentication Architecture Mismatch**

**Current Implementation:**
- Client-side token management
- Manual JWT validation in API routes
- No server-side session persistence
- Bearer tokens passed in Authorization headers

**Required by RLS:**
- Server-side session cookies
- Supabase's `createServerClient` with cookie handling
- Automatic session management with `auth.uid()`

### 3. **Missing OAuth Implementation**

**Current State:**
- ✅ Email/password authentication via `AuthService` (KEEP)
- ❌ No Google OAuth endpoints exist (ADD)
- ❌ No OAuth callback handling (ADD)
- ❌ No server-side Supabase client implementation (ADD for RLS compatibility)

**Files Missing:**
- `src/lib/auth/supabase-server.ts`
- `src/pages/api/auth/google.ts`
- `src/pages/api/auth/callback.ts`

**Files to Preserve:**
- `src/lib/services/auth.service.ts` (existing email/password logic)
- `src/pages/api/auth/login.ts` (email/password endpoint)
- `src/pages/api/auth/register.ts` (email/password registration)

## Detailed Change Analysis

### 1. **Core Authentication Infrastructure Changes**

#### A. Create Server-Side Supabase Client
**Status:** Missing entirely
**Priority:** CRITICAL
**Impact:** Enables RLS compatibility

```typescript
// NEW FILE: src/lib/auth/supabase-server.ts
import { createServerClient } from '@supabase/ssr'

export function createSupabaseServerClient(request: Request) {
  return createServerClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL!,
    import.meta.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          // Parse cookies from request headers
        },
        set() {},
        remove() {}
      }
    }
  );
}
```

#### B. Migrate to Cookie-Based Authentication
**Status:** Complete migration to cookies for RLS compatibility
**Priority:** CRITICAL
**Files:** `src/lib/auth.utils.ts`

**Current Signature:**
```typescript
validateAuthToken(request: Request, supabase: SupabaseClient<Database>): Promise<AuthResult>
```

**New Signature:**
```typescript
validateAuthToken(request: Request): Promise<AuthResult>
```

**Changes:**
- Remove `supabase` parameter (create internally via `createSupabaseServerClient`)
- **MIGRATE**: All authentication to cookie-based sessions
- **REMOVE**: Bearer token support (replace with cookies)
- **FIX**: Establish proper session context for RLS compatibility

**Unified Authentication:**
- All authentication methods use HTTP-only cookies
- Automatic account linking for same email addresses

### 2. **API Route Updates**

#### A. Container APIs (BREAKING CHANGES)
**Files Affected:**
- `src/pages/api/containers/index.ts`
- `src/pages/api/containers/[container_id]/index.ts`
- `src/pages/api/containers/[container_id]/contents.ts`
- `src/pages/api/containers/[container_id]/shelves.ts`

**Current Call Pattern:**
```typescript
const authResult = await validateAuthToken(request, locals.supabase);
```

**New Call Pattern:**
```typescript
const authResult = await validateAuthToken(request);
```

**Impact:** All 25+ API endpoints need this change

#### B. Service Layer Changes
**Files Affected:**
- `src/lib/services/container.service.ts`
- `src/lib/services/shelf.service.ts`
- `src/lib/services/item.service.ts`

**Change:** Replace `locals.supabase` with `createSupabaseServerClient(request)`

### 3. **OAuth Implementation (Additive)**

#### A. Google OAuth Endpoints
**Status:** New addition (does not replace existing auth)
**Priority:** HIGH for production use

**New Files Required:**
```
src/pages/api/auth/google.ts      # OAuth initiation
src/pages/api/auth/callback.ts    # OAuth callback handler
src/pages/api/auth/status.ts      # Check auth status for both methods
```

**Existing Files Preserved:**
```
src/pages/api/auth/login.ts       # Email/password login (KEEP)
src/pages/api/auth/register.ts    # Email/password registration (KEEP)
src/pages/api/auth/logout.ts      # Logout (UPDATE for dual auth)
```

#### B. Cookie Management
**Implementation:** Use Astro's `cookies` API to set HTTP-only cookies
**Security:** `httpOnly: true`, `secure: true` in production
**Scope:** All authentication methods (email/password + Google OAuth)

#### C. Account Linking Strategy
**Same Email Linking:** Automatic linking when Google OAuth email matches existing account
**Implementation:** Check for existing user by email during OAuth callback
**Local Development:** Google OAuth only available in remote Supabase (not local)

### 4. **Middleware Updates**

#### A. Current Middleware
**File:** `src/middleware/index.ts` (9 lines)
**Current Function:** Only injects `supabaseClient` into `locals`

#### B. Required Changes
**New Function:** Add authentication checks for protected routes
**Implementation:**
```typescript
export const onRequest = defineMiddleware(async ({ request, redirect }, next) => {
  const url = new URL(request.url);
  
  // Check if this is a protected route
  const protectedRoutes = ['/dashboard'];
  const isProtectedRoute = protectedRoutes.some(route => 
    url.pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    const supabase = createSupabaseServerClient(request);
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return redirect('/login?error=unauthorized');
    }
  }

  return next();
});
```

### 5. **Environment Variables**

#### A. Current Variables (from examples)
```bash
SUPABASE_URL=http://localhost:54321
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

#### B. Additional Required Variables
```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # For admin operations
```

### 6. **Dependencies**

#### A. Current Dependencies
- `@supabase/ssr`: ✅ Already installed (0.6.1)
- `@supabase/supabase-js`: ✅ Already installed (2.49.8)

#### B. No Additional Dependencies Required
The plan incorrectly suggests `npm install @supabase/ssr` - it's already installed.

## Critical Migration Path

### Phase 1: RLS Compatibility Fix (PRIORITY 1)
1. **Create `src/lib/auth/supabase-server.ts`** - Server-side Supabase client
2. **Update `src/lib/auth.utils.ts`** - Change to cookie-based validation
3. **Update `src/lib/services/auth.service.ts`** - Set cookies after login/register
4. **Update all API routes** - Remove `locals.supabase` parameter from auth calls
5. **Update logout endpoint** - Clear session cookies
6. **Test RLS functionality** - Verify `auth.uid()` works in database queries

### Phase 2: OAuth Implementation (PRIORITY 2)
1. **Create `src/pages/api/auth/google.ts`** - OAuth initiation
2. **Create `src/pages/api/auth/callback.ts`** - OAuth callback with account linking
3. **Create `src/pages/api/auth/status.ts`** - Check authentication status
4. **Update middleware** for route protection
5. **Configure Google OAuth in remote Supabase** (skip local setup)

### Phase 3: Client-Side Integration
1. **Update frontend hooks** to use cookies instead of tokens
2. **Remove token storage** from client-side code
3. **Add Google OAuth button** to login components
4. **Update login/logout flow** for cookie-based sessions

## Risk Assessment

### HIGH RISK
- **Data Access Failure:** Current implementation will completely fail with RLS
- **Security Vulnerabilities:** Manual JWT validation bypasses Supabase security
- **User Experience:** Users unable to access their data

### MEDIUM RISK
- **Breaking Changes:** All API clients need updates
- **Development Workflow:** Local development setup changes required

### LOW RISK
- **Dependencies:** All required packages already installed
- **Database Schema:** No changes required

## Recommended Implementation Order

1. **IMMEDIATE:** Implement Phase 1 (Core Infrastructure)
2. **HIGH PRIORITY:** Implement Phase 2 (OAuth)
3. **MEDIUM PRIORITY:** Phase 3 (Service Layer)
4. **LOW PRIORITY:** Phase 4 (Client Updates)

## Testing Strategy

### Critical Tests
1. **RLS Verification:** Ensure `auth.uid()` works in database queries
2. **Session Persistence:** Verify cookies maintain authentication
3. **Cross-User Isolation:** Confirm users can't access others' data

### OAuth Tests
1. **Google OAuth Flow:** Complete authentication cycle
2. **Error Handling:** Invalid codes, expired tokens
3. **Redirect Handling:** Proper redirects after authentication

## Conclusion

The current authentication implementation is **fundamentally incompatible** with the existing RLS policies. However, by taking a **minimal change approach**, we can preserve the existing email/password authentication system while adding Google OAuth and fixing RLS compatibility.

**Key Principles:**
1. **Preserve existing functionality** - email/password auth continues to work
2. **Add new capabilities** - Google OAuth as additional login method
3. **Fix critical issues** - RLS compatibility for all authentication methods
4. **Maintain backward compatibility** - existing API clients continue to work

The implementation focuses on **unified cookie-based authentication** for both email/password and Google OAuth, ensuring RLS compatibility while enabling automatic account linking.

## Implementation Details

### Phase 1: Cookie-Based Authentication Migration

#### 1. Server-Side Supabase Client
```typescript
// src/lib/auth/supabase-server.ts
import { createServerClient } from '@supabase/ssr'
import type { Database } from '../db/database.types.js'

export function createSupabaseServerClient(request: Request) {
  return createServerClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL!,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          const cookieHeader = request.headers.get('cookie');
          if (!cookieHeader) return undefined;
          
          const cookies = Object.fromEntries(
            cookieHeader.split('; ').map(cookie => {
              const [key, value] = cookie.split('=');
              return [key, decodeURIComponent(value)];
            })
          );
          
          return cookies[name];
        },
        set() {}, // Will be handled in response
        remove() {} // Will be handled in response
      }
    }
  );
}
```

#### 2. Updated AuthService (Cookie Session Management)
```typescript
// Update src/lib/services/auth.service.ts
async login(command: LoginCommandDTO): Promise<LoginResponseDTO> {
  const { data, error } = await this.supabase.auth.signInWithPassword({
    email: command.email,
    password: command.password,
  });

  if (error || !data.session) {
    throw new Error(this.mapAuthError(error.message));
  }

  // Return session data for cookie setting (in API route)
  return {
    user: {
      user_id: data.user.id,
      email: data.user.email as string,
      firstName: data.user.user_metadata?.firstName,
      lastName: data.user.user_metadata?.lastName,
    },
    session: data.session, // Include session for cookies
  };
}
```

#### 3. Updated Login API (Set Cookies)
```typescript
// Update src/pages/api/auth/login.ts
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const supabase = createSupabaseServerClient(request);
    const authService = new AuthService(supabase);
    const result = await authService.login(command);

    // Set HTTP-only cookies
    cookies.set('sb-access-token', result.session.access_token, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour
      path: '/'
    });

    cookies.set('sb-refresh-token', result.session.refresh_token, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/'
    });

    return createSuccessResponse({
      user: result.user,
      message: "Login successful"
    });
  } catch (error) {
    // ... error handling
  }
};
```

### Phase 2: Google OAuth with Account Linking

#### 1. OAuth Callback with Account Linking
```typescript
// src/pages/api/auth/callback.ts
export const GET: APIRoute = async ({ url, redirect, cookies }) => {
  const supabase = createSupabaseServerClient(new Request(url));
  const code = url.searchParams.get('code');

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.session) {
      return redirect('/login?error=oauth_failed');
    }

    // Set cookies (same as email/password login)
    cookies.set('sb-access-token', data.session.access_token, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 60 * 60,
      path: '/'
    });

    cookies.set('sb-refresh-token', data.session.refresh_token, {
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    return redirect('/dashboard');
  } catch (error) {
    return redirect('/login?error=oauth_failed');
  }
};
```

### Environment Setup
- **Local Development**: Only email/password authentication (Google OAuth disabled)
- **Remote Development/Production**: Both email/password and Google OAuth enabled
- **Supabase Configuration**: Google OAuth configured only in remote Supabase dashboard 