import React, { useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Item } from "@/types";
import type { Toast } from "@/lib/hooks/useToasts";

interface ItemRowProps {
  item: Pick<Item, "item_id" | "name" | "quantity" | "created_at">;
  searchQuery?: string;
  onQuantityUpdate?: (itemId: string, quantity: number) => Promise<void>;
  onDelete?: (itemId: string) => Promise<void>;
  onToast: (toast: Omit<Toast, "id">) => void;
}

export function ItemRow({ item, searchQuery, onQuantityUpdate, onDelete, onToast }: ItemRowProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleQuantityUpdate = async (newQuantity: number) => {
    if (newQuantity < 0 || !onQuantityUpdate) return;

    setIsUpdating(true);
    try {
      await onQuantityUpdate(item.item_id, newQuantity);
      onToast({
        type: "success",
        title: "Quantity updated",
        description: `${item.name} quantity updated to ${newQuantity}`,
      });
    } catch (error) {
      onToast({
        type: "error",
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update quantity",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) {
      return;
    }

    setIsUpdating(true);
    try {
      await onDelete(item.item_id);
      onToast({
        type: "success",
        title: "Item deleted",
        description: `${item.name} has been deleted`,
      });
    } catch (error) {
      onToast({
        type: "error",
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete item",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Highlight search terms
  const highlightText = (text: string, query?: string) => {
    if (!query || query.length < 2) return text;

    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-100">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{highlightText(item.name, searchQuery)}</p>
        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
      </div>

      <div className="flex items-center space-x-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleQuantityUpdate(item.quantity - 1)}
          disabled={isUpdating || item.quantity <= 0}
          className="h-6 w-6 p-0"
        >
          <Minus className="h-3 w-3" />
        </Button>

        <span className="text-xs font-medium min-w-[2rem] text-center">{item.quantity}</span>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleQuantityUpdate(item.quantity + 1)}
          disabled={isUpdating}
          className="h-6 w-6 p-0"
        >
          <Plus className="h-3 w-3" />
        </Button>

        <Button variant="ghost" size="sm" onClick={handleDelete} className="h-6 w-6 p-0 text-red-600">
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
