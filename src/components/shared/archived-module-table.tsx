import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { RotateCcw, Search, Archive, ExternalLink } from 'lucide-react';

import { ENV } from '@/conf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { RestoreConfirmModal } from '@/components/shared/restore-confirm-modal';

interface ArchivedTableProps {
  module: string;
  moduleLabel: string;
  detailUrlPrefix: string;
}

export const ArchivedModuleTable: React.FC<ArchivedTableProps> = ({
  module,
  moduleLabel,
  detailUrlPrefix,
}) => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<{ id: number; name: string } | null>(null);

  const queryClient = useQueryClient();

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['archived-list', module, page, debouncedSearch],
    queryFn: async () => {
      const url = new URL(`${ENV.VITE_BACKEND_BASE_URL}/archive/${module}`);
      url.searchParams.set('page', String(page));
      url.searchParams.set('page_size', '30');
      if (debouncedSearch) {
        url.searchParams.set('search', debouncedSearch);
      }
      const res = await fetch(url.toString(), { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch archived records');
      return res.json();
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/archive/${module}/${id}/restore`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || 'Failed to restore record');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(`${moduleLabel} restored successfully`);
      setSelectedRecord(null);
      refetch();
      // Invalidate normal module list queries so restored record immediately appears in active view
      queryClient.invalidateQueries({ queryKey: [module] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['revenue'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to restore record');
    },
  });

  const records = data?.data || [];
  const totalCount = data?.total_count || 0;
  const totalPages = data?.total_pages || 1;

  return (
    <div className='flex flex-col flex-1 h-full overflow-hidden bg-background'>
      {/* Search Bar */}
      <div className='p-4 border-b border-border/60 flex items-center justify-between gap-4'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search archived ${moduleLabel.toLowerCase()}...`}
            className='pl-9 h-9 text-xs'
          />
        </div>
        <div className='text-xs text-muted-foreground'>
          Total Archived: <span className='font-semibold text-foreground'>{totalCount}</span>
        </div>
      </div>

      {/* Table Container */}
      <div className='flex-1 overflow-auto'>
        <Table>
          <TableHeader className='bg-muted/30 sticky top-0 z-10'>
            <TableRow>
              <TableHead className='w-[100px] text-xs font-semibold'>ID</TableHead>
              <TableHead className='text-xs font-semibold'>{moduleLabel} Name</TableHead>
              <TableHead className='text-xs font-semibold'>Archived At</TableHead>
              <TableHead className='text-xs font-semibold'>Archived By</TableHead>
              <TableHead className='w-[150px] text-right text-xs font-semibold'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className='h-4 w-12' /></TableCell>
                  <TableCell><Skeleton className='h-4 w-36' /></TableCell>
                  <TableCell><Skeleton className='h-4 w-28' /></TableCell>
                  <TableCell><Skeleton className='h-4 w-24' /></TableCell>
                  <TableCell className='text-right'><Skeleton className='h-7 w-20 ml-auto' /></TableCell>
                </TableRow>
              ))
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className='h-64 text-center'>
                  <div className='flex flex-col items-center justify-center text-muted-foreground'>
                    <Archive className='h-10 w-10 text-muted-foreground/40 mb-2' />
                    <p className='text-sm font-medium'>No archived {moduleLabel.toLowerCase()} found</p>
                    <p className='text-xs mt-0.5 text-muted-foreground/80'>
                      Archived records will appear here for Super Admin review and restoration.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              records.map((item: any) => (
                <TableRow key={item.id} className='hover:bg-muted/20 transition-colors'>
                  <TableCell className='font-mono text-xs font-medium text-muted-foreground'>
                    #{item.id}
                  </TableCell>
                  <TableCell className='font-medium text-xs text-foreground'>
                    <div className='flex items-center gap-1.5'>
                      <a
                        href={`${detailUrlPrefix}/${item.id}`}
                        target='_blank'
                        rel='noreferrer'
                        className='hover:underline hover:text-primary flex items-center gap-1'
                      >
                        {item.name || `#${item.id}`}
                        <ExternalLink className='h-3 w-3 opacity-50' />
                      </a>
                    </div>
                  </TableCell>
                  <TableCell className='text-xs text-muted-foreground'>
                    {item.archived_at ? format(new Date(item.archived_at), 'dd MMM yyyy, HH:mm') : '—'}
                  </TableCell>
                  <TableCell className='text-xs text-muted-foreground'>
                    {item.archived_by_name || 'System / Unknown'}
                  </TableCell>
                  <TableCell className='text-right'>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => setSelectedRecord({ id: item.id, name: item.name })}
                      className='h-7 px-2.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 border-blue-200 dark:border-blue-900 cursor-pointer'
                    >
                      <RotateCcw className='h-3 w-3 mr-1' />
                      Restore
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className='p-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground'>
          <span>
            Page {page} of {totalPages}
          </span>
          <div className='flex items-center gap-2'>
            <Button
              size='sm'
              variant='outline'
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className='h-7 px-2 text-xs'
            >
              Previous
            </Button>
            <Button
              size='sm'
              variant='outline'
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className='h-7 px-2 text-xs'
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Restore Confirmation Dialog */}
      <RestoreConfirmModal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        onConfirm={() => selectedRecord && restoreMutation.mutate(selectedRecord.id)}
        recordName={selectedRecord?.name || ''}
        moduleName={moduleLabel}
        isLoading={restoreMutation.isPending}
      />
    </div>
  );
};
