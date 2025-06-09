# Test Plan: Health Check Endpoint

## TESTNAME
Health Check - System Status Verification

## TESTREASON
Verify that the health check endpoint returns system status and correctly identifies authentication state

## APIENDPOINT
/api/health

## METHOD
GET

## INPUT-PAYLOAD
None required

## NEED-AUTHORISATION
false - optional (endpoint works without authentication but provides different response when authenticated)

## EXPECTED-RESPONSE-CODE
200

## RESPONSE-SCHEMA
```json
{
  "status": "ok",
  "authenticated": boolean,
  "user_id": string|null
}
```

## NOTES
- Endpoint should return 200 even when not authenticated
- When authenticated, user_id should be present
- When not authenticated, user_id should be null
- Should handle authentication errors gracefully without failing
- Test both authenticated and unauthenticated scenarios 