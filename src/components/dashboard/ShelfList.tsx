import React from "react";
import { ShelfSection } from "./ShelfSection";
import type { AddItemCommandDTO, ShelfWithItemsDTO, UpdateShelfCommandDTO, UserPreferencesDTO } from "@/types";
import type { Toast } from "@/lib/hooks/useToasts";

interface ShelfListProps {
  shelves: ShelfWithItemsDTO[];
  searchQuery?: string;
  userPreferences?: UserPreferencesDTO | null;
  onShelfUpdate: (shelfId: string, data: UpdateShelfCommandDTO) => void;
  onShelfDelete: (shelfId: string) => void;
  onItemAdd: (shelfId: string, data: AddItemCommandDTO) => void;
  onItemQuantityUpdate?: (itemId: string, quantity: number) => Promise<void>;
  onItemQuantityRemove?: (itemId: string, quantity: number) => Promise<void>;
  onItemDelete?: (itemId: string) => Promise<void>;
  onSetAsDefault?: (shelfId: string) => Promise<void>;
  onToast: (toast: Omit<Toast, "id">) => void;
}

export function ShelfList({
  shelves,
  searchQuery,
  userPreferences,
  onShelfUpdate,
  onShelfDelete,
  onItemAdd,
  onItemQuantityUpdate,
  onItemQuantityRemove,
  onItemDelete,
  onSetAsDefault,
  onToast,
}: ShelfListProps) {
  // Sort shelves by position
  const sortedShelves = [...shelves].sort((a, b) => a.position - b.position);

  if (shelves.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <p className="text-sm">No shelves yet</p>
        <p className="text-xs">Add a shelf to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedShelves.map((shelf) => (
        <ShelfSection
          key={shelf.shelf_id}
          shelf={shelf}
          searchQuery={searchQuery}
          isDefault={userPreferences?.default_shelf_id === shelf.shelf_id}
          onUpdate={(data) => onShelfUpdate(shelf.shelf_id, data)}
          onDelete={() => onShelfDelete(shelf.shelf_id)}
          onItemAdd={(data) => onItemAdd(shelf.shelf_id, data)}
          onItemQuantityUpdate={onItemQuantityUpdate}
          onItemQuantityRemove={onItemQuantityRemove}
          onItemDelete={onItemDelete}
          onSetAsDefault={onSetAsDefault}
          onToast={onToast}
        />
      ))}
    </div>
  );
}
