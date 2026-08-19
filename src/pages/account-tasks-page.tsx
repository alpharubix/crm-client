import { useState, useMemo } from 'react';
import { DatePicker } from '@/components/ui/date-picker';
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import {
  Pencil,
  Trash2,
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
  MoreVertical,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import Pagination from '@/components/shared/pagination';
import { MultiSelect, type Option } from '@/components/ui/multi-select';
import { formatExactDate } from '@/utils/date-formatter';
import { useAuth } from '@/context/auth-context';
import { ENV } from '@/conf';
import type {
  AccountTask,
  TaskStatus,
  CallBackDateStatus,
} from '@/types/account-task';
import CreateAccountTaskModal from '@/components/account-tasks/create-account-task-modal';
import UpdateAccountTaskModal from '@/components/account-tasks/update-account-task-modal';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

    return `${d}-${m}-${y} ${hr}:${min} ${dayPeriod}`;
  } catch {
    return dateStr || '-';
  }
};

const getTaskStatusStyle = (status?: string | null) => {
  if (!status) return 'bg-slate-100 text-slate-600 border-slate-200';
  const s = status.toLowerCase();
  if (s.includes('completed') || s.includes('verified')) {
    return 'bg-emerald-100 text-emerald-700 border-emerald-200 font-medium';
  }
  if (s.includes('in progress')) {
    return 'bg-blue-100 text-blue-700 border-blue-200 font-medium';
  }
  if (s.includes('pending') || s.includes('assigned')) {
    return 'bg-amber-100 text-amber-700 border-amber-200 font-medium';
  }
  if (s.includes('overdue')) {
    return 'bg-red-100 text-red-700 border-red-200 font-medium';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200 font-medium';
};

export default function AccountTasksPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = String(user?.role || '').toLowerCase();
  const canViewOwnerFilter = ['super_admin', 'admin', 'manager'].includes(role);

  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [pageSize, setPageSize] = useState<number>(15);

  const quickCompleteMutation = useMutation({
    mutationFn: async (taskId: string | number) => {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/account-tasks/${taskId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ task_status: 'Completed' }),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to mark task as completed');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Task marked as Completed!');
      queryClient.invalidateQueries({ queryKey: ['account-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['account-tasks-list'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to mark task as completed');
    },
  });

  const [selectedTaskIds, setSelectedTaskIds] = useState<(string | number)[]>(
    [],
  );

  const massUpdateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/account-tasks/bulk-status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            task_ids: selectedTaskIds,
            task_status: newStatus,
          }),
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to mass update tasks');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Tasks status updated successfully');
      setSelectedTaskIds([]);
      queryClient.invalidateQueries({ queryKey: ['account-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['account-tasks-list'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to mass update tasks');
    },
  });

  const [filters, setFilters] = useState({
    accountId: '',
    search: '',
    taskStatus: 'all',
    taskType: 'all',
    callBackStatus: 'all',
    accountOwnerId: [] as Option[],
    assignedFromDate: '',
    assignedToDate: '',
    createdFromDate: '',
    createdToDate: '',
    assignmentFromDate: '',
    assignmentToDate: '',
    noteFromDate: '',
    noteToDate: '',
  });

  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [currentPage, setCurrentPage] = useState(1);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | number | null>(
    null,
  );
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const { data: ownerResponse } = useQuery({
    queryKey: ['account-owners'],
    queryFn: async () => {
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/user/filter`, {
        credentials: 'include',
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: canViewOwnerFilter,
    retry: false,
  });

  const rawOwners = useMemo(() => {
    return Array.isArray(ownerResponse)
      ? ownerResponse
      : Array.isArray(ownerResponse?.data)
        ? ownerResponse.data
        : [];
  }, [ownerResponse]);

  const ownerOptions: Option[] = useMemo(() => {
    return rawOwners.map((u: any) => ({
      value: (u.id || u.user_id || '').toString(),
      label: u.full_name || u.first_name || u.email || `User #${u.id}`,
    }));
  }, [rawOwners]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['account-tasks-list', currentPage, appliedFilters, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', currentPage.toString());
      params.set('page_size', pageSize.toString());

      if (appliedFilters.accountId)
        params.set('account_id', appliedFilters.accountId);
      if (appliedFilters.search) params.set('search', appliedFilters.search);
      if (appliedFilters.taskStatus !== 'all')
        params.set('task_status', appliedFilters.taskStatus);
      if (appliedFilters.taskType !== 'all')
        params.set('task_type', appliedFilters.taskType);
      if (appliedFilters.callBackStatus !== 'all')
        params.set('call_back_status', appliedFilters.callBackStatus);

      if (appliedFilters.assignedFromDate)
        params.set('assigned_from_date', appliedFilters.assignedFromDate);
      if (appliedFilters.assignedToDate)
        params.set('assigned_to_date', appliedFilters.assignedToDate);
      if (appliedFilters.createdFromDate)
        params.set('created_from_date', appliedFilters.createdFromDate);
      if (appliedFilters.createdToDate)
        params.set('created_to_date', appliedFilters.createdToDate);
      if (appliedFilters.assignmentFromDate)
        params.set('assignment_from_date', appliedFilters.assignmentFromDate);
      if (appliedFilters.assignmentToDate)
        params.set('assignment_to_date', appliedFilters.assignmentToDate);
      if (appliedFilters.noteFromDate)
        params.set('note_from_date', appliedFilters.noteFromDate);
      if (appliedFilters.noteToDate)
        params.set('note_to_date', appliedFilters.noteToDate);

      if (
        appliedFilters.accountOwnerId &&
        appliedFilters.accountOwnerId.length > 0
      ) {
        appliedFilters.accountOwnerId.forEach((o) =>
          params.append('account_owner_id', o.value),
        );
      }

      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/account-tasks?${params.toString()}`,
        {
          credentials: 'include',
        },
      );
      if (!res.ok) throw new Error('Failed to fetch account tasks');
      return res.json();
    },
    placeholderData: keepPreviousData,
  });

  const tasks: AccountTask[] = data?.data || [];
  const pageInfo = data?.page_info || {
    page: 1,
    total_pages: 1,
    total_records: 0,
  };

  const currentUserId = user?.user_id || (user as any)?.id;

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string | number) => {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/account-tasks/${id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to delete task');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Task deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['account-tasks-list'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error deleting task');
    },
  });

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    setAppliedFilters(filters);
    setCurrentPage(1);
  };

  const handleClear = () => {
    const emptyFilters = {
      accountId: '',
      search: '',
      taskStatus: 'all',
      taskType: 'all',
      callBackStatus: 'all',
      accountOwnerId: [] as Option[],
      assignedFromDate: '',
      assignedToDate: '',
      createdFromDate: '',
      createdToDate: '',
      assignmentFromDate: '',
      assignmentToDate: '',
      noteFromDate: '',
      noteToDate: '',
    };
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setCurrentPage(1);
  };

  const handleToggleSelectAll = () => {
    if (selectedTaskIds.length === tasks.length && tasks.length > 0) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(tasks.map((t) => t.id));
    }
  };

  const handleToggleSelectRow = (taskId: string | number) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId],
    );
  };

  const pendingCount = tasks.filter(
    (t) => t.task_status !== 'Completed',
  ).length;
  const overdueCount = tasks.filter(
    (t) =>
      t.call_back_date_time &&
      new Date(t.call_back_date_time) < new Date() &&
      t.task_status !== 'Completed',
  ).length;

  return (
    <div className='flex flex-col h-screen overflow-hidden bg-slate-50/50 dark:bg-background'>
      {/* ── Header Bar ── */}
      <div className='bg-background border-b border-border/60 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-2xs'>
        <div>
          <h1 className='text-2xl font-bold text-foreground tracking-tight'>
            Account Tasks
          </h1>
          <p className='text-xs text-muted-foreground mt-0.5'>
            Manage call-backs, follow-ups, and customer touchpoints.
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
            <Button
              variant='outline'
              size='icon'
              onClick={() => refetch()}
              title='Refresh tasks'
              className='h-9 w-9 rounded-lg border-border/60 text-muted-foreground hover:text-foreground cursor-pointer'
            >
              <RotateCw
                className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Toolbar & Content Container ── */}
      <div className='flex-1 flex flex-col overflow-hidden p-6 gap-4'>
        {/* Quick Filter Control Toolbar */}
        <div className='bg-background rounded-xl border border-border/60 p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs shrink-0'>
          <div className='flex flex-wrap items-center gap-2.5 flex-1'>
            <div className='flex items-center gap-1.5'>
              {/* Account ID Filter */}
              <div className='relative w-30 sm:w-35 '>
                <Hash className='absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/70 pointer-events-none' />
                <Input
                  placeholder='Account ID'
                  value={filters.accountId}
                  onChange={(e) =>
                    handleFilterChange('accountId', e.target.value)
                  }
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className='pl-8 h-9 w-35 text-xs font-mono bg-background border-border/60 focus-visible:border-primary transition-colors shadow-none rounded-lg'
                />
              </div>

              <div className='relative w-full max-w-[240px]'>
                <Search className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search Account...'
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className='pl-9 h-9 text-xs rounded-lg bg-background'
                />
              </div>
              <Button
                size='sm'
                onClick={handleSearch}
                className='h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3.5 gap-1.5 cursor-pointer font-medium shadow-2xs'
              >
                <Search className='h-3.5 w-3.5' /> Search
              </Button>
            </div>

            {/* Status Select */}
            <div className='w-[140px]'>
              <Select
                value={filters.taskStatus}
                onValueChange={(val) => {
                  handleFilterChange('taskStatus', val);
                  setAppliedFilters((prev) => ({ ...prev, taskStatus: val }));
                }}
              >
                <SelectTrigger className='h-9 text-xs rounded-lg bg-background'>
                  <SelectValue placeholder='All Statuses' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Statuses</SelectItem>
                  <SelectItem value='Pending'>Pending</SelectItem>
                  <SelectItem value='In Progress'>In Progress</SelectItem>
                  <SelectItem value='Completed'>Completed</SelectItem>
                  <SelectItem value='Overdue'>Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filters Button */}
            <Button
              variant='outline'
              onClick={() => setIsFilterSheetOpen(true)}
              className='h-9 text-xs gap-1.5 rounded-lg border-border font-medium cursor-pointer hover:bg-muted/50'
            >
              <SlidersHorizontal className='h-3.5 w-3.5 text-muted-foreground' />
              Filters
            </Button>

            <Button
              variant='ghost'
              onClick={handleClear}
              className='h-9 text-xs text-blue-600 font-medium hover:bg-blue-50 hover:text-blue-700 cursor-pointer'
            >
              Clear
            </Button>
          </div>

          {/* <div className='flex items-center gap-2 text-xs text-muted-foreground'>
            <span>Show</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(val) => setPageSize(Number(val))}
            >
              <SelectTrigger className='h-8 w-16 text-xs rounded-md bg-background px-2'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='15'>15</SelectItem>
                <SelectItem value='30'>30</SelectItem>
                <SelectItem value='50'>50</SelectItem>
              </SelectContent>
            </Select>
            <span>entries</span>
          </div> */}
        </div>

        {/* Main Content Area */}
        <div className='flex-1 bg-background rounded-xl border border-border/60 shadow-2xs overflow-hidden flex flex-col'>
          {/* Selected Rows Mass Action Bar */}
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
                  Loading account tasks...
                </span>
              </div>
            ) : (
              <table className='w-full caption-bottom text-sm'>
                <thead className='bg-slate-50/80 dark:bg-muted/30 sticky top-0 z-10 border-b border-border/60'>
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
                    <th className='px-4 py-3'>Account Name</th>
                    <th className='px-4 py-3'>Assignee</th>
                    <th className='px-4 py-3'>Due Date / Time</th>
                    <th className='px-4 py-3'>Status</th>
                    <th className='px-4 py-3 text-right pr-6'>Actions</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-border/40'>
                  {tasks.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className='text-center h-36 text-muted-foreground text-sm'
                      >
                        No tasks found.
                      </td>
                    </tr>
                  ) : (
                    tasks.map((task) => {
                      const isSelected = selectedTaskIds.includes(task.id);
                      const isCreator =
                        String(task.task_creator_id) === String(currentUserId);
                      const isAssignee =
                        String(task.assigned_to_id) === String(currentUserId);
                      const isCompleted = task.task_status === 'Completed';
                      const statusStyle = getTaskStatusStyle(task.task_status);

                      return (
                        <tr
                          key={task.id}
                          className={`transition-colors border-b border-border/40 ${
                            isSelected
                              ? 'bg-blue-50/60 dark:bg-blue-950/20'
                              : 'hover:bg-slate-50/80 dark:hover:bg-muted/30'
                          }`}
                        >
                          <td className='w-[48px] px-4 py-3.5 text-center'>
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
                                {task.description || `Task #${task.id}`}
                              </span>
                              {task.task_type && (
                                <span className='text-[11px] text-muted-foreground mt-0.5'>
                                  Type: {task.task_type}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Account Name */}
                          <td className='px-4 py-3.5'>
                            <span
                              onClick={() =>
                                window.open(
                                  `/accounts/${task.account_id}`,
                                  '_blank',
                                )
                              }
                              className='font-semibold text-blue-600 dark:text-blue-400 text-xs hover:underline cursor-pointer'
                            >
                              {task.account_name ||
                                `Account #${task.account_id}`}
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

                          {/* Due Date */}
                          <td className='px-4 py-3.5 text-xs text-muted-foreground'>
                            {formatISTDateTime(task.call_back_date_time)}
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

                          {/* Quick Actions */}
                          <td className='px-4 py-3.5 text-right pr-6'>
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

                              {(isCreator ||
                                isAssignee ||
                                canViewOwnerFilter) && (
                                <Button
                                  size='icon'
                                  variant='ghost'
                                  onClick={() => {
                                    setSelectedTaskId(task.id);
                                    setIsUpdateModalOpen(true);
                                  }}
                                  className='h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer'
                                >
                                  <Pencil className='h-3.5 w-3.5' />
                                </Button>
                              )}

                              {isCreator && (
                                <Button
                                  size='icon'
                                  variant='ghost'
                                  onClick={() => {
                                    if (
                                      confirm(
                                        'Are you sure you want to delete this task?',
                                      )
                                    ) {
                                      deleteTaskMutation.mutate(task.id);
                                    }
                                  }}
                                  className='h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer'
                                >
                                  <Trash2 className='h-3.5 w-3.5' />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Table Bottom Pagination Bar */}
          <div className='px-5 py-3 border-t border-border/60 shrink-0 bg-background flex flex-col md:flex-row md:items-center justify-between gap-3'>
            <span className='text-xs text-muted-foreground font-medium'>
              Showing{' '}
              <span className='text-foreground font-semibold'>
                {tasks.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
              </span>{' '}
              to{' '}
              <span className='text-foreground font-semibold'>
                {Math.min(
                  currentPage * pageSize,
                  pageInfo.total_records || tasks.length,
                )}
              </span>{' '}
              of{' '}
              <span className='text-foreground font-semibold'>
                {(pageInfo.total_records || tasks.length).toLocaleString()}
              </span>{' '}
              tasks
            </span>

            <Pagination
              currentPage={pageInfo.page || currentPage}
              totalPages={pageInfo.total_pages || 1}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </div>
        </div>
      </div>

      {/* ── Advanced Filter Side Sheet ── */}
      <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
        <SheetContent
          side='right'
          className='w-[380px] sm:w-[440px] p-0 flex flex-col gap-0 border-l shadow-2xl bg-background'
        >
          <SheetHeader className='px-6 py-4 border-b border-border/60 flex flex-row items-center justify-between shrink-0 space-y-0'>
            <SheetTitle className='text-base font-bold text-foreground'>
              Filter Tasks
            </SheetTitle>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleClear}
              className='h-7 text-xs text-blue-600 font-medium hover:bg-blue-50 hover:text-blue-700 px-2'
            >
              Clear all
            </Button>
          </SheetHeader>

          <div className='flex-1 overflow-y-auto px-6 py-5 space-y-4'>
            {/* Account ID */}
            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold text-foreground'>
                Account ID
              </Label>
              <Input
                placeholder='Enter Account ID (e.g. 1001)...'
                value={filters.accountId}
                onChange={(e) => handleFilterChange('accountId', e.target.value)}
                className='h-9 text-xs font-mono rounded-lg'
              />
            </div>
            {/* Search */}
            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold text-foreground'>
                Search Keyword
              </Label>
              <Input
                placeholder='Search account...'
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className='h-9 text-xs rounded-lg'
              />
            </div>

            {/* Task Status */}
            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold text-foreground'>
                Task Status
              </Label>
              <Select
                value={filters.taskStatus}
                onValueChange={(val) => handleFilterChange('taskStatus', val)}
              >
                <SelectTrigger className='h-9 text-xs rounded-lg bg-background'>
                  <SelectValue placeholder='Select Task Status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Statuses</SelectItem>
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
              <Label className='text-xs font-semibold text-foreground'>
                Task Type
              </Label>
              <Select
                value={filters.taskType}
                onValueChange={(val) => handleFilterChange('taskType', val)}
              >
                <SelectTrigger className='h-9 text-xs rounded-lg bg-background'>
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

            {/* Account Owner */}
            {canViewOwnerFilter && (
              <div className='space-y-1.5'>
                <Label className='text-xs font-semibold text-foreground'>
                  Assignee / Owner
                </Label>
                <MultiSelect
                  options={ownerOptions}
                  value={filters.accountOwnerId}
                  onChange={(val) => handleFilterChange('accountOwnerId', val)}
                  placeholder='Select Owner...'
                />
              </div>
            )}

            {/* Date Filters */}
            <div className='space-y-2 pt-2 border-t border-border/60'>
              <Label className='text-xs font-semibold text-foreground block'>
                Task Assigned Date Range
              </Label>
              <div className='grid grid-cols-2 gap-2'>
                <DatePicker
                  value={filters.assignedFromDate}
                  onChange={(val) =>
                    handleFilterChange('assignedFromDate', val)
                  }
                  placeholder='From Date'
                />
                <DatePicker
                  value={filters.assignedToDate}
                  onChange={(val) => handleFilterChange('assignedToDate', val)}
                  placeholder='To Date'
                />
              </div>
            </div>

            {/* Account Assignment Date Section */}
            <div className='space-y-2 pt-2 border-t border-border/60'>
              <Label className='text-xs font-semibold text-foreground block'>
                Account Assignment Date Range
              </Label>
              <div className='grid grid-cols-2 gap-2'>
                <DatePicker
                  value={filters.assignmentFromDate}
                  onChange={(val) =>
                    handleFilterChange('assignmentFromDate', val)
                  }
                  placeholder='From Date'
                />
                <DatePicker
                  value={filters.assignmentToDate}
                  onChange={(val) => handleFilterChange('assignmentToDate', val)}
                  placeholder='To Date'
                />
              </div>
            </div>

            {/* Last Updated Note Date Section */}
            <div className='space-y-2 pt-2 border-t border-border/60'>
              <Label className='text-xs font-semibold text-foreground block'>
                Last Updated Note Date Range
              </Label>
              <div className='grid grid-cols-2 gap-2'>
                <DatePicker
                  value={filters.noteFromDate}
                  onChange={(val) => handleFilterChange('noteFromDate', val)}
                  placeholder='From Date'
                />
                <DatePicker
                  value={filters.noteToDate}
                  onChange={(val) => handleFilterChange('noteToDate', val)}
                  placeholder='To Date'
                />
              </div>
            </div>
          </div>

          <SheetFooter className='p-4 border-t border-border/60 flex flex-row items-center justify-end gap-2 bg-slate-50/50 dark:bg-muted/20 shrink-0'>
            <Button
              variant='outline'
              onClick={() => setIsFilterSheetOpen(false)}
              className='h-9 text-xs rounded-lg px-4 cursor-pointer'
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleSearch();
                setIsFilterSheetOpen(false);
              }}
              className='h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 font-semibold cursor-pointer shadow-sm'
            >
              Apply Filters
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Create & Update Modals */}
      <CreateAccountTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <UpdateAccountTaskModal
        isOpen={isUpdateModalOpen}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setSelectedTaskId(null);
        }}
        taskId={selectedTaskId}
      />
    </div>
  );
}
