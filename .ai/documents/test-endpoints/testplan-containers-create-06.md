# Test Plan: Containers - Create New Container

## TESTNAME
Container Creation - Add New Container

## TESTREASON
Verify that authenticated users can create new containers with valid data and receive validation errors for invalid inputs

## APIENDPOINT
/api/containers

## METHOD
POST

## INPUT-PAYLOAD
```json
{
  "name": "My Freezer",
  "type": "freezer"
}
```

## NEED-AUTHORISATION
true - requires valid authentication token

## EXPECTED-RESPONSE-CODE
201 (success), 400 (validation error), 401 (unauthorized)

## RESPONSE-SCHEMA
Success (201):
```json
{
  "id": "string",
  "name": "string",
  "type": "freezer|fridge",
  "created_at": "string",
  "user_id": "string"
}
```

Error responses:
```json
{
  "error": "string"
}
```

## NOTES
- Name is required and cannot be empty
- Name cannot exceed 255 characters
- Type defaults to "freezer" if not provided
- Type must be either "freezer" or "fridge"
- Test cases: valid creation, empty name, invalid type, overly long name, missing authentication 