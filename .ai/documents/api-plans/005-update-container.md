# API Endpoint Implementation Plan: Update Container

## 1. Endpoint Overview
Updates an existing container's name and/or type. Validates input data and ensures the user owns the container before updating. Only allows updating name and type fields.

## 2. Request Details
- HTTP Method: PUT
- URL Pattern: `/api/containers/{container_id}`
- Parameters:
  - Required: `container_id` (UUID path parameter)
  - Optional: None
- Request Body:
```json
{
  "name": "Main Freezer",
  "type": "freezer"
}
```
- Authentication: Required (Bearer token)

## 3. Used Types
- `UpdateContainerCommandDTO` (request)
- `ContainerDTO` (response)
- `UpdateContainerEntity` (database)

## 4. Response Details
**Success Response (200 OK):**
```json
{
  "container_id": "uuid",
  "name": "Main Freezer",
  "type": "freezer",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- **400 Bad Request**: Invalid name (empty/too long) or invalid type
- **401 Unauthorized**: Invalid or missing JWT token
- **404 Not Found**: Container doesn't exist or doesn't belong to user
- **500 Internal Server Error**: Database or server errors

## 5. Data Flow
1. Validate JWT token and extract user_id
2. Validate container_id UUID format
3. Parse and validate request body against `UpdateContainerCommandDTO`
4. Verify container exists and belongs to user
5. Update container with new name/type
6. Return updated container as `ContainerDTO`

## 6. Security Considerations
- **JWT Validation**: Verify Bearer token with Supabase
- **RLS Protection**: Database automatically filters by user_id
- **Ownership Verification**: RLS prevents updating other users' containers
- **Input Validation**: Sanitize name and validate type enum
- **UUID Validation**: Validate container_id format

## 7. Error Handling
- **400 Bad Request**:
  - Invalid UUID format for container_id
  - Empty or missing name
  - Name longer than 255 characters
  - Invalid type (not 'freezer' or 'fridge')
  - Malformed JSON body
- **401 Unauthorized**: Invalid/expired JWT token
- **404 Not Found**: Container not found or not owned by user
- **500 Internal Server Error**: Database update failures
- **Logging**: Log validation errors and database failures

## 8. Performance Considerations
- **Single Update**: Simple UPDATE operation with WHERE clause
- **RLS Optimization**: Uses existing indexes for user_id filtering
- **Minimal Data Transfer**: Small request and response payloads
- **Atomic Operation**: Single database transaction

## 9. Implementation Steps
1. Create Astro API route file: `src/pages/api/containers/[container_id]/index.ts`
2. Import required types and Supabase client
3. Create PUT handler function with container_id parameter
4. Validate JWT token and extract user_id
5. Validate container_id UUID format
6. Parse request body to `UpdateContainerCommandDTO`
7. Validate required fields (name non-empty, valid type)
8. Create service function `ContainerService.updateContainer()`
9. Execute UPDATE query with RLS protection
10. Check if any rows were affected (indicates container found)
11. Fetch and return updated container as `ContainerDTO`
12. Return 404 if no rows affected
13. Add comprehensive input validation and error handling
14. Test update operations with valid and invalid data 