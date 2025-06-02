import React, { useState } from 'react';
import { MoreVertical, Plus, Trash2, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ShelfList } from './ShelfList';
import { EditContainerModal } from './modals/EditContainerModal';
import { AddShelfModal } from './modals/AddShelfModal';
import type { 
  ContainerDetailsDTO, 
  UpdateContainerCommandDTO,
  CreateShelfCommandDTO,
  UpdateShelfCommandDTO,
  AddItemCommandDTO
} from '@/types';
import type { Toast } from '@/lib/hooks/useToasts';

interface ContainerCardProps {
  container: ContainerDetailsDTO;
  searchQuery?: string;
  onUpdate: (data: UpdateContainerCommandDTO) => void;
  onDelete: () => void;
  onShelfAdd: (data: CreateShelfCommandDTO) => void;
  onShelfUpdate: (shelfId: string, data: UpdateShelfCommandDTO) => void;
  onShelfDelete: (shelfId: string) => void;
  onItemAdd: (shelfId: string, data: AddItemCommandDTO) => void;
  onItemQuantityUpdate?: (itemId: string, quantity: number) => Promise<void>;
  onItemQuantityRemove?: (itemId: string, quantity: number) => Promise<void>;
  onItemDelete?: (itemId: string) => Promise<void>;
  onToast: (toast: Omit<Toast, 'id'>) => void;
}

export function ContainerCard({
  container,
  searchQuery,
  onUpdate,
  onDelete,
  onShelfAdd,
  onShelfUpdate,
  onShelfDelete,
  onItemAdd,
  onItemQuantityUpdate,
  onItemQuantityRemove,
  onItemDelete,
  onToast,
}: ContainerCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddShelfModalOpen, setIsAddShelfModalOpen] = useState(false);

  const isEmpty = container.total_items === 0;
  const containerTypeIcon = container.type === 'freezer' ? '❄️' : '🧊';
  const containerTypeColor = container.type === 'freezer' ? 'text-blue-600' : 'text-cyan-600';

  const handleDelete = () => {
    if (!isEmpty) {
      onToast({
        type: 'error',
        title: 'Cannot delete container',
        description: 'Container must be empty before deletion',
      });
      return;
    }

    if (window.confirm('Are you sure you want to delete this container?')) {
      onDelete();
      onToast({
        type: 'success',
        title: 'Container deleted',
        description: `${container.name} has been deleted`,
      });
    }
  };

  const handleUpdate = (data: UpdateContainerCommandDTO) => {
    onUpdate(data);
    onToast({
      type: 'success',
      title: 'Container updated',
      description: `${data.name} has been updated`,
    });
    setIsEditModalOpen(false);
  };

  const handleShelfAdd = (data: CreateShelfCommandDTO) => {
    onShelfAdd(data);
    onToast({
      type: 'success',
      title: 'Shelf added',
      description: `${data.name} has been added`,
    });
    setIsAddShelfModalOpen(false);
  };

  return (
    <>
      <Card className="h-fit">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{containerTypeIcon}</span>
              <h3 className={`font-semibold text-lg ${containerTypeColor}`}>
                {container.name}
              </h3>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDelete}
                  disabled={!isEmpty}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{container.shelves.length} shelves</span>
            <span>{container.total_items} items</span>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <ShelfList
            shelves={container.shelves}
            containerId={container.container_id}
            searchQuery={searchQuery}
            onShelfUpdate={onShelfUpdate}
            onShelfDelete={onShelfDelete}
            onItemAdd={onItemAdd}
            onToast={onToast}
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddShelfModalOpen(true)}
            className="w-full mt-4"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Shelf
          </Button>
        </CardContent>
      </Card>

      <EditContainerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        container={container}
        onUpdate={handleUpdate}
      />

      <AddShelfModal
        isOpen={isAddShelfModalOpen}
        onClose={() => setIsAddShelfModalOpen(false)}
        existingPositions={container.shelves.map(s => s.position)}
        onAdd={handleShelfAdd}
      />
    </>
  );
} 