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
import { Archive, AlertTriangle } from 'lucide-react';

interface ArchiveConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  recordName: string;
  moduleName: string;
  isLoading?: boolean;
}

export const ArchiveConfirmModal: React.FC<ArchiveConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  recordName,
  moduleName,
  isLoading = false,
}) => {
  const getCascadingExplanation = () => {
    const norm = moduleName.toLowerCase();
    if (norm.includes('account')) {
      return 'Archiving this account will hide its associated contacts, deals, tickets, revenue, documents and tasks from normal CRM views. The records will remain in the database and can become visible again when the account is restored, subject to their individual archive statuses.';
    }
    if (norm.includes('deal')) {
      return 'Archiving this deal will hide its associated tickets, revenue, documents and deal tasks. The parent account and other deals belonging to the same account will remain visible.';
    }
    return `Archiving this ${moduleName.toLowerCase()} will hide it from normal CRM views. Its parent records and associated entities will remain visible.`;
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className='max-w-md'>
        <AlertDialogHeader>
          <div className='flex items-center gap-3'>
            <div className='h-10 w-10 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0'>
              <AlertTriangle className='h-5 w-5' />
            </div>
            <div>
              <AlertDialogTitle className='text-lg font-semibold'>
                Archive {moduleName}
              </AlertDialogTitle>
              <p className='text-xs text-muted-foreground mt-0.5 font-medium'>
                {recordName}
              </p>
            </div>
          </div>
          <AlertDialogDescription className='text-xs text-muted-foreground mt-3 leading-relaxed'>
            {getCascadingExplanation()}
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
            className='bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs h-9'
          >
            <Archive className='h-3.5 w-3.5 mr-1.5' />
            {isLoading ? 'Archiving...' : `Confirm Archive`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
