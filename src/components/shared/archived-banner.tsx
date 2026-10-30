import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface ArchivedBannerProps {
  archivedAt?: string | null;
  archivedByName?: string | null;
  onRestoreClick?: () => void;
  isRestoring?: boolean;
}

export const ArchivedBanner: React.FC<ArchivedBannerProps> = ({
  archivedAt,
  archivedByName,
  onRestoreClick,
  isRestoring = false,
}) => {
  const formattedDate = archivedAt
    ? format(new Date(archivedAt), 'PPpp')
    : 'Unknown Date';

  return (
    <div className='bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 shadow-2xs'>
      <div className='flex items-start sm:items-center gap-3'>
        <div className='h-9 w-9 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0'>
          <AlertCircle className='h-5 w-5' />
        </div>
        <div className='flex flex-col'>
          <div className='flex items-center gap-2'>
            <Badge variant='outline' className='bg-amber-500/20 text-amber-600 border-amber-500/30 font-semibold text-[10px] uppercase tracking-wider px-2 py-0.5'>
              Archived Record
            </Badge>
            <span className='text-xs font-medium text-foreground'>
              This record is archived and hidden from normal CRM views.
            </span>
          </div>
          <p className='text-[11px] text-muted-foreground mt-1'>
            Archived on <span className='font-medium text-foreground'>{formattedDate}</span>
            {archivedByName ? <> by <span className='font-medium text-foreground'>{archivedByName}</span></> : null}.
          </p>
        </div>
      </div>

      {onRestoreClick && (
        <Button
          size='sm'
          onClick={onRestoreClick}
          disabled={isRestoring}
          className='bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-8 shrink-0 cursor-pointer'
        >
          <RotateCcw className='h-3.5 w-3.5 mr-1.5' />
          {isRestoring ? 'Restoring...' : 'Restore Record'}
        </Button>
      )}
    </div>
  );
};
