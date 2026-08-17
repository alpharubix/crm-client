import { useState, useMemo } from 'react';
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
  RefreshCw,
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

export default function AccountTasksPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = String(user?.role || '').toLowerCase();
  const canViewOwnerFilter = ['super_admin', 'admin', 'manager'].includes(role);

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

  // Mass Update Status State & Mutation (Restricted to Task Creator)
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

  // Draft Filter state
  const [filters, setFilters] = useState({
    search: '',
    taskStatus: 'all',
    taskType: 'all',
    callBackStatus: 'all',
    accountOwnerId: [] as Option[],
    assignedFromDate: '',
    assignedToDate: '',
    createdFromDate: '',
    createdToDate: '',
  });

  // Applied Filter state (triggered when clicking "Search" button)
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | number | null>(
    null,
  );
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Fetch Account Owners for MultiSelect Filter (only for super_admin, admin, manager)
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

  // React Query fetch for Account Tasks list
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['account-tasks-list', currentPage, appliedFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', currentPage.toString());
      params.set('page_size', '15');

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

  const isCreatorOrAdmin = (task: AccountTask) => {
    return (
      (task.created_by_id &&
        String(task.created_by_id) === String(currentUserId)) ||
      role === 'super_admin' ||
      role === 'admin'
    );
  };

  const userCreatedTasks = tasks.filter(isCreatorOrAdmin);
  const isAllSelected =
    userCreatedTasks.length > 0 &&
    userCreatedTasks.every((t) => selectedTaskIds.includes(String(t.id)));

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTaskIds(userCreatedTasks.map((t) => String(t.id)));
    } else {
      setSelectedTaskIds([]);
    }
  };

  const handleSelectTask = (taskId: string, checked: boolean) => {
    if (checked) {
      setSelectedTaskIds((prev) => [...prev, taskId]);
    } else {
      setSelectedTaskIds((prev) => prev.filter((id) => id !== taskId));
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    setAppliedFilters(filters);
    setCurrentPage(1);
  };

  const handleClear = () => {
    const empty = {
      search: '',
      taskStatus: 'all',
      taskType: 'all',
      callBackStatus: 'all',
      accountOwnerId: [] as Option[],
      assignedFromDate: '',
      assignedToDate: '',
      createdFromDate: '',
      createdToDate: '',
    };
    setFilters(empty);
    setAppliedFilters(empty);
    setCurrentPage(1);
  };

  const getStatusBadge = (status: TaskStatus) => {
    const base = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap border'

    const styles: Record<string, string> = {
      Pending:     'bg-amber-50   text-amber-700  border-amber-200   dark:bg-amber-500/10  dark:text-amber-400  dark:border-amber-500/20',
      Assigned:    'bg-indigo-50  text-indigo-700 border-indigo-200  dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20',
      'In Progress':'bg-blue-50   text-blue-700   border-blue-200    dark:bg-blue-500/10   dark:text-blue-400   dark:border-blue-500/20',
      Completed:   'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
      Verified:    'bg-teal-50    text-teal-700   border-teal-200    dark:bg-teal-500/10   dark:text-teal-400   dark:border-teal-500/20',
      Overdue:     'bg-red-50     text-red-700    border-red-200     dark:bg-red-500/10    dark:text-red-400    dark:border-red-500/20',
      Unassigned:  'bg-slate-50   text-slate-600  border-slate-200   dark:bg-slate-500/10  dark:text-slate-400  dark:border-slate-500/20',
    }

    const dotColors: Record<string, string> = {
      Pending:     'bg-amber-500',
      Assigned:    'bg-indigo-500',
      'In Progress':'bg-blue-500',
      Completed:   'bg-emerald-500',
      Verified:    'bg-teal-500',
      Overdue:     'bg-red-500',
      Unassigned:  'bg-slate-400',
    }

    const style = styles[status] || styles.Unassigned
    const dot = dotColors[status] || dotColors.Unassigned
    const label = status || 'Unassigned'

    return (
      <span className={`${base} ${style}`}>
        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />
        {label}
      </span>
    )
  }

  const getCallBackBadge = (cbStatus?: CallBackDateStatus) => {
    const base = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap border'

    const styles: Record<string, string> = {
      Overdue:       'bg-red-50    text-red-700    border-red-200    dark:bg-red-500/10    dark:text-red-400    dark:border-red-500/20',
      'Due Today':   'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20',
      'Due Tomorrow':'bg-amber-50  text-amber-700  border-amber-200  dark:bg-amber-500/10  dark:text-amber-400  dark:border-amber-500/20',
      'Due This Week':'bg-blue-50  text-blue-700   border-blue-200   dark:bg-blue-500/10   dark:text-blue-400   dark:border-blue-500/20',
      'Due Next Week':'bg-slate-50 text-slate-600  border-slate-200  dark:bg-slate-500/10  dark:text-slate-400  dark:border-slate-500/20',
    }

    const dotColors: Record<string, string> = {
      Overdue:       'bg-red-500',
      'Due Today':   'bg-orange-500',
      'Due Tomorrow':'bg-amber-500',
      'Due This Week':'bg-blue-500',
      'Due Next Week':'bg-slate-400',
    }

    if (!cbStatus || !styles[cbStatus]) {
      return <span className='text-xs text-muted-foreground'>—</span>
    }

    return (
      <span className={`${base} ${styles[cbStatus]}`}>
        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColors[cbStatus]}`} />
        {cbStatus}
      </span>
    )
  }

  return (
    <div className='flex flex-col h-screen overflow-hidden'>
      {/* Page Header */}
      <div className='flex items-center justify-between px-5 py-3.5 border-b border-border/60 bg-background shrink-0'>
        <div>
          <h1 className='text-xl font-semibold text-foreground tracking-tight'>Account Tasks</h1>
          <p className='text-xs text-muted-foreground mt-0.5'>Track and manage tasks linked to accounts</p>
        </div>

        <div className='flex items-center gap-2.5'>
          {isLoading ? (
            <Skeleton className='w-24 h-5 rounded-md' />
          ) : (
            <span className='text-xs font-medium text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md border border-border/50'>
              {pageInfo.total_records || tasks.length} tasks
            </span>
          )}
          <Button
            size='sm'
            className='cursor-pointer h-8 text-xs gap-1.5'
            onClick={() => setIsCreateModalOpen(true)}
          >
            <span className='text-base leading-none'>+</span> Create Task
          </Button>
        </div>
      </div>

      {/* Mass Update Status Action Bar */}
      {selectedTaskIds.length > 0 && (
        <div className='flex items-center justify-between bg-blue-500/10 border border-blue-500/25 text-blue-600 dark:text-blue-400 px-4 py-2.5 shrink-0 text-xs font-medium'>
          <div className='flex items-center gap-2.5'>
            <div className='h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse' />
            <span className='font-semibold'>{selectedTaskIds.length} tasks selected</span>
          </div>
          <div className='flex items-center gap-2'>
            <Select
              onValueChange={(val) => massUpdateStatusMutation.mutate(val)}
              disabled={massUpdateStatusMutation.isPending}
            >
              <SelectTrigger className='h-8 text-xs bg-background w-[170px] font-medium'>
                <SelectValue placeholder='Update Status' />
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
              className='h-8 text-xs text-muted-foreground hover:text-foreground cursor-pointer'
              onClick={() => setSelectedTaskIds([])}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Split: Left Filter, Right Table */}
      <div className='flex flex-1 overflow-hidden'>
        {/* Left Filter Sidebar */}
        <div className='w-[240px] shrink-0 border-r border-border/60 bg-background overflow-y-auto flex flex-col'>
          <div className='p-3 border-b border-border/50 flex items-center justify-between'>
            <h2 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5'>
              <Filter className='h-3.5 w-3.5' /> Filters
            </h2>
            <button
              onClick={handleClear}
              className='text-[11px] text-muted-foreground hover:text-foreground transition-colors'
            >
              Reset
            </button>
          </div>

          <div className='p-3 space-y-3 flex-1 overflow-y-auto'>
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
                onValueChange={(val) =>
                  handleFilterChange('callBackStatus', val)
                }
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

            {/* Assigned Date Range Filter */}
            <div className='space-y-2'>
              <Label className='text-xs font-semibold'>
                Assigned Task Filter
              </Label>
              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <Label className='text-[11px] text-muted-foreground'>
                    From Date
                  </Label>
                  <Input
                    type='date'
                    value={filters.assignedFromDate}
                    onChange={(e) =>
                      handleFilterChange('assignedFromDate', e.target.value)
                    }
                    className='h-8 text-xs bg-background'
                  />
                </div>
                <div>
                  <Label className='text-[11px] text-muted-foreground'>
                    To Date
                  </Label>
                  <Input
                    type='date'
                    value={filters.assignedToDate}
                    onChange={(e) =>
                      handleFilterChange('assignedToDate', e.target.value)
                    }
                    className='h-8 text-xs bg-background'
                  />
                </div>
              </div>
            </div>

            {/* Created Date Range Filter */}
            <div className='space-y-2'>
              <Label className='text-xs font-semibold'>
                Created Task Filter
              </Label>
              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <Label className='text-[11px] text-muted-foreground'>
                    From Date
                  </Label>
                  <Input
                    type='date'
                    value={filters.createdFromDate}
                    onChange={(e) =>
                      handleFilterChange('createdFromDate', e.target.value)
                    }
                    className='h-8 text-xs bg-background'
                  />
                </div>
                <div>
                  <Label className='text-[11px] text-muted-foreground'>
                    To Date
                  </Label>
                  <Input
                    type='date'
                    value={filters.createdToDate}
                    onChange={(e) =>
                      handleFilterChange('createdToDate', e.target.value)
                    }
                    className='h-8 text-xs bg-background'
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Filter Actions */}
          <div className='p-3 border-t border-border/60 bg-background shrink-0 space-y-1.5'>
            <Button className='w-full h-8 text-xs cursor-pointer' onClick={handleSearch}>
              Apply Filters
            </Button>
            <Button variant='ghost' className='w-full h-8 text-xs cursor-pointer text-muted-foreground hover:text-foreground' onClick={handleClear}>
              Clear All
            </Button>
          </div>
        </div>

        {/* Right Main Table & Pagination */}
        <div className='flex flex-col flex-1 overflow-hidden'>
          {isLoading ? (
            <div className='flex items-center justify-center flex-1 border-l border-border/60'>
              <Spinner className='h-7 w-7 text-muted-foreground' />
            </div>
          ) : (
            <>
              <div className='flex-1 overflow-auto'>
                <table className='w-full caption-bottom text-sm'>
                  <thead>
                    <tr className='sticky top-0 z-10 bg-muted/40 hover:bg-muted/50 border-b border-border/60'>
                      <th className='h-10 px-3 text-left align-middle w-10'>
                        <input
                          type='checkbox'
                          checked={isAllSelected}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className='h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer'
                          title='Select all tasks created by you'
                        />
                      </th>
                      <th className='h-10 px-3 text-left align-middle font-medium text-muted-foreground text-xs whitespace-nowrap'>
                        Module Name
                      </th>
                      <th className='h-10 px-3 text-left align-middle font-medium text-muted-foreground text-xs whitespace-nowrap'>
                        Account Name
                      </th>
                      <th className='h-10 px-3 text-left align-middle font-medium text-muted-foreground text-xs whitespace-nowrap'>
                        Account Owner
                      </th>
                      <th className='h-10 px-3 text-left align-middle font-medium text-muted-foreground text-xs whitespace-nowrap'>
                        Task Type
                      </th>
                      <th className='h-10 px-3 text-left align-middle font-medium text-muted-foreground text-xs whitespace-nowrap'>
                        Account Status
                      </th>
                      <th className='h-10 px-3 text-left align-middle font-medium text-muted-foreground text-xs whitespace-nowrap'>
                        Account Stage
                      </th>
                      <th className='h-10 px-3 text-left align-middle font-semibold text-foreground text-xs whitespace-nowrap min-w-[150px]'>
                        Call Back Date/Time
                      </th>
                      <th className='h-10 px-3 text-left align-middle font-medium text-muted-foreground text-xs whitespace-nowrap min-w-[200px]'>
                        Task Description
                      </th>
                      <th className='h-10 px-3 text-left align-middle font-semibold text-foreground text-xs whitespace-nowrap min-w-[150px]'>
                        Created At
                      </th>
                      <th className='h-10 px-3 text-left align-middle font-semibold text-foreground text-xs whitespace-nowrap min-w-[150px]'>
                        Assigned Date/Time
                      </th>
                      <th className='h-10 px-3 text-left align-middle font-semibold text-foreground text-xs whitespace-nowrap min-w-[150px]'>
                        Due Date/Time
                      </th>
                      <th className='h-10 px-3 text-left align-middle font-medium text-muted-foreground text-xs whitespace-nowrap'>
                        Task Status
                      </th>
                      <th className='h-10 px-3 text-right align-middle font-medium text-muted-foreground text-xs whitespace-nowrap'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.length === 0 ? (
                      <tr>
                        <td
                          colSpan={14}
                          className='text-center py-12 text-muted-foreground text-sm'
                        >
                          No account tasks found matching your filter
                          parameters.
                        </td>
                      </tr>
                    ) : (
                      tasks.map((task) => {
                        const canSelect = isCreatorOrAdmin(task);
                        const isSelected = selectedTaskIds.includes(task.id);
                        const isOverdue =
                          task.task_status === 'Overdue' ||
                          (task.task_due_date_time &&
                            task.task_assigned_date_time &&
                            new Date(task.task_due_date_time) <
                              new Date(task.task_assigned_date_time) &&
                            !['Completed', 'Verified'].includes(
                              task.task_status,
                            )) ||
                          (task.task_due_date_time &&
                            new Date(task.task_due_date_time) < new Date() &&
                            !['Completed', 'Verified'].includes(
                              task.task_status,
                            ));

                        const isAccOwner = Boolean(
                          (task.account_owner_id &&
                            String(task.account_owner_id) ===
                              String(currentUserId)) ||
                          (task.assigned_to_id &&
                            String(task.assigned_to_id) ===
                              String(currentUserId)) ||
                          (task.created_by_id &&
                            String(task.created_by_id) ===
                              String(currentUserId)) ||
                          ['super_admin', 'admin', 'manager'].includes(role),
                        );

                        return (
                          <tr
                            key={task.id}
                            className={
                              isOverdue
                                ? 'border-b border-border/50 transition-colors cursor-pointer bg-red-500/5 hover:bg-red-500/10 dark:bg-red-900/10 dark:hover:bg-red-900/20'
                                : isSelected
                                ? 'border-b border-border/50 transition-colors cursor-pointer bg-blue-500/5 dark:bg-blue-500/8'
                                : 'border-b border-border/50 transition-colors cursor-pointer hover:bg-muted/40'
                            }
                            onClick={() => {
                              setSelectedTaskId(task.id);
                              setIsUpdateModalOpen(true);
                            }}
                          >
                            <td
                              className='px-3 py-2.5 w-10'
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type='checkbox'
                                checked={isSelected}
                                disabled={!canSelect}
                                onChange={(e) =>
                                  handleSelectTask(task.id, e.target.checked)
                                }
                                className='h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed accent-primary'
                                title={
                                  canSelect
                                    ? 'Select task for mass update'
                                    : 'Only tasks you created can be selected'
                                }
                              />
                            </td>
                            <td className='px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap'>
                              {task.module_name || 'Account'}
                            </td>
                            <td className='px-3 py-2.5 whitespace-nowrap'>
                              <span className='text-sm font-medium text-primary hover:underline'>
                                {task.account_name || `Account #${task.account_id}`}
                              </span>
                            </td>
                            <td className='px-3 py-2.5 text-xs text-foreground whitespace-nowrap'>
                              {task.account_owner || <span className='text-muted-foreground'>—</span>}
                            </td>
                            <td className='px-3 py-2.5 whitespace-nowrap'>
                              <span className='inline-flex items-center rounded-md bg-secondary text-secondary-foreground border border-border/60 px-2 py-0.5 text-[11px] font-medium'>
                                {task.task_type}
                              </span>
                            </td>
                            <td className='px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap'>
                              {task.account_status || <span className='text-muted-foreground/50'>—</span>}
                            </td>
                            <td className='px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap'>
                              {task.account_stage || <span className='text-muted-foreground/50'>—</span>}
                            </td>
                            <td className='px-3 py-2.5 whitespace-nowrap'>
                              {getCallBackBadge(task.call_back_date_status)}
                            </td>
                            <td
                              className='px-3 py-2.5 text-xs text-foreground max-w-[220px] truncate'
                              title={task.task_description}
                            >
                              {task.task_description || (
                                <span className='text-muted-foreground/50 italic'>
                                  No description
                                </span>
                              )}
                            </td>
                            <td className='px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap tabular-nums'>
                              {formatISTDateTime(task.created_at)}
                            </td>
                            <td className='px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap tabular-nums'>
                              {formatISTDateTime(task.task_assigned_date_time)}
                            </td>
                            <td className={`px-3 py-2.5 text-xs whitespace-nowrap tabular-nums font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-foreground'}`}>
                              {formatISTDateTime(task.task_due_date_time)}
                            </td>
                            <td className='px-3 py-2.5 whitespace-nowrap'>
                              <div className='flex items-center gap-1.5'>
                                {getStatusBadge(
                                  isOverdue
                                    ? 'Overdue'
                                    : (task.task_status as TaskStatus),
                                )}
                                {task.task_status !== 'Completed' &&
                                  task.task_status !== 'Verified' &&
                                  isAccOwner && (
                                    <button
                                      className='inline-flex items-center gap-1 rounded-md border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 px-2 py-0.5 text-[11px] font-medium transition-colors'
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        quickCompleteMutation.mutate(task.id);
                                      }}
                                      disabled={quickCompleteMutation.isPending}
                                      title='Mark as Completed'
                                    >
                                      <CheckCircle2 className='h-3 w-3' />
                                      Done
                                    </button>
                                  )}
                              </div>
                            </td>
                            <td
                              className='px-3 py-2.5 text-right whitespace-nowrap'
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                className='inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors'
                                onClick={() => {
                                  setSelectedTaskId(task.id);
                                  setIsUpdateModalOpen(true);
                                }}
                              >
                                <Pencil className='h-3.5 w-3.5' />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pageInfo && pageInfo.total_pages > 1 && (
                <div className='px-4 py-2 border-t border-border/60 shrink-0 bg-background'>
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
          setIsUpdateModalOpen(false);
          setSelectedTaskId(null);
        }}
      />
    </div>
  );
}
