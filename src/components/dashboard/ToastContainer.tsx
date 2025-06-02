import React from 'react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import type { Toast } from '@/lib/hooks/useToasts';

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  // Use sonner for toast notifications
  React.useEffect(() => {
    toasts.forEach((toastItem) => {
      const { type, title, description } = toastItem;
      
      switch (type) {
        case 'success':
          toast.success(title, { description });
          break;
        case 'error':
          toast.error(title, { description });
          break;
        case 'warning':
          toast.warning(title, { description });
          break;
        case 'info':
          toast.info(title, { description });
          break;
        default:
          toast(title, { description });
      }
      
      // Dismiss the toast from our state after showing
      onDismiss(toastItem.id);
    });
  }, [toasts, onDismiss]);

  return (
    <Toaster
      position="bottom-left"
      expand={true}
      richColors={true}
      closeButton={true}
    />
  );
} 