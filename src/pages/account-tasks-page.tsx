import { useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { Pencil, Trash2, CheckCircle2, Filter, Plus, Search, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import Pagination from '@/components/shared/pagination'
import { MultiSelect, type Option } from '@/components/ui/multi-select'
import { formatExactDate } from '@/utils/date-formatter'
import { useAuth } from '@/context/auth-context'
import { ENV } from '@/conf'
import type { AccountTask, TaskStatus, CallBackDateStatus } from '@/types/account-task'
import CreateAccountTaskModal from '@/components/account-tasks/create-account-task-modal'
import UpdateAccountTaskModal from '@/components/account-tasks/update-account-task-modal'

export default function AccountTasksPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const role = String(user?.role || '').toLowerCase()
  const canViewOwnerFilter = ['super_admin', 'admin', 'manager'].includes(role)

  const quickCompleteMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/account-tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ task_status: 'Completed' }),
      })
      if (!res.ok) throw new Error('Failed to mark task as completed')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Task marked as Completed!')
      queryClient.invalidateQueries({ queryKey: ['account-tasks'] })
    },
    onError: () => {
      toast.error('Failed to mark task as completed')
    },
  })

  // Mass Update Status State & Mutation (Restricted to Task Creator)
  const [selectedTaskIds, setSelectedTaskIds] = useState<(string | number)[]>([])

  const massUpdateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/account-tasks/bulk-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          task_ids: selectedTaskIds,
          task_status: newStatus,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed to mass update tasks')
      }
      return res.json()
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Tasks status updated successfully')
      setSelectedTaskIds([])
      queryClient.invalidateQueries({ queryKey: ['account-tasks'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to mass update tasks')
    },
  })

  // Draft Filter state
  const [filters, setFilters] = useState({
    search: '',
    taskStatus: 'all',
    taskType: 'all',
    callBackStatus: 'all',
    accountOwnerId: [] as Option[],
  })

  // Applied Filter state (triggered when clicking "Search" button)
  const [appliedFilters, setAppliedFilters] = useState(filters)
  const [currentPage, setCurrentPage] = useState(1)

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | number | null>(null)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)

  // Fetch Account Owners for MultiSelect Filter (only for super_admin, admin, manager)
  const { data: ownerResponse } = useQuery({
    queryKey: ['account-owners'],
    queryFn: async () => {
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/user/filter`, {
        credentials: 'include',
      })
      if (!res.ok) return []
      return res.json()
    },
    enabled: canViewOwnerFilter,
    retry: false,
  })

  const rawOwners = Array.isArray(ownerResponse)
    ? ownerResponse
    : Array.isArray(ownerResponse?.data)
      ? ownerResponse.data
      : []

  const ownerOptions: Option[] = rawOwners.map((u: any) => ({
    value: (u.id || u.user_id || '').toString(),
    label: u.full_name || u.first_name || u.email || `User #${u.id}`,
  }))

  // React Query fetch for Account Tasks list
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['account-tasks-list', currentPage, appliedFilters],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('page', currentPage.toString())
      params.set('page_size', '15')

      if (appliedFilters.search) params.set('search', appliedFilters.search)
      if (appliedFilters.taskStatus !== 'all') params.set('task_status', appliedFilters.taskStatus)
      if (appliedFilters.taskType !== 'all') params.set('task_type', appliedFilters.taskType)
      if (appliedFilters.callBackStatus !== 'all') params.set('call_back_status', appliedFilters.callBackStatus)

      if (appliedFilters.accountOwnerId && appliedFilters.accountOwnerId.length > 0) {
        appliedFilters.accountOwnerId.forEach((o) => params.append('account_owner_id', o.value))
      }

      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/account-tasks?${params.toString()}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to fetch account tasks')
      return res.json()
    },
    placeholderData: keepPreviousData,
  })

  const tasks: AccountTask[] = data?.data || []
  const pageInfo = data?.page_info || { page: 1, total_pages: 1, total_records: 0 }

  const currentUserId = user?.user_id || (user as any)?.id

  const isCreatorOrAdmin = (task: AccountTask) => {
    return (
      (task.created_by_id && String(task.created_by_id) === String(currentUserId)) ||
      role === 'super_admin' ||
      role === 'admin'
    )
  }

  const userCreatedTasks = tasks.filter(isCreatorOrAdmin)
  const isAllSelected = userCreatedTasks.length > 0 && userCreatedTasks.every((t) => selectedTaskIds.includes(t.id))

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTaskIds(userCreatedTasks.map((t) => t.id))
    } else {
      setSelectedTaskIds([])
    }
  }

  const handleSelectTask = (taskId: number, checked: boolean) => {
    if (checked) {
      setSelectedTaskIds((prev) => [...prev, taskId])
    } else {
      setSelectedTaskIds((prev) => prev.filter((id) => id !== taskId))
    }
  }

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleSearch = () => {
    setAppliedFilters(filters)
    setCurrentPage(1)
  }

  const handleClear = () => {
    const empty = {
      search: '',
      taskStatus: 'all',
      taskType: 'all',
      callBackStatus: 'all',
      accountOwnerId: [] as Option[],
    }
    setFilters(empty)
    setAppliedFilters(empty)
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
    <div className='p-4 space-y-4'>
      {/* Top Bar matching Accounts page layout */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Account Tasks</h1>
          <p className='text-muted-foreground text-sm'>Manage and track all tasks parented under Accounts.</p>
        </div>

        <div className='flex gap-4 items-center'>
          {isLoading ? (
            <Skeleton className='w-32 h-4' />
          ) : (
            <div className='flex gap-2 items-center text-sm'>
              <h3 className='font-semibold text-muted-foreground'>
                Total Tasks :
              </h3>
              <p className='text-muted-foreground'>{pageInfo.total_records || tasks.length}</p>
            </div>
          )}

          <Button onClick={() => setIsCreateModalOpen(true)}>
            + Create Account Task
          </Button>
        </div>
      </div>

      {/* Mass Update Status Action Bar */}
      {selectedTaskIds.length > 0 && (
        <div className='flex items-center justify-between bg-primary/10 p-2.5 px-4 rounded-md border border-primary/20 animate-in fade-in duration-200'>
          <span className='text-xs font-semibold text-foreground'>
            {selectedTaskIds.length} task(s) selected (Created by you)
          </span>
          <div className='flex items-center gap-2'>
            <Select
              onValueChange={(val) => massUpdateStatusMutation.mutate(val)}
              disabled={massUpdateStatusMutation.isPending}
            >
              <SelectTrigger className='h-8 text-xs bg-background w-[170px] font-medium'>
                <SelectValue placeholder='Mass Update Status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='Assigned'>Assigned</SelectItem>
                <SelectItem value='Pending'>Pending</SelectItem>
                <SelectItem value='In Progress'>In Progress</SelectItem>
                <SelectItem value='Completed'>Completed</SelectItem>
                <SelectItem value='Verified'>Verified</SelectItem>
                <SelectItem value='Overdue'>Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size='sm'
              variant='ghost'
              className='h-8 text-xs text-muted-foreground hover:text-foreground'
              onClick={() => setSelectedTaskIds([])}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Split: Left Filter Sidebar, Right Table */}
      <div className='grid grid-cols-1 lg:grid-cols-4 gap-4 items-start'>
        {/* Left Filter Sidebar */}
        <div className='border rounded-md p-4 bg-card space-y-4 lg:col-span-1 shadow-sm'>
          <div className='flex items-center justify-between border-b pb-2'>
            <h2 className='font-semibold text-sm flex items-center gap-2'>
              <Filter className='h-4 w-4' /> Filter Tasks
            </h2>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleClear}
              className='h-7 text-xs text-muted-foreground hover:text-foreground'
            >
              Reset
            </Button>
          </div>

          <div className='space-y-3.5'>
            {/* Search Input */}
            <div className='space-y-1.5'>
              <Label className='text-xs'>Search</Label>
              <Input
                placeholder='Search Account or Description...'
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className='h-9 text-xs'
              />
            </div>

            {/* Account Owner */}
            {canViewOwnerFilter && (
              <div className='space-y-1.5'>
                <Label className='text-xs'>Account Owner</Label>
                <MultiSelect
                  options={ownerOptions}
                  value={filters.accountOwnerId}
                  onChange={(val) => handleFilterChange('accountOwnerId', val)}
                  placeholder='Select Owner...'
                />
              </div>
            )}

            {/* Task Status */}
            <div className='space-y-1.5'>
              <Label className='text-xs'>Task Status</Label>
              <Select
                value={filters.taskStatus}
                onValueChange={(val) => handleFilterChange('taskStatus', val)}
              >
                <SelectTrigger className='h-9 text-xs'>
                  <SelectValue placeholder='Select Task Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Statuses</SelectItem>
                  <SelectItem value='Unassigned'>Unassigned</SelectItem>
                  <SelectItem value='Assigned'>Assigned</SelectItem>
                  <SelectItem value='Pending'>Pending</SelectItem>
                  <SelectItem value='In Progress'>In Progress</SelectItem>
                  <SelectItem value='Completed'>Completed</SelectItem>
                  <SelectItem value='Verified'>Verified</SelectItem>
                  <SelectItem value='Overdue'>Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Task Type */}
            <div className='space-y-1.5'>
              <Label className='text-xs'>Task Type</Label>
              <Select
                value={filters.taskType}
                onValueChange={(val) => handleFilterChange('taskType', val)}
              >
                <SelectTrigger className='h-9 text-xs'>
                  <SelectValue placeholder='Select Task Type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Task Types</SelectItem>
                  <SelectItem value='Call'>Call</SelectItem>
                  <SelectItem value='Update Record'>Update Record</SelectItem>
                  <SelectItem value='Email'>Email</SelectItem>
                  <SelectItem value='Move Status'>Move Status</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Call Back Status */}
            <div className='space-y-1.5'>
              <Label className='text-xs'>Call Back Date Status</Label>
              <Select
                value={filters.callBackStatus}
                onValueChange={(val) => handleFilterChange('callBackStatus', val)}
              >
                <SelectTrigger className='h-9 text-xs'>
                  <SelectValue placeholder='Select Call Back Status' />
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
            </div>
          </div>

          {/* Bottom Action Buttons inside Filter Sidebar */}
          <div className='flex gap-2 pt-3 border-t mt-4'>
            <Button className='flex-1 cursor-pointer h-9 text-xs' onClick={handleSearch}>
              Search
            </Button>
            <Button
              variant='outline'
              className='cursor-pointer h-9 text-xs'
              onClick={handleClear}
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Right Main Table & Pagination */}
        <div className='flex flex-col gap-4 min-w-0 lg:col-span-3'>
          {isLoading ? (
            <div className='flex items-center justify-center h-64 border rounded-md'>
              <Spinner className='h-8 w-8 text-muted-foreground' />
            </div>
          ) : (
            <>
              <div className='border rounded-md flex-1 overflow-auto relative bg-background'>
                <table className='w-full caption-bottom text-sm'>
                  <thead>
                    <tr className='sticky top-0 z-10 bg-background hover:bg-accent border-b'>
                      <th className='h-10 px-3 text-left align-middle w-10'>
                        <input
                          type='checkbox'
                          checked={isAllSelected}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className='h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer'
                          title='Select all tasks created by you'
                        />
                      </th>
                      <th className='h-10 px-3 text-left align-middle font-medium text-muted-foreground text-xs whitespace-nowrap'>Module Name</th>
                      <th className='h-10 px-3 text-left align-middle font-medium text-muted-foreground text-xs whitespace-nowrap'>Account Name</th>
                      <th className='h-10 px-3 text-left align-middle font-medium text-muted-foreground text-xs whitespace-nowrap'>Account Owner</th>
                      <th className='h-10 px-3 text-left align-middle font-medium text-muted-foreground text-xs whitespace-nowrap'>Task Type</th>
                      <th className='h-10 px-3 text-left align-middle font-medium text-muted-foreground text-xs whitespace-nowrap'>Account Status</th>
                      <th className='h-10 px-3 text-left align-middle font-medium text-muted-foreground text-xs whitespace-nowrap'>Account Stage</th>
                      <th className='h-10 px-3 text-left align-middle font-medium text-muted-foreground text-xs whitespace-nowrap min-w-[140px]'>Call Back Date/Time</th>
                      <th className='h-10 px-3 text-left align-middle font-medium text-muted-foreground text-xs whitespace-nowrap min-w-[200px]'>Task Description</th>
                      <th className='h-10 px-3 text-left align-middle font-medium text-muted-foreground text-xs whitespace-nowrap'>Assigned Date/Time</th>
                      <th className='h-10 px-3 text-left align-middle font-medium text-muted-foreground text-xs whitespace-nowrap'>Due Date/Time</th>
                      <th className='h-10 px-3 text-left align-middle font-medium text-muted-foreground text-xs whitespace-nowrap'>Task Status</th>
                      <th className='h-10 px-3 text-right align-middle font-medium text-muted-foreground text-xs whitespace-nowrap'>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.length === 0 ? (
                      <tr>
                        <td colSpan={13} className='text-center py-12 text-muted-foreground text-sm'>
                          No account tasks found matching your filter parameters.
                        </td>
                      </tr>
                    ) : (
                      tasks.map((task) => {
                        const canSelect = isCreatorOrAdmin(task)
                        const isSelected = selectedTaskIds.includes(task.id)
                        const isOverdue =
                          task.task_status === 'Overdue' ||
                          (task.task_due_date_time &&
                            task.task_assigned_date_time &&
                            new Date(task.task_due_date_time) < new Date(task.task_assigned_date_time) &&
                            !['Completed', 'Verified'].includes(task.task_status)) ||
                          (task.task_due_date_time &&
                            new Date(task.task_due_date_time) < new Date() &&
                            !['Completed', 'Verified'].includes(task.task_status))

                        const isAccOwner = Boolean(
                          task.account_owner_id && String(task.account_owner_id) === String(currentUserId)
                        )

                        return (
                          <tr
                            key={task.id}
                            className={
                              isOverdue
                                ? 'border-b transition-colors cursor-pointer bg-red-500/10 dark:bg-red-950/40 text-red-900 dark:text-red-200 hover:bg-red-500/20 border-red-200 dark:border-red-900'
                                : 'border-b transition-colors hover:bg-muted/50 cursor-pointer'
                            }
                            onClick={() => {
                              setSelectedTaskId(task.id)
                              setIsUpdateModalOpen(true)
                            }}
                          >
                            <td className='p-3 w-10' onClick={(e) => e.stopPropagation()}>
                              <input
                                type='checkbox'
                                checked={isSelected}
                                disabled={!canSelect}
                                onChange={(e) => handleSelectTask(task.id, e.target.checked)}
                                className='h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'
                                title={canSelect ? 'Select task for mass update' : 'Mass update status is only available for tasks created by you'}
                              />
                            </td>
                            <td className='p-3 text-xs text-muted-foreground whitespace-nowrap'>
                              {task.module_name || 'Account'}
                            </td>
                            <td className='p-3 text-sm font-semibold text-primary whitespace-nowrap'>
                              {task.account_name || `Account #${task.account_id}`}
                            </td>
                            <td className='p-3 text-sm whitespace-nowrap'>
                              {task.account_owner || 'Unassigned'}
                            </td>
                            <td className='p-3 whitespace-nowrap'>
                              <Badge variant='outline' className='font-normal text-xs'>
                                {task.task_type}
                              </Badge>
                            </td>
                            <td className='p-3 text-sm text-muted-foreground whitespace-nowrap'>
                              {task.account_status || '-'}
                            </td>
                            <td className='p-3 text-sm text-muted-foreground whitespace-nowrap'>
                              {task.account_stage || '-'}
                            </td>
                            <td className='p-3 whitespace-nowrap'>
                              {getCallBackBadge(task.call_back_date_status)}
                            </td>
                            <td className='p-3 text-sm max-w-[250px] truncate' title={task.task_description}>
                              {task.task_description || <span className='text-muted-foreground italic text-xs'>No description</span>}
                            </td>
                            <td className='p-3 text-xs text-muted-foreground whitespace-nowrap'>
                              {task.task_assigned_date_time
                                ? formatExactDate(task.task_assigned_date_time, 'dd MMM yyyy, hh:mm a')
                                : '-'}
                            </td>
                            <td className='p-3 text-xs text-muted-foreground whitespace-nowrap'>
                              {task.task_due_date_time
                                ? formatExactDate(task.task_due_date_time, 'dd MMM yyyy, hh:mm a')
                                : '-'}
                            </td>
                            <td className='p-3 whitespace-nowrap'>
                              <div className='flex items-center gap-2'>
                                {getStatusBadge(isOverdue ? 'Overdue' : (task.task_status as TaskStatus))}
                                {task.task_status !== 'Completed' && isAccOwner && (
                                  <Button
                                    size='sm'
                                    variant='outline'
                                    className='h-6 px-2 text-[11px] border-green-600 text-green-700 hover:bg-green-50 dark:hover:bg-green-950 dark:text-green-400 gap-1 font-medium'
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      quickCompleteMutation.mutate(task.id)
                                    }}
                                    disabled={quickCompleteMutation.isPending}
                                    title='Mark as Completed'
                                  >
                                    <CheckCircle2 className='h-3 w-3' />
                                    Complete
                                  </Button>
                                )}
                              </div>
                            </td>
                            <td className='p-3 text-right whitespace-nowrap' onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant='ghost'
                                size='icon'
                                className='h-8 w-8'
                                onClick={() => {
                                  setSelectedTaskId(task.id)
                                  setIsUpdateModalOpen(true)
                                }}
                              >
                                <Pencil className='h-4 w-4 text-muted-foreground hover:text-foreground' />
                              </Button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination matching Accounts page */}
              {pageInfo && pageInfo.total_pages > 1 && (
                <div className='shrink-0'>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={pageInfo.total_pages}
                    onPageChange={(page) => setCurrentPage(page)}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateAccountTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
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
