import { expect, test } from "@playwright/test";
import { api, testUser } from "../config/test-config";
import { createAuthHelper } from "../helpers/auth";

test.describe("API: Auth Login Endpoint", () => {
  test.describe("Valid authentication", () => {
    test("should login successfully with valid credentials", async ({ request }) => {
      const response = await request.post(api.endpoints.login, {
        data: {
          email: testUser.email,
          password: testUser.password,
        },
      });

      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("application/json");

      const body = await response.json();
      expect(body).toEqual({
        user: {
          user_id: expect.any(String),
          email: testUser.email,
        },
        message: "Login successful",
      });

      // Verify user ID is valid
      expect(body.user.user_id.length).toBeGreaterThan(0);
    });

    test("should set HTTP-only authentication cookies", async ({ request }) => {
      const response = await request.post(api.endpoints.login, {
        data: {
          email: testUser.email,
          password: testUser.password,
        },
      });

      expect(response.status()).toBe(200);

      const cookies = response.headers()["set-cookie"];
      expect(cookies).toBeTruthy();

      // Should contain session cookies
      expect(cookies).toContain("sb-access-token");
      expect(cookies).toContain("sb-refresh-token");
    });

    test("should authenticate user session after login", async ({ request }) => {
      const auth = createAuthHelper(request);

      // Login and verify authentication status
      await auth.loginAndVerify();
    });
  });

  test.describe("Invalid credentials", () => {
    test("should return 401 for wrong password", async ({ request }) => {
      const response = await request.post(api.endpoints.login, {
        data: {
          email: testUser.email,
          password: "wrongPassword123",
        },
      });

      expect(response.status()).toBe(401);
      expect(response.headers()["content-type"]).toContain("application/json");

      const body = await response.json();
      expect(body).toHaveProperty("error");
      expect(typeof body.error).toBe("string");
      expect(body.error.length).toBeGreaterThan(0);
    });

    test("should return 401 for non-existent email", async ({ request }) => {
      const response = await request.post(api.endpoints.login, {
        data: {
          email: "nonexistent@example.com",
          password: testUser.password,
        },
      });

      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body).toHaveProperty("error");
      expect(typeof body.error).toBe("string");
    });

    test("should return 400 for empty credentials", async ({ request }) => {
      const response = await request.post(api.endpoints.login, {
        data: {
          email: "",
          password: "",
        },
      });

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body).toHaveProperty("error");
    });
  });

  test.describe("Validation errors", () => {
    test("should return 400 for missing email", async ({ request }) => {
      const response = await request.post(api.endpoints.login, {
        data: {
          password: testUser.password,
        },
      });

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body).toHaveProperty("error");
      expect(typeof body.error).toBe("string");
    });

    test("should return 400 for missing password", async ({ request }) => {
      const response = await request.post(api.endpoints.login, {
        data: {
          email: testUser.email,
        },
      });

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body).toHaveProperty("error");
    });

    test("should return 400 for invalid email format", async ({ request }) => {
      const response = await request.post(api.endpoints.login, {
        data: {
          email: "invalid-email-format",
          password: testUser.password,
        },
      });

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body).toHaveProperty("error");
    });

    test("should handle malformed JSON gracefully", async ({ request }) => {
      const response = await request.post(api.endpoints.login, {
        data: "invalid-json-string",
      });

      expect([400, 422]).toContain(response.status());

      const body = await response.json();
      expect(body).toHaveProperty("error");
    });
  });

  test.describe("Unverified email scenarios", () => {
    test("should handle unverified email appropriately", async ({ request }) => {
      // This test would require a test user with unverified email
      // For now, we'll test that the endpoint handles this case
      const response = await request.post(api.endpoints.login, {
        data: {
          email: "unverified@example.com",
          password: "testPassword123",
        },
      });

      // Should return either 401 (user not found) or 403 (email not confirmed)
      expect([401, 403]).toContain(response.status());

      const body = await response.json();
      expect(body).toHaveProperty("error");
    });
  });

  test.describe("Security and edge cases", () => {
    test("should handle SQL injection attempts", async ({ request }) => {
      const response = await request.post(api.endpoints.login, {
        data: {
          email: "test@example.com'; DROP TABLE users; --",
          password: "password",
        },
      });

      expect(response.status()).toBe(400);

      const body = await response.json();
      expect(body).toHaveProperty("error");
    });

    test("should handle excessively long inputs", async ({ request }) => {
      const longString = "a".repeat(1000);

      const response = await request.post(api.endpoints.login, {
        data: {
          email: `${longString}@example.com`,
          password: longString,
        },
      });

      expect([400, 401]).toContain(response.status());

      const body = await response.json();
      expect(body).toHaveProperty("error");
    });

    test("should handle special characters in credentials", async ({ request }) => {
      const response = await request.post(api.endpoints.login, {
        data: {
          email: "test+special@example.com",
          password: "p@ssw0rd!#$%",
        },
      });

      expect(response.status()).toBe(401); // Should still validate and reject unknown user

      const body = await response.json();
      expect(body).toHaveProperty("error");
    });
  });

  test.describe("Performance", () => {
    test("should respond quickly for valid login", async ({ request }) => {
      const startTime = Date.now();

      const response = await request.post(api.endpoints.login, {
        data: {
          email: testUser.email,
          password: testUser.password,
        },
      });

      const duration = Date.now() - startTime;
      expect(response.status()).toBe(200);
      expect(duration).toBeLessThan(2000); // Should respond within 2 seconds
    });

    test("should respond quickly for invalid login", async ({ request }) => {
      const startTime = Date.now();

      const response = await request.post(api.endpoints.login, {
        data: {
          email: "invalid@example.com",
          password: "wrongpassword",
        },
      });

      const duration = Date.now() - startTime;
      expect(response.status()).toBe(401);
      expect(duration).toBeLessThan(2000); // Should respond within 2 seconds
    });

    test("should handle multiple concurrent login attempts", async ({ request }) => {
      const requests = Array(3)
        .fill(null)
        .map(() =>
          request.post(api.endpoints.login, {
            data: {
              email: testUser.email,
              password: testUser.password,
            },
          })
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status()).toBe(200);
      });

      const bodies = await Promise.all(responses.map((response) => response.json()));

      bodies.forEach((body) => {
        expect(body.message).toBe("Login successful");
        expect(body.user.email).toBe(testUser.email);
      });
    });
  });

  test.describe("Response validation", () => {
    test("should have correct response headers for successful login", async ({ request }) => {
      const response = await request.post(api.endpoints.login, {
        data: {
          email: testUser.email,
          password: testUser.password,
        },
      });

      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("application/json");

      // Should set authentication cookies
      const cookies = response.headers()["set-cookie"];
      expect(cookies).toBeTruthy();
    });

    test("should have correct response headers for failed login", async ({ request }) => {
      const response = await request.post(api.endpoints.login, {
        data: {
          email: "invalid@example.com",
          password: "wrongpassword",
        },
      });

      expect(response.status()).toBe(401);
      expect(response.headers()["content-type"]).toContain("application/json");
    });

    test("should return valid JSON structure for success", async ({ request }) => {
      const response = await request.post(api.endpoints.login, {
        data: {
          email: testUser.email,
          password: testUser.password,
        },
      });

      const body = await response.json();

      // Validate required fields
      expect(body).toHaveProperty("user");
      expect(body).toHaveProperty("message");

      // Validate user object structure
      expect(body.user).toHaveProperty("user_id");
      expect(body.user).toHaveProperty("email");

      // Validate types
      expect(typeof body.user.user_id).toBe("string");
      expect(typeof body.user.email).toBe("string");
      expect(typeof body.message).toBe("string");

      // Validate values
      expect(body.message).toBe("Login successful");
      expect(body.user.email).toBe(testUser.email);
    });

    test("should return valid JSON structure for errors", async ({ request }) => {
      const response = await request.post(api.endpoints.login, {
        data: {
          email: "invalid@example.com",
          password: "wrongpassword",
        },
      });

      const body = await response.json();

      // Validate error structure
      expect(body).toHaveProperty("error");
      expect(typeof body.error).toBe("string");
      expect(body.error.length).toBeGreaterThan(0);
    });
  });

  test.describe("Integration with auth flow", () => {
    test("should allow access to protected resources after login", async ({ request }) => {
      const auth = createAuthHelper(request);

      // Login
      await auth.login();

      // Verify authentication works with health endpoint
      const healthBody = await auth.verifyAuthenticated();
      expect(healthBody.authenticated).toBe(true);
      expect(healthBody.user_id).toBeTruthy();
    });

    test("should maintain session across multiple requests", async ({ request }) => {
      const auth = createAuthHelper(request);

      // Login
      await auth.login();

      // Make multiple authenticated requests
      const requests = Array(3)
        .fill(null)
        .map(() => request.get(api.endpoints.health));

      const responses = await Promise.all(requests);

      // All should show authenticated status
      const bodies = await Promise.all(responses.map((response) => response.json()));

      bodies.forEach((body) => {
        expect(body.authenticated).toBe(true);
        expect(body.user_id).toBeTruthy();
      });
    });
  });
});
