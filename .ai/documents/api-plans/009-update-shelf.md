# API Endpoint Implementation Plan: Update Shelf

## 1. Endpoint Overview
Updates an existing shelf's name and/or position within its container. Validates input data, ensures the user owns the container (through shelf ownership), and handles position uniqueness constraints.

## 2. Request Details
- HTTP Method: PUT
- URL Pattern: `/api/shelves/{shelf_id}`
- Parameters:
  - Required: `shelf_id` (UUID path parameter)
  - Optional: None
- Request Body:
```json
{
  "name": "Middle Shelf",
  "position": 2
}
```
- Authentication: Required (Bearer token)

## 3. Used Types
- `UpdateShelfCommandDTO` (request)
- `ShelfDTO` (response)
- `UpdateShelfEntity` (database)

## 4. Response Details
**Success Response (200 OK):**
```json
{
  "shelf_id": "uuid",
  "container_id": "uuid",
  "name": "Middle Shelf",
  "position": 2,
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- **400 Bad Request**: Invalid name, position, or position conflict
- **401 Unauthorized**: Invalid or missing JWT token
- **404 Not Found**: Shelf doesn't exist or user doesn't own container
- **500 Internal Server Error**: Database or server errors

## 5. Data Flow
1. Validate JWT token and extract user_id
2. Validate shelf_id UUID format
3. Parse and validate request body
4. Verify shelf exists and user owns container (via RLS)
5. Check position uniqueness if position changed
6. Update shelf with new name/position
7. Return updated shelf as `ShelfDTO`

## 6. Security Considerations
- **JWT Validation**: Verify Bearer token with Supabase
- **RLS Protection**: Database automatically filters through container ownership
- **Input Validation**: Sanitize name and validate position constraints
- **UUID Validation**: Validate shelf_id format
- **Hierarchical Security**: RLS checks container ownership through JOIN

## 7. Error Handling
- **400 Bad Request**: Invalid UUID, empty name, invalid position, position conflict
- **401 Unauthorized**: Invalid/expired JWT token
- **404 Not Found**: Shelf not found or container not owned by user
- **500 Internal Server Error**: Database constraint violations
- **Logging**: Log validation errors and database failures

## 8. Performance Considerations
- **RLS Optimization**: Uses JOIN through container relationship
- **Position Uniqueness**: Database constraint enforces uniqueness
- **Single Update**: Simple UPDATE with WHERE clause
- **Index Usage**: Leverages foreign key indexes

## 9. Implementation Steps
1. Create Astro API route file: `src/pages/api/shelves/[shelf_id]/index.ts`
2. Import required types and Supabase client
3. Create PUT handler function with shelf_id parameter
4. Validate JWT token and extract user_id
5. Parse request body to `UpdateShelfCommandDTO`
6. Create service function `ShelfService.updateShelf()`
7. Execute UPDATE query with RLS protection
8. Handle position uniqueness constraints
9. Return updated shelf or appropriate errors
10. Test position conflicts and ownership verification 