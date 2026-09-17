import { useState, useMemo } from 'react'
import { DatePicker } from '@/components/ui/date-picker'
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query'
import {
  Pencil,
  CheckCircle2,
  Filter,
  Plus,
  Search,
  Hash,
  RefreshCw,
  SlidersHorizontal,
  RotateCw,
  CheckSquare,
  Clock,
  AlertCircle,
  Briefcase,
} from 'lucide-react'
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
import { useAuth } from '@/context/auth-context'
import { ENV } from '@/conf'
import type { DealTask, TaskStatus } from '@/types/deal-task'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import users from '@/utils/users.json'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import CreateDealTaskModal from '@/components/deal-tasks/create-deal-task-modal'
import UpdateDealTaskModal from '@/components/deal-tasks/update-deal-task-modal'

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

    return `${d}-${m}-${y} ${hr}:${min} ${dayPeriod}`
  } catch {
    return dateStr || '-'
  }
}

const getTaskStatusStyle = (status?: string | null) => {
  if (!status) return 'bg-slate-100 text-slate-600 border-slate-200'
  const s = status.toLowerCase()
  if (s.includes('completed') || s.includes('verified')) {
    return 'bg-emerald-100 text-emerald-700 border-emerald-200 font-medium'
  }
  if (s.includes('in progress')) {
    return 'bg-blue-100 text-blue-700 border-blue-200 font-medium'
  }
  if (s.includes('pending') || s.includes('assigned')) {
    return 'bg-amber-100 text-amber-700 border-amber-200 font-medium'
  }
  if (s.includes('overdue')) {
    return 'bg-red-100 text-red-700 border-red-200 font-medium'
  }
  return 'bg-slate-100 text-slate-700 border-slate-200 font-medium'
}

