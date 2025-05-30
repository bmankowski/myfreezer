# REST API Plan - MyFreezer Application

## 1. Resources

### Core Resources
- **Containers** → `containers` table (freezers and fridges)
- **Shelves** → `shelves` table (organizational levels within containers)  
- **Items** → `items` table (food products stored on shelves)
- **Voice Commands** → Virtual resource for AI-powered voice processing
- **Search** → Virtual resource for product discovery

## 2. Endpoints

### 2.1 Authentication Endpoints

#### Health Check
- **Method**: GET
- **Path**: `/api/health`
- **Description**: Verify API availability and authentication status
- **Authentication**: None required
- **Response**: 
```json
{
  "status": "ok",
  "authenticated": boolean,
  "user_id": "uuid" | null
}
```
- **Success Codes**: 200 OK
- **Error Codes**: 500 Internal Server Error

### 2.2 Container Endpoints

#### List User's Containers
- **Method**: GET
- **Path**: `/api/containers`
- **Description**: Retrieve all containers belonging to authenticated user
- **Authentication**: Required (Bearer token)
- **Query Parameters**: None
- **Response**:
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
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized, 500 Internal Server Error

#### Create Container
- **Method**: POST
- **Path**: `/api/containers`
- **Description**: Create a new freezer or fridge
- **Authentication**: Required
- **Request Body**:
```json
{
  "name": "Kitchen Freezer",
  "type": "freezer"
}
```
- **Response**:
```json
{
  "container_id": "uuid",
  "name": "Kitchen Freezer",
  "type": "freezer",
  "created_at": "2024-01-15T10:30:00Z"
}
```
- **Success Codes**: 201 Created
- **Error Codes**: 400 Bad Request (invalid name/type), 401 Unauthorized, 500 Internal Server Error

