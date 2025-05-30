# API Endpoint Implementation Plan: Remove Item Quantity

## 1. Endpoint Overview
Decreases an item's quantity by a specified amount or deletes the item if quantity reaches zero. This endpoint supports voice commands like "wyjąłem mleko" and handles automatic deletion when items are completely consumed.

## 2. Request Details
- HTTP Method: PATCH
- URL Pattern: `/api/items/{item_id}/remove`
- Parameters:
  - Required: `item_id` (UUID path parameter)
  - Optional: None
- Request Body:
```json
{
  "quantity": 1.000
}
```
- Authentication: Required (Bearer token)

## 3. Used Types
- `RemoveItemQuantityCommandDTO` (request)
- `RemoveItemQuantityResponseDTO` (response)

## 4. Response Details
**Success Response (200 OK):**
```json
{
  "item_id": "uuid",
  "name": "mleko",
  "quantity": 1.000,
  "action": "updated" | "deleted"
}
```

**Error Responses:**
- **400 Bad Request**: Invalid quantity or would result in negative quantity
- **401 Unauthorized**: Invalid or missing JWT token
- **404 Not Found**: Item doesn't exist or user doesn't own container
- **500 Internal Server Error**: Database or server errors

## 5. Data Flow
1. Validate JWT token and extract user_id
2. Validate item_id UUID format
3. Parse and validate request body against `RemoveItemQuantityCommandDTO`
4. Verify item exists and user owns container (via RLS hierarchy)
5. Calculate new quantity (current - requested)
6. If new quantity <= 0: Delete item completely
7. If new quantity > 0: Update item with new quantity
8. Return `RemoveItemQuantityResponseDTO` with action indicator

## 6. Security Considerations
- **JWT Validation**: Verify Bearer token with Supabase
- **RLS Protection**: Database automatically filters through container ownership hierarchy
- **Input Validation**: Validate removal quantity is positive
- **UUID Validation**: Validate item_id format
- **Quantity Logic**: Prevent negative quantities, handle complete removal

## 7. Error Handling
- **400 Bad Request**:
  - Invalid UUID format for item_id
  - Zero or negative removal quantity
  - Removal quantity exceeds current quantity
  - Malformed JSON body
- **401 Unauthorized**: Invalid/expired JWT token
- **404 Not Found**: Item not found or container not owned by user
- **500 Internal Server Error**: Database update/delete failures
- **Logging**: Log quantity removals and automatic deletions

## 8. Performance Considerations
- **Atomic Operation**: Single transaction for quantity check and update/delete
- **RLS Optimization**: Uses JOIN through shelf and container hierarchy
- **Conditional Logic**: Efficient calculation and decision logic
- **Response Indicator**: Clear action feedback for different outcomes

## 9. Implementation Steps
1. Create Astro API route file: `src/pages/api/items/[item_id]/remove.ts`
2. Import required types and Supabase client
3. Create PATCH handler function with item_id parameter
4. Validate JWT token and extract user_id
5. Validate item_id UUID format
6. Parse request body to `RemoveItemQuantityCommandDTO`
7. Create service function `ItemService.removeQuantity()`
8. Fetch current item with RLS protection
9. Calculate new quantity and determine action
10. Execute UPDATE or DELETE based on calculation
11. Return `RemoveItemQuantityResponseDTO` with appropriate action
12. Add comprehensive validation and error handling
13. Test quantity edge cases and complete removal scenarios
14. Verify voice command integration compatibility 