export default function DealTasksPage() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const role = String(user?.role || '').toLowerCase()
  const canViewOwnerFilter = ['super_admin', 'admin', 'manager'].includes(role)

  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [pageSize, setPageSize] = useState<number>(15)

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
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed to mark deal task as completed')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Deal Task marked as Completed!')
      queryClient.invalidateQueries({ queryKey: ['deal-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['deal-tasks-list'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to mark deal task as completed')
    },
  })

  const [selectedTaskIds, setSelectedTaskIds] = useState<(string | number)[]>(
    [],
  )

  const massUpdateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/deal-tasks/bulk-status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            task_ids: selectedTaskIds,
            task_status: newStatus,
          }),
        },
      )
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed to mass update tasks')
      }
      return res.json()
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Deal Tasks status updated successfully')
      setSelectedTaskIds([])
      queryClient.invalidateQueries({ queryKey: ['deal-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['deal-tasks-list'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to mass update tasks')
    },
  })

  const [filters, setFilters] = useState({
    dealId: '',
    search: '',
    taskStatus: 'all',
    taskType: 'all',
    dealOwnerId: [] as Option[],
    assignedFromDate: '',
    assignedToDate: '',
    createdFromDate: '',
    createdToDate: '',
  })

  const [appliedFilters, setAppliedFilters] = useState(filters)
  const [currentPage, setCurrentPage] = useState(1)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | number | null>(
    null,
  )
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)

  const { data: ownerResponse } = useQuery({
    queryKey: ['deal-owners-filter'],
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

  const rawOwners = useMemo(() => {
    return Array.isArray(ownerResponse)
      ? ownerResponse
      : Array.isArray(ownerResponse?.data)
        ? ownerResponse.data
        : []
  }, [ownerResponse])

  const ownerOptions: Option[] = useMemo(() => {
    return rawOwners.map((u: any) => ({
      value: (u.id || u.user_id || '').toString(),
      label: u.full_name || u.first_name || u.email || `User #${u.id}`,
    }))
  }, [rawOwners])

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['deal-tasks-list', currentPage, appliedFilters, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('page', currentPage.toString())
      params.set('page_size', pageSize.toString())

      if (appliedFilters.dealId) params.set('deal_id', appliedFilters.dealId)
      if (appliedFilters.search) params.set('search', appliedFilters.search)
      if (appliedFilters.taskStatus !== 'all')
        params.set('task_status', appliedFilters.taskStatus)
      if (appliedFilters.taskType !== 'all')
        params.set('task_type', appliedFilters.taskType)

      if (appliedFilters.assignedFromDate)
        params.set('assigned_from_date', appliedFilters.assignedFromDate)
      if (appliedFilters.assignedToDate)
        params.set('assigned_to_date', appliedFilters.assignedToDate)
      if (appliedFilters.createdFromDate)
        params.set('created_from_date', appliedFilters.createdFromDate)
      if (appliedFilters.createdToDate)
        params.set('created_to_date', appliedFilters.createdToDate)

      if (appliedFilters.dealOwnerId && appliedFilters.dealOwnerId.length > 0) {
        appliedFilters.dealOwnerId.forEach((o) =>
          params.append('deal_owner_id', o.value),
        )
      }

      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/deal-tasks?${params.toString()}`,
        {
          credentials: 'include',
        },
      )
      if (!res.ok) throw new Error('Failed to fetch deal tasks')
      return res.json()
    },
    placeholderData: keepPreviousData,
  })

  const tasks: DealTask[] = data?.data || []
  const pageInfo = data?.page_info || {
    page: 1,
    total_pages: 1,
    total_records: 0,
  }

  const currentUserId = user?.user_id || (user as any)?.id

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleSearch = () => {
    setAppliedFilters(filters)
    setCurrentPage(1)
  }

  const handleClear = () => {
    const emptyFilters = {
      dealId: '',
      search: '',
      taskStatus: 'all',
      taskType: 'all',
      dealOwnerId: [] as Option[],
      assignedFromDate: '',
      assignedToDate: '',
      createdFromDate: '',
      createdToDate: '',
    }
    setFilters(emptyFilters)
    setAppliedFilters(emptyFilters)
    setCurrentPage(1)
  }

  const handleToggleSelectAll = () => {
    if (selectedTaskIds.length === tasks.length && tasks.length > 0) {
      setSelectedTaskIds([])
    } else {
      setSelectedTaskIds(tasks.map((t) => t.id))
    }
  }

  const handleToggleSelectRow = (taskId: string | number) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId],
    )
  }

  const pendingCount = tasks.filter(
    (t) => t.task_status !== 'Completed' && t.task_status !== 'Verified',
  ).length
  const overdueCount = tasks.filter(
    (t) =>
      t.task_status === 'Overdue' ||
      (t.task_due_date_time &&
        new Date(t.task_due_date_time) < new Date() &&
        t.task_status !== 'Completed'),
  ).length

  return (
    <div className='flex flex-col h-screen overflow-hidden bg-slate-50/50 dark:bg-background'>
      {/* ── Header Bar ── */}
      <div className='bg-background border-b border-border/60 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-2xs'>
        <div>
          <h1 className='text-2xl font-bold text-foreground tracking-tight'>
            Deal Tasks
          </h1>
          <p className='text-xs text-muted-foreground mt-0.5'>
            Manage deal follow-ups, borrower touchpoints, and loan progress.
          </p>
        </div>

        <div className='flex items-center gap-4'>
          {/* Stat Cards */}
          <div className='flex items-center gap-3'>
            <div className='flex items-center gap-3 bg-muted/40 border border-border/50 rounded-xl px-3.5 py-2 shadow-2xs'>
              <div className='h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0'>
                <CheckSquare className='h-4 w-4' />
              </div>
              <div className='flex flex-col'>
                <span className='text-[10px] font-medium text-muted-foreground uppercase tracking-wider'>
                  Total
                </span>
                <span className='text-base font-bold text-foreground leading-none mt-0.5'>
                  {isLoading ? (
                    <Skeleton className='h-4 w-12' />
                  ) : (
                    pageInfo.total_records || tasks.length
                  )}
                </span>
              </div>
            </div>

            <div className='flex items-center gap-3 bg-muted/40 border border-border/50 rounded-xl px-3.5 py-2 shadow-2xs'>
              <div className='h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0'>
                <Clock className='h-4 w-4' />
              </div>
              <div className='flex flex-col'>
                <span className='text-[10px] font-medium text-muted-foreground uppercase tracking-wider'>
                  Pending
                </span>
                <span className='text-base font-bold text-foreground leading-none mt-0.5'>
                  {isLoading ? <Skeleton className='h-4 w-12' /> : pendingCount}
                </span>
              </div>
            </div>

            <div className='flex items-center gap-3 bg-muted/40 border border-border/50 rounded-xl px-3.5 py-2 shadow-2xs'>
              <div className='h-8 w-8 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0'>
                <AlertCircle className='h-4 w-4' />
              </div>
              <div className='flex flex-col'>
                <span className='text-[10px] font-medium text-muted-foreground uppercase tracking-wider'>
                  Overdue
                </span>
                <span className='text-base font-bold text-foreground leading-none mt-0.5'>
                  {isLoading ? <Skeleton className='h-4 w-12' /> : overdueCount}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className='flex items-center gap-2.5'>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className='bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium text-xs rounded-lg px-4 h-9 gap-1.5 cursor-pointer'
            >
              <Plus className='h-4 w-4' /> Create Task
            </Button>
          </div>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className='flex-1 flex flex-col min-h-0 p-6 gap-4'>
        {/* Table Container */}
        <div className='flex-1 flex flex-col bg-background rounded-2xl border border-border/60 shadow-2xs overflow-hidden'>
          {/* Top Actions / Quick Bar */}
          <div className='p-4 border-b border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 bg-muted/10'>
            <div className='flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md'>
              <div className='relative w-full'>
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground' />
                <Input
                  placeholder='Search by Deal Name, Account, Description...'
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className='pl-8.5 h-8.5 text-xs bg-background rounded-lg border-border/80'
                />
              </div>
            </div>

            <div className='flex items-center gap-2 w-full sm:w-auto justify-end'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setIsFilterSheetOpen(true)}
                className='h-8.5 text-xs font-medium rounded-lg gap-1.5 border-border/80 cursor-pointer bg-background hover:bg-muted/50'
              >
                <SlidersHorizontal className='h-3.5 w-3.5 text-muted-foreground' />
                Filters
              </Button>

              <Button
                variant='ghost'
                size='icon'
                onClick={() => refetch()}
                className='h-8.5 w-8.5 rounded-lg border border-border/80 hover:bg-muted/50 cursor-pointer text-muted-foreground'
                title='Refresh'
              >
                <RotateCw className='h-3.5 w-3.5' />
              </Button>
            </div>
          </div>

          {/* Mass Actions Bar */}
          {selectedTaskIds.length > 0 && (
            <div className='flex items-center justify-between bg-blue-500/10 border-b border-blue-500/25 text-blue-600 dark:text-blue-400 px-5 py-2.5 shrink-0 text-xs font-medium'>
              <div className='flex items-center gap-2.5'>
                <div className='h-2 w-2 rounded-full bg-blue-500 animate-pulse' />
                <span className='font-semibold'>
                  {selectedTaskIds.length} task(s) selected
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <Select
                  onValueChange={(val) => massUpdateStatusMutation.mutate(val)}
                  disabled={massUpdateStatusMutation.isPending}
                >
                  <SelectTrigger className='h-8 text-xs bg-background w-[160px] font-medium'>
                    <SelectValue placeholder='Update Status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Pending'>Pending</SelectItem>
                    <SelectItem value='In Progress'>In Progress</SelectItem>
                    <SelectItem value='Completed'>Completed</SelectItem>
                    <SelectItem value='Verified'>Verified</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={() => setSelectedTaskIds([])}
                  className='h-8 text-xs text-muted-foreground hover:text-foreground cursor-pointer'
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className='flex-1 overflow-auto'>
            {isLoading ? (
              <div className='flex flex-col items-center justify-center h-64 gap-2 text-muted-foreground'>
                <Spinner className='h-7 w-7 text-blue-600' />
                <span className='text-xs font-medium'>
                  Loading deal tasks...
                </span>
              </div>
            ) : (
              <table className='w-full caption-bottom text-sm'>
                <thead className='bg-background sticky top-0 z-10'>
                  <tr className='text-left text-xs font-semibold text-muted-foreground tracking-wide'>
                    <th className='w-[48px] px-4 py-3 text-center'>
                      <input
                        type='checkbox'
                        checked={
                          selectedTaskIds.length === tasks.length &&
                          tasks.length > 0
                        }
                        onChange={handleToggleSelectAll}
                        className='rounded border-border'
                      />
                    </th>
                    <th className='px-4 py-3'>Task Details</th>
                    <th className='px-4 py-3'>Deal Name</th>
                    <th className='px-4 py-3'>Account Name</th>
                    <th className='px-4 py-3'>Deal Owner</th>
                    <th className='px-4 py-3'>Assignee</th>
                    <th className='px-4 py-3'>Assigned Date/Time</th>
                    <th className='px-4 py-3'>Due Date / Time</th>
                    <th className='px-4 py-3'>Completed At</th>
                    <th className='px-4 py-3'>Status</th>
                    <th className='px-4 py-3 text-right pr-6'>Actions</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-border/40'>
                  {tasks.length === 0 ? (
                    <tr>
                      <td
                        colSpan={11}
                        className='text-center h-36 text-muted-foreground text-sm'
                      >
                        No deal tasks found.
                      </td>
                    </tr>
                  ) : (
                    tasks.map((task) => {
                      const isSelected = selectedTaskIds.includes(task.id)
                      const isCreator =
                        String(task.created_by_id) === String(currentUserId)
                      const isAssignee =
                        String(task.assigned_to_id) === String(currentUserId)
                      const isCompleted = task.task_status === 'Completed'
                      const statusStyle = getTaskStatusStyle(task.task_status)

                      return (
                        <tr
                          key={task.id}
                          onClick={() => {
                            setSelectedTaskId(task.id)
                            setIsUpdateModalOpen(true)
                          }}
                          className={`transition-colors border-b cursor-pointer border-border/40 ${
                            isSelected
                              ? 'bg-blue-50/60 dark:bg-blue-950/20'
                              : 'hover:bg-slate-50/80 dark:hover:bg-muted/30'
                          }`}
                        >
                          <td
                            className='w-[48px] px-4 py-3.5 text-center'
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type='checkbox'
                              checked={isSelected}
                              onChange={() => handleToggleSelectRow(task.id)}
                              className='rounded border-border'
                            />
                          </td>

                          {/* Task Description / Type */}
                          <td className='px-4 py-3.5'>
                            <div className='flex flex-col'>
                              <span className='font-semibold text-foreground text-xs'>
                                {task.task_description || `Task #${task.id}`}
                              </span>
                              {task.task_type && (
                                <span className='text-[11px] text-muted-foreground mt-0.5'>
                                  Type: {task.task_type}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Deal Name */}
                          <td className='px-4 py-3.5'>
                            <span
                              onClick={(e) => {
                                e.stopPropagation()
                                if (task.deal_id) {
                                  window.open(
                                    `/deals/${task.deal_id}`,
                                    '_blank',
                                  )
                                }
                              }}
                              className='font-semibold text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer'
                            >
                              {task.deal_name || `Deal #${task.deal_id}`}
                            </span>
                          </td>

                          {/* Account Name */}
                          <td className='px-4 py-3.5'>
                            <span className='font-medium text-xs text-muted-foreground'>
                              {task.account_name || '—'}
                            </span>
                          </td>

                          {/* Deal Owner */}
                          <td className='px-4 py-3.5'>
                            <span className='text-xs text-foreground font-medium'>
                              {task.deal_owner || 'Unassigned'}
                            </span>
                          </td>

                          {/* Assignee */}
                          <td className='px-4 py-3.5'>
                            <div className='flex items-center gap-2'>
                              <Avatar className='h-6 w-6 border border-border/60'>
                                <AvatarFallback className='text-[10px] bg-slate-200 text-slate-700 font-semibold'>
                                  {task.assigned_to_name
                                    ? task.assigned_to_name
                                        .split(' ')
                                        .map((n) => n[0])
                                        .slice(0, 2)
                                        .join('')
                                    : 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span className='text-xs font-medium text-slate-700 dark:text-slate-200'>
                                {task.assigned_to_name || '—'}
                              </span>
                            </div>
                          </td>

                          {/* Assigned Date/Time */}
                          <td className='px-4 py-3.5'>
                            <span className='text-xs font-medium'>
                              {formatISTDateTime(task.task_assigned_date_time)}
                            </span>
                          </td>

                          {/* Due Date */}
                          <td className='px-4 py-3.5 text-xs'>
                            {formatISTDateTime(task.task_due_date_time)}
                          </td>

                          {/* Completed At */}
                          <td className='px-4 py-3.5 text-xs'>
                            {formatISTDateTime(task.completed_at)}
                          </td>

                          {/* Status */}
                          <td className='px-4 py-3.5'>
                            <Badge
                              variant='outline'
                              className={`rounded-full px-3 py-0.5 text-[11px] font-medium border border-transparent shadow-2xs ${statusStyle}`}
                            >
                              {task.task_status || 'Pending'}
                            </Badge>
                          </td>

                          {/* Quick Actions (NO DELETE) */}
                          <td
                            className='px-4 py-3.5 text-right pr-6'
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className='flex items-center justify-end gap-1.5'>
                              {!isCompleted && (
                                <Button
                                  size='sm'
                                  variant='ghost'
                                  onClick={() =>
                                    quickCompleteMutation.mutate(task.id)
                                  }
                                  disabled={quickCompleteMutation.isPending}
                                  title='Mark as Completed'
                                  className='h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer gap-1'
                                >
                                  <CheckCircle2 className='h-3.5 w-3.5' />{' '}
                                  Complete
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
                                <Pencil className='h-3.5 w-3.5' />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className='p-3 border-t border-border/60 shrink-0 bg-background'>
            <Pagination
              page={currentPage}
              totalPages={pageInfo.total_pages}
              setPage={setCurrentPage}
            />
          </div>
        </div>
      </div>

      {/* ── Filter Sheet ── */}
      <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
        <SheetContent side='right' className='sm:max-w-md overflow-y-auto'>
          <SheetHeader className='border-b pb-4'>
            <SheetTitle className='text-base font-bold flex items-center gap-2'>
              <Filter className='h-4 w-4 text-primary' />
              Filter Deal Tasks
            </SheetTitle>
          </SheetHeader>

          <div className='py-5 space-y-4 text-xs'>
            {/* Deal ID */}
            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold'>Deal ID</Label>
              <Input
                placeholder='Enter Deal ID...'
                value={filters.dealId}
                onChange={(e) => handleFilterChange('dealId', e.target.value)}
                className='h-8 text-xs'
              />
            </div>

            {/* Task Status */}
            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold'>Task Status</Label>
              <Select
                value={filters.taskStatus}
                onValueChange={(val) => handleFilterChange('taskStatus', val)}
              >
                <SelectTrigger className='h-8 text-xs'>
                  <SelectValue placeholder='All Statuses' />
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
              <Label className='text-xs font-semibold'>Task Type</Label>
              <Select
                value={filters.taskType}
                onValueChange={(val) => handleFilterChange('taskType', val)}
              >
                <SelectTrigger className='h-8 text-xs'>
                  <SelectValue placeholder='All Types' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Types</SelectItem>
                  <SelectItem value='Call'>Call</SelectItem>
                  <SelectItem value='Update Record'>Update Record</SelectItem>
                  <SelectItem value='Email'>Email</SelectItem>
                  <SelectItem value='Move Status'>Move Status</SelectItem>
                  <SelectItem value='Visit'>Visit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Deal Owners */}
            {canViewOwnerFilter && (
              <div className='space-y-1.5'>
                <Label className='text-xs font-semibold'>Deal Owners</Label>
                <MultiSelect
                  options={ownerOptions}
                  value={filters.dealOwnerId}
                  onValueChange={(val) =>
                    handleFilterChange('dealOwnerId', val)
                  }
                  placeholder='Select Deal Owners...'
                />
              </div>
            )}

            {/* Assigned Date Range */}
            <div className='space-y-1.5 border-t pt-3'>
              <Label className='text-xs font-semibold'>Assigned Date</Label>
              <div className='grid grid-cols-2 gap-2'>
                <DatePicker
                  value={
                    filters.assignedFromDate
                      ? new Date(filters.assignedFromDate)
                      : undefined
                  }
                  onChange={(d) =>
                    handleFilterChange(
                      'assignedFromDate',
                      d ? d.toISOString().split('T')[0] : '',
                    )
                  }
                  placeholder='From'
                />
                <DatePicker
                  value={
                    filters.assignedToDate
                      ? new Date(filters.assignedToDate)
                      : undefined
                  }
                  onChange={(d) =>
                    handleFilterChange(
                      'assignedToDate',
                      d ? d.toISOString().split('T')[0] : '',
                    )
                  }
                  placeholder='To'
                />
              </div>
            </div>

            {/* Created Date Range */}
            <div className='space-y-1.5 border-t pt-3'>
              <Label className='text-xs font-semibold'>Task Created Date</Label>
              <div className='grid grid-cols-2 gap-2'>
                <DatePicker
                  value={
                    filters.createdFromDate
                      ? new Date(filters.createdFromDate)
                      : undefined
                  }
                  onChange={(d) =>
                    handleFilterChange(
                      'createdFromDate',
                      d ? d.toISOString().split('T')[0] : '',
                    )
                  }
                  placeholder='From'
                />
                <DatePicker
                  value={
                    filters.createdToDate
                      ? new Date(filters.createdToDate)
                      : undefined
                  }
                  onChange={(d) =>
                    handleFilterChange(
                      'createdToDate',
                      d ? d.toISOString().split('T')[0] : '',
                    )
                  }
                  placeholder='To'
                />
              </div>
            </div>
          </div>

          <SheetFooter className='border-t pt-4 flex gap-2'>
            <Button
              variant='outline'
              onClick={handleClear}
              className='h-9 text-xs flex-1 cursor-pointer'
            >
              Reset
            </Button>
            <Button
              onClick={() => {
                handleSearch()
                setIsFilterSheetOpen(false)
              }}
              className='h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white flex-1 font-semibold cursor-pointer shadow-sm'
            >
              Apply Filters
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Create & Update Modals */}
      <CreateDealTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <UpdateDealTaskModal
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false)
          setSelectedTaskId(null)
        }}
        taskId={selectedTaskId}
      />
    </div>
  )
}
