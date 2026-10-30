import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RotateCcw, CheckCircle2 } from 'lucide-react';

interface RestoreConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  recordName: string;
  moduleName: string;
  isLoading?: boolean;
}

export const RestoreConfirmModal: React.FC<RestoreConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  recordName,
  moduleName,
  isLoading = false,
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className='max-w-md'>
        <AlertDialogHeader>
          <div className='flex items-center gap-3'>
            <div className='h-10 w-10 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0'>
              <RotateCcw className='h-5 w-5' />
            </div>
            <div>
              <AlertDialogTitle className='text-lg font-semibold'>
                Restore {moduleName}
              </AlertDialogTitle>
              <p className='text-xs text-muted-foreground mt-0.5 font-medium'>
                {recordName}
              </p>
            </div>
          </div>
          <AlertDialogDescription className='text-xs text-muted-foreground mt-3 leading-relaxed'>
            Are you sure you want to restore this record? It will become visible in normal CRM views only if its parent records are active.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className='mt-4'>
          <AlertDialogCancel disabled={isLoading} onClick={onClose}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isLoading}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            className='bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-9'
          >
            <CheckCircle2 className='h-3.5 w-3.5 mr-1.5' />
            {isLoading ? 'Restoring...' : `Confirm Restore`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
