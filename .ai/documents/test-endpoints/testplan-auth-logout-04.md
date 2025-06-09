# Test Plan: Authentication - Logout

## TESTNAME
User Logout - Session Termination

## TESTREASON
Verify that users can logout successfully and their session cookies are properly cleared

## APIENDPOINT
/api/auth/logout

## METHOD
POST

## INPUT-PAYLOAD
None required

## NEED-AUTHORISATION
true - requires valid session cookies

## EXPECTED-RESPONSE-CODE
200 (success), 401 (unauthorized)

## RESPONSE-SCHEMA
Success (200):
```json
{
  "message": "Logout successful"
}
```

Error responses:
```json
{
  "error": "string"
}
```

## NOTES
- Should clear HTTP-only session cookies (sb-access-token, sb-refresh-token)
- Test both authenticated and unauthenticated logout attempts
- Should revoke session on Supabase backend
- Cookies should be set with expired dates to clear them from browser 