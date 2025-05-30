# User Authentication Architecture Specification
You are an experienced full-stack web developer specializing in implementing user registration, login, and password recovery modules. Design a detailed architecture for this functionality based on the requirements from the file `@3-prd.md` and the tech stack from `@4-tech-stack.md`.
Ensure full compliance with the remaining requirements — the existing application behavior described in the documentation must not be disrupted.
The implementation will use **Supabase Auth** for registration, login, logout, and account recovery functionality, integrated with **Astro**.
---
## 1. USER INTERFACE ARCHITECTURE
- A detailed description of frontend layer changes, including:
  - Description of new UI elements
  - Extension of existing components to support authentication requirements
- Clear separation of concerns between:
  - Client-side React forms/components
  - Astro pages
  - Integration points with authentication backend, user actions, and navigation
- Description of validation cases and error messages:
  - Inline validation for required fields, password strength, email format, etc.
  - Friendly and technical error messages returned by Supabase (e.g., "Email already in use", "Invalid credentials")
- Handling of key user scenarios:
  - New user registration
  - Email confirmation and feedback
  - Secure login
  - Logout
  - Forgotten password and reset flow
  - Auth session persistence (local storage/cookies)
---
## 2. BACKEND LOGIC
- API endpoint and data model structure:
  - Endpoints for supporting client-side forms (if needed beyond Supabase)
  - Abstracted service layer for user auth logic, if local business rules apply
  - Minimal user data model extensions (if storing roles, metadata, etc.)
- Input validation mechanisms:
  - Schema-based validation (e.g., using `zod` or `yup`)
  - Backend-side defensive checks in case of direct API access
- Exception handling:
  - Graceful handling of known Supabase errors
  - Logging unexpected issues (e.g., with Astro's server-side logging tools)
- Updates to server-side rendering behavior:
  - Use of `@astro.config.mjs` to enable protected routes
  - Conditional rendering based on session state
  - Redirections for unauthenticated users when accessing restricted content
---
## 3. AUTHENTICATION SYSTEM
- Supabase Auth integration with Astro:
  - Use of Supabase client SDK on the frontend
  - Use of Supabase Server API on the backend (if needed for SSR session checks)
  - Integration of session handling and cookie management
  - Implementation of `onAuthStateChange` listener for session-aware navigation
- Supported functionality:
  - Registration (email/password or OAuth providers if specified)
  - Login
  - Logout
  - Email/password recovery (trigger email, reset flow with token)
  - Email confirmation and status feedback
---
## Final Output
Prepare the final document with this specification as a technical narrative, focusing on **components**, **modules**, **services**, and **contracts** involved, **without implementing the final code**.
### Save to file:
```
.ai/documents/15-3-intoroduce-auth-spec.md
```
Would you like me to generate the full Markdown file content now based on this structure?