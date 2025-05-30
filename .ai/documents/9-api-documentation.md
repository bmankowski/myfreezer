# MyFreezer API Documentation

**Version:** 1.0  
**Base URL:** `https://api.myfreezer.app` (or `http://localhost:3000` for development)  
**Authentication:** JWT Bearer tokens via Supabase Auth

## Overview

MyFreezer is a voice-controlled freezer/fridge management system with AI-powered Polish language support. The API provides complete inventory management, user authentication, and natural language processing capabilities.

### Key Features
- **Multi-tenant Architecture**: User data isolation via Row Level Security (RLS)
- **Polish Language Support**: Full support for Polish characters and voice commands
- **AI Integration**: OpenRouter + GPT-4o-mini for natural language processing
- **Voice Commands**: Add, remove, query items using Polish voice commands
- **Hierarchical Data Model**: Containers → Shelves → Items
- **Real-time Search**: Full-text search with pagination
- **Production Security**: JWT authentication, input validation, comprehensive error handling

---

## Authentication

All API endpoints (except health check and auth endpoints) require authentication via JWT Bearer tokens.

**Header Format:**
```
Authorization: Bearer <jwt_token>
```

**Error Responses:**
- `401 Unauthorized`: Missing, invalid, or expired token
- `403 Forbidden`: Valid token but insufficient permissions

---

## API Endpoints Summary

### **Authentication (8 endpoints)**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User sign-in
- `POST /api/auth/logout` - User sign-out
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/reset-password` - Request password reset
- `POST /api/auth/change-password` - Change password (authenticated)
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/resend-verification` - Resend verification email

### **Inventory Management (21 endpoints)**
- `GET /api/health` - System health check
- `GET /api/containers` - List user containers
- `POST /api/containers` - Create container
- `GET /api/containers/{id}` - Get container details
- `PUT /api/containers/{id}` - Update container
- `DELETE /api/containers/{id}` - Delete container
- `GET /api/containers/{id}/contents` - Get container contents (voice-optimized)
- `POST /api/containers/{id}/shelves` - Create shelf
- `PUT /api/shelves/{id}` - Update shelf
- `DELETE /api/shelves/{id}` - Delete shelf
- `POST /api/shelves/{id}/items` - Add item to shelf
- `PUT /api/items/{id}` - Update item
- `DELETE /api/items/{id}` - Delete item
- `GET /api/items` - Search items
- `PATCH /api/items/{id}/remove` - Remove item quantity
- `PATCH /api/items/{id}/move` - Move item between shelves

### **AI Integration (2 endpoints)**
- `POST /api/voice/process` - Process voice commands
- `POST /api/voice/query` - Voice-based item queries

---

## 1. Authentication Endpoints

### Register User
**POST** `/api/auth/register`

Register a new user with email and password.

**Request Body:**
```json
{
  "email": "jan.kowalski@example.com",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123",
  "firstName": "Jan",
  "lastName": "Kowalski"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "user_id": "uuid",
    "email": "jan.kowalski@example.com",
    "firstName": "Jan",
    "lastName": "Kowalski"
  },
  "message": "Registration successful. Please check your email for verification.",
  "email_confirmation_required": true
}
```

**Error Codes:** `400 Bad Request`, `409 Conflict`, `500 Internal Server Error`

---

### Login User
**POST** `/api/auth/login`

Sign in user with email and password.

**Request Body:**
```json
{
  "email": "jan.kowalski@example.com",
  "password": "SecurePass123"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "user_id": "uuid",
    "email": "jan.kowalski@example.com",
    "firstName": "Jan",
    "lastName": "Kowalski"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "refresh_token_string",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

**Error Codes:** `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `500 Internal Server Error`

---

### Logout User
**POST** `/api/auth/logout`

Sign out the current authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "message": "Logout successful"
}
```

**Error Codes:** `401 Unauthorized`, `500 Internal Server Error`

---

### Get User Profile
**GET** `/api/auth/profile`

Get current user profile information.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "user_id": "uuid",
  "email": "jan.kowalski@example.com",
  "firstName": "Jan",
  "lastName": "Kowalski",
  "email_verified": true,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Error Codes:** `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`

---

### Update User Profile
**PUT** `/api/auth/profile`

Update user profile information.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "firstName": "Janusz",
  "lastName": "Nowak",
  "email": "janusz.nowak@example.com"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "user_id": "uuid",
    "email": "janusz.nowak@example.com",
    "firstName": "Janusz",
    "lastName": "Nowak"
  },
  "message": "Profile updated successfully"
}
```

