import React, { useEffect } from "react";
import { useDashboard } from "@/lib/hooks/useDashboard";
import { useUserPreferences } from "@/lib/hooks/useUserPreferences";
import { useToasts } from "@/lib/hooks/useToasts";
import { Header } from "./dashboard/Header";
import { ContainerGrid } from "./dashboard/ContainerGrid";
import { FloatingMicrophone } from "./dashboard/FloatingMicrophone";
import { ToastContainer } from "./dashboard/ToastContainer";
import { Skeleton } from "@/components/ui/skeleton";

export function Dashboard() {
  const { state, actions } = useDashboard();
  const { preferences, setDefaultShelf } = useUserPreferences();
  const { toasts, addToast, dismissToast } = useToasts();

  console.log("🏠 Dashboard state:", {
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    containersCount: state.containers.length,
    defaultShelf: preferences?.default_shelf?.name,
  });

  // Handle authentication redirect
  useEffect(() => {
    if (state.isAuthenticated === false) {
      window.location.href = "/login";
    }
  }, [state.isAuthenticated]);

  // Handle errors with toasts
  useEffect(() => {
    if (state.error) {
      addToast({
        type: "error",
        title: "Error",
        description: state.error,
      });
    }
  }, [state.error, addToast]);

  const handleSetAsDefault = async (shelfId: string) => {
    await setDefaultShelf(shelfId);
  };

  const handleItemQuantityUpdate = async (itemId: string, quantity: number) => {
    try {
      const result = await actions.updateItemQuantity(itemId, { quantity });
      if (result) {
        addToast({
          type: "success",
          title: "Item updated",
          description: `Quantity updated successfully`,
        });
      }
    } catch (error) {
      addToast({
        type: "error",
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update item",
      });
    }
  };

  const handleItemQuantityRemove = async (itemId: string, quantity: number) => {
    try {
      const result = await actions.removeItemQuantity(itemId, { quantity });
      if (result) {
        addToast({
          type: "success",
          title: result.action === "deleted" ? "Item removed" : "Item updated",
          description:
            result.action === "deleted"
              ? `${result.name} was completely removed`
              : `Quantity reduced to ${result.quantity}`,
        });
      }
    } catch (error) {
      addToast({
        type: "error",
        title: "Remove failed",
        description: error instanceof Error ? error.message : "Failed to remove quantity",
      });
    }
  };

  const handleItemDelete = async (itemId: string) => {
    try {
      await actions.deleteItem(itemId);
      addToast({
        type: "success",
        title: "Item deleted",
        description: "Item has been removed successfully",
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete item",
      });
    }
  };

  // Show loading state for unauthenticated users
  if (state.isAuthenticated === null) {
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
  if (state.isAuthenticated === false) {
    return null;
  }

  // Show loading state while containers are loading
  if (state.isLoading && state.containers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header
          onSearch={actions.searchItems}
          isSearching={state.isSearching}
          searchQuery={state.searchQuery}
          onContainerCreate={actions.createContainer}
          onToast={addToast}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        onSearch={actions.searchItems}
        isSearching={state.isSearching}
        searchQuery={state.searchQuery}
        onContainerCreate={actions.createContainer}
        onToast={addToast}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ContainerGrid
          containers={state.containers}
          searchQuery={state.searchQuery}
          searchResults={state.searchResults}
          isSearching={state.isSearching}
          userPreferences={preferences}
          onContainerUpdate={actions.updateContainer}
          onContainerDelete={actions.deleteContainer}
          onShelfAdd={actions.addShelf}
          onShelfUpdate={actions.updateShelf}
          onShelfDelete={actions.deleteShelf}
          onItemAdd={actions.addItem}
          onItemQuantityUpdate={handleItemQuantityUpdate}
          onItemQuantityRemove={handleItemQuantityRemove}
          onItemDelete={handleItemDelete}
          onSetAsDefault={handleSetAsDefault}
          onToast={addToast}
        />
      </main>

      <FloatingMicrophone
        defaultContainerId={preferences?.default_shelf?.container_id || state.containers[0]?.container_id}
        onCommandSuccess={(response) => {
          addToast({
            type: "success",
            title: "Voice Command Processed",
            description: response.message,
          });
          actions.loadContainers(); // Refresh data
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
