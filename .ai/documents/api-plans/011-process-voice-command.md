# API Endpoint Implementation Plan: Process Voice Command

## 1. Endpoint Overview
Processes natural language voice commands for all operations (add, remove, query, complex commands) using AI integration via OpenRouter + GPT-4o-mini. Handles multi-action commands and provides detailed feedback for each operation performed.

## 2. Request Details
- HTTP Method: POST
- URL Pattern: `/api/voice/process`
- Parameters:
  - Required: None
  - Optional: None
- Request Body:
```json
{
  "command": "dodaj dwa kartony mleka do pierwszej półki",
  "context": {
    "default_container_id": "uuid1"
  }
}
```
- Authentication: Required (Bearer token)

## 3. Used Types
- `VoiceProcessCommandDTO` (request)
- `VoiceProcessResponseDTO` (response)
- `VoiceActionDTO` (action results)
- `VoiceActionDetailsDTO` (action details)

## 4. Response Details
**Success Response (200 OK):**
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

**Error Responses:**
- **400 Bad Request**: Cannot parse command or invalid context
- **401 Unauthorized**: Invalid or missing JWT token
- **422 Unprocessable Entity**: Ambiguous command requiring clarification
- **500 Internal Server Error**: AI service or database errors

## 5. Data Flow
1. Validate JWT token and extract user_id
2. Parse request body to `VoiceProcessCommandDTO`
3. Send command to AI service (OpenRouter + GPT-4o-mini) for parsing
4. Receive structured action list from AI
5. Execute each action sequentially through appropriate services
6. Collect results and feedback for each action
7. Generate user-friendly response messages
8. Return comprehensive `VoiceProcessResponseDTO`

## 6. Security Considerations
- **JWT Validation**: Verify Bearer token with Supabase
- **AI Service Security**: Secure API communication with OpenRouter
- **Input Sanitization**: Sanitize command text before AI processing
- **Context Validation**: Validate container_id in context if provided
- **Action Authorization**: Ensure all actions respect user ownership through RLS
- **Rate Limiting**: Implement AI service call rate limiting

## 7. Error Handling
- **400 Bad Request**: Empty command, invalid context data
- **401 Unauthorized**: Invalid/expired JWT token
- **422 Unprocessable Entity**: AI cannot parse command or needs clarification
- **429 Too Many Requests**: AI service rate limit exceeded
- **500 Internal Server Error**: AI service failures, database errors
- **Partial Success**: Handle scenarios where some actions succeed and others fail
- **Logging**: Log all AI interactions and action results

## 8. Performance Considerations
- **AI Service Latency**: OpenRouter API calls may take 1-3 seconds
- **Parallel Actions**: Consider executing independent actions in parallel
- **Context Caching**: Cache user's container/shelf context for disambiguation
- **Error Recovery**: Continue processing remaining actions if one fails
- **Response Time**: Optimize for user experience with quick feedback

## 9. Implementation Steps
1. Create Astro API route file: `src/pages/api/voice/process.ts`
2. Import required types and clients (Supabase, OpenRouter)
3. Create POST handler function
4. Validate JWT token and extract user_id
5. Parse request body to `VoiceProcessCommandDTO`
6. Create service function `VoiceService.processCommand()`
7. Set up OpenRouter client configuration
8. Send command to AI with user context for parsing
9. Parse AI response into structured actions
10. Create action execution functions for each type
11. Execute actions sequentially with error handling
12. Collect results and generate response messages
13. Return `VoiceProcessResponseDTO` with all results
14. Add comprehensive error handling and logging
15. Test with various Polish commands and edge cases
16. Implement rate limiting and AI service monitoring 