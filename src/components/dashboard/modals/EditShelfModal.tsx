import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ShelfWithItemsDTO, UpdateShelfCommandDTO } from "@/types";

interface EditShelfModalProps {
  isOpen: boolean;
  onClose: () => void;
  shelf: ShelfWithItemsDTO;
  onUpdate: (data: UpdateShelfCommandDTO) => void;
}

export function EditShelfModal({ isOpen, onClose, shelf, onUpdate }: EditShelfModalProps) {
  const [formData, setFormData] = useState<UpdateShelfCommandDTO>({
    name: shelf.name,
    position: shelf.position,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdate(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: shelf.name,
        position: shelf.position,
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Shelf</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Shelf Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Shelf name"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Input
              id="position"
              type="number"
              min="1"
              value={formData.position}
              onChange={(e) => setFormData((prev) => ({ ...prev, position: parseInt(e.target.value) || 1 }))}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-500">Position determines the order of shelves (1 = top)</p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.name.trim()}>
              {isSubmitting ? "Updating..." : "Update"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
