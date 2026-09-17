import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, RefreshCw, Pencil, CheckCircle2 } from 'lucide-react'
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
import type { DealTask, TaskStatus } from '@/types/deal-task'
import CreateDealTaskModal from '@/components/deal-tasks/create-deal-task-modal'
import UpdateDealTaskModal from '@/components/deal-tasks/update-deal-task-modal'
import { useAuth } from '@/context/auth-context'

interface DealTasksTabProps {
  dealId: string | number
  dealName?: string
}

const formatISTDateTime = (dateStr?: string | null) => {
  if (!dateStr) return '-'
  try {
    const dt = new Date(dateStr)
    if (isNaN(dt.getTime())) return '-'
    const parts = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).formatToParts(dt)

    const d = parts.find((p) => p.type === 'day')?.value || ''
    const m = parts.find((p) => p.type === 'month')?.value || ''
    const y = parts.find((p) => p.type === 'year')?.value || ''
    const hr = parts.find((p) => p.type === 'hour')?.value || ''
    const min = parts.find((p) => p.type === 'minute')?.value || ''
    const dayPeriod =
      parts.find((p) => p.type === 'dayPeriod')?.value?.toUpperCase() || ''

    return `${d}/${m}/${y}, ${hr}:${min} ${dayPeriod}`
  } catch {
    return dateStr || '-'
  }
}

export default function DealTasksTab({ dealId, dealName }: DealTasksTabProps) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const role = String(user?.role || '').toLowerCase()
  const canViewOwnerFilter = ['super_admin', 'admin', 'manager'].includes(role)
  const currentUserId = user?.user_id || (user as any)?.id

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | number | null>(
    null,
  )
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['deal-tasks-tab', dealId],
    queryFn: async () => {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/deals/${dealId}/tasks?page_size=50`,
        { credentials: 'include' },
      )
      if (!res.ok) throw new Error('Failed to fetch tasks for deal')
      return res.json()
    },
    enabled: !!dealId,
  })

  const tasks: DealTask[] = data?.data || []

  const quickCompleteMutation = useMutation({
    mutationFn: async (taskId: string | number) => {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/deal-tasks/${taskId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ task_status: 'Completed' }),
        },
      )
      if (!res.ok) throw new Error('Failed to mark task as completed')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Task marked as Completed!')
      queryClient.invalidateQueries({ queryKey: ['deal-tasks-tab', dealId] })
      queryClient.invalidateQueries({ queryKey: ['deal-tasks-list'] })
    },
    onError: () => {
      toast.error('Failed to mark task as completed')
    },
  })

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'Completed':
      case 'Verified':
        return (
          <Badge
            variant='outline'
            className='bg-emerald-50 text-emerald-700 border-emerald-200 text-xs'
          >
            {status}
          </Badge>
        )
      case 'In Progress':
        return (
          <Badge
            variant='outline'
            className='bg-blue-50 text-blue-700 border-blue-200 text-xs'
          >
            {status}
          </Badge>
        )
      case 'Pending':
      case 'Assigned':
        return (
          <Badge
            variant='outline'
            className='bg-amber-50 text-amber-700 border-amber-200 text-xs'
          >
            {status}
          </Badge>
        )
      case 'Overdue':
        return (
          <Badge
            variant='outline'
            className='bg-red-50 text-red-700 border-red-200 text-xs'
          >
            {status}
          </Badge>
        )
      default:
        return (
          <Badge variant='outline' className='text-xs'>
            {status || 'Unassigned'}
          </Badge>
        )
    }
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <h3 className='text-sm font-semibold text-foreground'>
            Deal Tasks ({tasks.length})
          </h3>
          {isFetching && (
            <RefreshCw className='h-3.5 w-3.5 animate-spin text-muted-foreground' />
          )}
        </div>
        <div className='flex items-center gap-2'>
          <Button
            size='sm'
            variant='outline'
            onClick={() => refetch()}
            className='h-8 text-xs gap-1 cursor-pointer'
          >
            <RefreshCw className='h-3 w-3' /> Refresh
          </Button>
          <Button
            size='sm'
            onClick={() => setIsCreateModalOpen(true)}
            className='h-8 text-xs gap-1 cursor-pointer'
          >
            <Plus className='h-3.5 w-3.5' /> Add Task
          </Button>
        </div>
      </div>

      <div className='rounded-lg border border-border bg-card overflow-hidden'>
        <Table>
          <TableHeader>
            <TableRow className='text-xs'>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Assigned Date/Time</TableHead>
              <TableHead>Due Date/Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className='text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className='h-4 w-16' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-4 w-32' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-4 w-20' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-4 w-24' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-4 w-24' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-5 w-16' />
                  </TableCell>
                  <TableCell className='text-right'>
                    <Skeleton className='h-7 w-16 ml-auto' />
                  </TableCell>
                </TableRow>
              ))
            ) : tasks.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className='text-center py-8 text-xs text-muted-foreground'
                >
                  No tasks created for this deal yet.
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => {
                const isCompleted =
                  task.task_status === 'Completed' ||
                  task.task_status === 'Verified'

                return (
                  <TableRow
                    key={task.id}
                    className='text-xs cursor-pointer hover:bg-muted/40'
                    onClick={() => {
                      setSelectedTaskId(task.id)
                      setIsUpdateModalOpen(true)
                    }}
                  >
                    <TableCell className='font-medium'>
                      {task.task_type}
                    </TableCell>
                    <TableCell
                      className='max-w-[200px] truncate'
                      title={task.task_description}
                    >
                      {task.task_description || '—'}
                    </TableCell>
                    <TableCell>{task.assigned_to_name || '—'}</TableCell>
                    <TableCell>
                      {formatISTDateTime(task.task_assigned_date_time)}
                    </TableCell>
                    <TableCell>
                      {formatISTDateTime(task.task_due_date_time)}
                    </TableCell>
                    <TableCell>{getStatusBadge(task.task_status)}</TableCell>
                    <TableCell
                      className='text-right'
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className='flex items-center justify-end gap-1'>
                        {!isCompleted && (
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() =>
                              quickCompleteMutation.mutate(task.id)
                            }
                            disabled={quickCompleteMutation.isPending}
                            className='h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer gap-1'
                          >
                            <CheckCircle2 className='h-3 w-3' /> Complete
                          </Button>
                        )}
                        <Button
                          size='icon'
                          variant='ghost'
                          onClick={() => {
                            setSelectedTaskId(task.id)
                            setIsUpdateModalOpen(true)
                          }}
                          className='h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer'
                        >
                          <Pencil className='h-3 w-3' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <CreateDealTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        fixedDealId={dealId}
        fixedDealName={dealName}
      />

      <UpdateDealTaskModal
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
