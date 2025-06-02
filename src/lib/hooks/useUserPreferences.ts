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

  const getAuthHeaders = useCallback((): HeadersInit | null => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      return null;
    }
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }, []);

  const fetchPreferences = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const headers = getAuthHeaders();
      if (!headers) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/user/preferences", {
        method: "GET",
        headers,
      });

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
  }, [getAuthHeaders]);

  const setDefaultShelf = async (shelfId: string) => {
    try {
      setError(null);

      const headers = getAuthHeaders();
      if (!headers) {
        throw new Error("Not authenticated");
      }

      const command: SetDefaultShelfCommandDTO = { shelf_id: shelfId };

      const response = await fetch("/api/user/preferences", {
        method: "PUT",
        headers,
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

      const headers = getAuthHeaders();
      if (!headers) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/user/preferences/default-shelf", {
        method: "DELETE",
        headers,
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
