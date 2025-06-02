import React, { useState } from "react";
import { Plus, Trash2, Edit, MoreHorizontal, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ItemList } from "./ItemList";
import { EditShelfModal } from "./modals/EditShelfModal";
import { AddItemModal } from "./modals/AddItemModal";
import type { ShelfWithItemsDTO, UpdateShelfCommandDTO, AddItemCommandDTO } from "@/types";
import type { Toast } from "@/lib/hooks/useToasts";

interface ShelfSectionProps {
  shelf: ShelfWithItemsDTO;
  searchQuery?: string;
  isDefault?: boolean;
  onUpdate: (data: UpdateShelfCommandDTO) => void;
  onDelete: () => void;
  onItemAdd: (data: AddItemCommandDTO) => void;
  onItemQuantityUpdate?: (itemId: string, quantity: number) => Promise<void>;
  onItemQuantityRemove?: (itemId: string, quantity: number) => Promise<void>;
  onItemDelete?: (itemId: string) => Promise<void>;
  onSetAsDefault?: (shelfId: string) => Promise<void>;
  onToast: (toast: Omit<Toast, "id">) => void;
}

export function ShelfSection({
  shelf,
  searchQuery,
  isDefault = false,
  onUpdate,
  onDelete,
  onItemAdd,
  onItemQuantityUpdate,
  onItemQuantityRemove,
  onItemDelete,
  onSetAsDefault,
  onToast,
}: ShelfSectionProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isSettingDefault, setIsSettingDefault] = useState(false);

  const isEmpty = shelf.items.length === 0;

  const handleDelete = () => {
    if (!isEmpty) {
      onToast({
        type: "error",
        title: "Cannot delete shelf",
        description: "Shelf must be empty before deletion",
      });
      return;
    }

    if (window.confirm("Are you sure you want to delete this shelf?")) {
      onDelete();
      onToast({
        type: "success",
        title: "Shelf deleted",
        description: `${shelf.name} has been deleted`,
      });
    }
  };

  const handleUpdate = (data: UpdateShelfCommandDTO) => {
    onUpdate(data);
    onToast({
      type: "success",
      title: "Shelf updated",
      description: `${data.name} has been updated`,
    });
    setIsEditModalOpen(false);
  };

  const handleItemAdd = (data: AddItemCommandDTO) => {
    onItemAdd(data);
    onToast({
      type: "success",
      title: "Item added",
      description: `${data.name} has been added`,
    });
    setIsAddItemModalOpen(false);
  };

  const handleSetAsDefault = async () => {
    if (!onSetAsDefault || isDefault) return;

    try {
      setIsSettingDefault(true);
      await onSetAsDefault(shelf.shelf_id);
      onToast({
        type: "success",
        title: "Default shelf set",
        description: `${shelf.name} is now your default shelf`,
      });
    } catch (error) {
      onToast({
        type: "error",
        title: "Failed to set default shelf",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsSettingDefault(false);
    }
  };

  // Filter items based on search query
  const filteredItems =
    searchQuery && searchQuery.length >= 2
      ? shelf.items.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : shelf.items;

  // Don't show shelf if no items match search
  if (searchQuery && searchQuery.length >= 2 && filteredItems.length === 0) {
    return null;
  }

  return (
    <>
      <div
        className={`border rounded-lg bg-gray-50 flex cursor-pointer transition-all hover:shadow-md ${
          isDefault ? "border-yellow-300 bg-yellow-50 shadow-sm" : "border-gray-200"
        }`}
        onClick={handleSetAsDefault}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleSetAsDefault();
          }
        }}
      >
        {/* Vertical Shelf Name on Left */}
        <div
          className={`flex-shrink-0 w-10 rounded-l-lg flex flex-col items-center justify-between relative py-3 ${
            isDefault ? "bg-yellow-200" : "bg-gray-200"
          }`}
        >
          {/* Default indicator - positioned at top */}
          {isDefault && (
            <div className="flex-shrink-0 mb-2">
              <Star className="h-3 w-3 text-yellow-600 fill-current" />
            </div>
          )}

          {/* Shelf Name - positioned in center area */}
          <div className="flex-1 flex items-center justify-center">
            <div
              className={`transform -rotate-90 whitespace-nowrap text-sm font-medium ${
                isDefault ? "text-yellow-800" : "text-gray-700"
              }`}
              style={{
                transformOrigin: "center",
              }}
            >
              {shelf.name.length > 10 ? shelf.name.slice(0, 10) : shelf.name}
            </div>
          </div>

          {/* Dropdown Menu - positioned at bottom */}
          <div className="flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => e.stopPropagation()} // Prevent triggering shelf click
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {onSetAsDefault && !isDefault && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetAsDefault();
                    }}
                    disabled={isSettingDefault}
                  >
                    <Star className="mr-2 h-3 w-3" />
                    {isSettingDefault ? "Setting..." : "Set as Default"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditModalOpen(true);
                  }}
                >
                  <Edit className="mr-2 h-3 w-3" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  disabled={!isEmpty}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-3 w-3" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Main Shelf Content */}
        <div
          className="flex-1 p-3"
          onClick={(e) => e.stopPropagation()} // Prevent triggering shelf click
          role="none" // This element doesn't need interactive behavior
        >
          {/* Items */}
          <ItemList
            items={filteredItems}
            searchQuery={searchQuery}
            onQuantityUpdate={onItemQuantityUpdate}
            onQuantityRemove={onItemQuantityRemove}
            onDelete={onItemDelete}
            onToast={onToast}
          />

          {/* Add Item Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsAddItemModalOpen(true);
            }}
            className="w-full mt-2 h-8 text-xs"
          >
            <Plus className="mr-1 h-3 w-3" />
            Add Item
          </Button>
        </div>
      </div>

      <EditShelfModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        shelf={shelf}
        onUpdate={handleUpdate}
      />

      <AddItemModal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        shelfName={shelf.name}
        onAdd={handleItemAdd}
      />
    </>
  );
}
