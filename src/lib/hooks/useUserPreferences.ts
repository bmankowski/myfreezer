import { useState, useEffect, useCallback } from "react";
import type { UserPreferencesDTO, SetDefaultShelfCommandDTO } from "@/types";

export interface UseUserPreferencesReturn {
  preferences: UserPreferencesDTO | null;
  isLoading: boolean;
  error: string | null;
  setDefaultShelf: (shelfId: string) => Promise<void>;
  clearDefaultShelf: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useUserPreferences(): UseUserPreferencesReturn {
  const [preferences, setPreferences] = useState<UserPreferencesDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuthentication = useCallback(async (): Promise<boolean> => {
    try {
      // Check authentication by calling server health endpoint
      const response = await fetch("/api/health", {
        credentials: "include", // Include cookies
      });

      if (response.ok) {
        const data = await response.json();
        return data.authenticated;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Error checking authentication:", error);
      return false;
    }
  }, []);

  const makeAuthenticatedRequest = useCallback(async (url: string, options: RequestInit = {}) => {
    const isAuth = await checkAuthentication();
    if (!isAuth) {
      throw new Error("Not authenticated");
    }

    return fetch(url, {
      ...options,
      credentials: "include", // Include cookies
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  }, [checkAuthentication]);

  const fetchPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check authentication first
      const isAuth = await checkAuthentication();
      if (!isAuth) {
        // User is not authenticated, set to not loading and return early
        setIsLoading(false);
        setError(null);
        setPreferences(null);
        return;
      }

      const response = await makeAuthenticatedRequest("/api/user/preferences");

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to fetch preferences" }));
        throw new Error(errorData.error || "Failed to fetch preferences");
      }

      const data = await response.json();
      setPreferences(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch preferences";
      setError(errorMessage);
      console.error("Error fetching user preferences:", err);
    } finally {
      setIsLoading(false);
    }
  }, [checkAuthentication, makeAuthenticatedRequest]);

  const setDefaultShelf = async (shelfId: string) => {
    try {
      setError(null);

      const command: SetDefaultShelfCommandDTO = { shelf_id: shelfId };

      const response = await makeAuthenticatedRequest("/api/user/preferences", {
        method: "PUT",
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to set default shelf" }));
        throw new Error(errorData.error || "Failed to set default shelf");
      }

      // Refetch preferences to get updated data
      await fetchPreferences();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to set default shelf";
      setError(errorMessage);
      console.error("Error setting default shelf:", err);
      throw err; // Re-throw so calling code can handle it
    }
  };

  const clearDefaultShelf = async () => {
    try {
      setError(null);

      const response = await makeAuthenticatedRequest("/api/user/preferences/default-shelf", {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to clear default shelf" }));
        throw new Error(errorData.error || "Failed to clear default shelf");
      }

      // Refetch preferences to get updated data
      await fetchPreferences();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to clear default shelf";
      setError(errorMessage);
      console.error("Error clearing default shelf:", err);
      throw err; // Re-throw so calling code can handle it
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    isLoading,
    error,
    setDefaultShelf,
    clearDefaultShelf,
    refetch: fetchPreferences,
  };
}
