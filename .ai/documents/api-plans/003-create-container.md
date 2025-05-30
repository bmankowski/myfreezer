# API Endpoint Implementation Plan: Create Container

## 1. Endpoint Overview
Creates a new freezer or fridge container for the authenticated user. Validates input data and automatically associates the container with the current user via JWT token.

## 2. Request Details
- HTTP Method: POST
- URL Pattern: `/api/containers`
- Parameters:
  - Required: None
  - Optional: None
- Request Body:
```json
{
  "name": "Kitchen Freezer",
  "type": "freezer"
}
```
- Authentication: Required (Bearer token)

## 3. Used Types
- `CreateContainerCommandDTO` (request)
- `ContainerDTO` (response)
- `CreateContainerEntity` (database)

## 4. Response Details
**Success Response (201 Created):**
```json
{
  "container_id": "uuid",
  "name": "Kitchen Freezer",
  "type": "freezer",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- **400 Bad Request**: Invalid name (empty/too long) or invalid type
- **401 Unauthorized**: Invalid or missing JWT token
- **500 Internal Server Error**: Database or server errors

## 5. Data Flow
1. Validate JWT token and extract user_id
2. Parse and validate request body against `CreateContainerCommandDTO`
3. Create `CreateContainerEntity` with user_id
4. Insert new container into database
5. Return created container as `ContainerDTO` (excluding user_id)

## 6. Security Considerations
- **JWT Validation**: Verify Bearer token with Supabase
- **User Association**: Automatically set user_id from JWT, never from request
- **Input Validation**: Sanitize name and validate type enum
- **RLS Protection**: Database RLS prevents unauthorized access

## 7. Error Handling
- **400 Bad Request**: 
  - Empty or missing name
  - Name longer than 255 characters
  - Invalid type (not 'freezer' or 'fridge')
  - Malformed JSON body
- **401 Unauthorized**: Invalid/expired JWT token
- **500 Internal Server Error**: Database connection or insert failures
- **Logging**: Log validation errors and database failures

## 8. Performance Considerations
- **Single Insert**: Simple INSERT operation with auto-generated UUID
- **Minimal Validation**: Basic field validation only
- **No Complex Logic**: Straightforward create operation
- **Response Size**: Small response payload

## 9. Implementation Steps
1. Create Astro API route file: `src/pages/api/containers/index.ts`
2. Import required types and Supabase client
3. Create POST handler function
4. Validate JWT token and extract user_id
5. Parse request body to `CreateContainerCommandDTO`
6. Validate required fields (name non-empty, valid type)
7. Create service function `ContainerService.createContainer()`
8. Construct `CreateContainerEntity` with user_id
9. Execute INSERT query with RLS protection
10. Transform result to `ContainerDTO`
11. Return 201 status with created container
12. Add comprehensive input validation and error handling
13. Test with various input scenarios 