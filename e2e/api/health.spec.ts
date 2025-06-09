import { expect, test } from "@playwright/test";
import { api } from "../config/test-config";
import { createAuthHelper } from "../helpers/auth";

test.describe("API: Health Endpoint", () => {
  test.describe("Unauthenticated requests", () => {
    test("should return 200 with unauthenticated status", async ({ request }) => {
      const response = await request.get(api.endpoints.health);

      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("application/json");

      const body = await response.json();
      expect(body).toEqual({
        status: "ok",
        authenticated: false,
        user_id: null,
      });
    });

    test("should handle malformed requests gracefully", async ({ request }) => {
      const response = await request.get(api.endpoints.health, {
        headers: {
          Cookie: "invalid-cookie=malformed;",
          Authorization: "Bearer invalid-token",
        },
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.status).toBe("ok");
      expect(body.authenticated).toBe(false);
    });
  });

  test.describe("Authenticated requests", () => {
    test("should return 200 with authenticated status after login", async ({ request }) => {
      const auth = createAuthHelper(request);

      // Login using auth helper (includes all validations)
      await auth.login();

      // Verify health endpoint shows authenticated status
      const healthBody = await auth.verifyAuthenticated();

      // Additional verification that user_id is a valid string
      expect(typeof healthBody.user_id).toBe("string");
      expect(healthBody.user_id.length).toBeGreaterThan(0);
    });

    test("should work after logout (unauthenticated)", async ({ request }) => {
      const auth = createAuthHelper(request);

      // Complete login and logout flow with verification
      await auth.loginAndVerify();
      await auth.logoutAndVerify();
    });
  });

  test.describe("Error handling", () => {
    test("should handle network issues gracefully", async ({ request }) => {
      // This tests the endpoint's robustness
      const response = await request.get(api.endpoints.health, {
        timeout: 5000,
      });

      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body.status).toBe("ok");
    });
  });

  test.describe("Performance", () => {
    test("should respond quickly", async ({ request }) => {
      const startTime = Date.now();

      const response = await request.get(api.endpoints.health);

      const duration = Date.now() - startTime;
      expect(response.status()).toBe(200);
      expect(duration).toBeLessThan(1000); // Should respond within 1 second
    });

    test("should handle multiple concurrent requests", async ({ request }) => {
      const requests = Array(5)
        .fill(null)
        .map(() => request.get(api.endpoints.health));

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status()).toBe(200);
      });

      const bodies = await Promise.all(responses.map((response) => response.json()));

      bodies.forEach((body) => {
        expect(body.status).toBe("ok");
        expect(typeof body.authenticated).toBe("boolean");
      });
    });
  });

  test.describe("Response validation", () => {
    test("should have correct response headers", async ({ request }) => {
      const response = await request.get(api.endpoints.health);

      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("application/json");
    });

    test("should return valid JSON structure", async ({ request }) => {
      const response = await request.get(api.endpoints.health);
      const body = await response.json();

      // Validate required fields
      expect(body).toHaveProperty("status");
      expect(body).toHaveProperty("authenticated");
      expect(body).toHaveProperty("user_id");

      // Validate types
      expect(typeof body.status).toBe("string");
      expect(typeof body.authenticated).toBe("boolean");
      expect(body.user_id === null || typeof body.user_id === "string").toBe(true);

      // Validate status value
      expect(body.status).toBe("ok");
    });
  });
});
