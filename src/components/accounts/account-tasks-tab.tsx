import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, RefreshCw, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatExactDate } from '@/utils/date-formatter';
import { ENV } from '@/conf';
import type {
  AccountTask,
  TaskStatus,
  CallBackDateStatus,
} from '@/types/account-task';
import CreateAccountTaskModal from '@/components/account-tasks/create-account-task-modal';
import UpdateAccountTaskModal from '@/components/account-tasks/update-account-task-modal';
import { useAuth } from '@/context/auth-context';

interface AccountTasksTabProps {
  accountId: string | number;
  accountName?: string;
}

const formatISTDateTime = (dateStr?: string | null) => {
  if (!dateStr) return '-';
  try {
    const dt = new Date(dateStr);
    if (isNaN(dt.getTime())) return '-';
    const parts = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).formatToParts(dt);

    const d = parts.find((p) => p.type === 'day')?.value || '';
    const m = parts.find((p) => p.type === 'month')?.value || '';
    const y = parts.find((p) => p.type === 'year')?.value || '';
    const hr = parts.find((p) => p.type === 'hour')?.value || '';
    const min = parts.find((p) => p.type === 'minute')?.value || '';
    const dayPeriod =
      parts.find((p) => p.type === 'dayPeriod')?.value?.toUpperCase() || '';

    return `${d}/${m}/${y}, ${hr}:${min} ${dayPeriod}`;
  } catch {
    return dateStr || '-';
  }
};

