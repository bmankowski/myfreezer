# API Endpoint Implementation Plan: Search Items

## 1. Endpoint Overview
Searches and filters items across all user's containers with pagination support. Provides comprehensive location information for each item including shelf and container details. Supports text search, container/shelf filtering, and pagination.

## 2. Request Details
- HTTP Method: GET
- URL Pattern: `/api/items`
- Parameters:
  - Required: None
  - Optional: 
    - `q` (string): Search query for item names (partial matching)
    - `container_id` (uuid): Filter by specific container
    - `shelf_id` (uuid): Filter by specific shelf
    - `limit` (integer, default: 50): Maximum results to return
    - `offset` (integer, default: 0): Results to skip for pagination
- Request Body: None (GET request)
- Authentication: Required (Bearer token)

## 3. Used Types
- `ItemSearchResponseDTO` (response)
- `ItemWithLocationDTO` (item in response)
- `ItemSearchParams` (query parameters)

## 4. Response Details
**Success Response (200 OK):**
```json
{
  "items": [
    {
      "item_id": "uuid",
      "name": "mleko",
      "quantity": 2.000,
      "created_at": "2024-01-15T10:30:00Z",
      "shelf": {
        "shelf_id": "uuid",
        "name": "Top Shelf",
        "position": 1
      },
      "container": {
        "container_id": "uuid",
        "name": "Kitchen Freezer",
        "type": "freezer"
      }
    }
  ],
  "total": 25,
  "limit": 50,
  "offset": 0
}
```

**Error Responses:**
- **401 Unauthorized**: Invalid or missing JWT token
- **500 Internal Server Error**: Database or server errors

## 5. Data Flow
1. Validate JWT token and extract user_id
2. Parse query parameters to `ItemSearchParams`
3. Build dynamic SQL query with filters and text search
4. Execute query with JOIN to include shelf and container info
5. Apply RLS filtering automatically through container ownership
6. Calculate total count for pagination
7. Transform results to `ItemWithLocationDTO[]`
8. Return `ItemSearchResponseDTO` with pagination info

## 6. Security Considerations
- **JWT Validation**: Verify Bearer token with Supabase
- **RLS Protection**: Automatically filters through container ownership hierarchy
- **Input Sanitization**: Sanitize search query to prevent SQL injection
- **UUID Validation**: Validate container_id and shelf_id if provided
- **Pagination Limits**: Enforce maximum limit to prevent abuse

## 7. Error Handling
- **400 Bad Request**: Invalid UUID format for container_id/shelf_id
- **401 Unauthorized**: Invalid/expired JWT token
- **500 Internal Server Error**: Database query failures
- **Graceful Defaults**: Use default pagination values for invalid parameters
- **Logging**: Log search queries and performance metrics

## 8. Performance Considerations
- **Text Search Index**: Uses `idx_items_name` for efficient text search
- **Complex JOIN**: Optimized query with proper indexes
- **Pagination**: LIMIT/OFFSET for controlled response size
- **Search Optimization**: ILIKE for case-insensitive partial matching
- **Count Query**: Separate COUNT query for total results

## 9. Implementation Steps
1. Create Astro API route file: `src/pages/api/items/index.ts`
2. Import required types and Supabase client
3. Create GET handler function
4. Validate JWT token and extract user_id
5. Parse and validate query parameters
6. Create service function `ItemService.searchItems()`
7. Build dynamic SQL with text search and filters
8. Execute complex JOIN query with RLS protection
9. Transform results to include location information
10. Calculate pagination metadata
11. Return `ItemSearchResponseDTO`
12. Test various search scenarios and pagination
13. Optimize query performance with proper indexing 