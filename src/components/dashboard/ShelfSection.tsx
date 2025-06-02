import React, { useState } from "react";
import { Plus, Trash2, Edit, MoreHorizontal } from "lucide-react";
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
  onUpdate: (data: UpdateShelfCommandDTO) => void;
  onDelete: () => void;
  onItemAdd: (data: AddItemCommandDTO) => void;
  onItemQuantityUpdate?: (itemId: string, quantity: number) => Promise<void>;
  onItemQuantityRemove?: (itemId: string, quantity: number) => Promise<void>;
  onItemDelete?: (itemId: string) => Promise<void>;
  onToast: (toast: Omit<Toast, "id">) => void;
}

export function ShelfSection({
  shelf,
  searchQuery,
  onUpdate,
  onDelete,
  onItemAdd,
  onItemQuantityUpdate,
  onItemQuantityRemove,
  onItemDelete,
  onToast,
}: ShelfSectionProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);

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
      <div className="border border-gray-200 rounded-lg bg-gray-50 flex">
        {/* Vertical Shelf Name on Left */}
        <div className="flex-shrink-0 w-10 bg-gray-200 rounded-l-lg flex flex-col items-center justify-between relative py-3">
          {/* Shelf Name - positioned in upper area */}
          <div className="flex-1 flex items-center justify-center mt-8">
            <div
              className="transform -rotate-90 whitespace-nowrap text-sm font-medium text-gray-700"
              style={{
                transformOrigin: "center",
              }}
            >
              {shelf.name.length > 10 ? shelf.name.slice(0, 10) : shelf.name}
            </div>
          </div>

          {/* Dropdown Menu - positioned at bottom */}
          <div className="flex-shrink-0 mt-8">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                  <Edit className="mr-2 h-3 w-3" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} disabled={!isEmpty} className="text-red-600">
                  <Trash2 className="mr-2 h-3 w-3" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Main Shelf Content */}
        <div className="flex-1 p-3">
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
            onClick={() => setIsAddItemModalOpen(true)}
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
