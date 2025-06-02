import { useState, useEffect, useCallback } from "react";
import type {
  ContainerDetailsDTO,
  ItemWithLocationDTO,
  UpdateContainerCommandDTO,
  CreateContainerCommandDTO,
  CreateShelfCommandDTO,
  UpdateShelfCommandDTO,
  AddItemCommandDTO,
  UpdateItemQuantityCommandDTO,
  RemoveItemQuantityCommandDTO,
  MoveItemCommandDTO,
} from "@/types";

interface DashboardState {
  containers: ContainerDetailsDTO[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  searchResults: ItemWithLocationDTO[];
  isSearching: boolean;
  isAuthenticated: boolean | null;
}

export function useDashboard() {
  const [state, setState] = useState<DashboardState>({
    containers: [],
    isLoading: true,
    error: null,
    searchQuery: "",
    searchResults: [],
    isSearching: false,
    isAuthenticated: null,
  });

  const refreshTokenIfNeeded = useCallback(async (): Promise<boolean> => {
    const token = localStorage.getItem("access_token");
    const refreshToken = localStorage.getItem("refresh_token");

    if (!token || !refreshToken) {
      setState((prev) => ({ ...prev, isAuthenticated: false }));
      return false;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const now = Math.floor(Date.now() / 1000);
      const expiry = payload.exp;

      if (expiry - now < 300) {
        console.log("🔄 Refreshing expired token...");

        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);
          console.log("✅ Token refreshed successfully");
          return true;
        } else {
          console.log("❌ Token refresh failed");
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user");
          setState((prev) => ({ ...prev, isAuthenticated: false }));
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("Error checking/refreshing token:", error);
      setState((prev) => ({ ...prev, isAuthenticated: false }));
      return false;
    }
  }, []);

  const getAuthHeadersWithRefresh = useCallback(async (): Promise<HeadersInit | null> => {
    const tokenIsValid = await refreshTokenIfNeeded();
    if (!tokenIsValid) {
      return null;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      setState((prev) => ({ ...prev, isAuthenticated: false }));
      return null;
    }

    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }, [refreshTokenIfNeeded]);

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem("access_token");
    const user = localStorage.getItem("user");
    const isAuth = !!(token && user);

    console.log("🔍 Auth check:", {
      hasToken: !!token,
      hasUser: !!user,
      isAuth,
      user: user ? JSON.parse(user) : null,
    });

    setState((prev) => ({ ...prev, isAuthenticated: isAuth }));
    return isAuth;
  }, []);

  const loadContainers = useCallback(async () => {
    try {
      console.log("📦 Loading containers...");
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      const headers = await getAuthHeadersWithRefresh();
      if (!headers) return;

      const response = await fetch("/api/containers", { headers });

      if (!response.ok) {
        if (response.status === 401) {
          setState((prev) => ({ ...prev, isAuthenticated: false }));
          return;
        }
        throw new Error(`Failed to load containers: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("📦 Containers loaded:", { count: data.containers?.length || 0, containers: data.containers });
      setState((prev) => ({
        ...prev,
        containers: data.containers || [],
        isLoading: false,
      }));
    } catch (error) {
      console.error("📦 Failed to load containers:", error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to load containers",
        isLoading: false,
      }));
    }
  }, [getAuthHeadersWithRefresh]);

  const searchItems = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setState((prev) => ({ ...prev, searchQuery: query, searchResults: [] }));
        return;
      }

      try {
        setState((prev) => ({ ...prev, searchQuery: query, isSearching: true }));

        const headers = await getAuthHeadersWithRefresh();
        if (!headers) {
          setState((prev) => ({ ...prev, isSearching: false }));
          return;
        }

        const params = new URLSearchParams({ q: query });
        const response = await fetch(`/api/items?${params}`, { headers });

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data = await response.json();
        setState((prev) => ({
          ...prev,
          searchResults: data.items || [],
          isSearching: false,
        }));
      } catch {
        setState((prev) => ({
          ...prev,
          searchResults: [],
          isSearching: false,
          error: "Search failed",
        }));
      }
    },
    [getAuthHeadersWithRefresh]
  );

  const createContainer = useCallback(
    async (data: CreateContainerCommandDTO) => {
      try {
        console.log("➕ Creating container:", data);
        const headers = await getAuthHeadersWithRefresh();
        if (!headers) return;

        const response = await fetch("/api/containers", {
          method: "POST",
          headers,
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create container");
        }

        const result = await response.json();
        console.log("➕ Container created successfully:", result);

        console.log("🔄 Refreshing containers list...");
        await loadContainers(); // Refresh data
      } catch (error) {
        console.error("➕ Failed to create container:", error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Failed to create container",
        }));
      }
    },
    [getAuthHeadersWithRefresh, loadContainers]
  );

  const updateContainer = useCallback(
    async (id: string, data: UpdateContainerCommandDTO) => {
      try {
        const headers = await getAuthHeadersWithRefresh();
        if (!headers) return;

        const response = await fetch(`/api/containers/${id}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("Failed to update container");
        }

        await loadContainers(); // Refresh data
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Failed to update container",
        }));
      }
    },
    [getAuthHeadersWithRefresh, loadContainers]
  );

  const deleteContainer = useCallback(
    async (id: string) => {
      try {
        const headers = await getAuthHeadersWithRefresh();
        if (!headers) return;

        const response = await fetch(`/api/containers/${id}`, {
          method: "DELETE",
          headers,
        });

        if (!response.ok) {
          throw new Error("Failed to delete container");
        }

        await loadContainers(); // Refresh data
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Failed to delete container",
        }));
      }
    },
    [getAuthHeadersWithRefresh, loadContainers]
  );

  const addShelf = useCallback(
    async (containerId: string, data: CreateShelfCommandDTO) => {
      try {
        const headers = await getAuthHeadersWithRefresh();
        if (!headers) return;

        const response = await fetch(`/api/containers/${containerId}/shelves`, {
          method: "POST",
          headers,
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("Failed to add shelf");
        }

        await loadContainers(); // Refresh data
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Failed to add shelf",
        }));
      }
    },
    [getAuthHeadersWithRefresh, loadContainers]
  );

  const updateShelf = useCallback(
    async (shelfId: string, data: UpdateShelfCommandDTO) => {
      try {
        const headers = await getAuthHeadersWithRefresh();
        if (!headers) return;

        const response = await fetch(`/api/shelves/${shelfId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("Failed to update shelf");
        }

        await loadContainers(); // Refresh data
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Failed to update shelf",
        }));
      }
    },
    [getAuthHeadersWithRefresh, loadContainers]
  );

  const deleteShelf = useCallback(
    async (shelfId: string) => {
      try {
        const headers = await getAuthHeadersWithRefresh();
        if (!headers) return;

        const response = await fetch(`/api/shelves/${shelfId}`, {
          method: "DELETE",
          headers,
        });

        if (!response.ok) {
          throw new Error("Failed to delete shelf");
        }

        await loadContainers(); // Refresh data
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Failed to delete shelf",
        }));
      }
    },
    [getAuthHeadersWithRefresh, loadContainers]
  );

  const addItem = useCallback(
    async (shelfId: string, data: AddItemCommandDTO) => {
      try {
        const headers = await getAuthHeadersWithRefresh();
        if (!headers) return;

        const response = await fetch(`/api/shelves/${shelfId}/items`, {
          method: "POST",
          headers,
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("Failed to add item");
        }

        await loadContainers(); // Refresh data
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Failed to add item",
        }));
      }
    },
    [getAuthHeadersWithRefresh, loadContainers]
  );

  const updateItemQuantity = useCallback(
    async (itemId: string, data: UpdateItemQuantityCommandDTO) => {
      try {
        const headers = await getAuthHeadersWithRefresh();
        if (!headers) return null;

        const response = await fetch(`/api/items/${itemId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("Failed to update item quantity");
        }

        const result = await response.json();
        await loadContainers(); // Refresh data
        return result;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Failed to update item quantity",
        }));
        throw error;
      }
    },
    [getAuthHeadersWithRefresh, loadContainers]
  );

  const removeItemQuantity = useCallback(
    async (itemId: string, data: RemoveItemQuantityCommandDTO) => {
      try {
        const headers = await getAuthHeadersWithRefresh();
        if (!headers) return null;

        const response = await fetch(`/api/items/${itemId}/remove`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("Failed to remove item quantity");
        }

        const result = await response.json();
        await loadContainers(); // Refresh data
        return result;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Failed to remove item quantity",
        }));
        throw error;
      }
    },
    [getAuthHeadersWithRefresh, loadContainers]
  );

  const deleteItem = useCallback(
    async (itemId: string) => {
      try {
        const headers = await getAuthHeadersWithRefresh();
        if (!headers) return;

        const response = await fetch(`/api/items/${itemId}`, {
          method: "DELETE",
          headers,
        });

        if (!response.ok) {
          throw new Error("Failed to delete item");
        }

        await loadContainers(); // Refresh data
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Failed to delete item",
        }));
      }
    },
    [getAuthHeadersWithRefresh, loadContainers]
  );

  const moveItem = useCallback(
    async (itemId: string, data: MoveItemCommandDTO) => {
      try {
        const headers = await getAuthHeadersWithRefresh();
        if (!headers) return;

        const response = await fetch(`/api/items/${itemId}/move`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("Failed to move item");
        }

        await loadContainers(); // Refresh data
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Failed to move item",
        }));
      }
    },
    [getAuthHeadersWithRefresh, loadContainers]
  );

  // Initialize on mount
  useEffect(() => {
    const initializeDashboard = async () => {
      const isAuthenticated = checkAuth();
      if (isAuthenticated) {
        await loadContainers();
      }
    };

    initializeDashboard();

    // Listen for focus events to recheck auth (in case user logged out in another tab)
    const handleFocus = () => {
      const isAuthenticated = checkAuth();
      if (!isAuthenticated) {
        setState((prev) => ({
          ...prev,
          containers: [],
          searchResults: [],
          searchQuery: "",
        }));
      }
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [checkAuth, loadContainers]);

  return {
    state,
    actions: {
      loadContainers,
      searchItems,
      createContainer,
      updateContainer,
      deleteContainer,
      addShelf,
      updateShelf,
      deleteShelf,
      addItem,
      updateItemQuantity,
      removeItemQuantity,
      deleteItem,
      moveItem,
      checkAuth,
    },
  };
}
