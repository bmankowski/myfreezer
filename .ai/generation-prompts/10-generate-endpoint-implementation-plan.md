You are an experienced software architect tasked with creating a series of detailed implementation plans for a REST API endpoint. Your plan will guide the development team in the effective and correct implementation of all endpoints.

Before we begin, review the following information:

1. Route API specification:
<route_api_specification>
@8-api-plan.md
</route_api_specification>

2. Related database resources:
<related_db_resources>
@7-database-structure.md
</related_db_resources>

3. Type Definitions:
<type_definitions>
@src/types.ts
</type_definitions>

3. Tech stack:
<tech_stack>
@4-tech-stack.md
</tech_stack>

4. Implementation rules:
<implementation_rules>
{{backend-rules}} <- replace with reference to Rules for AI for backend (e.g. @shared.mdc, @backend.mdc, @astro.mdc)
</implementation_rules>

Your task is to create a comprehensive implementation plan for a REST API endpoint. Before delivering the final plan, use <analysis> markers to analyze the information and outline your approach. In your analysis, ensure that:

1. Summarize the key points of the API specification.
2. List the required and optional parameters from the API specification.
3. List the necessary DTO types and Command Models.
4. Consider how to extract the logic into a service (existing or new if necessary).
5. Plan the validation of input data according to the API endpoint specification, database resources, and implementation rules.
6. Determine how to log errors in an error table (if applicable).
7. Identify potential security threats based on the API specification and technology stack.
8. Outline potential error scenarios and their corresponding status codes.

After completing your analysis, create a detailed implementation plan in markdown format. The plan should include the following sections:

1. Endpoint Overview
2. Request Details
3. Response Details
4. Data Flow
5. Security Considerations
6. Error Handling
7. Performance Considerations
8. Implementation Steps

Throughout the plan, ensure that:
- Use the correct API status codes:
  - 200 for successful retrieval
  - 201 for successful creation
  - 400 for invalid input data
  - 401 for unauthorized access
  - 404 for resources not found
  - 500 for server-side errors
- Adapt to the provided technology stack
- Follow the given implementation rules

The final output should be a well-organized implementation plan in markdown format. Here is an example of the expected output for every endpoint:

```
# API Endpoint Implementation Plan: [Endpoint Name]

## 1. Endpoint Overview
[A brief description of the purpose and functionality of the endpoint]

## 2. Request Details
- HTTP Method: [GET/POST/PUT/DELETE]
- URL Pattern: [URL pattern]
- Parameters:
  - Required: [List of required parameters]
  - Optional: [List of optional parameters]
- Request Body: [Structure of the request body, if applicable]

## 3. Used Types
[DTOs and Command Models necessary for implementation]

## 3. Response Details
[Expected response structure and status codes]

## 4. Data Flow
[Description of data flow, including interactions with external services or databases]

## 5. Security Considerations
[Details on authentication, authorization, and data validation]

## 6. Error Handling
[List of potential errors and how to handle them]

## 7. Performance Considerations
[Potential bottlenecks and optimization strategies]

## 8. Implementation Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]
...
```

The final results should consist solely of the implementation plan in markdown format and should not duplicate or repeat any work done in the analysis section.

Remember to save every of your implementation plan as:
 .ai/documents/api-plans/XXX-ENDPOINTNAME.md
 (where XXX is the next document number, starting from 1). 
 Ensure the plan is detailed, clear, and provides comprehensive guidance for the development team.
 Create all needed endpoints. Do not stop untill all needed endpoints are created.