# API Endpoint Implementation Plan: Get Container Contents

## 1. Endpoint Overview
Retrieves all items in a container organized by shelves. This endpoint supports voice queries like "what do I have in freezer?" and provides a different data structure than the container details endpoint, focused on content organization.

## 2. Request Details
- HTTP Method: GET
- URL Pattern: `/api/containers/{container_id}/contents`
- Parameters:
  - Required: `container_id` (UUID path parameter)
  - Optional: None
- Request Body: None (GET request)
- Authentication: Required (Bearer token)

## 3. Used Types
- `ContainerContentsDTO` (response)
- `ShelfWithItemsDTO` (nested in response)

## 4. Response Details
**Success Response (200 OK):**
```json
{
  "container": {
    "container_id": "uuid",
    "name": "Kitchen Freezer",
    "type": "freezer"
  },
  "shelves": [
    {
      "shelf_id": "uuid",
      "name": "Top Shelf",
      "position": 1,
      "items": [
        {
          "item_id": "uuid",
          "name": "mleko",
          "quantity": 2.000,
          "created_at": "2024-01-15T10:30:00Z"
        }
      ]
    }
  ],
  "total_items": 15
}
```

**Error Responses:**
- **401 Unauthorized**: Invalid or missing JWT token
- **404 Not Found**: Container doesn't exist or doesn't belong to user
- **500 Internal Server Error**: Database or server errors

## 5. Data Flow
1. Validate JWT token and extract user_id
2. Validate container_id UUID format
3. Query container basic info with RLS filtering
4. Query all shelves and items for the container
5. Calculate total items count
6. Transform to `ContainerContentsDTO` structure
7. Return organized content information

## 6. Security Considerations
- **JWT Validation**: Verify Bearer token with Supabase
- **RLS Protection**: Database automatically filters by user_id
- **UUID Validation**: Validate container_id format
- **Ownership Verification**: RLS ensures user can only access their containers
- **Minimal Container Info**: Only returns essential container fields

## 7. Error Handling
- **400 Bad Request**: Invalid UUID format for container_id
- **401 Unauthorized**: Invalid/expired JWT token
- **404 Not Found**: Container not found or not owned by user
- **500 Internal Server Error**: Database query failures
- **Logging**: Log access attempts and database errors

## 8. Performance Considerations
- **Optimized Queries**: Use JOIN to fetch shelves and items efficiently
- **Ordered Results**: Order shelves by position, items by creation date
- **Content-Focused**: Streamlined response for voice query use cases
- **Index Usage**: Leverages existing relationship indexes

## 9. Implementation Steps
1. Create Astro API route file: `src/pages/api/containers/[container_id]/contents.ts`
2. Import required types and Supabase client
3. Create GET handler function with container_id parameter
4. Validate JWT token and extract user_id
5. Validate container_id UUID format
6. Create service function `ContainerService.getContainerContents()`
7. Query container basic information first
8. Query shelves and items with JOIN operations
9. Transform results to `ContainerContentsDTO` structure
10. Calculate total_items across all shelves
11. Return 200 with contents or 404 if container not found
12. Add comprehensive error handling and logging
13. Test with various container configurations
14. Optimize for voice command integration 