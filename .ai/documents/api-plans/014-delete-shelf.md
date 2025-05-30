# API Endpoint Implementation Plan: Delete Shelf

## 1. Endpoint Overview
Deletes an empty shelf from a container. The shelf must be empty (no items) before deletion. Uses CASCADE deletion to automatically remove related data and maintains position integrity within the container.

## 2. Request Details
- HTTP Method: DELETE
- URL Pattern: `/api/shelves/{shelf_id}`
- Parameters:
  - Required: `shelf_id` (UUID path parameter)
  - Optional: None
- Request Body: None (DELETE request)
- Authentication: Required (Bearer token)

## 3. Used Types
- `DeleteResponseDTO` (response)

## 4. Response Details
**Success Response (200 OK):**
```json
{
  "message": "Shelf deleted successfully"
}
```

**Error Responses:**
- **400 Bad Request**: Shelf not empty (contains items)
- **401 Unauthorized**: Invalid or missing JWT token
- **404 Not Found**: Shelf doesn't exist or user doesn't own container
- **500 Internal Server Error**: Database or server errors

## 5. Data Flow
1. Validate JWT token and extract user_id
2. Validate shelf_id UUID format
3. Verify shelf exists and user owns container (via RLS)
4. Check if shelf is empty (no items)
5. Delete shelf (CASCADE will handle any remaining relations)
6. Return success message

## 6. Security Considerations
- **JWT Validation**: Verify Bearer token with Supabase
- **RLS Protection**: Database automatically filters through container ownership
- **UUID Validation**: Validate shelf_id format
- **Business Logic**: Enforce empty shelf rule
- **Hierarchical Security**: RLS checks container ownership through JOIN

## 7. Error Handling
- **400 Bad Request**:
  - Invalid UUID format for shelf_id
  - Shelf not empty (contains items)
- **401 Unauthorized**: Invalid/expired JWT token
- **404 Not Found**: Shelf not found or container not owned by user
- **500 Internal Server Error**: Database deletion failures
- **Logging**: Log deletion attempts and failures

## 8. Performance Considerations
- **Emptiness Check**: Query to count items before deletion
- **CASCADE Deletion**: Database handles related data cleanup
- **Single Transaction**: Atomic operation for consistency
- **RLS Optimization**: Uses JOIN through container relationship

## 9. Implementation Steps
1. Create Astro API route file: `src/pages/api/shelves/[shelf_id]/index.ts`
2. Import required types and Supabase client
3. Create DELETE handler function with shelf_id parameter
4. Validate JWT token and extract user_id
5. Validate shelf_id UUID format
6. Create service function `ShelfService.deleteShelf()`
7. Verify shelf exists and user owns container via RLS
8. Count items in shelf to verify it's empty
9. Return 400 error if shelf contains items
10. Execute DELETE query with RLS protection
11. Check if any rows were affected
12. Return success message or 404 if not found
13. Add comprehensive validation and error handling
14. Test with empty and non-empty shelves 