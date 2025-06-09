# Test Plan: Authentication - Login

## TESTNAME
User Login - Authentication

## TESTREASON
Verify that users can authenticate successfully with valid credentials and receive appropriate error responses for invalid attempts

## APIENDPOINT
/api/auth/login

## METHOD
POST

## INPUT-PAYLOAD
```json
{
  "email": "user@example.com",
  "password": "validPassword123"
}
```

## NEED-AUTHORISATION
false

## EXPECTED-RESPONSE-CODE
200 (success), 400 (validation error), 401 (invalid credentials), 403 (email not confirmed)

## RESPONSE-SCHEMA
Success (200):
```json
{
  "user": {
    "id": "string",
    "email": "string",
    "email_confirmed_at": "string|null"
  },
  "message": "Login successful"
}
```

Error responses:
```json
{
  "error": "string"
}
```

## NOTES
- Sets HTTP-only cookies for session management (sb-access-token, sb-refresh-token)
- Test cases: valid credentials, invalid credentials, unverified email, invalid JSON format
- Access token expires in 1 hour, refresh token in 1 week
- Handles specific error messages for different failure scenarios 