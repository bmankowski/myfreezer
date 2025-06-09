import React from "react";
import { ContainerCard } from "./ContainerCard";
import type {
  AddItemCommandDTO,
  ContainerDetailsDTO,
  CreateShelfCommandDTO,
  ItemWithLocationDTO,
  UpdateContainerCommandDTO,
  UpdateShelfCommandDTO,
  UserPreferencesDTO,
} from "@/types";
import type { Toast } from "@/lib/hooks/useToasts";

interface ContainerGridProps {
  containers: ContainerDetailsDTO[];
  searchQuery?: string;
  searchResults?: ItemWithLocationDTO[];
  isSearching?: boolean;
  userPreferences?: UserPreferencesDTO | null;
  onContainerUpdate: (id: string, data: UpdateContainerCommandDTO) => void;
  onContainerDelete: (id: string) => void;
  onShelfAdd: (containerId: string, data: CreateShelfCommandDTO) => void;
  onShelfUpdate: (shelfId: string, data: UpdateShelfCommandDTO) => void;
  onShelfDelete: (shelfId: string) => void;
  onItemAdd: (shelfId: string, data: AddItemCommandDTO) => void;
  onItemQuantityUpdate?: (itemId: string, quantity: number) => Promise<void>;
  onItemDelete?: (itemId: string) => Promise<void>;
  onSetAsDefault?: (shelfId: string) => Promise<void>;
  onToast: (toast: Omit<Toast, "id">) => void;
}

export function ContainerGrid({
  containers,
  searchQuery,
  searchResults,
  isSearching,
  userPreferences,
  onContainerUpdate,
  onContainerDelete,
  onShelfAdd,
  onShelfUpdate,
  onShelfDelete,
  onItemAdd,
  onItemQuantityUpdate,
  onItemDelete,
  onSetAsDefault,
  onToast,
}: ContainerGridProps) {
  // Filter containers based on search query
  const filteredContainers =
    searchQuery && searchQuery.length >= 2
      ? containers.filter((container) => {
          // Check if any item in any shelf matches the search query
          return container.shelves.some((shelf) =>
            shelf.items.some((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
          );
        })
      : containers;

  // Show empty state for no containers (when not searching)
  if (containers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto max-w-md">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No containers</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first container using the &ldquo;Add Container&rdquo; button in the header.
          </p>
        </div>
      </div>
    );
  }

  // Show no results state when searching
  if (searchQuery && searchQuery.length >= 2 && filteredContainers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto max-w-md">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
          <p className="mt-1 text-sm text-gray-500">
            No items found matching &ldquo;{searchQuery}&rdquo;. Try a different search term.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Results Section */}
      {searchQuery && searchQuery.length >= 2 && searchResults && searchResults.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-blue-900">Search Results for &ldquo;{searchQuery}&rdquo;</h3>
            <span className="text-sm text-blue-600">{searchResults.length} items found</span>
          </div>
          <div className="grid gap-3">
            {searchResults.map((item) => (
              <div
                key={item.item_id}
                className="bg-white border border-blue-200 rounded-md p-3 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.container.name} → {item.shelf.name} • Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-lg">{item.container.type === "freezer" ? "❄️" : "🧊"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading indicator for search */}
      {searchQuery && searchQuery.length >= 2 && isSearching && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Searching...</p>
        </div>
      )}

      {/* Containers Section */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {searchQuery && searchQuery.length >= 2 && (
            <span className="ml-2 text-base font-normal text-gray-500">
              ({filteredContainers.length} containing &ldquo;{searchQuery}&rdquo;)
            </span>
          )}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContainers.map((container) => (
          <ContainerCard
            key={container.container_id}
            container={container}
            searchQuery={searchQuery}
            userPreferences={userPreferences}
            onUpdate={(data) => onContainerUpdate(container.container_id, data)}
            onDelete={() => onContainerDelete(container.container_id)}
            onShelfAdd={(data) => onShelfAdd(container.container_id, data)}
            onShelfUpdate={onShelfUpdate}
            onShelfDelete={onShelfDelete}
            onItemAdd={onItemAdd}
            onItemQuantityUpdate={onItemQuantityUpdate}
            onItemDelete={onItemDelete}
            onSetAsDefault={onSetAsDefault}
            onToast={onToast}
          />
        ))}
      </div>
    </div>
  );
}
