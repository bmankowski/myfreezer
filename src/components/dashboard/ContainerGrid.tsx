import React from 'react';
import { ContainerCard } from './ContainerCard';
import type { 
  ContainerDetailsDTO, 
  UpdateContainerCommandDTO,
  CreateShelfCommandDTO,
  UpdateShelfCommandDTO,
  AddItemCommandDTO
} from '@/types';
import type { Toast } from '@/lib/hooks/useToasts';

interface ContainerGridProps {
  containers: ContainerDetailsDTO[];
  searchQuery?: string;
  onContainerUpdate: (id: string, data: UpdateContainerCommandDTO) => void;
  onContainerDelete: (id: string) => void;
  onShelfAdd: (containerId: string, data: CreateShelfCommandDTO) => void;
  onShelfUpdate: (shelfId: string, data: UpdateShelfCommandDTO) => void;
  onShelfDelete: (shelfId: string) => void;
  onItemAdd: (shelfId: string, data: AddItemCommandDTO) => void;
  onItemQuantityUpdate?: (itemId: string, quantity: number) => Promise<void>;
  onItemQuantityRemove?: (itemId: string, quantity: number) => Promise<void>;
  onItemDelete?: (itemId: string) => Promise<void>;
  onToast: (toast: Omit<Toast, 'id'>) => void;
}

export function ContainerGrid({
  containers,
  searchQuery,
  onContainerUpdate,
  onContainerDelete,
  onShelfAdd,
  onShelfUpdate,
  onShelfDelete,
  onItemAdd,
  onItemQuantityUpdate,
  onItemQuantityRemove,
  onItemDelete,
  onToast,
}: ContainerGridProps) {
  if (containers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto max-w-md">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No containers</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first container.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {containers.map((container) => (
        <ContainerCard
          key={container.container_id}
          container={container}
          searchQuery={searchQuery}
          onUpdate={(data) => onContainerUpdate(container.container_id, data)}
          onDelete={() => onContainerDelete(container.container_id)}
          onShelfAdd={(data) => onShelfAdd(container.container_id, data)}
          onShelfUpdate={onShelfUpdate}
          onShelfDelete={onShelfDelete}
          onItemAdd={onItemAdd}
          onItemQuantityUpdate={onItemQuantityUpdate}
          onItemQuantityRemove={onItemQuantityRemove}
          onItemDelete={onItemDelete}
          onToast={onToast}
        />
      ))}
    </div>
  );
} 