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
    const response = await this.request.post(api.endpoints.login, {
      data: {
        email: testUser.email,
        password: testUser.password,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.message).toBe("Login successful");
    expect(body.user.email).toBe(testUser.email);

    return { response, body };
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
