You are an AI assistant tasked with summarizing the conversation about planning the UI architecture for an MVP and preparing a concise summary for the next development stage. The conversation history contains the following information:

    Product Requirements Document (PRD)
    .ai/documents/3-prd.md

    Information about the tech stack
    .ai/documents/tech-stack.md

    API plan
    .ai/documents/8-api-plan.md

    Conversation history containing questions and answers
    .ai/documents/11-ui-questions-answers

    UI architecture recommendations
    .ai/documents/12-ui-architecture-plan.md

Your task is to:

    Summarize the conversation history, focusing on all decisions related to UI architecture planning.

    Match the model's recommendations with the answers provided during the conversation. Identify which recommendations are relevant based on the discussion.

    Prepare a detailed conversation summary, which should include: a. Main requirements regarding the UI architecture
    b. Key views, screens, and user flows
    c. Strategy for API integration and state management
    d. Issues concerning responsiveness, accessibility, and security
    e. Any unresolved questions or areas requiring further clarification

    Format the output as follows:

<conversation_summary>
<decisions>
[List decisions made by the user, numbered].
</decisions>
<matched_recommendations>
[List the most relevant recommendations matched to the conversation, numbered].
</matched_recommendations>
<ui_architecture_planning_summary>
[Provide a detailed summary of the conversation, including the elements listed in step 3].
</ui_architecture_planning_summary>
<unresolved_issues>
[List any unresolved questions or areas requiring further clarification, if any].
</unresolved_issues>
</conversation_summary>

The final output should only contain content in markdown format written to file 13-ui-resume-of-planning-session.md  
Make sure your summary is clear, concise, and provides valuable information for the next stage of UI architecture planning and API integration.
