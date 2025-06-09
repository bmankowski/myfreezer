/**
 * Test configuration for E2E tests
 * Contains test user credentials and other test-specific settings
 */

export const TEST_CONFIG = {
  // Test user credentials
  testUser: {
    email: process.env.TEST_USER_EMAIL,
    password: process.env.TEST_USER_PASSWORD,
    // You can add more test users here if needed
    displayName: "Test User",
  },

  // API endpoints
  api: {
    baseUrl: process.env.BASE_URL || "http://localhost:3000",
    endpoints: {
      health: "/api/health",
      login: "/api/auth/login",
      logout: "/api/auth/logout",
      register: "/api/auth/register",
      profile: "/api/auth/profile",
      containers: "/api/containers",
      items: "/api/items",
      // Voice endpoints
      voiceTranscribe: "/api/voice/transcribe",
      voiceQuery: "/api/voice/query",
      voiceProcess: "/api/voice/process",
      // Command endpoints
      commandProcess: "/api/command/process",
      commandQuery: "/api/command/query",
    },
  },

  // Test timeouts and limits
  timeouts: {
    apiResponse: 5000,
    authFlow: 10000,
    pageLoad: 30000,
    upload: 15000,
  },

  // Test data
  testData: {
    container: {
      name: "Test Container",
      type: "freezer" as const,
    },
    item: {
      name: "Test Item",
      quantity: 1,
    },
    voice: {
      maxFileSize: 25 * 1024 * 1024, // 25MB
      supportedFormats: ["audio/webm", "audio/wav", "audio/mp3", "audio/mp4", "audio/m4a"],
    },
  },
};

// Export individual parts for convenience
export const { testUser, api, timeouts, testData } = TEST_CONFIG;

// Helper to validate test config
export function validateTestConfig() {
  if (!testUser.email || !testUser.password) {
    throw new Error(
      "Test user credentials not configured. Please set TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables."
    );
  }

  if (!api.baseUrl) {
    throw new Error("Base URL not configured. Please set BASE_URL environment variable.");
  }
}