#### Get Container Details
- **Method**: GET
- **Path**: `/api/containers/{container_id}`
- **Description**: Retrieve detailed information about specific container including shelves and all products on them
- **Authentication**: Required
- **Response**:
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
        },
        {
          "item_id": "uuid",
          "name": "ser",
          "quantity": 1.000,
          "created_at": "2024-01-15T10:30:00Z"
        }
      ]
    }
  ],
  "total_items": 15
}
```
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized, 404 Not Found, 500 Internal Server Error

#### Update Container
- **Method**: PUT
- **Path**: `/api/containers/{container_id}`
- **Description**: Update container name or type
- **Authentication**: Required
- **Request Body**:
```json
{
  "name": "Main Freezer",
  "type": "freezer"
}
```
- **Response**:
```json
{
  "container_id": "uuid",
  "name": "Main Freezer",
  "type": "freezer",
  "created_at": "2024-01-15T10:30:00Z"
}
```
- **Success Codes**: 200 OK
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Internal Server Error

#### Delete Container
- **Method**: DELETE
- **Path**: `/api/containers/{container_id}`
- **Description**: Delete empty container (must contain no items)
- **Authentication**: Required
- **Response**: 
```json
{
  "message": "Container deleted successfully"
}
```
- **Success Codes**: 200 OK
- **Error Codes**: 400 Bad Request (container not empty), 401 Unauthorized, 404 Not Found, 500 Internal Server Error

#### Get Container Contents
- **Method**: GET
- **Path**: `/api/containers/{container_id}/contents`
- **Description**: Retrieve all items in container organized by shelves (supports voice query "what do I have in freezer?")
- **Authentication**: Required
- **Response**:
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
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized, 404 Not Found, 500 Internal Server Error

### 2.3 Shelf Endpoints

#### Create Shelf
- **Method**: POST
- **Path**: `/api/containers/{container_id}/shelves`
- **Description**: Create a new shelf in specified container
- **Authentication**: Required
- **Request Body**:
```json
{
  "name": "Top Shelf",
  "position": 1
}
```
- **Response**:
```json
{
  "shelf_id": "uuid",
  "container_id": "uuid",
  "name": "Top Shelf",
  "position": 1,
  "created_at": "2024-01-15T10:30:00Z"
}
```
- **Success Codes**: 201 Created
- **Error Codes**: 400 Bad Request (position already exists, invalid data), 401 Unauthorized, 404 Not Found (container), 500 Internal Server Error

#### Update Shelf
- **Method**: PUT
- **Path**: `/api/shelves/{shelf_id}`
- **Description**: Update shelf name or position
- **Authentication**: Required
- **Request Body**:
```json
{
  "name": "Middle Shelf",
  "position": 2
}
```
- **Response**:
```json
{
  "shelf_id": "uuid",
  "container_id": "uuid",
  "name": "Middle Shelf",
  "position": 2,
  "created_at": "2024-01-15T10:30:00Z"
}
```
- **Success Codes**: 200 OK
- **Error Codes**: 400 Bad Request (position conflict), 401 Unauthorized, 404 Not Found, 500 Internal Server Error

#### Delete Shelf
- **Method**: DELETE
- **Path**: `/api/shelves/{shelf_id}`
- **Description**: Delete empty shelf (must contain no items)
- **Authentication**: Required
- **Response**:
```json
{
  "message": "Shelf deleted successfully"
}
```
- **Success Codes**: 200 OK
- **Error Codes**: 400 Bad Request (shelf not empty), 401 Unauthorized, 404 Not Found, 500 Internal Server Error

### 2.4 Item Endpoints

#### List Items with Search
- **Method**: GET
- **Path**: `/api/items`
- **Description**: Search and filter items across all user's containers
- **Authentication**: Required
- **Query Parameters**:
  - `q` (string, optional): Search query for item names (supports partial matching)
  - `container_id` (uuid, optional): Filter by specific container
  - `shelf_id` (uuid, optional): Filter by specific shelf
  - `limit` (integer, optional, default: 50): Maximum results to return
  - `offset` (integer, optional, default: 0): Results to skip for pagination
- **Response**:
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
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized, 500 Internal Server Error

#### Add Item
- **Method**: POST
- **Path**: `/api/shelves/{shelf_id}/items`
- **Description**: Add new item or increase quantity if item already exists on shelf
- **Authentication**: Required
- **Request Body**:
```json
{
  "name": "mleko",
  "quantity": 2.000
}
```
- **Response**:
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
- **Success Codes**: 201 Created (new item), 200 OK (quantity updated)
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found (shelf), 500 Internal Server Error

#### Update Item Quantity
- **Method**: PUT
- **Path**: `/api/items/{item_id}`
- **Description**: Set specific quantity for item
- **Authentication**: Required
- **Request Body**:
```json
{
  "quantity": 5.000
}
```
- **Response**:
```json
{
  "item_id": "uuid",
  "shelf_id": "uuid",
  "name": "mleko",
  "quantity": 5.000,
  "created_at": "2024-01-15T10:30:00Z"
}
```
- **Success Codes**: 200 OK
- **Error Codes**: 400 Bad Request (negative quantity), 401 Unauthorized, 404 Not Found, 500 Internal Server Error

#### Remove Item Quantity
- **Method**: PATCH
- **Path**: `/api/items/{item_id}/remove`
- **Description**: Decrease item quantity or delete if quantity reaches zero
- **Authentication**: Required
- **Request Body**:
```json
{
  "quantity": 1.000
}
```
- **Response**:
```json
{
  "item_id": "uuid",
  "name": "mleko",
  "quantity": 1.000,
  "action": "updated" | "deleted"
}
```
- **Success Codes**: 200 OK
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Internal Server Error

#### Delete Item
- **Method**: DELETE
- **Path**: `/api/items/{item_id}`
- **Description**: Completely remove item regardless of quantity
- **Authentication**: Required
- **Response**:
```json
{
  "message": "Item deleted successfully"
}
```
- **Success Codes**: 200 OK
- **Error Codes**: 401 Unauthorized, 404 Not Found, 500 Internal Server Error

#### Move Item
- **Method**: PATCH
- **Path**: `/api/items/{item_id}/move`
- **Description**: Move item to different shelf
- **Authentication**: Required
- **Request Body**:
```json
{
  "shelf_id": "new-shelf-uuid"
}
```
- **Response**:
```json
{
  "item_id": "uuid",
  "shelf_id": "new-shelf-uuid",
  "name": "mleko",
  "quantity": 2.000,
  "created_at": "2024-01-15T10:30:00Z"
}
```
- **Success Codes**: 200 OK
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Internal Server Error

### 2.5 Voice Command Endpoints

#### Process Voice Command
- **Method**: POST
- **Path**: `/api/voice/process`
- **Description**: Process natural language voice commands for all operations (add, remove, query, complex commands)
- **Authentication**: Required
- **Request Body**:
```json
{
  "command": "dodaj dwa kartony mleka do pierwszej półki",
  "context": {
    "default_container_id": "uuid1"
  }
}
```
- **Response**:
```json
{
  "success": true,
  "actions": [
    {
      "type": "add_item",
      "status": "success",
      "details": {
        "item_name": "mleko",
        "quantity": 2.000,
        "shelf_name": "Pierwsza półka",
        "container_name": "Kitchen Freezer"
      }
    }
  ],
  "message": "Dodano 2 sztuki mleka na pierwszą półkę w Kitchen Freezer",
  "ai_response": "Dodano 2 sztuki mleka na pierwszą półkę w Kitchen Freezer"
}
```
- **Success Codes**: 200 OK
- **Error Codes**: 400 Bad Request (cannot parse command), 401 Unauthorized, 422 Unprocessable Entity (ambiguous command), 500 Internal Server Error

#### Query Items by Voice
- **Method**: POST
- **Path**: `/api/voice/query`
- **Description**: Handle voice queries like "czy mam pomidory?" or "co mam w zamrażarce?"
- **Authentication**: Required
- **Request Body**:
```json
{
  "query": "czy mam pomidory?",
  "context": {
    "containers": ["uuid1", "uuid2"]
  }
}
```
- **Response**:
```json
{
  "found": true,
  "items": [
    {
      "name": "pomidor",
      "quantity": 3.000,
      "locations": [
        {
          "container_name": "Kitchen Freezer",
          "shelf_name": "Top Shelf",
          "shelf_position": 1
        }
      ]
    }
  ],
  "message": "Tak, masz 3 sztuki pomidorów na górnej półce w Kitchen Freezer",
  "ai_response": "Tak, masz pomidory w zamrażarce"
}
```
- **Success Codes**: 200 OK
- **Error Codes**: 400 Bad Request, 401 Unauthorized, 500 Internal Server Error

## 3. Authentication and Authorization

### Authentication Method
- **Type**: JWT Bearer tokens provided by Supabase Auth
- **Header**: `Authorization: Bearer <jwt_token>`
- **Validation**: All endpoints verify JWT with Supabase and extract `user_id` from `auth.uid()`

### Authorization Model
- **Row Level Security (RLS)**: All database operations automatically enforce user isolation
- **Hierarchical Access**: Users access only their own containers, shelves inherit container access, items inherit shelf access
- **No Role-Based Access**: MVP supports single-user accounts only

### Security Implementation
- **Database Level**: PostgreSQL RLS policies ensure data isolation
- **API Level**: Middleware validates JWT and sets user context
- **Error Handling**: Consistent 401 Unauthorized responses for authentication failures

## 4. Validation and Business Logic

### Container Validation
- **Name**: Required, non-empty string, maximum 255 characters
- **Type**: Must be either "freezer" or "fridge", defaults to "freezer"
- **Deletion**: Only allowed for empty containers (no shelves/items)

### Shelf Validation
- **Name**: Required, non-empty string, maximum 255 characters
- **Position**: Required positive integer, must be unique within container
- **Deletion**: Only allowed for empty shelves (no items)

### Item Validation
- **Name**: Required, non-empty string, maximum 255 characters, normalized by AI to singular Polish form
- **Quantity**: Non-negative decimal with 3 decimal places, defaults to 1.000
- **Duplicate Handling**: Adding existing item on same shelf increases quantity instead of creating duplicate

### Voice Command Business Logic
- **AI Processing**: Commands processed through OpenRouter + GPT-4o-mini for natural language understanding
- **Multi-Action Support**: Single command can trigger multiple operations (e.g., "add milk and remove cheese")
- **Context Awareness**: AI considers user's existing containers and shelves for disambiguation
- **Error Recovery**: Graceful handling of partial command failures with detailed feedback
- **Normalization**: Item names standardized to singular Polish forms for consistency

### Search Logic
- **Text Matching**: Case-insensitive partial matching using PostgreSQL ILIKE
- **Scope**: Searches across all user's containers and items
- **Performance**: Indexed text search on item names for fast results
- **Real-time**: No caching, always fresh data from database

### Quantity Management
- **Decimal Precision**: Support for fractional quantities (e.g., 2.500 kg)
- **Automatic Aggregation**: Adding duplicate items increases existing quantity
- **Zero Handling**: Items with zero quantity are automatically deleted
- **Negative Prevention**: Quantities cannot be negative, validated at database level

