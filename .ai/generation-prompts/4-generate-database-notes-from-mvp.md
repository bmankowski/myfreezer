You are an AI assistant tasked with helping plan a PostgreSQL database schema for an MVP (Minimum Viable Product) based on the provided information. Your goal is to generate a list of **questions** and **recommendations** that will be used in the next prompt to create the database schema, relationships, and row-level security (RLS) rules.

Please review the following inputs carefully:

<product_requirements>  
@3-prd.md <- reference to the product requirements document  
</product_requirements>

<tech_stack>  
@4-tech-stack.md  <- reference to the technology stack document  
</tech_stack>

Analyze the provided information with a focus on database design-relevant aspects. Consider the following:

1. Identify key entities and their attributes based on the product requirements.  
2. Determine potential relationships between entities.  
3. Consider data types and constraints that may be necessary.  
4. Think about scalability and performance impact.  
5. Assess security requirements and how they affect the database design.  
6. Consider any specific PostgreSQL features that might be beneficial for the project.

Based on your analysis, generate a list of **questions** and **recommendations**. These should address any ambiguities, potential issues, or areas where more information is needed in order to create an effective database schema. Consider asking about:

1. Entity relationships and cardinality  
2. Data types and constraints  
3. Indexing strategies  
4. Partitioning (if applicable)  
5. Row-level security requirements  
6. Performance considerations  
7. Scalability concerns  
8. Data integrity and consistency  

The output should follow this structure:

<database_planning_output>

<questions>  
[List your questions here, numbered]  
</questions>

<recommendations>  
[List your recommendations here, numbered]  
</recommendations>

</database_planning_output>

Remember, your goal is to provide a **comprehensive list of questions and recommendations** that will help create a solid PostgreSQL database schema for the MVP. Focus on clarity, relevance, and accuracy of your output. Do not include any additional commentary or explanation outside of the specified output format.

Continue this process, generating new questions and recommendations based on the provided context and the user's responses, until the user explicitly requests a summary.

Be sure to focus on clarity, relevance, and accuracy of your results. Do not include any extra comments or explanations outside of the specified output format.
