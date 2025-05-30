# API Endpoint Implementation Plan: Update Item Quantity

## 1. Endpoint Overview
Sets a specific quantity for an existing item. Allows direct quantity updates as opposed to adding/removing quantities. Validates that the quantity is non-negative and handles automatic deletion if quantity becomes zero.

## 2. Request Details
- HTTP Method: PUT
- URL Pattern: `/api/items/{item_id}`
- Parameters:
  - Required: `item_id` (UUID path parameter)
  - Optional: None
- Request Body:
```json
{
  "quantity": 5.000
}
```
- Authentication: Required (Bearer token)

## 3. Used Types
- `UpdateItemQuantityCommandDTO` (request)
- `ItemDTO` (response)

## 4. Response Details
**Success Response (200 OK):**
```json
{
  "item_id": "uuid",
  "shelf_id": "uuid",
  "name": "mleko",
  "quantity": 5.000,
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- **400 Bad Request**: Negative quantity or invalid data
- **401 Unauthorized**: Invalid or missing JWT token
- **404 Not Found**: Item doesn't exist or user doesn't own container
- **500 Internal Server Error**: Database or server errors

## 5. Data Flow
1. Validate JWT token and extract user_id
2. Validate item_id UUID format
3. Parse and validate request body against `UpdateItemQuantityCommandDTO`
4. Verify item exists and user owns container (via RLS hierarchy)
5. If quantity is 0: Delete item
6. If quantity > 0: Update item quantity
7. Return updated item as `ItemDTO` or handle deletion

## 6. Security Considerations
- **JWT Validation**: Verify Bearer token with Supabase
- **RLS Protection**: Database automatically filters through container ownership hierarchy
- **Input Validation**: Validate quantity is non-negative decimal
- **UUID Validation**: Validate item_id format
- **Business Logic**: Handle zero quantity deletion automatically

## 7. Error Handling
- **400 Bad Request**:
  - Invalid UUID format for item_id
  - Negative quantity value
  - Invalid decimal format
  - Malformed JSON body
- **401 Unauthorized**: Invalid/expired JWT token
- **404 Not Found**: Item not found or container not owned by user
- **500 Internal Server Error**: Database update/delete failures
- **Logging**: Log quantity updates and deletions

## 8. Performance Considerations
- **Single Operation**: Simple UPDATE or DELETE query
- **RLS Optimization**: Uses JOIN through shelf and container hierarchy
- **Decimal Precision**: Handles DECIMAL(10,3) with proper precision
- **Conditional Logic**: Efficient IF/THEN logic for zero handling

## 9. Implementation Steps
1. Create Astro API route file: `src/pages/api/items/[item_id]/index.ts`
2. Import required types and Supabase client
3. Create PUT handler function with item_id parameter
4. Validate JWT token and extract user_id
5. Validate item_id UUID format
6. Parse request body to `UpdateItemQuantityCommandDTO`
7. Create service function `ItemService.updateQuantity()`
8. Verify item exists and user owns container via RLS
9. If quantity is 0: Execute DELETE query
10. If quantity > 0: Execute UPDATE query
11. Return updated item or handle deletion response
12. Add comprehensive validation and error handling
13. Test with various quantity values including zero
14. Verify RLS protection through container hierarchy 