export default function AccountTasksTab({
  accountId,
  accountName,
}: AccountTasksTabProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = String(user?.role || '').toLowerCase();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | number | null>(
    null,
  );
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['account-tasks', accountId],
    queryFn: async () => {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/accounts/${accountId}/tasks?page_size=50`,
        { credentials: 'include' },
      );
      if (!res.ok) throw new Error('Failed to fetch tasks for account');
      return res.json();
    },
    enabled: !!accountId,
  });

  const tasks: AccountTask[] = data?.data || [];

  const quickCompleteMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/account-tasks/${taskId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ task_status: 'Completed' }),
        },
      );
      if (!res.ok) throw new Error('Failed to mark task as completed');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Task marked as Completed!');
      queryClient.invalidateQueries({ queryKey: ['account-tasks', accountId] });
    },
    onError: () => {
      toast.error('Failed to mark task as completed');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/account-tasks/${taskId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      );
      if (!res.ok) throw new Error('Failed to delete task');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Task deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['account-tasks', accountId] });
      queryClient.invalidateQueries({ queryKey: ['account-tasks-list'] });
    },
    onError: () => {
      toast.error('Error deleting task');
    },
  });

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'Completed':
      case 'Verified':
        return (
          <Badge className='bg-green-600 hover:bg-green-700 text-white'>
            {status}
          </Badge>
        );
      case 'In Progress':
        return (
          <Badge className='bg-blue-600 hover:bg-blue-700 text-white'>
            {status}
          </Badge>
        );
      case 'Pending':
      case 'Assigned':
        return (
          <Badge className='bg-amber-500 hover:bg-amber-600 text-white'>
            {status}
          </Badge>
        );
      case 'Overdue':
        return <Badge variant='destructive'>{status}</Badge>;
      default:
        return <Badge variant='outline'>{status || 'Unassigned'}</Badge>;
    }
  };

  const getCallBackBadge = (cbStatus?: CallBackDateStatus) => {
    switch (cbStatus) {
      case 'Overdue':
        return (
          <Badge variant='destructive' className='text-xs px-2 py-0.5'>
            {cbStatus}
          </Badge>
        );
      case 'Due Today':
        return (
          <Badge className='bg-amber-500 text-xs px-2 py-0.5'>{cbStatus}</Badge>
        );
      case 'Due Tomorrow':
        return (
          <Badge className='bg-blue-500 text-xs px-2 py-0.5'>{cbStatus}</Badge>
        );
      case 'Due This Week':
        return (
          <Badge variant='secondary' className='text-xs px-2 py-0.5'>
            {cbStatus}
          </Badge>
        );
      case 'Due Next Week':
        return (
          <Badge variant='outline' className='text-xs px-2 py-0.5'>
            {cbStatus}
          </Badge>
        );
      default:
        return <span className='text-sm text-muted-foreground'>Blank</span>;
    }
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-base font-semibold'>
          Account Tasks ({tasks.length})
        </h3>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 mr-1 ${isFetching ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
          <Button size='sm' onClick={() => setIsCreateModalOpen(true)}>
            <Plus className='h-3.5 w-3.5 mr-1' />
            New Task
          </Button>
        </div>
      </div>

      <div className='border rounded-md bg-card overflow-x-auto'>
        <Table>
          <TableHeader className='bg-muted/50'>
            <TableRow>
              <TableHead className='font-semibold'>Module Name</TableHead>

              <TableHead className='font-semibold'>Task Type</TableHead>
              <TableHead className='font-semibold min-w-[200px]'>
                Task Description
              </TableHead>
              <TableHead className='font-semibold'>Call Back Status</TableHead>
              <TableHead className='font-semibold text-foreground min-w-[150px]'>Created At</TableHead>
              <TableHead className='font-semibold text-foreground min-w-[150px]'>
                Assigned Date/Time
              </TableHead>
              <TableHead className='font-semibold text-foreground min-w-[150px]'>Due Date/Time</TableHead>
              <TableHead className='font-semibold'>Task Status</TableHead>
              <TableHead className='font-semibold text-right'>
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className='h-4 w-full' />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : tasks.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className='text-center py-8 text-muted-foreground text-sm'
                >
                  No tasks recorded for this account yet.
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => {
                const isOverdue =
                  task.task_status === 'Overdue' ||
                  (task.task_due_date_time &&
                    task.task_assigned_date_time &&
                    new Date(task.task_due_date_time) <
                      new Date(task.task_assigned_date_time) &&
                    !['Completed', 'Verified'].includes(task.task_status)) ||
                  (task.task_due_date_time &&
                    new Date(task.task_due_date_time) < new Date() &&
                    !['Completed', 'Verified'].includes(task.task_status));

                const currentUserId = user?.user_id || (user as any)?.id;
                const isAccOwner = Boolean(
                  task.account_owner_id &&
                  String(task.account_owner_id) === String(currentUserId),
                );

                return (
                  <TableRow
                    key={task.id}
                    className={
                      isOverdue
                        ? 'bg-red-500/10 dark:bg-red-950/40 text-red-900 dark:text-red-200 hover:bg-red-500/20 border-b border-red-200 dark:border-red-900 cursor-pointer'
                        : 'hover:bg-muted/30 cursor-pointer transition-colors'
                    }
                    onClick={() => {
                      setSelectedTaskId(task.id);
                      setIsUpdateModalOpen(true);
                    }}
                  >
                    <TableCell className='text-xs font-medium text-muted-foreground'>
                      {task.module_name || 'Account'}
                    </TableCell>

                    <TableCell>
                      <Badge variant='outline' className='font-normal'>
                        {task.task_type}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className='text-sm max-w-[250px] truncate'
                      title={task.task_description}
                    >
                      {task.task_description || (
                        <span className='text-muted-foreground italic'>
                          No description
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getCallBackBadge(task.call_back_date_status)}
                    </TableCell>
                    <TableCell className='text-sm font-semibold text-foreground whitespace-nowrap'>
                      {formatISTDateTime(task.created_at)}
                    </TableCell>
                    <TableCell className='text-sm font-semibold text-foreground whitespace-nowrap'>
                      {formatISTDateTime(task.task_assigned_date_time)}
                    </TableCell>
                    <TableCell className='text-sm font-semibold text-foreground whitespace-nowrap'>
                      {formatISTDateTime(task.task_due_date_time)}
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        {getStatusBadge(task.task_status)}
                        {task.task_status !== 'Completed' && isAccOwner && (
                          <Button
                            size='sm'
                            variant='outline'
                            className='h-6 px-2 text-[11px] border-green-600 text-green-700 hover:bg-green-50 dark:hover:bg-green-950 dark:text-green-400 gap-1 font-medium'
                            onClick={(e) => {
                              e.stopPropagation();
                              quickCompleteMutation.mutate(task.id);
                            }}
                            disabled={quickCompleteMutation.isPending}
                            title='Mark as Completed'
                          >
                            <CheckCircle2 className='h-3 w-3' />
                            Complete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell
                      className='text-right'
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className='flex items-center justify-end gap-1'>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => {
                            setSelectedTaskId(task.id);
                            setIsUpdateModalOpen(true);
                          }}
                        >
                          <Pencil className='h-3.5 w-3.5 text-muted-foreground hover:text-foreground' />
                        </Button>
                        {/* <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => {
                          if (confirm('Delete this task?')) deleteMutation.mutate(task.id)
                        }}
                      >
                        <Trash2 className='h-3.5 w-3.5 text-destructive hover:text-destructive/80' />
                      </Button> */}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <CreateAccountTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        fixedAccountId={accountId}
        fixedAccountName={accountName}
      />

      <UpdateAccountTaskModal
        taskId={selectedTaskId}
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setSelectedTaskId(null);
        }}
      />
    </div>
  );
}
