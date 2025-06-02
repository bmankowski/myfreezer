import React from "react";
import { ItemRow } from "./ItemRow";
import type { Item } from "@/types";
import type { Toast } from "@/lib/hooks/useToasts";

interface ItemListProps {
  items: Pick<Item, "item_id" | "name" | "quantity" | "created_at">[];
  searchQuery?: string;
  onQuantityUpdate?: (itemId: string, quantity: number) => Promise<void>;
  onQuantityRemove?: (itemId: string, quantity: number) => Promise<void>;
  onDelete?: (itemId: string) => Promise<void>;
  onToast: (toast: Omit<Toast, "id">) => void;
}

export function ItemList({ items, searchQuery, onQuantityUpdate, onQuantityRemove, onDelete, onToast }: ItemListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-3 text-gray-400">
        <p className="text-xs">No items</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <ItemRow
          key={item.item_id}
          item={item}
          searchQuery={searchQuery}
          onQuantityUpdate={onQuantityUpdate}
          onQuantityRemove={onQuantityRemove}
          onDelete={onDelete}
          onToast={onToast}
        />
      ))}
    </div>
  );
}
