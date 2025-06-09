# Test Plan: Containers - List User Containers

## TESTNAME
Container List - Get User Containers

## TESTREASON
Verify that authenticated users can retrieve their containers list

## APIENDPOINT
/api/containers

## METHOD
GET

## INPUT-PAYLOAD
None required

## NEED-AUTHORISATION
true - requires valid authentication token

## EXPECTED-RESPONSE-CODE
200 (success), 401 (unauthorized)

## RESPONSE-SCHEMA
Success (200):
```json
{
  "containers": [
    {
      "id": "string",
      "name": "string",
      "type": "freezer|fridge",
      "created_at": "string",
      "user_id": "string"
    }
  ]
}
```

Error responses:
```json
{
  "error": "string"
}
```

## NOTES
- Only returns containers belonging to the authenticated user
- Empty array if user has no containers
- Test with valid authentication and without authentication
- Should handle database connection issues gracefully 