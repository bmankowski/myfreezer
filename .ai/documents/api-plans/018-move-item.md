# API Endpoint Implementation Plan: Move Item

## 1. Endpoint Overview
Moves an existing item from one shelf to another shelf. Validates that both the source and destination shelves belong to the user and handles the shelf relationship update while preserving all item data.

## 2. Request Details
- HTTP Method: PATCH
- URL Pattern: `/api/items/{item_id}/move`
- Parameters:
  - Required: `item_id` (UUID path parameter)
  - Optional: None
- Request Body:
```json
{
  "shelf_id": "new-shelf-uuid"
}
```
- Authentication: Required (Bearer token)

## 3. Used Types
- `MoveItemCommandDTO` (request)
- `ItemDTO` (response)

## 4. Response Details
**Success Response (200 OK):**
```json
{
  "item_id": "uuid",
  "shelf_id": "new-shelf-uuid",
  "name": "mleko",
  "quantity": 2.000,
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- **400 Bad Request**: Invalid shelf_id or moving to same shelf
- **401 Unauthorized**: Invalid or missing JWT token
- **404 Not Found**: Item or destination shelf doesn't exist or user doesn't own containers
- **500 Internal Server Error**: Database or server errors

## 5. Data Flow
1. Validate JWT token and extract user_id
2. Validate item_id and shelf_id UUID formats
3. Parse and validate request body against `MoveItemCommandDTO`
4. Verify item exists and user owns source container (via RLS)
5. Verify destination shelf exists and user owns destination container (via RLS)
6. Check for potential conflicts (item with same name on destination shelf)
7. Update item's shelf_id or merge quantities if conflict exists
8. Return updated item as `ItemDTO`

## 6. Security Considerations
- **JWT Validation**: Verify Bearer token with Supabase
- **RLS Protection**: Database automatically filters both source and destination through container ownership
- **UUID Validation**: Validate both item_id and shelf_id formats
- **Cross-Container Validation**: Ensure user owns both source and destination containers
- **Ownership Verification**: RLS prevents moving items between users

## 7. Error Handling
- **400 Bad Request**:
  - Invalid UUID format for item_id or shelf_id
  - Moving item to same shelf
  - Malformed JSON body
- **401 Unauthorized**: Invalid/expired JWT token
- **404 Not Found**: Item or destination shelf not found or not owned by user
- **409 Conflict**: Could implement merging logic for items with same name on destination shelf
- **500 Internal Server Error**: Database update failures
- **Logging**: Log move operations and any conflicts

## 8. Performance Considerations
- **Single Update**: Simple UPDATE operation on items table
- **RLS Optimization**: Uses JOIN through container hierarchy for both source and destination
- **Conflict Handling**: Efficient check for existing items on destination shelf
- **Transaction Safety**: Atomic operation for consistency

## 9. Implementation Steps
1. Create Astro API route file: `src/pages/api/items/[item_id]/move.ts`
2. Import required types and Supabase client
3. Create PATCH handler function with item_id parameter
4. Validate JWT token and extract user_id
5. Validate item_id and parse shelf_id from request body
6. Create service function `ItemService.moveItem()`
7. Verify item exists and user owns source container via RLS
8. Verify destination shelf exists and user owns destination container via RLS
9. Check for same shelf move (validation error)
10. Optionally check for name conflicts on destination shelf
11. Execute UPDATE query to change shelf_id
12. Return updated item as `ItemDTO`
13. Add comprehensive validation and error handling
14. Test cross-container moves and same-container moves
15. Consider implementing quantity merging for name conflicts 