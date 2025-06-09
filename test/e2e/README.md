# E2E Test Configuration

This directory contains the E2E test configuration and helpers for testing API endpoints with real authentication.

## 📁 Structure

```
e2e/
├── config/
│   └── test-config.ts      # Centralized test configuration
├── helpers/
│   └── auth.ts             # Authentication helpers
└── api/
    └── health.spec.ts      # Health endpoint tests
```

## 🔧 Configuration

### Test Credentials

Your test credentials are centralized in `e2e/config/test-config.ts`:

```typescript
export const testUser = {
  email: 'bmankowski@gmail.com',
  password: 'Test123'
}
```

### Environment Variables (Optional)

You can override credentials using environment variables:

```bash
# .env.test (optional)
TEST_USER_EMAIL=bmankowski@gmail.com
TEST_USER_PASSWORD=Test123
BASE_URL=http://localhost:3000
```

### API Endpoints

All API endpoints are centralized for easy maintenance:

```typescript
export const api = {
  endpoints: {
    health: '/api/health',
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    containers: '/api/containers',
    // ... more endpoints
  }
}
```

## 🔐 Authentication Helpers

The `AuthHelper` class provides reusable authentication methods:

```typescript
import { createAuthHelper } from '../helpers/auth'

test('example test', async ({ request }) => {
  const auth = createAuthHelper(request)
  
  // Login with credentials from config
  await auth.login()
  
  // Verify authentication via health endpoint
  await auth.verifyAuthenticated()
  
  // Complete logout flow
  await auth.logoutAndVerify()
})
```

### Available Methods

- `auth.login()` - Login with test credentials
- `auth.logout()` - Logout current session
- `auth.verifyAuthenticated()` - Check auth via health endpoint
- `auth.verifyUnauthenticated()` - Check no auth via health endpoint
- `auth.loginAndVerify()` - Login + verify in one call
- `auth.logoutAndVerify()` - Logout + verify in one call

## 🚀 Usage Examples

### Basic API Test
```typescript
import { test, expect } from '@playwright/test'
import { api } from '../config/test-config'

test('should test endpoint', async ({ request }) => {
  const response = await request.get(api.endpoints.health)
  expect(response.status()).toBe(200)
})
```

### Authenticated API Test
```typescript
import { test, expect } from '@playwright/test'
import { api } from '../config/test-config'
import { createAuthHelper } from '../helpers/auth'

test('should test authenticated endpoint', async ({ request }) => {
  const auth = createAuthHelper(request)
  await auth.loginAndVerify()
  
  const response = await request.get(api.endpoints.containers)
  expect(response.status()).toBe(200)
})
```

## 🎯 Benefits

1. **Centralized Credentials** - One place to manage test user data
2. **Reusable Auth Logic** - DRY authentication flows
3. **Environment Flexibility** - Override via env vars
4. **Type Safety** - Full TypeScript support
5. **Easy Maintenance** - Update endpoints in one place

## 🔄 Adding New Tests

1. Create new test file in appropriate directory
2. Import configuration: `import { api, testUser } from '../config/test-config'`
3. Use auth helpers: `import { createAuthHelper } from '../helpers/auth'`
4. Add new endpoints to `test-config.ts` if needed

This structure ensures your credentials are managed centrally and your authentication flows are consistent across all tests! 