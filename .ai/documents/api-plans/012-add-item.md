# API Endpoint Implementation Plan: Add Item

## 1. Endpoint Overview
Adds a new item to a shelf or increases quantity if the item already exists on that shelf. Implements automatic quantity aggregation business logic and AI normalization of item names to Polish singular forms.

## 2. Request Details
- HTTP Method: POST
- URL Pattern: `/api/shelves/{shelf_id}/items`
- Parameters:
  - Required: `shelf_id` (UUID path parameter)
  - Optional: None
- Request Body:
```json
{
  "name": "mleko",
  "quantity": 2.000
}
```
- Authentication: Required (Bearer token)

## 3. Used Types
- `AddItemCommandDTO` (request)
- `ItemActionResponseDTO` (response)
- `CreateItemEntity` (database)

## 4. Response Details
**Success Response (201 Created for new item, 200 OK for quantity update):**
```json
{
  "item_id": "uuid",
  "shelf_id": "uuid",
  "name": "mleko",
  "quantity": 3.000,
  "created_at": "2024-01-15T10:30:00Z",
  "action": "created" | "updated"
}
```

**Error Responses:**
- **400 Bad Request**: Invalid name, negative quantity, or validation errors
- **401 Unauthorized**: Invalid or missing JWT token
- **404 Not Found**: Shelf doesn't exist or user doesn't own container
- **500 Internal Server Error**: Database or server errors

## 5. Data Flow
1. Validate JWT token and extract user_id
2. Validate shelf_id UUID format
3. Parse and validate request body against `AddItemCommandDTO`
4. Verify shelf exists and user owns container (via RLS)
5. Normalize item name using AI to Polish singular form
6. Check if item already exists on shelf
7. If exists: Update quantity (existing + new)
8. If not exists: Create new item
9. Return `ItemActionResponseDTO` with action indicator

## 6. Security Considerations
- **JWT Validation**: Verify Bearer token with Supabase
- **RLS Protection**: Database automatically filters through container ownership hierarchy
- **Input Validation**: Sanitize name and validate quantity constraints
- **UUID Validation**: Validate shelf_id format
- **AI Normalization**: Secure integration with AI service for name normalization

## 7. Error Handling
- **400 Bad Request**:
  - Invalid UUID format for shelf_id
  - Empty or missing name
  - Name longer than 255 characters
  - Negative quantity
  - Malformed JSON body
- **401 Unauthorized**: Invalid/expired JWT token
- **404 Not Found**: Shelf not found or container not owned by user
- **500 Internal Server Error**: Database failures, AI service errors
- **Logging**: Log item operations and AI normalization results

## 8. Performance Considerations
- **Upsert Logic**: Use database UPSERT or conditional logic for efficiency
- **AI Normalization**: Cache common normalizations to reduce AI calls
- **Single Transaction**: Atomic operation for consistency
- **Index Usage**: Leverages shelf_id foreign key index and name search index

## 9. Implementation Steps
1. Create Astro API route file: `src/pages/api/shelves/[shelf_id]/items.ts`
2. Import required types and clients (Supabase, AI service)
3. Create POST handler function with shelf_id parameter
4. Validate JWT token and extract user_id
5. Validate shelf_id UUID format
6. Parse request body to `AddItemCommandDTO`
7. Create service function `ItemService.addItem()`
8. Verify shelf exists and belongs to user via RLS
9. Normalize item name using AI service
10. Check for existing item on shelf
11. Execute INSERT or UPDATE based on existence
12. Return appropriate status code (201 or 200) with action
13. Add comprehensive validation and error handling
14. Test quantity aggregation and name normalization
15. Implement AI service caching for performance 