import { useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { Plus, RefreshCw, Pencil, Trash2, Calendar, Filter } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import Pagination from '@/components/shared/pagination'
import { ENV } from '@/conf'
import type { AccountTask, TaskStatus, TaskType, CallBackDateStatus } from '@/types/account-task'
import CreateAccountTaskModal from '@/components/account-tasks/create-account-task-modal'
import UpdateAccountTaskModal from '@/components/account-tasks/update-account-task-modal'

export default function AccountTasksPage() {
  const queryClient = useQueryClient()

  // Pagination & Filtering state
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTaskStatus, setSelectedTaskStatus] = useState<string>('all')
  const [selectedTaskType, setSelectedTaskType] = useState<string>('all')
  const [selectedCallBackStatus, setSelectedCallBackStatus] = useState<string>('all')

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)

  // React Query fetch
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: [
      'account-tasks-list',
      currentPage,
      searchQuery,
      selectedTaskStatus,
      selectedTaskType,
      selectedCallBackStatus,
    ],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('page', currentPage.toString())
      params.set('page_size', '10')

      if (searchQuery) params.set('search', searchQuery)
      if (selectedTaskStatus !== 'all') params.set('task_status', selectedTaskStatus)
      if (selectedTaskType !== 'all') params.set('task_type', selectedTaskType)
      if (selectedCallBackStatus !== 'all') params.set('call_back_status', selectedCallBackStatus)

      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/account-tasks?${params.toString()}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to fetch account tasks')
      return res.json()
    },
    placeholderData: keepPreviousData,
  })

  const tasks: AccountTask[] = data?.data || []
  const pageInfo = data?.page_info || { page: 1, total_pages: 1 }

  // Delete mutation
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
      toast.success('Account Task deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['account-tasks-list'] })
    },
    onError: () => {
      toast.error('Error deleting task')
    },
  })

  const handleDelete = (taskId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this task?')) {
      deleteMutation.mutate(taskId)
    }
  }

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedTaskStatus('all')
    setSelectedTaskType('all')
    setSelectedCallBackStatus('all')
    setCurrentPage(1)
  }

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
    <div className='p-6 space-y-6 max-w-[1600px] mx-auto'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Account Tasks</h1>
          <p className='text-muted-foreground text-sm'>
            Manage and track all tasks parented under Accounts.
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm' onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className='h-4 w-4 mr-2' />
            Create Account Task
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className='bg-card p-4 rounded-lg border shadow-sm space-y-3'>
        <div className='flex items-center gap-2 font-medium text-sm text-foreground mb-1'>
          <Filter className='h-4 w-4 text-primary' />
          Filters & Search
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3'>
          {/* Search */}
          <Input
            placeholder='Search Account or Description...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full'
          />

          {/* Task Status */}
          <Select value={selectedTaskStatus} onValueChange={setSelectedTaskStatus}>
            <SelectTrigger>
              <SelectValue placeholder='Task Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Task Statuses</SelectItem>
              <SelectItem value='Unassigned'>Unassigned</SelectItem>
              <SelectItem value='Assigned'>Assigned</SelectItem>
              <SelectItem value='Pending'>Pending</SelectItem>
              <SelectItem value='In Progress'>In Progress</SelectItem>
              <SelectItem value='Completed'>Completed</SelectItem>
              <SelectItem value='Verified'>Verified</SelectItem>
              <SelectItem value='Overdue'>Overdue</SelectItem>
            </SelectContent>
          </Select>

          {/* Task Type */}
          <Select value={selectedTaskType} onValueChange={setSelectedTaskType}>
            <SelectTrigger>
              <SelectValue placeholder='Task Type' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Task Types</SelectItem>
              <SelectItem value='Call'>Call</SelectItem>
              <SelectItem value='Update Record'>Update Record</SelectItem>
              <SelectItem value='Email'>Email</SelectItem>
              <SelectItem value='Move Status'>Move Status</SelectItem>
            </SelectContent>
          </Select>

          {/* Call Back Date/Time is currently */}
          <Select value={selectedCallBackStatus} onValueChange={setSelectedCallBackStatus}>
            <SelectTrigger>
              <SelectValue placeholder='Call Back Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Call Back Statuses</SelectItem>
              <SelectItem value='Blank'>Blank</SelectItem>
              <SelectItem value='Overdue'>Overdue</SelectItem>
              <SelectItem value='Due Today'>Due Today</SelectItem>
              <SelectItem value='Due Tomorrow'>Due Tomorrow</SelectItem>
              <SelectItem value='Due This Week'>Due This Week</SelectItem>
              <SelectItem value='Due Next Week'>Due Next Week</SelectItem>
            </SelectContent>
          </Select>

          {/* Reset */}
          <Button variant='ghost' onClick={handleResetFilters} className='text-sm text-muted-foreground'>
            Reset Filters
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <div className='border rounded-lg bg-card shadow-sm overflow-x-auto'>
        <Table>
          <TableHeader className='bg-muted/50'>
            <TableRow>
              <TableHead className='font-semibold'>Module Name</TableHead>
              <TableHead className='font-semibold'>Account Name</TableHead>
              <TableHead className='font-semibold'>Account Owner</TableHead>
              <TableHead className='font-semibold'>Task Type</TableHead>
              <TableHead className='font-semibold'>Account Status</TableHead>
              <TableHead className='font-semibold'>Account Stage</TableHead>
              <TableHead className='font-semibold min-w-[150px]'>Call Back Date/Time</TableHead>
              <TableHead className='font-semibold min-w-[200px]'>Task Description</TableHead>
              <TableHead className='font-semibold'>Assigned Date/Time</TableHead>
              <TableHead className='font-semibold'>Due Date/Time</TableHead>
              <TableHead className='font-semibold'>Task Status</TableHead>
              <TableHead className='font-semibold text-right'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 12 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className='h-4 w-full' />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className='text-center py-10 text-muted-foreground'>
                  No account tasks found matching your filters.
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
                  <TableCell className='font-medium text-xs text-muted-foreground'>
                    {task.module_name || 'Account'}
                  </TableCell>
                  <TableCell className='font-semibold text-primary'>
                    {task.account_name || `Account #${task.account_id}`}
                  </TableCell>
                  <TableCell className='text-sm'>
                    {task.account_owner || 'Unassigned'}
                  </TableCell>
                  <TableCell>
                    <Badge variant='outline' className='font-normal'>
                      {task.task_type}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-sm text-muted-foreground'>
                    {task.account_status || '-'}
                  </TableCell>
                  <TableCell className='text-sm text-muted-foreground'>
                    {task.account_stage || '-'}
                  </TableCell>
                  <TableCell>
                    {getCallBackBadge(task.call_back_date_status)}
                  </TableCell>
                  <TableCell className='text-sm max-w-[250px] truncate' title={task.task_description}>
                    {task.task_description || <span className='text-muted-foreground italic'>No description</span>}
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
                        <Pencil className='h-4 w-4 text-muted-foreground hover:text-foreground' />
                      </Button>
                      {/* <Button
                        variant='ghost'
                        size='icon'
                        onClick={(e) => handleDelete(task.id, e)}
                      >
                        <Trash2 className='h-4 w-4 text-destructive hover:text-destructive/80' />
                      </Button> */}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        {pageInfo && pageInfo.total_pages > 1 && (
          <div className='p-4 border-t'>
            <Pagination
              currentPage={currentPage}
              totalPages={pageInfo.total_pages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateAccountTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Update Modal */}
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