**Error Codes:** `400 Bad Request`, `401 Unauthorized`, `409 Conflict`, `500 Internal Server Error`

---

### Request Password Reset
**POST** `/api/auth/reset-password`

Request password reset email.

**Request Body:**
```json
{
  "email": "jan.kowalski@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "If an account with this email exists, a password reset email has been sent."
}
```

**Error Codes:** `400 Bad Request`, `500 Internal Server Error`

---

### Change Password
**POST** `/api/auth/change-password`

Change password for authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewSecurePass456",
  "confirmPassword": "NewSecurePass456"
}
```

**Response (200 OK):**
```json
{
  "message": "Password changed successfully"
}
```

**Error Codes:** `400 Bad Request`, `401 Unauthorized`, `500 Internal Server Error`

---

### Refresh Token
**POST** `/api/auth/refresh`

Refresh JWT access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token_string"
}
```

**Response (200 OK):**
```json
{
  "access_token": "new_jwt_token",
  "refresh_token": "new_refresh_token",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

**Error Codes:** `400 Bad Request`, `401 Unauthorized`, `500 Internal Server Error`

---

### Verify Email
**POST** `/api/auth/verify-email`

Verify email address with token.

**Request Body:**
```json
{
  "token": "verification_token"
}
```

**Response (200 OK):**
```json
{
  "message": "Email verified successfully"
}
```

**Error Codes:** `400 Bad Request`, `500 Internal Server Error`

---

### Resend Verification Email
**POST** `/api/auth/resend-verification`

Resend email verification.

**Request Body:**
```json
{
  "email": "jan.kowalski@example.com"
}
```

**Response (200 OK):**
```json
{
  "message": "If an account with this email exists, a verification email has been sent."
}
```

**Error Codes:** `400 Bad Request`, `500 Internal Server Error`

---

## 2. System Health

### Health Check
**GET** `/api/health`

Check system health and authentication status.

**Response (200 OK):**
```json
{
  "status": "ok",
  "authenticated": true,
  "user_id": "uuid"
}
```

**Error Codes:** `500 Internal Server Error`

---

## 3. Container Management

### List Containers
**GET** `/api/containers`

Get all containers for authenticated user with counts.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "containers": [
    {
      "container_id": "uuid1",
      "name": "Kitchen Freezer",
      "type": "freezer",
      "created_at": "2024-01-15T10:30:00Z",
      "shelves_count": 3,
      "items_count": 15
    },
    {
      "container_id": "uuid2",
      "name": "Basement Fridge",
      "type": "fridge",
      "created_at": "2024-01-15T11:00:00Z",
      "shelves_count": 2,
      "items_count": 8
    }
  ]
}
```

**Error Codes:** `401 Unauthorized`, `500 Internal Server Error`

---

### Create Container
**POST** `/api/containers`

Create a new container.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Kitchen Freezer",
  "type": "freezer"
}
```

**Response (201 Created):**
```json
{
  "container_id": "uuid",
  "name": "Kitchen Freezer",
  "type": "freezer",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Error Codes:** `400 Bad Request`, `401 Unauthorized`, `500 Internal Server Error`

---

### Get Container Details
**GET** `/api/containers/{container_id}`

Get detailed container information with shelves and items.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "container_id": "uuid",
  "name": "Kitchen Freezer",
  "type": "freezer",
  "created_at": "2024-01-15T10:30:00Z",
  "shelves": [
    {
      "shelf_id": "uuid1",
      "name": "Top Shelf",
      "position": 1,
      "created_at": "2024-01-15T10:35:00Z",
      "items": [
        {
          "item_id": "uuid_item1",
          "name": "mleko",
          "quantity": 2.000,
          "created_at": "2024-01-15T11:00:00Z"
        }
      ]
    }
  ],
  "total_items": 1
}
```

**Error Codes:** `400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`

---

### Update Container
**PUT** `/api/containers/{container_id}`

Update container name and/or type.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Updated Freezer Name",
  "type": "freezer"
}
```

**Response (200 OK):**
```json
{
  "container_id": "uuid",
  "name": "Updated Freezer Name",
  "type": "freezer",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Error Codes:** `400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`

---

### Delete Container
**DELETE** `/api/containers/{container_id}`

Delete an empty container.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "message": "Container deleted successfully"
}
```

**Error Codes:** `400 Bad Request` (container not empty), `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`

---

