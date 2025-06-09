import React, { useEffect } from "react";
import { useDashboard } from "@/lib/hooks/useDashboard";
import { useUserPreferences } from "@/lib/hooks/useUserPreferences";
import { useToasts } from "@/lib/hooks/useToasts";
import { Header } from "./dashboard/Header";
import { ContainerGrid } from "./dashboard/ContainerGrid";
import { FloatingMicrophone } from "./dashboard/FloatingMicrophone";
import { ToastContainer } from "./dashboard/ToastContainer";
import { Skeleton } from "@/components/ui/skeleton";
import type { AddItemCommandDTO, CreateShelfCommandDTO } from "@/types";

export function Dashboard() {
  const {
    // State
    containers,
    isLoading,
    error,
    searchQuery,
    searchResults,
    isSearching,
    isAuthenticated,
    // Actions
    refreshContainers,
    updateContainer,
    createContainer,
    deleteContainer,
    createShelf,
    updateShelf,
    deleteShelf,
    updateItemQuantity,
    deleteItem,
    searchItems,
    clearError,
  } = useDashboard();
  const { preferences, setDefaultShelf } = useUserPreferences();
  const { toasts, addToast, dismissToast } = useToasts();
  // Handle authentication redirect
  useEffect(() => {
    if (isAuthenticated === false) {
      window.location.href = "/login";
    }
  }, [isAuthenticated]);

  // Handle errors with toasts
  useEffect(() => {
    if (error) {
      addToast({
        type: "error",
        title: "Error",
        description: error,
      });
      clearError();
    }
  }, [error, addToast, clearError]);

  const handleSetAsDefault = async (shelfId: string) => {
    await setDefaultShelf(shelfId);
  };

  const handleShelfAdd = async (containerId: string, data: CreateShelfCommandDTO) => {
    try {
      await createShelf(containerId, data);
    } catch (error) {
      addToast({
        type: "error",
        title: "Create shelf failed",
        description: error instanceof Error ? error.message : "Failed to create shelf",
      });
    }
  };

  const handleItemAdd = async (shelfId: string, data: AddItemCommandDTO) => {
    try {
      // Call the shelf-specific items endpoint
      const response = await fetch(`/api/shelves/${shelfId}/items`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to add item" }));
        throw new Error(errorData.error || "Failed to add item");
      }

      // Refresh containers data
      await refreshContainers();
    } catch (error) {
      addToast({
        type: "error",
        title: "Add item failed",
        description: error instanceof Error ? error.message : "Failed to add item",
      });
    }
  };

  const handleItemQuantityUpdate = async (itemId: string, newQuantity: number) => {
    try {
      const result = await updateItemQuantity(itemId, { quantity: newQuantity });
      if (result) {
        // addToast({
        //   type: "success",
        //   title: "Item updated",
        //   description: `Quantity updated successfully`,
        // });
      }
    } catch (error) {
      addToast({
        type: "error",
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update item",
      });
    }
  };

  const handleItemDelete = async (itemId: string) => {
    try {
      await deleteItem(itemId);
    } catch (error) {
      addToast({
        type: "error",
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete item",
      });
    }
  };

  const handleToast = (message: string, type: "success" | "error" = "success") => {
    addToast({
      type,
      title: type === "success" ? "Success" : "Error",
      description: message,
    });
  };

  // Show loading state for unauthenticated users
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (isAuthenticated === false) {
    return null;
  }

  // Show loading state while containers are loading
  if (isLoading && containers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          onSearch={searchItems}
          isSearching={isSearching}
          searchQuery={searchQuery}
          onContainerCreate={createContainer}
          onToast={handleToast}
        />

        <main className="w-full sm:max-w-7xl sm:mx-auto px-3 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onSearch={searchItems}
        isSearching={isSearching}
        searchQuery={searchQuery}
        onContainerCreate={createContainer}
        onToast={handleToast}
      />

      <main className="w-full sm:max-w-7xl sm:mx-auto px-3 sm:px-6 lg:px-8 py-8">
        <ContainerGrid
          containers={containers}
          searchQuery={searchQuery}
          searchResults={searchResults}
          isSearching={isSearching}
          userPreferences={preferences}
          onContainerUpdate={updateContainer}
          onContainerDelete={deleteContainer}
          onShelfAdd={handleShelfAdd}
          onShelfUpdate={updateShelf}
          onShelfDelete={deleteShelf}
          onItemAdd={handleItemAdd}
          onItemQuantityUpdate={handleItemQuantityUpdate}
          onItemDelete={handleItemDelete}
          onSetAsDefault={handleSetAsDefault}
          onToast={addToast}
        />
      </main>

      <FloatingMicrophone
        defaultShelfId={preferences?.default_shelf?.container_id || containers[0]?.container_id}
        onCommandSuccess={(response) => {
          addToast({
            type: "success",
            title: "Voice Command Processed",
            description: response.message,
          });
          refreshContainers(); // Refresh data
        }}
        onCommandError={(error) => {
          addToast({
            type: "error",
            title: "Voice Command Failed",
            description: error,
          });
        }}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
