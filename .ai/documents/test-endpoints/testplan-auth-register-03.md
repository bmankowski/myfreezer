# Test Plan: Authentication - Register

## TESTNAME
User Registration - New Account Creation

## TESTREASON
Verify that new users can register successfully and receive appropriate validation errors for invalid data

## APIENDPOINT
/api/auth/register

## METHOD
POST

## INPUT-PAYLOAD
```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "confirmPassword": "securePassword123"
}
```

## NEED-AUTHORISATION
false

## EXPECTED-RESPONSE-CODE
201 (success), 400 (validation error), 409 (email already exists)

## RESPONSE-SCHEMA
Success (201):
```json
{
  "user": {
    "id": "string",
    "email": "string",
    "email_confirmed_at": "string|null"
  },
  "message": "string",
  "email_confirmation_required": boolean
}
```

Error responses:
```json
{
  "error": "string"
}
```

## NOTES
- May auto-confirm users and set cookies if email confirmation is disabled
- Test cases: valid registration, duplicate email, password mismatch, invalid email format
- Password requirements should be tested based on schema validation
- Returns 409 for existing email addresses 