# API Endpoint Implementation Plan: List User Containers

## 1. Endpoint Overview
Retrieves all containers (freezers/fridges) belonging to the authenticated user with computed counts of shelves and items. Uses Row Level Security to ensure users only see their own containers.

## 2. Request Details
- HTTP Method: GET
- URL Pattern: `/api/containers`
- Parameters:
  - Required: None
  - Optional: None
- Request Body: None (GET request)
- Authentication: Required (Bearer token)

## 3. Used Types
- `ContainerListResponseDTO`
- `ContainerSummaryDTO`

## 4. Response Details
**Success Response (200 OK):**
```json
{
  "containers": [
    {
      "container_id": "uuid",
      "name": "Kitchen Freezer",
      "type": "freezer",
      "created_at": "2024-01-15T10:30:00Z",
      "shelves_count": 3,
      "items_count": 15
    }
  ]
}
```

**Error Responses:**
- **401 Unauthorized**: Invalid or missing JWT token
- **500 Internal Server Error**: Database or server errors

## 5. Data Flow
1. Validate JWT token and extract user_id
2. Query containers table with RLS filtering by user_id
3. For each container, count associated shelves and items
4. Transform database results to `ContainerSummaryDTO` format
5. Return wrapped in `ContainerListResponseDTO`

## 6. Security Considerations
- **JWT Validation**: Verify Bearer token with Supabase
- **Row Level Security**: Database automatically filters by user_id
- **Data Isolation**: Users cannot access other users' containers
- **No Sensitive Data**: user_id is excluded from response

## 7. Error Handling
- **401 Unauthorized**: Invalid/expired JWT token
- **500 Internal Server Error**: Database connection issues or query failures
- **Graceful Empty Response**: Return empty array if user has no containers
- **Logging**: Log authentication failures and database errors

## 8. Performance Considerations
- **Efficient Counting**: Use JOIN with COUNT to get shelves/items counts in single query
- **Index Usage**: Query leverages RLS indexes on user_id
- **Response Size**: Minimal data in summary format
- **Caching**: No caching due to real-time requirement

## 9. Implementation Steps
1. Create Astro API route file: `src/pages/api/containers/index.ts`
2. Import required types and Supabase client
3. Create GET handler function
4. Validate JWT token and extract user_id
5. Create service function `ContainerService.getUserContainers()`
6. Write SQL query with JOIN to count shelves and items
7. Execute query with RLS automatically filtering by user_id
8. Transform results to `ContainerSummaryDTO[]`
9. Return `ContainerListResponseDTO`
10. Add comprehensive error handling
11. Test with multiple users to verify RLS isolation 