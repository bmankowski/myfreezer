import { useCallback, useEffect, useState } from "react";
import type {
  AddItemCommandDTO,
  ContainerDetailsDTO,
  CreateContainerCommandDTO,
  CreateShelfCommandDTO,
  ItemWithLocationDTO,
  MoveItemCommandDTO,
  RemoveItemQuantityCommandDTO,
  UpdateContainerCommandDTO,
  UpdateItemQuantityCommandDTO,
  UpdateShelfCommandDTO,
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

  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      // Check authentication by calling server health endpoint
      const response = await fetch("/api/health", {
        credentials: "include", // Include cookies
      });

      if (response.ok) {
        const data = await response.json();
        const isAuth = data.authenticated;

        console.log("🔍 Auth check:", {
          status: data.status,
          authenticated: data.authenticated,
          user_id: data.user_id,
        });

        setState((prev) => ({ ...prev, isAuthenticated: isAuth }));
        return isAuth;
      } else {
        setState((prev) => ({ ...prev, isAuthenticated: false }));
        return false;
      }
    } catch (error) {
      console.log("Authentication check failed:", error);
      setState((prev) => ({ ...prev, isAuthenticated: false }));
      return false;
    }
  }, []);

  const makeAuthenticatedRequest = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const isAuth = await checkAuth();
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
    },
    [checkAuth]
  );

  const refreshContainers = useCallback(async () => {
    console.log("🔄 Refreshing containers...");
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await makeAuthenticatedRequest("/api/containers");

      if (!response.ok) {
        if (response.status === 401) {
          setState((prev) => ({ ...prev, isAuthenticated: false, isLoading: false }));
          return;
        }
        throw new Error(`Failed to fetch containers: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Containers loaded:", data.containers?.length || 0);

      setState((prev) => ({
        ...prev,
        containers: data.containers || [],
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load containers";
      console.error("❌ Container loading error:", errorMessage);
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
        containers: [],
      }));
    }
  }, [makeAuthenticatedRequest]);

  // Initial authentication check and data loading
  useEffect(() => {
    const initializeData = async () => {
      console.log("🏠 Dashboard initializing...");
      const isAuth = await checkAuth();

      if (isAuth) {
        await refreshContainers();
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    initializeData();
  }, [checkAuth, refreshContainers]);

  // Log state changes for debugging
  useEffect(() => {
    console.log("🏠 Dashboard state:", {
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      containersCount: state.containers.length,
      defaultShelf: state.containers[0]?.shelves?.[0]?.shelf_id,
    });
  }, [state.isAuthenticated, state.isLoading, state.containers]);

  const searchItems = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setState((prev) => ({ ...prev, searchResults: [], isSearching: false }));
        return;
      }

      setState((prev) => ({ ...prev, isSearching: true }));

      try {
        const response = await makeAuthenticatedRequest(`/api/items?q=${encodeURIComponent(query)}`);

        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }

        const data = await response.json();
        setState((prev) => ({
          ...prev,
          searchResults: data.items || [],
          isSearching: false,
        }));
      } catch (error) {
        console.error("Search error:", error);
        setState((prev) => ({
          ...prev,
          searchResults: [],
          isSearching: false,
          error: error instanceof Error ? error.message : "Search failed",
        }));
      }
    },
    [makeAuthenticatedRequest]
  );

  const updateContainer = useCallback(
    async (containerId: string, updates: UpdateContainerCommandDTO) => {
      try {
        const response = await makeAuthenticatedRequest(`/api/containers/${containerId}`, {
          method: "PUT",
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error(`Failed to update container: ${response.status}`);
        }

        await refreshContainers();
        return await response.json();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to update container";
        setState((prev) => ({ ...prev, error: errorMessage }));
        throw error;
      }
    },
    [makeAuthenticatedRequest, refreshContainers]
  );

  const createContainer = useCallback(
    async (containerData: CreateContainerCommandDTO) => {
      try {
        const response = await makeAuthenticatedRequest("/api/containers", {
          method: "POST",
          body: JSON.stringify(containerData),
        });

        if (!response.ok) {
          throw new Error(`Failed to create container: ${response.status}`);
        }

        await refreshContainers();
        return await response.json();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to create container";
        setState((prev) => ({ ...prev, error: errorMessage }));
        throw error;
      }
    },
    [makeAuthenticatedRequest, refreshContainers]
  );

  const deleteContainer = useCallback(
    async (containerId: string) => {
      try {
        const response = await makeAuthenticatedRequest(`/api/containers/${containerId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error(`Failed to delete container: ${response.status}`);
        }

        await refreshContainers();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to delete container";
        setState((prev) => ({ ...prev, error: errorMessage }));
        throw error;
      }
    },
    [makeAuthenticatedRequest, refreshContainers]
  );

  const createShelf = useCallback(
    async (containerId: string, shelfData: CreateShelfCommandDTO) => {
      try {
        const response = await makeAuthenticatedRequest(`/api/containers/${containerId}/shelves`, {
          method: "POST",
          body: JSON.stringify(shelfData),
        });

        if (!response.ok) {
          throw new Error(`Failed to create shelf: ${response.status}`);
        }

        await refreshContainers();
        return await response.json();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to create shelf";
        setState((prev) => ({ ...prev, error: errorMessage }));
        throw error;
      }
    },
    [makeAuthenticatedRequest, refreshContainers]
  );

  const updateShelf = useCallback(
    async (shelfId: string, updates: UpdateShelfCommandDTO) => {
      try {
        const response = await makeAuthenticatedRequest(`/api/shelves/${shelfId}`, {
          method: "PUT",
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error(`Failed to update shelf: ${response.status}`);
        }

        await refreshContainers();
        return await response.json();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to update shelf";
        setState((prev) => ({ ...prev, error: errorMessage }));
        throw error;
      }
    },
    [makeAuthenticatedRequest, refreshContainers]
  );

  const deleteShelf = useCallback(
    async (shelfId: string) => {
      try {
        const response = await makeAuthenticatedRequest(`/api/shelves/${shelfId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error(`Failed to delete shelf: ${response.status}`);
        }

        await refreshContainers();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to delete shelf";
        setState((prev) => ({ ...prev, error: errorMessage }));
        throw error;
      }
    },
    [makeAuthenticatedRequest, refreshContainers]
  );

  const addItem = useCallback(
    async (itemData: AddItemCommandDTO) => {
      try {
        const response = await makeAuthenticatedRequest("/api/items", {
          method: "POST",
          body: JSON.stringify(itemData),
        });

        if (!response.ok) {
          throw new Error(`Failed to add item: ${response.status}`);
        }

        await refreshContainers();
        return await response.json();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to add item";
        setState((prev) => ({ ...prev, error: errorMessage }));
        throw error;
      }
    },
    [makeAuthenticatedRequest, refreshContainers]
  );

  const updateItemQuantity = useCallback(
    async (itemId: string, quantityData: UpdateItemQuantityCommandDTO | RemoveItemQuantityCommandDTO) => {
      try {
        const response = await makeAuthenticatedRequest(`/api/items/${itemId}/quantity`, {
          method: "PUT",
          body: JSON.stringify(quantityData),
        });

        if (!response.ok) {
          throw new Error(`Failed to update item quantity: ${response.status}`);
        }

        await refreshContainers();
        return await response.json();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to update item quantity";
        setState((prev) => ({ ...prev, error: errorMessage }));
        throw error;
      }
    },
    [makeAuthenticatedRequest, refreshContainers]
  );

  const moveItem = useCallback(
    async (itemId: string, moveData: MoveItemCommandDTO) => {
      try {
        const response = await makeAuthenticatedRequest(`/api/items/${itemId}/move`, {
          method: "PUT",
          body: JSON.stringify(moveData),
        });

        if (!response.ok) {
          throw new Error(`Failed to move item: ${response.status}`);
        }

        await refreshContainers();
        return await response.json();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to move item";
        setState((prev) => ({ ...prev, error: errorMessage }));
        throw error;
      }
    },
    [makeAuthenticatedRequest, refreshContainers]
  );

  const deleteItem = useCallback(
    async (itemId: string) => {
      try {
        const response = await makeAuthenticatedRequest(`/api/items/${itemId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error(`Failed to delete item: ${response.status}`);
        }

        await refreshContainers();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to delete item";
        setState((prev) => ({ ...prev, error: errorMessage }));
        throw error;
      }
    },
    [makeAuthenticatedRequest, refreshContainers]
  );

  const handleSearchQuery = useCallback(
    (query: string) => {
      setState((prev) => ({ ...prev, searchQuery: query }));
      if (query.trim()) {
        searchItems(query);
      } else {
        setState((prev) => ({ ...prev, searchResults: [], isSearching: false }));
      }
    },
    [searchItems]
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    containers: state.containers,
    isLoading: state.isLoading,
    error: state.error,
    searchQuery: state.searchQuery,
    searchResults: state.searchResults,
    isSearching: state.isSearching,
    isAuthenticated: state.isAuthenticated,

    // Actions
    refreshContainers,
    updateContainer,
    createContainer,
    deleteContainer,
    createShelf,
    updateShelf,
    deleteShelf,
    addItem,
    updateItemQuantity,
    moveItem,
    deleteItem,
    searchItems: handleSearchQuery,
    clearError,
    checkAuth,
  };
}
