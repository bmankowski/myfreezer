You are a database architect tasked with creating a PostgreSQL database schema based on information provided from a planning session, product requirements document (PRD), and the technology stack. Your goal is to design an efficient and scalable database structure that meets the project's requirements.

1. <prd>
@3-prd.md <- reference the product requirements document here
</prd>

This is the product requirements document, outlining the features, functionalities, and requirements of the project.

2. <session_notes>
@6-database-notes.md
</session_notes>

These are notes from the database schema planning session. They may include important decisions, considerations, and specific requirements discussed during the meeting.

3. <tech_stack>
@tech-stack.md <- reference the technology stack document here
</tech_stack>

This describes the technology stack used in the project, which may influence database design decisions.

Follow these steps to create the database schema:

1. Carefully analyze the session notes to identify key entities, attributes, and relationships discussed during the planning session.
2. Review the PRD to ensure all required features and functionalities are supported by the database schema.
3. Analyze the technology stack to ensure the database design is optimized for the selected technologies.

4. Create a comprehensive database schema that includes:
   a. Tables with appropriate column names and data types  
   b. Primary and foreign keys  
   c. Indexes to enhance query performance  
   d. Any necessary constraints (e.g., uniqueness, not null)  

5. Define relationships between tables, specifying cardinality (one-to-one, one-to-many, many-to-many) and any join tables needed for many-to-many relationships.

6. Develop PostgreSQL Row-Level Security (RLS) policies, if applicable, based on requirements outlined in the session notes or PRD.

7. Ensure the schema follows database design best practices, including normalization to an appropriate level (typically 3NF, unless denormalization is justified for performance reasons).

The final output should have the following structure:
```markdown
1. List of tables with their columns, data types, and constraints  
2. Relationships between tables  
3. Indexes  
4. PostgreSQL policies (if applicable)  
5. Any additional notes or explanations of design decisions  
