import React, { useState } from 'react';
import { Plus, Minus, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Item } from '@/types';
import type { Toast } from '@/lib/hooks/useToasts';

interface ItemRowProps {
  item: Pick<Item, "item_id" | "name" | "quantity" | "created_at">;
  searchQuery?: string;
  onQuantityUpdate?: (itemId: string, quantity: number) => Promise<void>;
  onQuantityRemove?: (itemId: string, quantity: number) => Promise<void>;
  onDelete?: (itemId: string) => Promise<void>;
  onToast: (toast: Omit<Toast, 'id'>) => void;
}

export function ItemRow({ 
  item, 
  searchQuery, 
  onQuantityUpdate,
  onQuantityRemove,
  onDelete,
  onToast 
}: ItemRowProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleQuantityUpdate = async (newQuantity: number) => {
    if (newQuantity < 0 || !onQuantityUpdate) return;
    
    setIsUpdating(true);
    try {
      await onQuantityUpdate(item.item_id, newQuantity);
      onToast({
        type: 'success',
        title: 'Quantity updated',
        description: `${item.name} quantity updated to ${newQuantity}`,
      });
    } catch (error) {
      onToast({
        type: 'error',
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update quantity',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveQuantity = async (removeAmount: number) => {
    if (removeAmount <= 0 || removeAmount > item.quantity || !onQuantityRemove) return;
    
    setIsUpdating(true);
    try {
      await onQuantityRemove(item.item_id, removeAmount);
      onToast({
        type: 'success',
        title: 'Quantity reduced',
        description: `${item.name} quantity reduced by ${removeAmount}`,
      });
    } catch (error) {
      onToast({
        type: 'error',
        title: 'Remove failed',
        description: error instanceof Error ? error.message : 'Failed to remove quantity',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${item.name}?`) || !onDelete) {
      return;
    }

    setIsUpdating(true);
    try {
      await onDelete(item.item_id);
      onToast({
        type: 'success',
        title: 'Item deleted',
        description: `${item.name} has been deleted`,
      });
    } catch (error) {
      onToast({
        type: 'error',
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete item',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Highlight search terms
  const highlightText = (text: string, query?: string) => {
    if (!query || query.length < 2) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-100">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {highlightText(item.name, searchQuery)}
        </p>
        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
      </div>
      
      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleRemoveQuantity(1)}
          disabled={isUpdating || item.quantity <= 0}
          className="h-6 w-6 p-0"
        >
          <Minus className="h-3 w-3" />
        </Button>
        
        <span className="text-xs font-medium min-w-[2rem] text-center">
          {item.quantity}
        </span>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleQuantityUpdate(item.quantity + 1)}
          disabled={isUpdating}
          className="h-6 w-6 p-0"
        >
          <Plus className="h-3 w-3" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={handleDelete}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-3 w-3" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
} 