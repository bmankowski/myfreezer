# API Endpoint Implementation Plan: Delete Container

## 1. Endpoint Overview
Deletes an empty container (freezer/fridge) belonging to the authenticated user. The container must be empty (no shelves or items) before deletion. Uses CASCADE deletion to automatically remove related data.

## 2. Request Details
- HTTP Method: DELETE
- URL Pattern: `/api/containers/{container_id}`
- Parameters:
  - Required: `container_id` (UUID path parameter)
  - Optional: None
- Request Body: None (DELETE request)
- Authentication: Required (Bearer token)

## 3. Used Types
- `DeleteResponseDTO` (response)

## 4. Response Details
**Success Response (200 OK):**
```json
{
  "message": "Container deleted successfully"
}
```

**Error Responses:**
- **400 Bad Request**: Container not empty (contains shelves/items)
- **401 Unauthorized**: Invalid or missing JWT token
- **404 Not Found**: Container doesn't exist or doesn't belong to user
- **500 Internal Server Error**: Database or server errors

## 5. Data Flow
1. Validate JWT token and extract user_id
2. Validate container_id UUID format
3. Verify container exists and belongs to user
4. Check if container is empty (no shelves/items)
5. Delete container (CASCADE will handle any remaining relations)
6. Return success message

## 6. Security Considerations
- **JWT Validation**: Verify Bearer token with Supabase
- **RLS Protection**: Database automatically filters by user_id
- **Ownership Verification**: RLS prevents deleting other users' containers
- **UUID Validation**: Validate container_id format
- **Business Logic**: Enforce empty container rule

## 7. Error Handling
- **400 Bad Request**:
  - Invalid UUID format for container_id
  - Container not empty (contains shelves or items)
- **401 Unauthorized**: Invalid/expired JWT token
- **404 Not Found**: Container not found or not owned by user
- **500 Internal Server Error**: Database deletion failures
- **Logging**: Log deletion attempts and failures

## 8. Performance Considerations
- **Emptiness Check**: Query to count shelves before deletion
- **CASCADE Deletion**: Database handles related data cleanup
- **Single Transaction**: Atomic operation for consistency
- **Index Usage**: Leverages RLS indexes for user_id filtering

## 9. Implementation Steps
1. Create Astro API route file: `src/pages/api/containers/[container_id]/index.ts`
2. Import required types and Supabase client
3. Create DELETE handler function with container_id parameter
4. Validate JWT token and extract user_id
5. Validate container_id UUID format
6. Create service function `ContainerService.deleteContainer()`
7. Check if container exists and belongs to user
8. Count shelves in container to verify it's empty
9. Return 400 error if container contains shelves
10. Execute DELETE query with RLS protection
11. Check if any rows were affected (indicates container found)
12. Return success message or 404 if not found
13. Add comprehensive validation and error handling
14. Test with empty and non-empty containers 