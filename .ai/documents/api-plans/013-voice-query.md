# API Endpoint Implementation Plan: Voice Query

## 1. Endpoint Overview
Handles voice queries like "czy mam pomidory?" or "co mam w zamrażarce?" using AI integration to parse natural language queries and search across user's containers. Provides detailed location information for found items.

## 2. Request Details
- HTTP Method: POST
- URL Pattern: `/api/voice/query`
- Parameters:
  - Required: None
  - Optional: None
- Request Body:
```json
{
  "query": "czy mam pomidory?",
  "context": {
    "containers": ["uuid1", "uuid2"]
  }
}
```
- Authentication: Required (Bearer token)

## 3. Used Types
- `VoiceQueryCommandDTO` (request)
- `VoiceQueryResponseDTO` (response)
- `VoiceQueryItemDTO` (item results)
- `ItemLocationDTO` (location info)

## 4. Response Details
**Success Response (200 OK):**
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

**Error Responses:**
- **400 Bad Request**: Invalid query or context data
- **401 Unauthorized**: Invalid or missing JWT token
- **500 Internal Server Error**: AI service or database errors

## 5. Data Flow
1. Validate JWT token and extract user_id
2. Parse request body to `VoiceQueryCommandDTO`
3. Send query to AI service for analysis and item extraction
4. Execute search across user's containers based on AI analysis
5. Aggregate results by item name across all locations
6. Generate user-friendly response message
7. Return `VoiceQueryResponseDTO` with findings

## 6. Security Considerations
- **JWT Validation**: Verify Bearer token with Supabase
- **RLS Protection**: Database automatically filters by user ownership
- **AI Service Security**: Secure communication with OpenRouter API
- **Input Sanitization**: Sanitize query text before AI processing
- **Context Validation**: Validate container UUIDs in context if provided

## 7. Error Handling
- **400 Bad Request**: Empty query, invalid context container UUIDs
- **401 Unauthorized**: Invalid/expired JWT token
- **422 Unprocessable Entity**: AI cannot understand query
- **500 Internal Server Error**: AI service failures, database errors
- **Not Found Responses**: Handle gracefully when no items match query
- **Logging**: Log queries and AI analysis results

## 8. Performance Considerations
- **AI Service Latency**: OpenRouter API calls for query analysis
- **Search Optimization**: Use existing text search indexes
- **Result Aggregation**: Efficiently group results by item name
- **Context Filtering**: Optimize queries when specific containers provided
- **Response Generation**: Cache common response patterns

## 9. Implementation Steps
1. Create Astro API route file: `src/pages/api/voice/query.ts`
2. Import required types and clients (Supabase, OpenRouter)
3. Create POST handler function
4. Validate JWT token and extract user_id
5. Parse request body to `VoiceQueryCommandDTO`
6. Create service function `VoiceService.processQuery()`
7. Send query to AI for analysis and item extraction
8. Build search query based on AI analysis
9. Execute search with RLS protection
10. Aggregate results by item name and locations
11. Generate natural language response
12. Return `VoiceQueryResponseDTO`
13. Add comprehensive error handling
14. Test with various Polish query patterns
15. Optimize AI prompts for better query understanding 