### Get Container Contents
**GET** `/api/containers/{container_id}/contents`

Get container contents in voice-optimized format.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "container": {
    "container_id": "uuid",
    "name": "Kitchen Freezer",
    "type": "freezer"
  },
  "shelves": [
    {
      "shelf_id": "uuid1",
      "name": "Top Shelf",
      "position": 1,
      "created_at": "2024-01-15T10:35:00Z",
      "items": [
        {
          "item_id": "uuid_item1",
          "name": "mleko",
          "quantity": 2.000,
          "created_at": "2024-01-15T11:00:00Z"
        }
      ]
    }
  ],
  "total_items": 1
}
```

**Error Codes:** `400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`

---

## 4. Shelf Management

### Create Shelf
**POST** `/api/containers/{container_id}/shelves`

Create a new shelf in container.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Top Shelf",
  "position": 1
}
```

**Response (201 Created):**
```json
{
  "shelf_id": "uuid",
  "container_id": "uuid",
  "name": "Top Shelf",
  "position": 1,
  "created_at": "2024-01-15T10:35:00Z"
}
```

**Error Codes:** `400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`

---

### Update Shelf
**PUT** `/api/shelves/{shelf_id}`

Update shelf name and/or position.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Updated Shelf Name",
  "position": 2
}
```

**Response (200 OK):**
```json
{
  "shelf_id": "uuid",
  "container_id": "uuid",
  "name": "Updated Shelf Name",
  "position": 2,
  "created_at": "2024-01-15T10:35:00Z"
}
```

**Error Codes:** `400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`

---

### Delete Shelf
**DELETE** `/api/shelves/{shelf_id}`

Delete an empty shelf.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "message": "Shelf deleted successfully"
}
```

**Error Codes:** `400 Bad Request` (shelf not empty), `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`

---

## 5. Item Management

### Add Item to Shelf
**POST** `/api/shelves/{shelf_id}/items`

Add item to shelf or update quantity if exists.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "mleko",
  "quantity": 2.000
}
```

**Response (201 Created or 200 OK):**
```json
{
  "item_id": "uuid",
  "shelf_id": "uuid",
  "name": "mleko",
  "quantity": 2.000,
  "created_at": "2024-01-15T11:00:00Z",
  "action": "created"
}
```

**Error Codes:** `400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`

---

### Update Item
**PUT** `/api/items/{item_id}`

Update item quantity (deletes if zero).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "quantity": 5.000
}
```

**Response (200 OK):**
```json
{
  "item_id": "uuid",
  "shelf_id": "uuid",
  "name": "mleko",
  "quantity": 5.000,
  "created_at": "2024-01-15T11:00:00Z"
}
```

**Error Codes:** `400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`

---

### Delete Item
**DELETE** `/api/items/{item_id}`

Delete item completely.

**Headers:** `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "message": "Item deleted successfully"
}
```

**Error Codes:** `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`

---

### Search Items
**GET** `/api/items`

Search items with filters and pagination.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `q` (string, optional): Search query for item names
- `container_id` (uuid, optional): Filter by container
- `shelf_id` (uuid, optional): Filter by shelf
- `limit` (integer, optional, default: 50, max: 100): Results limit
- `offset` (integer, optional, default: 0): Results offset

**Response (200 OK):**
```json
{
  "items": [
    {
      "item_id": "uuid",
      "name": "mleko",
      "quantity": 2.000,
      "created_at": "2024-01-15T11:00:00Z",
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

**Error Codes:** `400 Bad Request`, `401 Unauthorized`, `500 Internal Server Error`

---

### Remove Item Quantity
**PATCH** `/api/items/{item_id}/remove`

Remove specific quantity from item (consumption tracking).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "quantity": 1.000
}
```

**Response (200 OK):**
```json
{
  "item_id": "uuid",
  "name": "mleko",
  "quantity": 1.000,
  "action": "updated"
}
```

**Error Codes:** `400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`

---

### Move Item
**PATCH** `/api/items/{item_id}/move`

Move item to different shelf.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "shelf_id": "new_shelf_uuid"
}
```

**Response (200 OK):**
```json
{
  "item_id": "uuid",
  "shelf_id": "new_shelf_uuid",
  "name": "mleko",
  "quantity": 2.000,
  "created_at": "2024-01-15T11:00:00Z"
}
```

**Error Codes:** `400 Bad Request`, `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`

---

## 6. AI Voice Integration

### Process Voice Command
**POST** `/api/voice/process`

Process natural language voice commands in Polish.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "command": "dodaj dwa kartony mleka do pierwszej półki",
  "context": {
    "default_container_id": "uuid1"
  }
}
```

