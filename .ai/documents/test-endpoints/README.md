# API Endpoint Test Plans

This directory contains comprehensive test plans for all API endpoints in the MyFreezer application.

## Test Plan Index

### Authentication Endpoints
- **testplan-auth-login-02.md** - User login with email/password
- **testplan-auth-register-03.md** - User registration 
- **testplan-auth-logout-04.md** - User logout and session termination
- **testplan-auth-status-07.md** - Authentication status check
- **testplan-auth-refresh-08.md** - Token refresh using refresh token
- **testplan-auth-profile-25.md** - User profile management

### System Endpoints
- **testplan-health-01.md** - Health check endpoint

### Container Management
- **testplan-containers-list-05.md** - List user containers
- **testplan-containers-create-06.md** - Create new container
- **testplan-container-details-18.md** - Get container details
- **testplan-container-contents-19.md** - Get container contents
- **testplan-container-shelves-20.md** - Manage container shelves

### Shelf Management
- **testplan-shelf-details-21.md** - Shelf CRUD operations
- **testplan-shelf-items-22.md** - List items on shelf

### Item Management
- **testplan-items-list-12.md** - List all user items
- **testplan-items-quantity-13.md** - Update item quantity
- **testplan-items-remove-14.md** - Remove item from inventory
- **testplan-items-move-15.md** - Move item between containers/shelves

### Voice Processing
- **testplan-voice-transcribe-09.md** - Audio transcription using Whisper
- **testplan-voice-query-10.md** - Natural language inventory queries
- **testplan-voice-process-11.md** - Voice command processing

### AI Command Processing
- **testplan-command-process-16.md** - AI-powered command execution
- **testplan-command-query-17.md** - AI-powered inventory queries

### User Preferences
- **testplan-user-preferences-23.md** - User preferences management
- **testplan-user-default-shelf-24.md** - Default shelf preference

## Test Plan Structure

Each test plan follows a consistent structure:
- **TESTNAME** - Descriptive name for the test
- **TESTREASON** - Purpose of testing this endpoint
- **APIENDPOINT** - Full path of the endpoint
- **METHOD** - HTTP method (GET, POST, PUT, DELETE)
- **INPUT-PAYLOAD** - Example input data (if required)
- **NEED-AUTHORISATION** - Authentication requirements
- **EXPECTED-RESPONSE-CODE** - Expected HTTP status codes
- **RESPONSE-SCHEMA** - Expected response format
- **NOTES** - Additional context, edge cases, and testing considerations

## Technology Stack Considerations

These test plans are designed for:
- **Astro 5** with React components
- **Supabase** backend (PostgreSQL + Auth)
- **OpenAI/OpenRouter.ai** for AI processing
- **TypeScript 5** for type safety
- **Cookie-based authentication** with HTTP-only cookies

## Testing Tools Recommended

Based on the tech stack documentation:
- **Vitest + React Testing Library** for unit tests
- **Playwright** for E2E and integration tests
- **Postman/SuperTest** for API testing
- **Lighthouse + k6** for performance testing 