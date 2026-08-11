import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, RefreshCw, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { ENV } from '@/conf'
import type { AccountTask, TaskStatus, CallBackDateStatus } from '@/types/account-task'
import CreateAccountTaskModal from '@/components/account-tasks/create-account-task-modal'
import UpdateAccountTaskModal from '@/components/account-tasks/update-account-task-modal'

interface AccountTasksTabProps {
  accountId: number
  accountName?: string
}

export default function AccountTasksTab({ accountId, accountName }: AccountTasksTabProps) {
  const queryClient = useQueryClient()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['account-tasks', accountId],
    queryFn: async () => {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/accounts/${accountId}/tasks?page_size=50`,
        { credentials: 'include' },
      )
      if (!res.ok) throw new Error('Failed to fetch tasks for account')
      return res.json()
    },
    enabled: !!accountId,
  })

  const tasks: AccountTask[] = data?.data || []

  const deleteMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/account-tasks/${taskId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to delete task')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Task deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['account-tasks', accountId] })
      queryClient.invalidateQueries({ queryKey: ['account-tasks-list'] })
    },
    onError: () => {
      toast.error('Error deleting task')
    },
  })

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'Completed':
      case 'Verified':
        return <Badge className='bg-green-600 hover:bg-green-700 text-white'>{status}</Badge>
      case 'In Progress':
        return <Badge className='bg-blue-600 hover:bg-blue-700 text-white'>{status}</Badge>
      case 'Pending':
      case 'Assigned':
        return <Badge className='bg-amber-500 hover:bg-amber-600 text-white'>{status}</Badge>
      case 'Overdue':
        return <Badge variant='destructive'>{status}</Badge>
      default:
        return <Badge variant='outline'>{status || 'Unassigned'}</Badge>
    }
  }

  const getCallBackBadge = (cbStatus?: CallBackDateStatus) => {
    switch (cbStatus) {
      case 'Overdue':
        return <Badge variant='destructive' className='text-[10px] py-0'>{cbStatus}</Badge>
      case 'Due Today':
        return <Badge className='bg-amber-500 text-[10px] py-0'>{cbStatus}</Badge>
      case 'Due Tomorrow':
        return <Badge className='bg-blue-500 text-[10px] py-0'>{cbStatus}</Badge>
      case 'Due This Week':
        return <Badge variant='secondary' className='text-[10px] py-0'>{cbStatus}</Badge>
      case 'Due Next Week':
        return <Badge variant='outline' className='text-[10px] py-0'>{cbStatus}</Badge>
      default:
        return <span className='text-xs text-muted-foreground'>Blank</span>
    }
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='text-base font-semibold'>Account Tasks ({tasks.length})</h3>
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm' onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
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
              <TableHead className='font-semibold min-w-[200px]'>Task Description</TableHead>
              <TableHead className='font-semibold'>Call Back Status</TableHead>
              <TableHead className='font-semibold'>Assigned Date/Time</TableHead>
              <TableHead className='font-semibold'>Due Date/Time</TableHead>
              <TableHead className='font-semibold'>Task Status</TableHead>
              <TableHead className='font-semibold text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className='h-4 w-full' />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className='text-center py-8 text-muted-foreground text-sm'>
                  No tasks recorded for this account yet.
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow
                  key={task.id}
                  className='hover:bg-muted/30 cursor-pointer transition-colors'
                  onClick={() => {
                    setSelectedTaskId(task.id)
                    setIsUpdateModalOpen(true)
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
                  <TableCell className='text-sm max-w-[250px] truncate' title={task.task_description}>
                    {task.task_description || <span className='text-muted-foreground italic'>No description</span>}
                  </TableCell>
                  <TableCell>
                    {getCallBackBadge(task.call_back_date_status)}
                  </TableCell>
                  <TableCell className='text-xs text-muted-foreground whitespace-nowrap'>
                    {task.task_assigned_date_time
                      ? new Date(task.task_assigned_date_time).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
                      : '-'}
                  </TableCell>
                  <TableCell className='text-xs text-muted-foreground whitespace-nowrap'>
                    {task.task_due_date_time
                      ? new Date(task.task_due_date_time).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(task.task_status)}
                  </TableCell>
                  <TableCell className='text-right' onClick={(e) => e.stopPropagation()}>
                    <div className='flex items-center justify-end gap-1'>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => {
                          setSelectedTaskId(task.id)
                          setIsUpdateModalOpen(true)
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
              ))
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
          setIsUpdateModalOpen(false)
          setSelectedTaskId(null)
        }}
      />
    </div>
  )
}
