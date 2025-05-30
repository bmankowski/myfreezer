# API Endpoint Implementation Plan: Delete Item

## 1. Endpoint Overview
Completely removes an item from a shelf regardless of quantity. This is a hard delete operation that immediately removes the item from the user's inventory without quantity considerations.

## 2. Request Details
- HTTP Method: DELETE
- URL Pattern: `/api/items/{item_id}`
- Parameters:
  - Required: `item_id` (UUID path parameter)
  - Optional: None
- Request Body: None (DELETE request)
- Authentication: Required (Bearer token)

## 3. Used Types
- `DeleteResponseDTO` (response)

## 4. Response Details
**Success Response (200 OK):**
```json
{
  "message": "Item deleted successfully"
}
```

**Error Responses:**
- **401 Unauthorized**: Invalid or missing JWT token
- **404 Not Found**: Item doesn't exist or user doesn't own container
- **500 Internal Server Error**: Database or server errors

## 5. Data Flow
1. Validate JWT token and extract user_id
2. Validate item_id UUID format
3. Verify item exists and user owns container (via RLS hierarchy)
4. Delete item completely from database
5. Return success message

## 6. Security Considerations
- **JWT Validation**: Verify Bearer token with Supabase
- **RLS Protection**: Database automatically filters through container ownership hierarchy
- **UUID Validation**: Validate item_id format
- **Ownership Verification**: RLS ensures user can only delete their items
- **Hard Delete**: Immediate permanent removal without recovery

## 7. Error Handling
- **400 Bad Request**: Invalid UUID format for item_id
- **401 Unauthorized**: Invalid/expired JWT token
- **404 Not Found**: Item not found or container not owned by user
- **500 Internal Server Error**: Database deletion failures
- **Logging**: Log deletion operations for audit trail

## 8. Performance Considerations
- **Simple DELETE**: Single database operation
- **RLS Optimization**: Uses JOIN through shelf and container hierarchy
- **Immediate Response**: No complex logic or calculations
- **Index Usage**: Leverages primary key index for fast lookup

## 9. Implementation Steps
1. Create Astro API route file: `src/pages/api/items/[item_id]/index.ts`
2. Import required types and Supabase client
3. Create DELETE handler function with item_id parameter
4. Validate JWT token and extract user_id
5. Validate item_id UUID format
6. Create service function `ItemService.deleteItem()`
7. Execute DELETE query with RLS protection
8. Check if any rows were affected (indicates item found)
9. Return success message or 404 if not found
10. Add comprehensive error handling and logging
11. Test with valid and invalid item IDs
12. Verify RLS protection through container hierarchy 