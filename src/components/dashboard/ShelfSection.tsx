import React, { useState } from 'react';
import { MoreVertical, Plus, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ItemList } from './ItemList';
import { EditShelfModal } from './modals/EditShelfModal';
import { AddItemModal } from './modals/AddItemModal';
import type { 
  ShelfWithItemsDTO,
  UpdateShelfCommandDTO,
  AddItemCommandDTO
} from '@/types';
import type { Toast } from '@/lib/hooks/useToasts';

interface ShelfSectionProps {
  shelf: ShelfWithItemsDTO;
  containerId: string;
  searchQuery?: string;
  onUpdate: (data: UpdateShelfCommandDTO) => void;
  onDelete: () => void;
  onItemAdd: (data: AddItemCommandDTO) => void;
  onItemQuantityUpdate?: (itemId: string, quantity: number) => Promise<void>;
  onItemQuantityRemove?: (itemId: string, quantity: number) => Promise<void>;
  onItemDelete?: (itemId: string) => Promise<void>;
  onToast: (toast: Omit<Toast, 'id'>) => void;
}

export function ShelfSection({
  shelf,
  containerId,
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
        type: 'error',
        title: 'Cannot delete shelf',
        description: 'Shelf must be empty before deletion',
      });
      return;
    }

    if (window.confirm('Are you sure you want to delete this shelf?')) {
      onDelete();
      onToast({
        type: 'success',
        title: 'Shelf deleted',
        description: `${shelf.name} has been deleted`,
      });
    }
  };

  const handleUpdate = (data: UpdateShelfCommandDTO) => {
    onUpdate(data);
    onToast({
      type: 'success',
      title: 'Shelf updated',
      description: `${data.name} has been updated`,
    });
    setIsEditModalOpen(false);
  };

  const handleItemAdd = (data: AddItemCommandDTO) => {
    onItemAdd(data);
    onToast({
      type: 'success',
      title: 'Item added',
      description: `${data.name} has been added`,
    });
    setIsAddItemModalOpen(false);
  };

  // Filter items based on search query
  const filteredItems = searchQuery && searchQuery.length >= 2
    ? shelf.items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : shelf.items;

  // Don't show shelf if no items match search
  if (searchQuery && searchQuery.length >= 2 && filteredItems.length === 0) {
    return null;
  }

  return (
    <>
      <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
        {/* Shelf Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <h4 className="font-medium text-gray-900">{shelf.name}</h4>
            <span className="text-xs text-gray-500">#{shelf.position}</span>
            <span className="text-xs text-gray-500">
              {shelf.items.length} items
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                <Edit className="mr-2 h-3 w-3" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDelete}
                disabled={!isEmpty}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-3 w-3" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

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