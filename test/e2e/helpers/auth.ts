import { expect } from "@playwright/test";
import type { APIRequestContext } from "@playwright/test";
import { api, testUser } from "../config/test-config";

/**
 * Shared authentication helpers for E2E tests
 */

export class AuthHelper {
  constructor(private request: APIRequestContext) {}

  /**
   * Login with test user credentials
   * Returns the login response for further assertions
   */
  async login() {
    // Add retry logic for login failures
    let lastError: Error | unknown;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const response = await this.request.post(api.endpoints.login, {
          data: {
            email: testUser.email,
            password: testUser.password,
          },
        });

        // Handle different response statuses
        if (response.status() === 200) {
          const body = await response.json();
          expect(body.message).toBe("Login successful");
          expect(body.user.email).toBe(testUser.email);
          return { response, body };
        } else if (response.status() === 500) {
          console.warn(`Login attempt ${attempt} failed with 500 error`);
          if (attempt === 3) {
            // On final attempt, get response body for debugging
            await new Promise((resolve) => setTimeout(resolve, 2000));
            const errorBody = await response.json();
            console.error("Login 500 error details:", errorBody);
            throw new Error(`Login failed after 3 attempts. Final error: ${JSON.stringify(errorBody)}`);
          }
          // Wait a bit before retrying
          await new Promise((resolve) => setTimeout(resolve, 5000));
          continue;
        } else {
          // Other status codes
          const body = await response.json();
          throw new Error(`Login failed with status ${response.status()}: ${JSON.stringify(body)}`);
        }
      } catch (error) {
        lastError = error;
        if (attempt === 3) {
          throw error;
        }
        console.warn(`Login attempt ${attempt} failed:`, error);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    throw lastError;
  }

  /**
   * Logout current session
   */
  async logout() {
    const response = await this.request.post(api.endpoints.logout);
    expect(response.status()).toBe(200);
    return response;
  }

  /**
   * Get current authentication status
   */
  async getAuthStatus() {
    const response = await this.request.get("/api/auth/status");
    return response;
  }

  /**
   * Verify user is authenticated by checking health endpoint
   */
  async verifyAuthenticated() {
    const response = await this.request.get(api.endpoints.health);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.authenticated).toBe(true);
    expect(body.user_id).toBeTruthy();

    return body;
  }

  /**
   * Verify user is NOT authenticated by checking health endpoint
   */
  async verifyUnauthenticated() {
    const response = await this.request.get(api.endpoints.health);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.authenticated).toBe(false);
    expect(body.user_id).toBeNull();

    return body;
  }

  /**
   * Complete login flow and verify authentication
   */
  async loginAndVerify() {
    const loginResult = await this.login();
    await this.verifyAuthenticated();
    return loginResult;
  }

  /**
   * Complete logout flow and verify deauthentication
   */
  async logoutAndVerify() {
    await this.logout();
    await this.verifyUnauthenticated();
  }
}

/**
 * Factory function to create AuthHelper
 */
export function createAuthHelper(request: APIRequestContext): AuthHelper {
  return new AuthHelper(request);
}

/**
 * Quick login function for simple use cases
 */
export async function quickLogin(request: APIRequestContext) {
  const auth = new AuthHelper(request);
  return auth.login();
}

/**
 * Quick logout function for simple use cases
 */
export async function quickLogout(request: APIRequestContext) {
  const auth = new AuthHelper(request);
  return auth.logout();
}
