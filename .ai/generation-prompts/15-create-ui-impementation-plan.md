# Prompt: Frontend View Implementation Plan

As a senior frontend developer, your task is to create a **detailed implementation plan** for a new view in a web application.  
The plan should be **comprehensive** and **clear enough** for another frontend developer to properly and efficiently implement the view.

First, review the following inputs:

1. Product Requirements Document (PRD):
<prd>
@3-prd.md
</prd>

2. View Description:
<view_description>
{{view-description}} <- insert the description of the view to be implemented from ui-plan.md
</view_description>

3. User Stories:
<user_stories>
{{user-stories}} <- insert user stories from @prd.md that are addressed by the view
</user_stories>

4. Endpoint Description:
<endpoint_description>
{{endpoint-description}} <- insert endpoint descriptions from api-plan.md that the view will use
</endpoint_description>

5. Endpoint Implementation:
<endpoint_implementation>
{{endpoint-implementation}} <- replace with references to the endpoint implementations the view will use (e.g., @generations.ts, @flashcards.ts)
</endpoint_implementation>

6. Type Definitions:
<type_definitions>
@types.ts
</type_definitions>

7. Tech Stack:
<tech_stack>
@4-tech-stack.md
</tech_stack>

---

Before creating the final implementation plan, conduct an analysis and planning phase within the <implementation_breakdown> tags in your thinking section.  
This section can be quite long because it is important to be thorough.

In your implementation breakdown, perform the following steps:
1. For each input section (PRD, User Stories, Endpoint Description, Endpoint Implementation, Type Definitions, Tech Stack):
   - Summarize the key points
   - List any requirements or constraints
   - Note any potential challenges or important issues
2. Extract and list the key requirements from the PRD
3. List all the necessary major components, along with a short description of each, needed types, supported events, and validation conditions
4. Create a high-level component tree diagram
5. Identify required DTOs and custom ViewModel types for each view component. Explain these new types in detail, breaking down their fields and related types.
6. Identify potential state variables and custom hooks, explaining their purpose and usage
7. List required API calls and their corresponding frontend actions
8. Map each user story to specific implementation details, components, or features
9. List user interactions and their expected outcomes
10. List the conditions required by the API and how to validate them at the component level
11. Identify potential error scenarios and suggest how to handle them
12. List potential challenges with implementing the view and suggest possible solutions

---

After completing the analysis, deliver the **final implementation plan** in **Markdown format** with the following sections:

## Final Plan Sections

1. Overview: A short summary of the view and its purpose.
2. View Routing: Define the path where the view should be accessible.
3. Component Structure: Outline the main components and their hierarchy.
4. Component Details: For each component, describe:
   - Component description, purpose, and its structure
   - Main HTML elements and child components it consists of
   - Supported interactions (events)
   - Validation conditions (detailed according to API)
   - Types (DTO and ViewModel) required by the component
   - Props the component receives from its parent (component interface)
5. Types: A detailed description of the types required for implementing the view, including a full breakdown of any new types or view models by fields and types.
6. State Management: A detailed description of how state will be managed within the view, and whether a custom hook is required.
7. API Integration: Explain how to integrate with the provided endpoint. Clearly point out request and response types.
8. User Interactions: A detailed description of user interactions and how to handle them.
9. Conditions and Validation: Describe what conditions are verified by the interface, which components are involved, and how they affect the UI state.
10. Error Handling: Describe how to handle potential errors or edge cases.
11. Implementation Steps: A step-by-step guide to implementing the view.

---

Make sure your plan **complies with the PRD**, **addresses the user stories**, and **aligns with the provided tech stack**.

The final output should be **in Polish** and saved in a file named `.ai/{view-name}-view-implementation-plan.md`.  
**Do not include any of the analysis and planning** in the final deliverable.

---

### Example Final File (structure only)

```markdown
# View Implementation Plan: [View Name]

## 1. Overview
[Short description of the view and its purpose]

## 2. View Routing
[Path where the view should be available]

## 3. Component Structure
[Outline of main components and their hierarchy]

## 4. Component Details
### [Component Name 1]
- Component description [description]
- Main elements: [description]
- Supported interactions: [list]
- Supported validation: [list, detailed]
- Types: [list]
- Props: [list]

### [Component Name 2]
[...]

## 5. Types
[Detailed description of required types]

## 6. State Management
[State management description]

## 7. API Integration
[Explanation of API integration, specifying request and response types]

## 8. User Interactions
[Detailed description of user interactions]

## 9. Conditions and Validation
[Detailed description of validation conditions]

## 10. Error Handling
[Error and edge case handling description]

## 11. Implementation Steps
1. [Step 1]
2. [Step 2]
3. [...]
