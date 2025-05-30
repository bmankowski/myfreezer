# API Endpoint Implementation Plan: Get Container Details

## 1. Endpoint Overview
Retrieves detailed information about a specific container including all shelves and items within those shelves. Returns hierarchical data structure with container → shelves → items relationship.

## 2. Request Details
- HTTP Method: GET
- URL Pattern: `/api/containers/{container_id}`
- Parameters:
  - Required: `container_id` (UUID path parameter)
  - Optional: None
- Request Body: None (GET request)
- Authentication: Required (Bearer token)

## 3. Used Types
- `ContainerDetailsDTO` (response)
- `ShelfWithItemsDTO` (nested in response)

## 4. Response Details
**Success Response (200 OK):**
```json
{
  "container_id": "uuid",
  "name": "Kitchen Freezer", 
  "type": "freezer",
  "created_at": "2024-01-15T10:30:00Z",
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
3. Query container with RLS filtering by user_id
4. If container found, query all shelves with their items
5. Calculate total items count across all shelves
6. Transform to hierarchical `ContainerDetailsDTO` structure
7. Return detailed container information

## 6. Security Considerations
- **JWT Validation**: Verify Bearer token with Supabase
- **RLS Protection**: Database automatically filters by user_id
- **UUID Validation**: Validate container_id format to prevent injection
- **Ownership Verification**: RLS ensures user can only access their containers

## 7. Error Handling
- **400 Bad Request**: Invalid UUID format for container_id
- **401 Unauthorized**: Invalid/expired JWT token
- **404 Not Found**: Container not found or not owned by user
- **500 Internal Server Error**: Database query failures
- **Logging**: Log access attempts and database errors

## 8. Performance Considerations
- **Optimized Queries**: Use JOIN queries to fetch container, shelves, and items efficiently
- **Single Database Round Trip**: Minimize database calls with complex JOIN
- **Ordered Results**: Order shelves by position, items by creation date
- **Response Size**: Can be large with many items, consider pagination for future

## 9. Implementation Steps
1. Create Astro API route file: `src/pages/api/containers/[container_id]/index.ts`
2. Import required types and Supabase client
3. Create GET handler function with container_id parameter
4. Validate JWT token and extract user_id
5. Validate container_id UUID format
6. Create service function `ContainerService.getContainerDetails()`
7. Write complex JOIN query to fetch container, shelves, and items
8. Verify container ownership via RLS
9. Transform nested database results to `ContainerDetailsDTO`
10. Calculate total_items count
11. Return 200 with container details or 404 if not found
12. Add comprehensive error handling and logging
13. Test with containers containing various shelf/item configurations 