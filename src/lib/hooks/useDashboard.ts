import { useState, useEffect, useCallback } from "react";
import type {
  ContainerDetailsDTO,
  ItemWithLocationDTO,
  ItemSearchParams,
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
    searchQuery: '',
    searchResults: [],
    isSearching: false,
    isAuthenticated: null,
  });

  const getAuthHeaders = useCallback((): HeadersInit | null => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setState(prev => ({ ...prev, isAuthenticated: false }));
      return null;
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }, []);

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    const isAuth = !!(token && user);
    
    console.log('🔍 Auth check:', { 
      hasToken: !!token,
      hasUser: !!user,
      isAuth,
      user: user ? JSON.parse(user) : null
    });
    
    setState(prev => ({ ...prev, isAuthenticated: isAuth }));
    return isAuth;
  }, []);

  const loadContainers = useCallback(async () => {
    try {
      console.log('📦 Loading containers...');
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch('/api/containers', { headers });
      
      if (!response.ok) {
        if (response.status === 401) {
          setState(prev => ({ ...prev, isAuthenticated: false }));
          return;
        }
        throw new Error(`Failed to load containers: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📦 Containers loaded:', { count: data.containers?.length || 0, containers: data.containers });
      setState(prev => ({ 
        ...prev, 
        containers: data.containers || [],
        isLoading: false 
      }));
    } catch (error) {
      console.error('📦 Failed to load containers:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to load containers',
        isLoading: false 
      }));
    }
  }, [getAuthHeaders]);

  const searchItems = useCallback(async (query: string) => {
    if (query.length < 2) {
      setState(prev => ({ ...prev, searchQuery: query, searchResults: [] }));
      return;
    }

    try {
      setState(prev => ({ ...prev, searchQuery: query, isSearching: true }));
      
      const headers = getAuthHeaders();
      if (!headers) {
        setState(prev => ({ ...prev, isSearching: false }));
        return;
      }
      
      const params = new URLSearchParams({ q: query });
      const response = await fetch(`/api/items?${params}`, { headers });
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      setState(prev => ({ 
        ...prev, 
        searchResults: data.items || [],
        isSearching: false 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        searchResults: [],
        isSearching: false,
        error: 'Search failed'
      }));
    }
  }, [getAuthHeaders]);

  const createContainer = useCallback(async (data: CreateContainerCommandDTO) => {
    try {
      console.log('➕ Creating container:', data);
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch('/api/containers', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create container');
      }

      const result = await response.json();
      console.log('➕ Container created successfully:', result);
      
      console.log('🔄 Refreshing containers list...');
      await loadContainers(); // Refresh data
    } catch (error) {
      console.error('➕ Failed to create container:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to create container'
      }));
    }
  }, [getAuthHeaders, loadContainers]);

  const updateContainer = useCallback(async (id: string, data: UpdateContainerCommandDTO) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`/api/containers/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update container');
      }

      await loadContainers(); // Refresh data
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to update container'
      }));
    }
  }, [getAuthHeaders, loadContainers]);

  const deleteContainer = useCallback(async (id: string) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`/api/containers/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to delete container');
      }

      await loadContainers(); // Refresh data
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to delete container'
      }));
    }
  }, [getAuthHeaders, loadContainers]);

  const addShelf = useCallback(async (containerId: string, data: CreateShelfCommandDTO) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`/api/containers/${containerId}/shelves`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to add shelf');
      }

      await loadContainers(); // Refresh data
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to add shelf'
      }));
    }
  }, [getAuthHeaders, loadContainers]);

  const updateShelf = useCallback(async (shelfId: string, data: UpdateShelfCommandDTO) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`/api/shelves/${shelfId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update shelf');
      }

      await loadContainers(); // Refresh data
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to update shelf'
      }));
    }
  }, [getAuthHeaders, loadContainers]);

  const deleteShelf = useCallback(async (shelfId: string) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`/api/shelves/${shelfId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to delete shelf');
      }

      await loadContainers(); // Refresh data
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to delete shelf'
      }));
    }
  }, [getAuthHeaders, loadContainers]);

  const addItem = useCallback(async (shelfId: string, data: AddItemCommandDTO) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`/api/shelves/${shelfId}/items`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to add item');
      }

      await loadContainers(); // Refresh data
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to add item'
      }));
    }
  }, [getAuthHeaders, loadContainers]);

  const updateItemQuantity = useCallback(async (itemId: string, data: UpdateItemQuantityCommandDTO) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`/api/items/${itemId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update item quantity');
      }

      await loadContainers(); // Refresh data
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to update item quantity'
      }));
    }
  }, [getAuthHeaders, loadContainers]);

  const removeItemQuantity = useCallback(async (itemId: string, data: RemoveItemQuantityCommandDTO) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`/api/items/${itemId}/remove`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to remove item quantity');
      }

      await loadContainers(); // Refresh data
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to remove item quantity'
      }));
    }
  }, [getAuthHeaders, loadContainers]);

  const deleteItem = useCallback(async (itemId: string) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`/api/items/${itemId}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      await loadContainers(); // Refresh data
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to delete item'
      }));
    }
  }, [getAuthHeaders, loadContainers]);

  const moveItem = useCallback(async (itemId: string, data: MoveItemCommandDTO) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(`/api/items/${itemId}/move`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to move item');
      }

      await loadContainers(); // Refresh data
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to move item'
      }));
    }
  }, [getAuthHeaders, loadContainers]);

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
        setState(prev => ({ 
          ...prev, 
          containers: [],
          searchResults: [],
          searchQuery: '',
        }));
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
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