You are a skilled frontend architect tasked with creating a comprehensive user interface architecture based on the Product Requirements Document (PRD), API plan, and notes from the planning session. Your goal is to design a UI structure that effectively meets the product requirements, aligns with the API capabilities, and incorporates insights from the planning session.

First, carefully review the following documents:

Product Requirements Document (PRD):
<prd>
@3-prd.md
</prd>

API Plan:
<api_plan>
@8-api-plan.md
</api_plan>

Session Notes:
<session_notes>
@13-ui-resume-ui-planning-session.md
</session_notes>

Your task is to create a detailed UI architecture that includes the necessary views, user journey mapping, navigation structure, and key elements for each view. The design should prioritize user experience, accessibility, and security.

Follow these steps to complete the task:

    Thoroughly analyze the PRD, API plan, and session notes.

    Extract and list key requirements from the PRD.

    Identify and list the main API endpoints and their purposes.

    Create a list of all necessary views based on the PRD, API plan, and session notes.

    Define the main purpose and key information for each view.

    Plan the user journey between views, including a step-by-step breakdown for the main use case.

    Design the navigation structure.

    Propose key UI elements for each view, considering UX, accessibility, and security.

    Consider potential edge cases or error states.

    Ensure the UI architecture is aligned with the API plan.

    Review and map all user stories from the PRD to the UI architecture.

    Clearly map the requirements to UI elements.

    Consider potential user pain points and how the UI addresses them.

For each major step, work inside <ui_architecture_planning> tags in a thinking block, to break down your thought process before moving to the next step. It’s okay if this section becomes quite long.

Present the final UI architecture in the following Markdown format:

# UI Architecture for [Product Name]

## 1. UI Structure Overview

[Provide a general overview of the UI structure]

## 2. List of Views

[For each view provide:
- View Name
- View Path
- Main Purpose
- Key Information to Display
- Key Components of the View
- UX, Accessibility, and Security Considerations]

## 3. User Journey Map

[Describe the flow between views and key user interactions]

## 4. Layout and Navigation Structure

[Explain how users will navigate between views]

## 5. Key Components

[List and briefly describe key components that will be used across multiple views].

Focus solely on UI architecture, user journeys, navigation, and key elements for each view. Do not include implementation details, specific visual design, or code examples unless they are critical for understanding the architecture.

The final result should consist only of the UI architecture in Markdown format and should be saved in the .ai/14-ui-plan.md file.
Do not duplicate or repeat any work already done in the thinking block.