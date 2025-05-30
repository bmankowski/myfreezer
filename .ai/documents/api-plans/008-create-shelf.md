# API Endpoint Implementation Plan: Create Shelf

## 1. Endpoint Overview
Creates a new shelf within a specified container. Validates that the container exists and belongs to the user, ensures position uniqueness within the container, and handles the hierarchical relationship between containers and shelves.

## 2. Request Details
- HTTP Method: POST
- URL Pattern: `/api/containers/{container_id}/shelves`
- Parameters:
  - Required: `container_id` (UUID path parameter)
  - Optional: None
- Request Body:
```json
{
  "name": "Top Shelf",
  "position": 1
}
```
- Authentication: Required (Bearer token)

## 3. Used Types
- `CreateShelfCommandDTO` (request)
- `ShelfDTO` (response)
- `CreateShelfEntity` (database)

## 4. Response Details
**Success Response (201 Created):**
```json
{
  "shelf_id": "uuid",
  "container_id": "uuid",
  "name": "Top Shelf",
  "position": 1,
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Error Responses:**
- **400 Bad Request**: Invalid data (empty name, invalid position, position conflict)
- **401 Unauthorized**: Invalid or missing JWT token
- **404 Not Found**: Container doesn't exist or doesn't belong to user
- **500 Internal Server Error**: Database or server errors

## 5. Data Flow
1. Validate JWT token and extract user_id
2. Validate container_id UUID format
3. Parse and validate request body against `CreateShelfCommandDTO`
4. Verify container exists and belongs to user (via RLS)
5. Check position uniqueness within container
6. Create new shelf with container association
7. Return created shelf as `ShelfDTO`

## 6. Security Considerations
- **JWT Validation**: Verify Bearer token with Supabase
- **Container Ownership**: RLS ensures user owns the container
- **Input Validation**: Sanitize name and validate position constraints
- **UUID Validation**: Validate container_id format
- **Hierarchical Security**: Shelf inherits container's access control

## 7. Error Handling
- **400 Bad Request**:
  - Invalid UUID format for container_id
  - Empty or missing name
  - Name longer than 255 characters
  - Invalid position (zero or negative)
  - Position already exists in container
  - Malformed JSON body
- **401 Unauthorized**: Invalid/expired JWT token
- **404 Not Found**: Container not found or not owned by user
- **500 Internal Server Error**: Database constraint violations or insert failures
- **Logging**: Log validation errors and database failures

## 8. Performance Considerations
- **Position Uniqueness**: Database constraint enforces uniqueness efficiently
- **Single Insert**: Simple INSERT with foreign key relationship
- **Index Usage**: Uses container_id foreign key index
- **Minimal Validation**: Basic field validation only

## 9. Implementation Steps
1. Create Astro API route file: `src/pages/api/containers/[container_id]/shelves.ts`
2. Import required types and Supabase client
3. Create POST handler function with container_id parameter
4. Validate JWT token and extract user_id
5. Validate container_id UUID format
6. Parse request body to `CreateShelfCommandDTO`
7. Validate required fields (name non-empty, position positive)
8. Create service function `ShelfService.createShelf()`
9. Verify container exists and belongs to user
10. Construct `CreateShelfEntity` with container_id
11. Execute INSERT query with position uniqueness constraint
12. Handle unique constraint violations with meaningful errors
13. Return 201 with created shelf
14. Add comprehensive validation and error handling
15. Test position uniqueness and container ownership 