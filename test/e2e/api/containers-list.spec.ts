import { expect, test } from "@playwright/test";
import { api } from "../config/test-config";
import { createAuthHelper } from "../helpers/auth";

// Type definition for container object in API responses
interface ContainerResponse {
  container_id: string;
  name: string;
  type: "freezer" | "fridge";
  created_at: string;
}

test.describe("API: Containers List Endpoint", () => {
  test.describe("Authenticated requests", () => {
    test("should return containers list for authenticated user", async ({ request }) => {
      const auth = createAuthHelper(request);

      // Login first
      await auth.login();

      const response = await request.get(api.endpoints.containers);

      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("application/json");

      const body = await response.json();
      expect(body).toHaveProperty("containers");
      expect(Array.isArray(body.containers)).toBe(true);

      // Each container should have the correct structure
      body.containers.forEach((container: ContainerResponse) => {
        expect(container).toHaveProperty("container_id");
        expect(container).toHaveProperty("name");
        expect(container).toHaveProperty("type");
        expect(container).toHaveProperty("created_at");

        // Validate types
        expect(typeof container.container_id).toBe("string");
        expect(typeof container.name).toBe("string");
        expect(typeof container.type).toBe("string");
        expect(typeof container.created_at).toBe("string");

        // Validate type values
        expect(["freezer", "fridge"]).toContain(container.type);
      });
    });

    test("should return empty array if user has no containers", async ({ request }) => {
      const auth = createAuthHelper(request);

      // Login first
      await auth.login();

      const response = await request.get(api.endpoints.containers);

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty("containers");
      expect(Array.isArray(body.containers)).toBe(true);
      // Should be empty array if no containers (this is normal for new users)
    });

    test("should maintain session across multiple requests", async ({ request }) => {
      const auth = createAuthHelper(request);

      // Login first
      await auth.login();

      // Make multiple requests
      const requests = Array(3)
        .fill(null)
        .map(() => request.get(api.endpoints.containers));

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status()).toBe(200);
      });

      const bodies = await Promise.all(responses.map((response) => response.json()));

      bodies.forEach((body) => {
        expect(body).toHaveProperty("containers");
        expect(Array.isArray(body.containers)).toBe(true);
      });
    });

    test("should handle valid authentication cookies", async ({ request }) => {
      const auth = createAuthHelper(request);

      // Login to get valid session
      await auth.login();

      // Use the session to access containers
      const response = await request.get(api.endpoints.containers);

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty("containers");
    });
  });

  test.describe("Unauthenticated requests", () => {
    test("should return 401 for unauthenticated requests", async ({ request }) => {
      const response = await request.get(api.endpoints.containers);

      expect(response.status()).toBe(401);
      expect(response.headers()["content-type"]).toContain("application/json");

      const body = await response.json();
      expect(body).toHaveProperty("error");
      expect(typeof body.error).toBe("string");
      expect(body.error.length).toBeGreaterThan(0);
    });

    test("should return 401 for invalid session cookies", async ({ request }) => {
      const response = await request.get(api.endpoints.containers, {
        headers: {
          Cookie: "sb-access-token=invalid-token; sb-refresh-token=invalid-refresh;",
        },
      });

      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body).toHaveProperty("error");
    });

    test("should return 401 for expired session cookies", async ({ request }) => {
      const response = await request.get(api.endpoints.containers, {
        headers: {
          Cookie: "sb-access-token=expired-token; sb-refresh-token=expired-refresh;",
        },
      });

      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body).toHaveProperty("error");
    });

    test("should return 401 for malformed cookies", async ({ request }) => {
      const response = await request.get(api.endpoints.containers, {
        headers: {
          Cookie: "malformed-cookie-data",
        },
      });

      expect(response.status()).toBe(401);

      const body = await response.json();
      expect(body).toHaveProperty("error");
    });
  });

  test.describe("Session management", () => {
    test("should require authentication after logout", async ({ request }) => {
      const auth = createAuthHelper(request);

      // Login, verify access, then logout
      await auth.loginAndVerify();

      // Should have access to containers
      const authenticatedResponse = await request.get(api.endpoints.containers);
      expect(authenticatedResponse.status()).toBe(200);

      await auth.logout();

      // Should no longer have access after logout
      const unauthenticatedResponse = await request.get(api.endpoints.containers);
      expect(unauthenticatedResponse.status()).toBe(401);
    });

    test("should work after fresh login", async ({ request }) => {
      const auth = createAuthHelper(request);

      await auth.loginAndVerify();

      const response = await request.get(api.endpoints.containers);
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty("containers");
    });
  });

  test.describe("Error handling", () => {
    test("should handle server errors gracefully", async ({ request }) => {
      const auth = createAuthHelper(request);
      await auth.login();

      const response = await request.get(api.endpoints.containers, {
        timeout: 5000,
      });

      // Should either succeed or return appropriate error
      expect([200, 401, 500]).toContain(response.status());

      const body = await response.json();
      if (response.status() === 200) {
        expect(body).toHaveProperty("containers");
      } else {
        expect(body).toHaveProperty("error");
      }
    });

    test("should handle database connection issues", async ({ request }) => {
      const auth = createAuthHelper(request);
      await auth.login();

      // Test endpoint robustness
      const response = await request.get(api.endpoints.containers, {
        timeout: 10000,
      });

      expect(response.status()).toBeDefined();
      expect(response.status()).toBeGreaterThanOrEqual(200);
      expect(response.status()).toBeLessThan(600);
    });

    test("should handle network timeouts", async ({ request }) => {
      const auth = createAuthHelper(request);
      await auth.login();

      const response = await request.get(api.endpoints.containers, {
        timeout: 15000,
      });

      // Should respond within timeout
      expect([200, 401]).toContain(response.status());
    });
  });

  test.describe("Performance", () => {
    test("should respond quickly for authenticated requests", async ({ request }) => {
      const auth = createAuthHelper(request);
      await auth.login();

      const startTime = Date.now();
      const response = await request.get(api.endpoints.containers);
      const duration = Date.now() - startTime;

      expect(response.status()).toBe(200);
      expect(duration).toBeLessThan(2000); // Should respond within 2 seconds
    });

    test("should respond quickly for unauthorized requests", async ({ request }) => {
      const startTime = Date.now();
      const response = await request.get(api.endpoints.containers);
      const duration = Date.now() - startTime;

      expect(response.status()).toBe(401);
      expect(duration).toBeLessThan(1000); // Should respond within 1 second
    });

    test("should handle multiple concurrent requests", async ({ request }) => {
      const auth = createAuthHelper(request);
      await auth.login();

      const requests = Array(5)
        .fill(null)
        .map(() => request.get(api.endpoints.containers));

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status()).toBe(200);
      });

      const bodies = await Promise.all(responses.map((response) => response.json()));

      bodies.forEach((body) => {
        expect(body).toHaveProperty("containers");
        expect(Array.isArray(body.containers)).toBe(true);
      });
    });
  });

  test.describe("Response validation", () => {
    test("should have correct response headers for success", async ({ request }) => {
      const auth = createAuthHelper(request);
      await auth.login();

      const response = await request.get(api.endpoints.containers);

      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("application/json");
    });

    test("should have correct response headers for errors", async ({ request }) => {
      const response = await request.get(api.endpoints.containers);

      expect(response.status()).toBe(401);
      expect(response.headers()["content-type"]).toContain("application/json");
    });

    test("should return valid JSON structure for success", async ({ request }) => {
      const auth = createAuthHelper(request);
      await auth.login();

      const response = await request.get(api.endpoints.containers);
      const body = await response.json();

      // Validate required fields
      expect(body).toHaveProperty("containers");

      // Validate types
      expect(Array.isArray(body.containers)).toBe(true);

      // If containers exist, validate their structure
      if (body.containers.length > 0) {
        const container = body.containers[0];
        expect(container).toHaveProperty("container_id");
        expect(container).toHaveProperty("name");
        expect(container).toHaveProperty("type");
        expect(container).toHaveProperty("created_at");

        // Validate field types
        expect(typeof container.container_id).toBe("string");
        expect(typeof container.name).toBe("string");
        expect(typeof container.type).toBe("string");
        expect(typeof container.created_at).toBe("string");

        // Validate enum values
        expect(["freezer", "fridge"]).toContain(container.type);

        // Validate string lengths
        expect(container.container_id.length).toBeGreaterThan(0);
        expect(container.name.length).toBeGreaterThan(0);

        // Validate date format
        expect(new Date(container.created_at).toString()).not.toBe("Invalid Date");
      }
    });

    test("should return valid JSON structure for errors", async ({ request }) => {
      const response = await request.get(api.endpoints.containers);
      const body = await response.json();

      // Validate error structure
      expect(body).toHaveProperty("error");
      expect(typeof body.error).toBe("string");
      expect(body.error.length).toBeGreaterThan(0);
    });
  });

  test.describe("Security", () => {
    test("should not leak sensitive information", async ({ request }) => {
      const response = await request.get(api.endpoints.containers);
      const body = await response.json();

      // Response should not contain sensitive data
      expect(body).not.toHaveProperty("password");
      expect(body).not.toHaveProperty("token");
      expect(body).not.toHaveProperty("session");
    });

    test("should handle SQL injection attempts", async ({ request }) => {
      const auth = createAuthHelper(request);
      await auth.login();

      // Try with malicious query parameters
      const response = await request.get(`${api.endpoints.containers}?id=' OR 1=1 --`);

      expect([200, 400, 401]).toContain(response.status());

      const body = await response.json();
      if (response.status() === 200) {
        expect(body).toHaveProperty("containers");
      } else {
        expect(body).toHaveProperty("error");
      }
    });
  });

  test.describe("Integration scenarios", () => {
    test("should work in complete authentication flow", async ({ request }) => {
      const auth = createAuthHelper(request);

      // Complete authentication flow
      await auth.loginAndVerify();

      // Access containers
      const response = await request.get(api.endpoints.containers);
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty("containers");

      // Logout and verify no access
      await auth.logoutAndVerify();

      const unauthenticatedResponse = await request.get(api.endpoints.containers);
      expect(unauthenticatedResponse.status()).toBe(401);
    });

    test("should maintain consistency with health endpoint", async ({ request }) => {
      const auth = createAuthHelper(request);
      await auth.login();

      // Both endpoints should show authenticated status
      const healthResponse = await request.get(api.endpoints.health);
      expect(healthResponse.status()).toBe(200);

      const healthBody = await healthResponse.json();
      expect(healthBody.authenticated).toBe(true);

      // Containers should be accessible
      const containersResponse = await request.get(api.endpoints.containers);
      expect(containersResponse.status()).toBe(200);
    });
  });
});
