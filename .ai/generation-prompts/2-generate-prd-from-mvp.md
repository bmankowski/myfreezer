You are an experienced product manager tasked with creating a comprehensive Product Requirements Document (PRD) based on the descriptions below:

<project_description>
{{project-description}} <- insert the MVP idea
</project_description>

<project_details>
{{project-details}} <- insert th2e planning session summary
</project_details>

Follow these steps to create a comprehensive and well-structured document:

    Divide the PRD into the following sections: a. Project Overview
    b. User Problem
    c. Functional Requirements
    d. Project Boundaries
    e. User Stories
    f. Success Metrics

    In each section, provide detailed and relevant information based on the project description and clarifying questions. Make sure to:

        Use clear and concise language

        Provide specific details and data where necessary

        Maintain consistency throughout the document

        Address all items listed in each section

    When creating user stories and acceptance criteria:

        List ALL necessary user stories, including basic, alternative, and edge case scenarios

        Assign a unique requirement ID (e.g., US-001) to each user story for direct traceability

        Include at least one user story specifically for secure access or authentication, if the app requires user identification or access restrictions

        Ensure no potential user interaction is omitted

        Make sure each user story is testable

Use the following structure for each user story:

    ID

    Title

    Description

    Acceptance Criteria

    After completing the PRD, review it against this checklist:

        Is every user story testable?

        Are the acceptance criteria clear and specific?

        Do we have enough user stories to build a fully functional application?

        Have we included authentication and authorization requirements (if applicable)?

    PRD formatting:

        Maintain consistent formatting and numbering

        Do not use bold formatting in markdown ( ** )

        List ALL user stories

        Format the PRD in valid markdown

Prepare the PRD using the following structure:

# Product Requirements Document (PRD) - {{app-name}}
## 1. Product Overview
## 2. User Problem
## 3. Functional Requirements
## 4. Product Boundaries
## 5. User Stories
## 6. Success Metrics

Remember to fill out each section with detailed, relevant information based on the project description and our clarifying questions. Make sure the PRD is comprehensive, clear, and includes all essential information needed for further product development.

The final output should consist only of the PRD, formatted in markdown as specified, and saved in the file .ai/prd.md.