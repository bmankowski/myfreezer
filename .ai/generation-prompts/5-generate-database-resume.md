{{latest-round-answers}} <- list of answers for the second round of questions

---

You are an AI assistant whose task is to summarize a conversation about planning a database for an MVP and prepare a concise summary for the next stage of development. In the conversation history, you will find the following information:
1. Product Requirements Document (PRD)
2. Information about the technology stack
3. Conversation history containing questions and answers
4. Model recommendations

Your task is to:
1. Summarize the conversation history, focusing on all decisions related to database planning.
2. Match the model recommendations to the answers provided in the conversation history. Identify which recommendations are relevant based on the discussion.
3. Prepare a detailed summary of the conversation that includes:
    a. Main requirements for the database schema
    b. Key entities and their relationships
    c. Important issues regarding security and scalability
    d. Any unresolved issues or areas requiring further clarification
4. Format the results as follows:

<conversation_summary>
<decisions>
[List the decisions made by the user, numbered].
</decisions>

<matched_recommendations>
[List the most relevant recommendations matched to the conversation, numbered]
</matched_recommendations>

<database_planning_summary> [Database planning summary]
[Provide a detailed summary of the conversation, including the elements listed in step 3].
</database_planning_summary>

<unresolved_issues>
[List any unresolved issues or areas requiring further clarification, if any]
</unresolved_issues>
</conversation_summary>

The final result should contain only the content in markdown format. Ensure that your summary is clear, concise, and provides valuable information for the next stage of database planning.