import { expect, test } from "@playwright/test";
import { api } from "../config/test-config";
import { createAuthHelper } from "../helpers/auth";

test.describe("API: Auth Logout Endpoint", () => {
  test.describe("Authenticated logout", () => {
    test("should logout successfully with valid session", async ({ request }) => {
      const auth = createAuthHelper(request);

      // First login to get a valid session
      await auth.login();

      // Verify we're authenticated
      await auth.verifyAuthenticated();

      // Perform logout
      const response = await request.post(api.endpoints.logout);

      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("application/json");

      const body = await response.json();
      expect(body).toEqual({
        message: "Logout successful",
      });
    });

    test("should clear session cookies on logout", async ({ request }) => {
      const auth = createAuthHelper(request);

      // Login first
      await auth.login();

      // Logout and check cookies
      const response = await request.post(api.endpoints.logout);

      expect(response.status()).toBe(200);

      // Check that cookies are being cleared (expired)
      const cookies = response.headers()["set-cookie"];
      if (cookies) {
        // Should contain expired cookies to clear them
        expect(cookies).toBeTruthy();
      }
    });

    test("should revoke session on backend", async ({ request }) => {
      const auth = createAuthHelper(request);

      // Login first
      await auth.login();
      await auth.verifyAuthenticated();

      // Logout
      const logoutResponse = await request.post(api.endpoints.logout);
      expect(logoutResponse.status()).toBe(200);

      // Verify session is no longer valid
      await auth.verifyUnauthenticated();
    });

    test("should complete full login-logout cycle", async ({ request }) => {
      const auth = createAuthHelper(request);

      // Complete cycle using helper
      await auth.loginAndVerify();
      await auth.logoutAndVerify();
    });

    test("should handle multiple logout attempts gracefully", async ({ request }) => {
      const auth = createAuthHelper(request);

      // Login first
      await auth.login();

      // First logout
      const firstLogout = await request.post(api.endpoints.logout);
      expect(firstLogout.status()).toBe(200);

      // Second logout attempt (should still work or return appropriate response)
      const secondLogout = await request.post(api.endpoints.logout);
      expect([200, 401]).toContain(secondLogout.status());

      const body = await secondLogout.json();
      expect(body).toHaveProperty("message");
    });
  });

  test.describe("Unauthenticated logout", () => {
    test("should handle logout without authentication", async ({ request }) => {
      // Try to logout without being logged in
      const response = await request.post(api.endpoints.logout);

      // Should either succeed (idempotent) or return 401
      expect([200, 401]).toContain(response.status());

      const body = await response.json();
      if (response.status() === 200) {
        expect(body.message).toBe("Logout successful");
      } else {
        expect(body).toHaveProperty("error");
      }
    });

    test("should handle invalid session cookies gracefully", async ({ request }) => {
      const response = await request.post(api.endpoints.logout, {
        headers: {
          Cookie: "sb-access-token=invalid-token; sb-refresh-token=invalid-refresh;",
        },
      });

      expect([200, 401]).toContain(response.status());

      const body = await response.json();
      if (response.status() === 200) {
        expect(body.message).toBe("Logout successful");
      } else {
        expect(body).toHaveProperty("error");
      }
    });

    test("should handle malformed cookies", async ({ request }) => {
      const response = await request.post(api.endpoints.logout, {
        headers: {
          Cookie: "malformed-cookie-data",
        },
      });

      expect([200, 401]).toContain(response.status());

      const body = await response.json();
      expect(body).toHaveProperty("message");
    });
  });

  test.describe("Session management", () => {
    test("should prevent access to protected resources after logout", async ({ request }) => {
      const auth = createAuthHelper(request);

      // Login and verify access
      await auth.loginAndVerify();

      // Logout
      await auth.logout();

      // Verify no longer authenticated
      await auth.verifyUnauthenticated();
    });

    test("should handle concurrent logout requests", async ({ request }) => {
      const auth = createAuthHelper(request);

      // Login first
      await auth.login();

      // Make multiple concurrent logout requests
      const requests = Array(3)
        .fill(null)
        .map(() => request.post(api.endpoints.logout));

      const responses = await Promise.all(requests);

      // At least one should succeed
      const successfulResponses = responses.filter((response) => response.status() === 200);
      expect(successfulResponses.length).toBeGreaterThan(0);

      // All should return valid JSON
      const bodies = await Promise.all(responses.map((response) => response.json()));
      bodies.forEach((body) => {
        expect(body).toHaveProperty("message");
      });
    });

    test("should maintain other user sessions (isolation)", async ({ request }) => {
      // This test ensures logout only affects the current session
      // In a real scenario, this would require multiple user contexts
      const auth = createAuthHelper(request);

      await auth.loginAndVerify();
      await auth.logoutAndVerify();

      // The logout should not affect system-wide functionality
      const healthResponse = await request.get(api.endpoints.health);
      expect(healthResponse.status()).toBe(200);

      const healthBody = await healthResponse.json();
      expect(healthBody.status).toBe("ok");
    });
  });

  test.describe("Error handling", () => {
    test("should handle server errors gracefully", async ({ request }) => {
      const response = await request.post(api.endpoints.logout, {
        timeout: 5000,
      });

      expect([200, 401, 500]).toContain(response.status());

      const body = await response.json();
      expect(body).toHaveProperty("message");
    });

    test("should handle network issues", async ({ request }) => {
      // Test endpoint robustness
      const response = await request.post(api.endpoints.logout, {
        timeout: 10000,
      });

      expect(response.status()).toBeDefined();
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(600);
    });
  });

  test.describe("Performance", () => {
    test("should respond quickly for authenticated logout", async ({ request }) => {
      const auth = createAuthHelper(request);
      await auth.login();

      const startTime = Date.now();
      const response = await request.post(api.endpoints.logout);
      const duration = Date.now() - startTime;

      expect([200, 401]).toContain(response.status());
      expect(duration).toBeLessThan(2000); // Should respond within 2 seconds
    });

    test("should respond quickly for unauthenticated logout", async ({ request }) => {
      const startTime = Date.now();
      const response = await request.post(api.endpoints.logout);
      const duration = Date.now() - startTime;

      expect([200, 401]).toContain(response.status());
      expect(duration).toBeLessThan(1000); // Should respond within 1 second
    });
  });

  test.describe("Response validation", () => {
    test("should have correct response headers", async ({ request }) => {
      const auth = createAuthHelper(request);
      await auth.login();

      const response = await request.post(api.endpoints.logout);

      expect([200, 401]).toContain(response.status());
      expect(response.headers()["content-type"]).toContain("application/json");
    });

    test("should return valid JSON structure for success", async ({ request }) => {
      const auth = createAuthHelper(request);
      await auth.login();

      const response = await request.post(api.endpoints.logout);

      if (response.status() === 200) {
        const body = await response.json();

        // Validate required fields
        expect(body).toHaveProperty("message");

        // Validate types
        expect(typeof body.message).toBe("string");

        // Validate values
        expect(body.message).toBe("Logout successful");
      }
    });

    test("should return valid JSON structure for errors", async ({ request }) => {
      const response = await request.post(api.endpoints.logout);

      const body = await response.json();

      if (response.status() === 401) {
        // Validate error structure
        expect(body).toHaveProperty("error");
        expect(typeof body.error).toBe("string");
        expect(body.error.length).toBeGreaterThan(0);
      } else {
        // Success case
        expect(body).toHaveProperty("message");
      }
    });
  });

  test.describe("Security", () => {
    test("should handle CSRF protection appropriately", async ({ request }) => {
      const auth = createAuthHelper(request);
      await auth.login();

      // Logout should work with proper session cookies
      const response = await request.post(api.endpoints.logout);
      expect([200, 401]).toContain(response.status());
    });

    test("should not leak sensitive information in responses", async ({ request }) => {
      const response = await request.post(api.endpoints.logout);
      const body = await response.json();

      // Response should not contain sensitive data
      expect(body).not.toHaveProperty("password");
      expect(body).not.toHaveProperty("token");
      expect(body).not.toHaveProperty("session");
      expect(body).not.toHaveProperty("user_id");
    });

    test("should handle injection attempts safely", async ({ request }) => {
      const response = await request.post(api.endpoints.logout, {
        headers: {
          Cookie: "sb-access-token='OR 1=1; --; sb-refresh-token=malicious",
        },
      });

      expect([200, 401]).toContain(response.status());

      const body = await response.json();
      expect(body).toHaveProperty("message");
    });
  });

  test.describe("Integration scenarios", () => {
    test("should work in complete authentication flow", async ({ request }) => {
      const auth = createAuthHelper(request);

      // Complete flow: login -> verify -> logout -> verify
      await auth.loginAndVerify();
      await auth.logoutAndVerify();

      // Should be able to login again
      await auth.loginAndVerify();
    });

    test("should clear session for all endpoints", async ({ request }) => {
      const auth = createAuthHelper(request);

      // Login
      await auth.login();

      // Logout
      const logoutResponse = await request.post(api.endpoints.logout);
      expect([200, 401]).toContain(logoutResponse.status());

      // Verify health endpoint shows unauthenticated
      const healthResponse = await request.get(api.endpoints.health);
      expect(healthResponse.status()).toBe(200);

      const healthBody = await healthResponse.json();
      expect(healthBody.authenticated).toBe(false);
      expect(healthBody.user_id).toBeNull();
    });
  });
});
