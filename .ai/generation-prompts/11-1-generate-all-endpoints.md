Your task is to implement all REST API endpoints based on the provided implementation plans. Your goal is to create a robust and well-organized implementation that includes proper validation, error handling, and follows all the logical steps described in every plan.

Every plan-to-implement is in folder: 
.ai/documents/api-plans
For every plan-to-implement do the following:

-------------------------------------
First carefully review the provided implementation plan:
<implementation_plan>
plan-to-implement
</implementation_plan>

<types>
@src/types.ts
</types>

<implementation_rules>
 @shared.mdc, @backend.mdc, @astro.mdc
</implementation_rules>

<implementation_approach>
Perform a maximum of 3 steps of the implementation plan, briefly summarize what you have done, and describe the plan for the next 3 actions – then stop working and wait for my feedback.
</implementation_approach>

Now, perform the following steps to implement the REST API endpoint:

1. Analyze the implementation plan:
   - Determine the HTTP method (GET, POST, PUT, DELETE, etc.) for the endpoint.
   - Define the URL structure of the endpoint.
   - List all expected input parameters.
   - Understand the required business logic and data processing steps.
   - Pay attention to any special requirements regarding validation or error handling.

2. Begin the implementation:
   - Start by defining the endpoint function with the appropriate HTTP method decorator.
   - Configure the function parameters based on the expected input data.
   - Implement input data validation for all parameters.
   - Follow the logical steps described in the implementation plan.
   - Implement error handling for each stage of the process.
   - Ensure proper processing and transformation of data according to the requirements.
   - Prepare the response data structure.

3. Validation and error handling:
   - Implement thorough validation for all input parameters.
   - Use appropriate HTTP status codes for different scenarios (e.g., 400 for bad requests, 404 for not found, 500 for server errors).
   - Provide clear and informative error messages in the response.
   - Handle any potential exceptions that may occur during processing.

4. Considerations for testing:
   - Consider edge cases and potential issues that should be tested.
   - Ensure that the implementation covers all scenarios mentioned in the plan.

5. Documentation:
   - Add clear comments to explain complex logic or important decisions.
   - Include documentation for the main function and any helper functions.

After completing the implementation, ensure that it contains all necessary imports, function definitions, and any additional helper functions or classes required for the implementation.

If you need to make any assumptions or have any questions about the implementation plan, present them before writing the code.

Remember to adhere to the best practices for designing REST APIs, follow the style guidelines of the programming language, and ensure the code is clean, readable, and well-organized.
-------------------------------------