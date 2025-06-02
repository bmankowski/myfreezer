import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { ContainerCard } from './ContainerCard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { 
  ContainerDetailsDTO, 
  UpdateContainerCommandDTO,
  CreateContainerCommandDTO,
  CreateShelfCommandDTO,
  UpdateShelfCommandDTO,
  AddItemCommandDTO
} from '@/types';
import type { Toast } from '@/lib/hooks/useToasts';

interface ContainerGridProps {
  containers: ContainerDetailsDTO[];
  searchQuery?: string;
  onContainerCreate: (data: CreateContainerCommandDTO) => void;
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
  onContainerCreate,
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<'freezer' | 'fridge'>('freezer');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onContainerCreate({ name: name.trim(), type });
    setName('');
    setType('freezer');
    setIsDialogOpen(false);
    onToast({
      type: 'success',
      title: 'Container Created',
      description: `${name} has been added successfully.`,
    });
  };

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
          <div className="mt-6">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Container
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Container</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Container Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Main Freezer, Kitchen Fridge"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select value={type} onValueChange={(value: 'freezer' | 'fridge') => setType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="freezer">❄️ Freezer</SelectItem>
                        <SelectItem value="fridge">🧊 Fridge</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Container</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Containers</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Container
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Container</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Container Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Main Freezer, Kitchen Fridge"
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={(value: 'freezer' | 'fridge') => setType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="freezer">❄️ Freezer</SelectItem>
                    <SelectItem value="fridge">🧊 Fridge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Container</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
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
    </div>
  );
} 