**Response (200 OK):**
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

**Supported Commands:**
- **Add items**: "dodaj dwa mleka do pierwszej półki"
- **Remove items**: "wyjmij trzy chleby z lodówki"
- **Update quantities**: "zmień ilość mleka na pięć"
- **Query items**: "czy mam pomidory?"

**Error Codes:** `400 Bad Request`, `401 Unauthorized`, `422 Unprocessable Entity`, `500 Internal Server Error`

---

### Voice Query
**POST** `/api/voice/query`

Handle voice queries for finding items.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "query": "czy mam pomidory?",
  "context": {
    "containers": ["uuid1", "uuid2"]
  }
}
```

**Response (200 OK):**
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

**Error Codes:** `400 Bad Request`, `401 Unauthorized`, `500 Internal Server Error`

---

## Data Models

### Container Types
- `freezer` - Freezer/Zamrażarka
- `fridge` - Refrigerator/Lodówka

### Database Schema
```
users (Supabase Auth)
└── containers (user_id, name, type)
    └── shelves (container_id, name, position)
        └── items (shelf_id, name, quantity)
```

### Security Model
- **Row Level Security (RLS)**: All tables protected
- **JWT Authentication**: Supabase Auth integration
- **User Isolation**: Users can only access their own data
- **Hierarchical Protection**: Items protected through container ownership

---

## Error Handling

### Standard Error Response Format
```json
{
  "error": "Error description message"
}
```

### Common HTTP Status Codes
- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Permission denied
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., email already exists)
- `422 Unprocessable Entity` - AI cannot process command
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - AI service temporarily unavailable

---

## Rate Limiting

### Supabase Auth Rate Limits
- **Sign-in/Sign-up**: 30 requests per 5 minutes per IP
- **Password reset**: 2 emails per hour
- **Email verification**: 30 requests per 5 minutes per IP
- **Token refresh**: 150 requests per 5 minutes per IP

### AI Service Rate Limits
- **Voice commands**: Limited by OpenRouter API quotas
- **Query processing**: Throttled based on API key limits

---

## Environment Variables

### Required Configuration
```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key

# AI Service Configuration
OPENROUTER_API_KEY=your_openrouter_api_key

# Application Configuration
SITE_URL=https://your-domain.com
```

---

## Polish Language Support

### Supported Characters
- Full Polish alphabet: `a-z A-Z ą ć ę ł ń ó ś ź ż Ą Ć Ę Ł Ń Ó Ś Ź Ż`
- Hyphens, apostrophes, and spaces in names
- Case-insensitive search and matching

### Voice Command Examples
```
Dodaj trzy kartony mleka do pierwszej półki
Wyjmij dwa chleby z lodówki
Ile mam pomidorów w zamrażarce?
Czy mam jajka na górnej półce?
Przenieś mleko na drugą półkę
```

### AI Processing Features
- **Quantity Parsing**: Text to numbers (dwa → 2, pięć → 5)
- **Item Normalization**: Plural to singular (mleka → mleko)
- **Shelf Resolution**: Name or position matching
- **Container Matching**: Type or name recognition
- **Context Awareness**: Smart defaults and disambiguation

---

## SDK and Integration

### Authentication Flow
1. **Register** user with email/password
2. **Verify** email address
3. **Login** to receive JWT tokens
4. **Use Bearer token** for API requests
5. **Refresh** tokens when expired

### Typical Usage Pattern
```javascript
// 1. Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

// 2. Use token for API calls
const containersResponse = await fetch('/api/containers', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// 3. Process voice commands
const voiceResponse = await fetch('/api/voice/process', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json' 
  },
  body: JSON.stringify({ 
    command: "dodaj mleko do lodówki",
    context: { default_container_id: "uuid" }
  })
});
```

---

## Support and Resources

### Development Tools
- **TypeScript**: Full type safety across all endpoints
- **Zod Validation**: Runtime schema validation
- **Supabase**: Database, authentication, real-time subscriptions
- **OpenRouter**: AI service integration

### Testing Recommendations
- Use Supabase local development environment
- Test authentication flows with various scenarios
- Validate Polish character handling
- Test voice commands with different sentence structures
- Verify RLS policies with multiple users

---

*This documentation covers MyFreezer API v1.0 with 31 endpoints providing complete freezer/fridge management with AI-powered Polish voice control.* 