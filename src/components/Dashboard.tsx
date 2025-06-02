import React, { useEffect } from 'react';
import { useDashboard } from '@/lib/hooks/useDashboard';
import { useToasts } from '@/lib/hooks/useToasts';
import { Header } from './dashboard/Header';
import { ContainerGrid } from './dashboard/ContainerGrid';
import { FloatingMicrophone } from './dashboard/FloatingMicrophone';
import { ToastContainer } from './dashboard/ToastContainer';
import { Skeleton } from '@/components/ui/skeleton';

export function Dashboard() {
  const { state, actions } = useDashboard();
  const { toasts, addToast, dismissToast } = useToasts();

  console.log('🏠 Dashboard state:', { 
    isAuthenticated: state.isAuthenticated, 
    isLoading: state.isLoading,
    containersCount: state.containers.length 
  });

  // Handle authentication redirect
  useEffect(() => {
    if (state.isAuthenticated === false) {
      window.location.href = '/login';
    }
  }, [state.isAuthenticated]);

  // Handle errors with toasts
  useEffect(() => {
    if (state.error) {
      addToast({
        type: 'error',
        title: 'Error',
        description: state.error,
      });
    }
  }, [state.error, addToast]);

  // Show loading skeleton while checking auth or loading data
  if (state.isAuthenticated === null || state.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-96 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (state.isAuthenticated === false) {
    return null;
  }

  // Create wrapper functions for item operations
  const handleItemQuantityUpdate = async (itemId: string, quantity: number) => {
    await actions.updateItemQuantity(itemId, { quantity });
  };

  const handleItemQuantityRemove = async (itemId: string, quantity: number) => {
    await actions.removeItemQuantity(itemId, { quantity });
  };

  const handleItemDelete = async (itemId: string) => {
    await actions.deleteItem(itemId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        onSearch={actions.searchItems}
        searchResults={state.searchResults}
        isSearching={state.isSearching}
        searchQuery={state.searchQuery}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ContainerGrid
          containers={state.containers}
          searchQuery={state.searchQuery}
          onContainerCreate={actions.createContainer}
          onContainerUpdate={actions.updateContainer}
          onContainerDelete={actions.deleteContainer}
          onShelfAdd={actions.addShelf}
          onShelfUpdate={actions.updateShelf}
          onShelfDelete={actions.deleteShelf}
          onItemAdd={actions.addItem}
          onItemQuantityUpdate={handleItemQuantityUpdate}
          onItemQuantityRemove={handleItemQuantityRemove}
          onItemDelete={handleItemDelete}
          onToast={addToast}
        />
      </main>

      <FloatingMicrophone
        defaultContainerId={state.containers[0]?.container_id}
        onCommandSuccess={(response) => {
          addToast({
            type: 'success',
            title: 'Voice Command Processed',
            description: response.message,
          });
          actions.loadContainers(); // Refresh data
        }}
        onCommandError={(error) => {
          addToast({
            type: 'error',
            title: 'Voice Command Failed',
            description: error,
          });
        }}
      />

      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
      />
    </div>
  );
} 