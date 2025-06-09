import { test } from "@playwright/test";

test.describe("API: Auth Register Endpoint", () => {
  // Helper function to generate unique test emails
  // const generateTestEmail = () => `test-${Date.now()}-${Math.random().toString(36).substring(7)}@gmail.com`;
  // test.describe("Valid registration", () => {
  //   test("should register successfully with valid data", async ({ request }) => {
  //     const testEmail = generateTestEmail();
  //     const response = await request.post(api.endpoints.register, {
  //       data: {
  //         email: testEmail,
  //         password: "SecurePass123",
  //         confirmPassword: "SecurePass123",
  //         firstName: "John",
  //         lastName: "Doe",
  //       },
  //     });
  //     // Accept both success and rate limit responses
  //     expect([201, 429, 500]).toContain(response.status());
  //     expect(response.headers()["content-type"]).toContain("application/json");
  //     const body = await response.json();
  //     if (response.status() === 201) {
  //       // Successful registration
  //       expect(body).toEqual({
  //         user: {
  //           user_id: expect.any(String),
  //           email: testEmail,
  //           firstName: "John",
  //           lastName: "Doe",
  //         },
  //         message: expect.any(String),
  //         email_confirmation_required: expect.any(Boolean),
  //       });
  //       // Verify user ID is valid
  //       expect(body.user.user_id.length).toBeGreaterThan(0);
  //     } else {
  //       // Rate limit hit - this is expected in test environments
  //       expect(body).toHaveProperty("error");
  //       expect(body.error).toMatch(/rate limit|too many|exceeded/i);
  //     }
  //   });
  //   test("should handle email confirmation requirement correctly", async ({ request }) => {
  //     const testEmail = generateTestEmail();
  //     const response = await request.post(api.endpoints.register, {
  //       data: {
  //         email: testEmail,
  //         password: "SecurePass123",
  //         confirmPassword: "SecurePass123",
  //         firstName: "Jane",
  //         lastName: "Smith",
  //       },
  //     });
  //     expect([201, 429, 500]).toContain(response.status());
  //     const body = await response.json();
  //     if (response.status() === 201) {
  //       expect(body.message).toBe("Registration successful. Please check your email for verification.");
  //       expect(typeof body.email_confirmation_required).toBe("boolean");
  //     } else {
  //       expect(body).toHaveProperty("error");
  //       expect(body.error).toMatch(/rate limit|too many|exceeded/i);
  //     }
  //   });
  //   test("should set authentication cookies if user is auto-confirmed", async ({ request }) => {
  //     const testEmail = generateTestEmail();
  //     const response = await request.post(api.endpoints.register, {
  //       data: {
  //         email: testEmail,
  //         password: "SecurePass123",
  //         confirmPassword: "SecurePass123",
  //         firstName: "Auto",
  //         lastName: "Confirmed",
  //       },
  //     });
  //     expect([201, 429, 500]).toContain(response.status());
  //     if (response.status() === 201) {
  //       // Check if cookies are set (they may or may not be depending on configuration)
  //       const cookies = response.headers()["set-cookie"];
  //       if (cookies) {
  //         expect(cookies).toBeTruthy();
  //       }
  //     } else {
  //       const body = await response.json();
  //       expect(body).toHaveProperty("error");
  //       expect(body.error).toMatch(/rate limit|too many|exceeded/i);
  //     }
  //   });
  //   test("should handle special characters in names", async ({ request }) => {
  //     const testEmail = generateTestEmail();
  //     const response = await request.post(api.endpoints.register, {
  //       data: {
  //         email: testEmail,
  //         password: "SecurePass123",
  //         confirmPassword: "SecurePass123",
  //         firstName: "Mary-Anne",
  //         lastName: "O'Connor-Smith",
  //       },
  //     });
  //     expect([201, 429, 500]).toContain(response.status());
  //     const body = await response.json();
  //     if (response.status() === 201) {
  //       expect(body.user.firstName).toBe("Mary-Anne");
  //       expect(body.user.lastName).toBe("O'Connor-Smith");
  //     } else {
  //       expect(body).toHaveProperty("error");
  //       expect(body.error).toMatch(/rate limit|too many|exceeded/i);
  //     }
  //   });
  // });
  // test.describe("Duplicate email handling", () => {
  //   test("should return 409 for existing email address", async ({ request }) => {
  //     const testEmail = generateTestEmail();
  //     // First registration
  //     const firstResponse = await request.post(api.endpoints.register, {
  //       data: {
  //         email: testEmail,
  //         password: "SecurePass123",
  //         confirmPassword: "SecurePass123",
  //         firstName: "First",
  //         lastName: "User",
  //       },
  //     });
  //     expect([201, 429, 500]).toContain(firstResponse.status());
  //     // Only proceed with duplicate test if first registration succeeded
  //     if (firstResponse.status() === 201) {
  //       // Second registration with same email
  //       const secondResponse = await request.post(api.endpoints.register, {
  //         data: {
  //           email: testEmail,
  //           password: "DifferentPass456",
  //           confirmPassword: "DifferentPass456",
  //           firstName: "Second",
  //           lastName: "User",
  //         },
  //       });
  //       expect([409, 429, 500]).toContain(secondResponse.status());
  //       const body = await secondResponse.json();
  //       expect(body).toHaveProperty("error");
  //       if (secondResponse.status() === 409) {
  //         expect(body.error).toContain("already exists");
  //       } else {
  //         expect(body.error).toMatch(/rate limit|too many|exceeded/i);
  //       }
  //     } else {
  //       // First registration hit rate limit - skip duplicate test
  //       const body = await firstResponse.json();
  //       expect(body).toHaveProperty("error");
  //       expect(body.error).toMatch(/rate limit|too many|exceeded/i);
  //     }
  //   });
  // });
  // test.describe("Password validation", () => {
  //   test("should return 400 for password mismatch", async ({ request }) => {
  //     const testEmail = generateTestEmail();
  //     const response = await request.post(api.endpoints.register, {
  //       data: {
  //         email: testEmail,
  //         password: "SecurePass123",
  //         confirmPassword: "DifferentPass456",
  //         firstName: "John",
  //         lastName: "Doe",
  //       },
  //     });
  //     expect(response.status()).toBe(400);
  //     const body = await response.json();
  //     expect(body).toHaveProperty("error");
  //     expect(body.error).toContain("Passwords do not match");
  //   });
  // test("should return 400 for weak password", async ({ request }) => {
  //   const testEmail = generateTestEmail();
  //   const response = await request.post(api.endpoints.register, {
  //     data: {
  //       email: testEmail,
  //       password: "weak",
  //       confirmPassword: "weak",
  //       firstName: "John",
  //       lastName: "Doe",
  //     },
  //   });
  //   expect(response.status()).toBe(400);
  //   const body = await response.json();
  //   expect(body).toHaveProperty("error");
  //   expect(body.error).toContain("Password must");
  // });
  // test("should return 400 for password without uppercase", async ({ request }) => {
  //   const testEmail = generateTestEmail();
  //   const response = await request.post(api.endpoints.register, {
  //     data: {
  //       email: testEmail,
  //       password: "lowercase123",
  //       confirmPassword: "lowercase123",
  //       firstName: "John",
  //       lastName: "Doe",
  //     },
  //   });
  //   expect(response.status()).toBe(400);
  //   const body = await response.json();
  //   expect(body).toHaveProperty("error");
  //   expect(body.error).toContain("uppercase");
  // });
  // test("should return 400 for password without lowercase", async ({ request }) => {
  //   const testEmail = generateTestEmail();
  //   const response = await request.post(api.endpoints.register, {
  //     data: {
  //       email: testEmail,
  //       password: "UPPERCASE123",
  //       confirmPassword: "UPPERCASE123",
  //       firstName: "John",
  //       lastName: "Doe",
  //     },
  //   });
  //   expect(response.status()).toBe(400);
  //   const body = await response.json();
  //   expect(body).toHaveProperty("error");
  //   expect(body.error).toContain("lowercase");
  // });
  // test("should return 400 for password without numbers", async ({ request }) => {
  //   const testEmail = generateTestEmail();
  //   const response = await request.post(api.endpoints.register, {
  //     data: {
  //       email: testEmail,
  //       password: "NoNumbers",
  //       confirmPassword: "NoNumbers",
  //       firstName: "John",
  //       lastName: "Doe",
  //     },
  //   });
  //   expect(response.status()).toBe(400);
  //   const body = await response.json();
  //   expect(body).toHaveProperty("error");
  //   expect(body.error).toContain("number");
  // });
  //   test("should return 400 for excessively long password", async ({ request }) => {
  //     const testEmail = generateTestEmail();
  //     const longPassword = "A".repeat(130) + "1a"; // 132 characters
  //     const response = await request.post(api.endpoints.register, {
  //       data: {
  //         email: testEmail,
  //         password: longPassword,
  //         confirmPassword: longPassword,
  //         firstName: "John",
  //         lastName: "Doe",
  //       },
  //     });
  //     expect(response.status()).toBe(400);
  //     const body = await response.json();
  //     expect(body).toHaveProperty("error");
  //     expect(body.error).toContain("128 characters");
  //   });
  // });
  // test.describe("Email validation", () => {
  //   test("should return 400 for invalid email format", async ({ request }) => {
  //     const response = await request.post(api.endpoints.register, {
  //       data: {
  //         email: "invalid-email-format",
  //         password: "SecurePass123",
  //         confirmPassword: "SecurePass123",
  //         firstName: "John",
  //         lastName: "Doe",
  //       },
  //     });
  //     expect(response.status()).toBe(400);
  //     const body = await response.json();
  //     expect(body).toHaveProperty("error");
  //     expect(body.error).toContain("email");
  //   });
  //   test("should return 400 for empty email", async ({ request }) => {
  //     const response = await request.post(api.endpoints.register, {
  //       data: {
  //         email: "",
  //         password: "SecurePass123",
  //         confirmPassword: "SecurePass123",
  //         firstName: "John",
  //         lastName: "Doe",
  //       },
  //     });
  //     expect(response.status()).toBe(400);
  //     const body = await response.json();
  //     expect(body).toHaveProperty("error");
  //   });
  //   test("should return 400 for excessively long email", async ({ request }) => {
  //     const longEmail = "a".repeat(250) + "@gmail.com"; // Over 255 characters
  //     const response = await request.post(api.endpoints.register, {
  //       data: {
  //         email: longEmail,
  //         password: "SecurePass123",
  //         confirmPassword: "SecurePass123",
  //         firstName: "John",
  //         lastName: "Doe",
  //       },
  //     });
  //     expect(response.status()).toBe(400);
  //     const body = await response.json();
  //     expect(body).toHaveProperty("error");
  //     expect(body.error).toContain("255 characters");
  //   });
  //   test("should handle email case normalization", async ({ request }) => {
  //     const testEmail = generateTestEmail().toUpperCase();
  //     const response = await request.post(api.endpoints.register, {
  //       data: {
  //         email: testEmail,
  //         password: "SecurePass123",
  //         confirmPassword: "SecurePass123",
  //         firstName: "John",
  //         lastName: "Doe",
  //       },
  //     });
  //     expect([201, 429, 500]).toContain(response.status());
  //     const body = await response.json();
  //     if (response.status() === 201) {
  //       expect(body.user.email).toBe(testEmail.toLowerCase());
  //     } else {
  //       expect(body).toHaveProperty("error");
  //       expect(body.error).toMatch(/rate limit|too many|exceeded/i);
  //     }
  //   });
  // });
  // test.describe("Name validation", () => {
  //   test("should return 400 for missing first name", async ({ request }) => {
  //     const testEmail = generateTestEmail();
  //     const response = await request.post(api.endpoints.register, {
  //       data: {
  //         email: testEmail,
  //         password: "SecurePass123",
  //         confirmPassword: "SecurePass123",
  //         lastName: "Doe",
  //       },
  //     });
  //     expect(response.status()).toBe(400);
  //     const body = await response.json();
  //     expect(body).toHaveProperty("error");
  //     expect(body.error).toContain("firstName");
  //   });
  //   test("should return 400 for missing last name", async ({ request }) => {
  //     const testEmail = generateTestEmail();
  //     const response = await request.post(api.endpoints.register, {
  //       data: {
  //         email: testEmail,
  //         password: "SecurePass123",
  //         confirmPassword: "SecurePass123",
  //         firstName: "John",
  //       },
  //     });
  //     expect(response.status()).toBe(400);
  //     const body = await response.json();
  //     expect(body).toHaveProperty("error");
  //     expect(body.error).toContain("lastName");
  //   });
  //   test("should return 400 for empty first name", async ({ request }) => {
  //     const testEmail = generateTestEmail();
  //     const response = await request.post(api.endpoints.register, {
  //       data: {
  //         email: testEmail,
  //         password: "SecurePass123",
  //         confirmPassword: "SecurePass123",
  //         firstName: "",
  //         lastName: "Doe",
  //       },
  //     });
  //     expect(response.status()).toBe(400);
  //     const body = await response.json();
  //     expect(body).toHaveProperty("error");
  //     expect(body.error).toContain("firstName");
  //   });
  //   test("should return 400 for excessively long first name", async ({ request }) => {
  //     const testEmail = generateTestEmail();
  //     const longName = "a".repeat(51);
  //     const response = await request.post(api.endpoints.register, {
  //       data: {
  //         email: testEmail,
  //         password: "SecurePass123",
  //         confirmPassword: "SecurePass123",
  //         firstName: longName,
  //         lastName: "Doe",
  //       },
  //     });
  //     expect(response.status()).toBe(400);
  //     const body = await response.json();
  //     expect(body).toHaveProperty("error");
  //     expect(body.error).toContain("50 characters");
  //   });
  //   test("should return 400 for invalid characters in first name", async ({ request }) => {
  //     const testEmail = generateTestEmail();
  //     const response = await request.post(api.endpoints.register, {
  //       data: {
  //         email: testEmail,
  //         password: "SecurePass123",
  //         confirmPassword: "SecurePass123",
  //         firstName: "John123",
  //         lastName: "Doe",
  //       },
  //     });
  //     expect(response.status()).toBe(400);
  //     const body = await response.json();
  //     expect(body).toHaveProperty("error");
  //     expect(body.error).toContain("invalid characters");
  //   });
  // });
  // test.describe("Request validation", () => {
  //   test("should return 400 for missing request body", async ({ request }) => {
  //     const response = await request.post(api.endpoints.register);
  //     expect(response.status()).toBe(400);
  //     const body = await response.json();
  //     expect(body).toHaveProperty("error");
  //   });
  //   test("should return 400 for malformed JSON", async ({ request }) => {
  //     const response = await request.post(api.endpoints.register, {
  //       data: "invalid-json-string",
  //     });
  //     expect([400, 422]).toContain(response.status());
  //     const body = await response.json();
  //     expect(body).toHaveProperty("error");
  //   });
  //   test("should return 400 for missing password", async ({ request }) => {
  //     const testEmail = generateTestEmail();
  //     const response = await request.post(api.endpoints.register, {
  //       data: {
  //         email: testEmail,
  //         confirmPassword: "SecurePass123",
  //         firstName: "John",
  //         lastName: "Doe",
  //       },
  //     });
  //     expect(response.status()).toBe(400);
  //     const body = await response.json();
  //     expect(body).toHaveProperty("error");
  //   });
  //   test("should return 400 for missing confirmPassword", async ({ request }) => {
  //     const testEmail = generateTestEmail();
  //     const response = await request.post(api.endpoints.register, {
  //       data: {
  //         email: testEmail,
  //         password: "SecurePass123",
  //         firstName: "John",
  //         lastName: "Doe",
  //       },
  //     });
  //     expect(response.status()).toBe(400);
  //     const body = await response.json();
  //     expect(body).toHaveProperty("error");
  //   });
  // });
  // test.describe("Security and edge cases", () => {
  //   test("should handle SQL injection attempts in email", async ({ request }) => {
  //     const response = await request.post(api.endpoints.register, {
  //       data: {
  //         email: "test@gmail.com'; DROP TABLE users; --",
  //         password: "SecurePass123",
  //         confirmPassword: "SecurePass123",
  //         firstName: "John",
  //         lastName: "Doe",
  //       },
  //     });
  //     expect(response.status()).toBe(400);
  //     const body = await response.json();
  //     expect(body).toHaveProperty("error");
  //   });
  //   test("should handle SQL injection attempts in names", async ({ request }) => {
  //     const testEmail = generateTestEmail();
  //     const response = await request.post(api.endpoints.register, {
  //       data: {
  //         email: testEmail,
  //         password: "SecurePass123",
  //         confirmPassword: "SecurePass123",
  //         firstName: "John'; DROP TABLE users; --",
  //         lastName: "Doe",
  //       },
  //     });
  //     expect(response.status()).toBe(400);
  //     const body = await response.json();
  //     expect(body).toHaveProperty("error");
  //     expect(body.error).toContain("invalid characters");
  //   });
  //   test("should handle XSS attempts in names", async ({ request }) => {
  //     const testEmail = generateTestEmail();
  //     const response = await request.post(api.endpoints.register, {
  //       data: {
  //         email: testEmail,
  //         password: "SecurePass123",
  //         confirmPassword: "SecurePass123",
  //         firstName: "<script>alert('xss')</script>",
  //         lastName: "Doe",
  //       },
  //     });
  //     expect(response.status()).toBe(400);
  //     const body = await response.json();
  //     expect(body).toHaveProperty("error");
  //     expect(body.error).toContain("invalid characters");
  //   });
  //   test("should handle Unicode characters appropriately", async ({ request }) => {
  //     const testEmail = generateTestEmail();
  //     const response = await request.post(api.endpoints.register, {
  //       data: {
  //         email: testEmail,
  //         password: "SecurePass123",
  //         confirmPassword: "SecurePass123",
  //         firstName: "Józef",
  //         lastName: "Kowalski",
  //       },
  //     });
  //     expect([201, 429, 500]).toContain(response.status());
  //     const body = await response.json();
  //     if (response.status() === 201) {
  //       expect(body.user.firstName).toBe("Józef");
  //       expect(body.user.lastName).toBe("Kowalski");
  //     } else {
  //       expect(body).toHaveProperty("error");
  //       expect(body.error).toMatch(/rate limit|too many|exceeded/i);
  //     }
  //   });
  // });
  // test.describe("Performance", () => {
  //   test("should respond quickly for valid registration", async ({ request }) => {
  //     const testEmail = generateTestEmail();
  //     const startTime = Date.now();
  //     const response = await request.post(api.endpoints.register, {
  //       data: {
  //         email: testEmail,
  //         password: "SecurePass123",
  //         confirmPassword: "SecurePass123",
  //         firstName: "John",
  //         lastName: "Doe",
  //       },
  //     });
  //     const duration = Date.now() - startTime;
  //     expect([201, 429, 500]).toContain(response.status());
  //     expect(duration).toBeLessThan(3000); // Should respond within 3 seconds
  //   });
  //   test("should respond quickly for validation errors", async ({ request }) => {
  //     const startTime = Date.now();
  //     const response = await request.post(api.endpoints.register, {
  //       data: {
  //         email: "invalid-email",
  //         password: "weak",
  //         confirmPassword: "different",
  //         firstName: "",
  //         lastName: "",
  //       },
  //     });
  //     const duration = Date.now() - startTime;
  //     expect(response.status()).toBe(400);
  //     expect(duration).toBeLessThan(1000); // Should respond within 1 second for validation
  //   });
  //   test("should handle multiple concurrent registration attempts", async ({ request }) => {
  //     const requests = Array(3)
  //       .fill(null)
  //       .map(() => {
  //         const testEmail = generateTestEmail();
  //         return request.post(api.endpoints.register, {
  //           data: {
  //             email: testEmail,
  //             password: "SecurePass123",
  //             confirmPassword: "SecurePass123",
  //             firstName: "Concurrent",
  //             lastName: "User",
  //           },
  //         });
  //       });
  //     const responses = await Promise.all(requests);
  //     responses.forEach((response) => {
  //       expect([201, 429, 500]).toContain(response.status());
  //     });
  //     const bodies = await Promise.all(responses.map((response) => response.json()));
  //     bodies.forEach((body, index) => {
  //       const response = responses[index];
  //       if (response.status() === 201) {
  //         expect(body.message).toBe("Registration successful. Please check your email for verification.");
  //         expect(body.user.firstName).toBe("Concurrent");
  //         expect(body.user.lastName).toBe("User");
  //       } else {
  //         expect(body).toHaveProperty("error");
  //         expect(body.error).toMatch(/rate limit|too many|exceeded/i);
  //       }
  //     });
  //   });
  // });
  // test.describe("Response validation", () => {
  //   test("should have correct response headers for successful registration", async ({ request }) => {
  //     const testEmail = generateTestEmail();
  //     const response = await request.post(api.endpoints.register, {
  //       data: {
  //         email: testEmail,
  //         password: "SecurePass123",
  //         confirmPassword: "SecurePass123",
  //         firstName: "John",
  //         lastName: "Doe",
  //       },
  //     });
  //     expect([201, 429, 500]).toContain(response.status());
  //     expect(response.headers()["content-type"]).toContain("application/json");
  //   });
  //   test("should have correct response headers for validation errors", async ({ request }) => {
  //     const response = await request.post(api.endpoints.register, {
  //       data: {
  //         email: "invalid-email",
  //         password: "weak",
  //         confirmPassword: "different",
  //         firstName: "",
  //         lastName: "",
  //       },
  //     });
  //     expect(response.status()).toBe(400);
  //     expect(response.headers()["content-type"]).toContain("application/json");
  //   });
  //   test("should return valid JSON structure for success", async ({ request }) => {
  //     const testEmail = generateTestEmail();
  //     const response = await request.post(api.endpoints.register, {
  //       data: {
  //         email: testEmail,
  //         password: "SecurePass123",
  //         confirmPassword: "SecurePass123",
  //         firstName: "John",
  //         lastName: "Doe",
  //       },
  //     });
  //     expect([201, 429, 500]).toContain(response.status());
  //     const body = await response.json();
  //     if (response.status() === 201) {
  //       // Validate required fields
  //       expect(body).toHaveProperty("user");
  //       expect(body).toHaveProperty("message");
  //       expect(body).toHaveProperty("email_confirmation_required");
  //       // Validate user object structure
  //       expect(body.user).toHaveProperty("user_id");
  //       expect(body.user).toHaveProperty("email");
  //       expect(body.user).toHaveProperty("firstName");
  //       expect(body.user).toHaveProperty("lastName");
  //       // Validate types
  //       expect(typeof body.user.user_id).toBe("string");
  //       expect(typeof body.user.email).toBe("string");
  //       expect(typeof body.user.firstName).toBe("string");
  //       expect(typeof body.user.lastName).toBe("string");
  //       expect(typeof body.message).toBe("string");
  //       expect(typeof body.email_confirmation_required).toBe("boolean");
  //       // Validate values
  //       expect(body.user.email).toBe(testEmail);
  //       expect(body.user.firstName).toBe("John");
  //       expect(body.user.lastName).toBe("Doe");
  //       expect(body.message.length).toBeGreaterThan(0);
  //     } else {
  //       // Rate limit response
  //       expect(body).toHaveProperty("error");
  //       expect(body.error).toMatch(/rate limit|too many|exceeded/i);
  //     }
  //   });
  //   test("should return valid JSON structure for errors", async ({ request }) => {
  //     const response = await request.post(api.endpoints.register, {
  //       data: {
  //         email: "invalid-email",
  //         password: "weak",
  //         confirmPassword: "different",
  //         firstName: "",
  //         lastName: "",
  //       },
  //     });
  //     const body = await response.json();
  //     // Validate error structure
  //     expect(body).toHaveProperty("error");
  //     expect(typeof body.error).toBe("string");
  //     expect(body.error.length).toBeGreaterThan(0);
  //   });
  // });
  // test.describe("Integration scenarios", () => {
  //   test("should not allow authentication with unconfirmed email", async ({ request }) => {
  //     const testEmail = generateTestEmail();
  //     // Register user
  //     const registerResponse = await request.post(api.endpoints.register, {
  //       data: {
  //         email: testEmail,
  //         password: "SecurePass123",
  //         confirmPassword: "SecurePass123",
  //         firstName: "Unconfirmed",
  //         lastName: "User",
  //       },
  //     });
  //     expect([201, 429, 500]).toContain(registerResponse.status());
  //     const registerBody = await registerResponse.json();
  //     if (registerResponse.status() === 201 && registerBody.email_confirmation_required) {
  //       // Try to login with unconfirmed email (should fail)
  //       const loginResponse = await request.post(api.endpoints.login, {
  //         data: {
  //           email: testEmail,
  //           password: "SecurePass123",
  //         },
  //       });
  //       expect([401, 403, 500]).toContain(loginResponse.status());
  //       const loginBody = await loginResponse.json();
  //       expect(loginBody).toHaveProperty("error");
  //     } else {
  //       // Registration hit rate limit or user was auto-confirmed - skip login test
  //       expect(registerBody).toHaveProperty("error");
  //       if (registerResponse.status() !== 201) {
  //         expect(registerBody.error).toMatch(/rate limit|too many|exceeded/i);
  //       }
  //     }
  //   });
  // });
});
