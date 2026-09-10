import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ENV, USERS_MAP } from '@/conf';
import type {
  TaskType,
  TaskStatus,
  TargetAccountStatus,
} from '@/types/account-task';
import {
  Building2,
  MessageSquare,
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  History,
} from 'lucide-react';
import DateField from '../shared/date-field';
import { useAuth } from '@/context/auth-context';
import usersData from '@/utils/users.json';

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'N/A';
  const dt = new Date(dateStr);
  if (isNaN(dt.getTime())) return dateStr;
  return dt.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function getOverdueDetails(callBackDateTimeStr?: string | null) {
  if (!callBackDateTimeStr) {
    return {
      isOverdue: false,
      hasDate: false,
      days: 0,
      hours: 0,
      label: 'No Call Back Date Set',
      badgeClass:
        'bg-muted text-muted-foreground border-border dark:bg-muted/50',
    };
  }
  const callBackDate = new Date(callBackDateTimeStr);
  if (isNaN(callBackDate.getTime())) {
    return {
      isOverdue: false,
      hasDate: false,
      days: 0,
      hours: 0,
      label: 'Invalid Date',
      badgeClass:
        'bg-muted text-muted-foreground border-border dark:bg-muted/50',
    };
  }
  const now = new Date();
  const diffMs = now.getTime() - callBackDate.getTime();

  if (diffMs > 0) {
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    let label = '';
    if (days > 0) {
      label = `${days} day${days > 1 ? 's' : ''}${hours > 0 ? ` ${hours} hr${hours > 1 ? 's' : ''}` : ''} overdue`;
    } else if (hours > 0) {
      label = `${hours} hr${hours > 1 ? 's' : ''} overdue`;
    } else {
      label = `${minutes} min overdue`;
    }

    return {
      isOverdue: true,
      hasDate: true,
      days,
      hours,
      label,
      badgeClass:
        'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800',
    };
  } else {
    const futureMs = callBackDate.getTime() - now.getTime();
    const futureDays = Math.floor(futureMs / (1000 * 60 * 60 * 24));
    const futureHours = Math.floor(
      (futureMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );

    let label = '';
    if (futureDays > 0) {
      label = `Due in ${futureDays} day${futureDays > 1 ? 's' : ''}`;
    } else if (futureHours > 0) {
      label = `Due in ${futureHours} hr${futureHours > 1 ? 's' : ''}`;
    } else {
      label = 'Due now';
    }

    return {
      isOverdue: false,
      hasDate: true,
      days: 0,
      hours: 0,
      label,
      badgeClass:
        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    };
  }
}

function getContactEstablishedAudit(accountData?: any) {
  if (!accountData) {
    return {
      isCurrent: false,
      hasStayed: false,
      currentStatus: 'N/A',
      stayedDuration: '0d',
      stepsCount: 0,
      steps: [] as any[],
      journey: [] as any[],
    };
  }

  const currentStatus = String(accountData.account_status || '').trim();
  const isCurrent = currentStatus.toLowerCase() === 'contact established';

  const journey: any[] =
    accountData.status_journey || accountData.journey || [];

  const matchedSteps = journey.filter(
    (s: any) =>
      String(s?.name || '')
        .toLowerCase()
        .trim() === 'contact established',
  );

  const hasStayed = matchedSteps.length > 0;

  // Aggregate duration across all Contact Established steps
  let totalMinutes = 0;
  matchedSteps.forEach((s: any) => {
    if (s.duration) {
      const dayMatch = String(s.duration).match(/(\d+)\s*d/i);
      const hourMatch = String(s.duration).match(/(\d+)\s*h/i);
      const minMatch = String(s.duration).match(/(\d+)\s*m/i);
      let mins = 0;
      if (dayMatch) mins += parseInt(dayMatch[1], 10) * 24 * 60;
      if (hourMatch) mins += parseInt(hourMatch[1], 10) * 60;
      if (minMatch) mins += parseInt(minMatch[1], 10);
      totalMinutes += mins > 0 ? mins : 0;
    }
  });

  let formattedDuration = '';
  if (totalMinutes >= 1440) {
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    formattedDuration = hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  } else if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    formattedDuration = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  } else if (totalMinutes > 0) {
    formattedDuration = `${totalMinutes}m`;
  } else if (matchedSteps.length > 0) {
    formattedDuration = matchedSteps
      .map((s: any) => s.duration)
      .filter(Boolean)
      .join(', ');
  } else if (isCurrent) {
    formattedDuration = 'Current';
  } else {
    formattedDuration = '0d';
  }

  return {
    isCurrent,
    hasStayed,
    currentStatus,
    stayedDuration: formattedDuration || '0d',
    stepsCount: matchedSteps.length,
    steps: matchedSteps,
    journey,
  };
}

interface CreateAccountTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  fixedAccountId?: string | number;
  fixedAccountName?: string;
}

export default function CreateAccountTaskModal({
  isOpen,
  onClose,
  fixedAccountId,
  fixedAccountName,
}: CreateAccountTaskModalProps) {
  const queryClient = useQueryClient();

  const [accountId, setAccountId] = useState<string | number | undefined>(
    fixedAccountId,
  );
  const [accountSearch, setAccountSearch] = useState<string>(
    fixedAccountName || '',
  );
  const [selectedAccountName, setSelectedAccountName] = useState<string>(
    fixedAccountName || '',
  );
  const [taskType, setTaskType] = useState<TaskType>('Call');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('Unassigned');
  const [targetAccountStatus, setTargetAccountStatus] =
    useState<TargetAccountStatus>('Awareness');
  const [targetCallBackDateTime, setTargetCallBackDateTime] = useState<Date>();
  const [taskDescription, setTaskDescription] = useState('');
  const [taskAssignedDateTime, setTaskAssignedDateTime] = useState('');
  const [taskDueDateTime, setTaskDueDateTime] = useState('');
  const [isSearchingAccount, setIsSearchingAccount] = useState(false);

  const toLocalISOString = (dateInput?: string | Date | null) => {
    if (!dateInput) return '';
    const dt = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(dt.getTime())) return '';
    const offset = dt.getTimezoneOffset() * 60000;
    return new Date(dt.getTime() - offset).toISOString().slice(0, 16);
  };

  const { user } = useAuth();

  const rawRole = String(user?.role || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');
  const isAdminOrSuperAdmin =
    ['super_admin', 'superadmin', 'admin'].includes(rawRole) ||
    rawRole.includes('admin') ||
    rawRole.includes('super_admin');

  useEffect(() => {
    if (fixedAccountId) {
      setAccountId(fixedAccountId);
    }
    if (fixedAccountName) {
      setAccountSearch(fixedAccountName);
      setSelectedAccountName(fixedAccountName);
    }
  }, [fixedAccountId, fixedAccountName]);

  // Query accounts for dropdown if not fixed
  const { data: accountSearchResults } = useQuery({
    queryKey: ['account-search', accountSearch],
    queryFn: async () => {
      if (!accountSearch || fixedAccountId) return [];
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/accounts?account_name=${encodeURIComponent(accountSearch)}&page_size=10`,
        { credentials: 'include' },
      );
      if (!res.ok) return [];
      const data = await res.json();
      return data.data || [];
    },
    enabled: !fixedAccountId && accountSearch.length > 1 && isSearchingAccount,
  });

  // Query account details when an account is selected
  const { data: selectedAccountDetails } = useQuery({
    queryKey: ['account-details-for-task', accountId],
    queryFn: async () => {
      if (!accountId) return null;
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/accounts?account_id=${accountId}`,
        { credentials: 'include' },
      );
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!accountId && isOpen,
    staleTime: 0,
  });

  const accountData = selectedAccountDetails?.data?.[0];
  const rawBusinessStatus = accountData?.business_status;
  const isBusinessStatusActive = Boolean(
    rawBusinessStatus === true ||
    String(rawBusinessStatus).toLowerCase() === 'true' ||
    String(rawBusinessStatus).toLowerCase() === 'active' ||
    (rawBusinessStatus &&
      String(rawBusinessStatus).trim() !== '' &&
      String(rawBusinessStatus).toLowerCase() !== 'inactive'),
  );
  const overdueInfo = getOverdueDetails(accountData?.call_back_date_time);
  const contactAudit = getContactEstablishedAudit(accountData);

  // Query notes for selected account
  const { data: accountCreateNotes } = useQuery({
    queryKey: ['account-create-notes', accountId],
    queryFn: async () => {
      if (!accountId) return [];
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/notes/${accountId}`,
        { credentials: 'include' },
      );
      if (!res.ok) return [];
      const data = await res.json();
      return data.data || [];
    },
    enabled: !!accountId && isOpen,
  });

  const lastAccountNote =
    accountCreateNotes && accountCreateNotes.length > 0
      ? [...accountCreateNotes].sort(
          (a: any, b: any) =>
            new Date(
              b.Created_Time || b.Created_time || b.created_at || 0,
            ).getTime() -
            new Date(
              a.Created_Time || a.Created_time || a.created_at || 0,
            ).getTime(),
        )[0]
      : null;

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!accountId) {
        throw new Error('Please select an Account');
      }
      const payload = {
        module_name: 'Account',
        account_id: accountId,
        task_type: taskType,
        task_status: taskStatus,
        task_description: taskDescription,
        target_account_status: targetAccountStatus,
        target_call_back_date_time: targetCallBackDateTime
          ? targetCallBackDateTime.toISOString()
          : null,
        task_assigned_date_time:
          taskStatus === 'Assigned' && !taskAssignedDateTime
            ? new Date().toISOString()
            : taskStatus === 'Unassigned'
              ? null
              : taskAssignedDateTime
                ? new Date(taskAssignedDateTime).toISOString()
                : null,
        task_due_date_time: taskDueDateTime
          ? new Date(taskDueDateTime).toISOString()
          : null,
      };

      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/account-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to create account task');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Account Task created successfully!');
      queryClient.invalidateQueries({ queryKey: ['account-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['account-tasks-list'] });
      onClose();
      resetForm();
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error creating task');
    },
  });

  const resetForm = () => {
    if (!fixedAccountId) {
      setAccountId(undefined);
      setAccountSearch('');
      setSelectedAccountName('');
    }
    setTaskType('Call');
    setTaskStatus('Unassigned');
    setTaskDescription('');
    setTaskAssignedDateTime('');
    setTaskDueDateTime('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  function renderMentions(text: string) {
    return text.replace(/crm\[user#([^\]]+)\]crm/g, (_, userId) => {
      const userName = (usersData as Record<string, string>)[userId];
      return userName ? `@${userName}` : '@Unknown User';
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-150 max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Create Account Task</DialogTitle>
        </DialogHeader>

        {/* Selected Account Readonly Details Panel */}
        {accountId && accountData && (
          <div className='bg-linear-to-br from-card via-muted/30 to-muted/50 p-3.5 rounded-xl border shadow-xs space-y-3 mt-2'>
            <div className='flex items-center justify-between border-b border-border/60 pb-2'>
              <div className='flex items-center gap-2'>
                <Building2 className='w-4 h-4 text-primary' />
                <span className='font-semibold text-xs uppercase tracking-wider text-muted-foreground'>
                  Account Information
                </span>
              </div>
              <div className='flex items-center gap-1.5 flex-wrap'>
                <Badge
                  variant='outline'
                  className='text-[10px] font-mono bg-background/80'
                >
                  Record #{accountData.id || accountId}
                </Badge>
                <Badge variant='secondary' className='text-[10px] font-mono'>
                  Module: Account
                </Badge>
              </div>
            </div>

            <div className='grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs'>
              <div>
                <span className='text-muted-foreground text-[11px] font-medium block'>
                  Account Name
                </span>
                <span
                  className='font-semibold text-foreground truncate block'
                  title={accountData.account_name}
                >
                  {accountData.account_name || selectedAccountName || 'N/A'}
                </span>
              </div>

              <div>
                <span className='text-muted-foreground text-[11px] font-medium block'>
                  Account Owner
                </span>
                <span className='font-semibold text-foreground truncate block'>
                  {accountData.owner?.full_name ||
                    // USERS_MAP[selectedAccountDetails.account_owner_id] ||
                    'Unassigned'}
                </span>
              </div>

              <div>
                <span className='text-muted-foreground text-[11px] font-medium block'>
                  Account Status
                </span>
                <Badge
                  variant='outline'
                  className='mt-0.5 text-[10px] font-medium bg-blue-50/60 text-blue-700 border-blue-200'
                >
                  {accountData.account_status || 'N/A'}
                </Badge>
              </div>

              <div>
                <span className='text-muted-foreground text-[11px] font-medium block'>
                  Account Assigned Date & Time
                </span>
                <span className='font-medium text-foreground/90 truncate block'>
                  {formatDate(accountData.assignment_date) || 'N/A'}
                </span>
              </div>

              <div>
                <span className='text-muted-foreground text-[11px] font-medium block'>
                  Call Back Date
                </span>
                <span className='font-medium text-foreground/90 truncate block'>
                  {formatDate(accountData.call_back_date_time) || 'N/A'}
                </span>
              </div>
            </div>

            {/* Last Account Note Section */}
            <div className='mt-2.5 pt-2.5 border-t border-border/60 bg-background/90 p-2.5 rounded-lg border space-y-1.5'>
              <div className='flex items-center justify-between text-[11px] text-muted-foreground'>
                <span className='font-semibold flex items-center gap-1.5 text-foreground'>
                  <MessageSquare className='w-3.5 h-3.5 text-primary' /> Last
                  Account Note
                  {lastAccountNote?.Owner?.first_name ||
                  lastAccountNote?.Created_By?.name ? (
                    <span className='font-normal text-muted-foreground'>
                      by{' '}
                      {lastAccountNote?.Owner?.first_name ||
                        lastAccountNote?.Created_By?.name}
                    </span>
                  ) : null}
                </span>
                <span className='font-mono text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20'>
                  {lastAccountNote?.Created_Time ||
                    lastAccountNote?.Modified_Time ||
                    'Date N/A'}
                </span>
              </div>
              <p className='text-xs text-foreground/90 line-clamp-3 italic bg-muted/20 p-2 rounded border border-muted/40'>
                {renderMentions(lastAccountNote?.Note_Content || '')}
              </p>
            </div>
          </div>
        )}

        {/* Audit View Panel (Visible only for Admin & Super Admin when account business_status is true/active) */}
        {accountId &&
          accountData &&
          isAdminOrSuperAdmin &&
          isBusinessStatusActive && (
            <div className='bg-linear-to-br from-card via-muted/30 to-muted/50 p-3.5 rounded-xl border shadow-xs space-y-3 mt-2'>
              <div className='flex items-center justify-between border-b border-border/60 pb-2'>
                <div className='flex items-center gap-2'>
                  <ShieldAlert className='w-4 h-4 text-blue-500' />
                  <span className='font-semibold text-xs uppercase tracking-wider'>
                    Audit View
                  </span>
                </div>
                <div className='flex items-center gap-1.5 flex-wrap'>
                  <Badge variant='outline' className='text-[10px] font-medium '>
                    Admin / Super Admin
                  </Badge>
                  <Badge variant='outline' className='text-[10px] font-medium '>
                    Business Status: {String(rawBusinessStatus || 'Active')}
                  </Badge>
                </div>
              </div>

              <div className='grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs'>
                <div>
                  <span className='text-muted-foreground text-[11px] font-medium block'>
                    Call Back Date & Time
                  </span>
                  <span className='font-semibold text-foreground truncate block'>
                    {formatDate(accountData.call_back_date_time)}
                  </span>
                </div>

                <div>
                  <span className='text-muted-foreground text-[11px] font-medium block'>
                    Overdue Status
                  </span>
                  {overdueInfo.isOverdue ? (
                    <Badge
                      variant='outline'
                      className={`mt-0.5 text-[10px] font-semibold gap-1 flex items-center w-fit ${overdueInfo.badgeClass}`}
                    >
                      <AlertTriangle className='w-3 h-3 text-red-600' />
                      {overdueInfo.days > 0
                        ? `${overdueInfo.days} Day${overdueInfo.days > 1 ? 's' : ''} Overdue`
                        : overdueInfo.label}
                    </Badge>
                  ) : (
                    <Badge
                      variant='outline'
                      className={`mt-0.5 text-[10px] font-medium flex items-center w-fit ${overdueInfo.badgeClass}`}
                    >
                      <Clock className='w-3 h-3 mr-1' />
                      {overdueInfo.label}
                    </Badge>
                  )}
                </div>

                <div>
                  <span className='text-muted-foreground text-[11px] font-medium block'>
                    Days Overdue
                  </span>
                  <span
                    className={`font-semibold truncate block ${
                      overdueInfo.isOverdue
                        ? 'text-red-600 dark:text-red-400 font-bold'
                        : 'text-foreground/80'
                    }`}
                  >
                    {overdueInfo.isOverdue
                      ? `${overdueInfo.days} day${overdueInfo.days === 1 ? '' : 's'} overdue`
                      : overdueInfo.hasDate
                        ? '0 days (Not Overdue)'
                        : 'N/A'}
                  </span>
                </div>

                <div>
                  <span className='text-muted-foreground text-[11px] font-medium block'>
                    Contact Established
                  </span>
                  {contactAudit.isCurrent ? (
                    <div className='space-y-0.5 mt-0.5'>
                      <Badge
                        variant='outline'
                        className='text-[10px] font-semibold bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700 flex items-center w-fit'
                      >
                        <CheckCircle2 className='w-3 h-3 text-emerald-600 mr-1' />
                        Current Status
                      </Badge>
                      <span className='text-[11px] text-emerald-700 dark:text-emerald-400 font-medium block'>
                        Active now ({contactAudit.stayedDuration})
                      </span>
                    </div>
                  ) : contactAudit.hasStayed ? (
                    <div className='space-y-0.5 mt-0.5'>
                      <Badge
                        variant='outline'
                        className='text-[10px] font-semibold bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-700 flex items-center w-fit'
                      >
                        <History className='w-3 h-3 text-blue-600 mr-1' />
                        Previously Stayed
                      </Badge>
                      <span className='text-[11px] text-blue-700 dark:text-blue-400 font-medium block'>
                        Stayed: {contactAudit.stayedDuration}
                      </span>
                    </div>
                  ) : (
                    <div className='space-y-0.5 mt-0.5'>
                      <Badge
                        variant='outline'
                        className='text-[10px] font-medium bg-muted/60 text-muted-foreground border-border flex items-center w-fit'
                      >
                        <XCircle className='w-3 h-3 text-muted-foreground mr-1' />
                        Never Stayed
                      </Badge>
                      <span className='text-[11px] text-muted-foreground block truncate'>
                        Current: {accountData.account_status || 'N/A'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Journey History Timeline */}
              <div className='mt-2.5 pt-2.5 border-t border-border/60 space-y-1.5'>
                <div className='flex items-center justify-between text-[11px] text-muted-foreground'>
                  <span className='font-semibold flex items-center gap-1.5 text-foreground'>
                    <History className='w-3.5 h-3.5 text-blue-500' /> Status
                    Journey History
                  </span>
                  <span>
                    Current Status:{' '}
                    <strong className='text-foreground font-semibold'>
                      {accountData.account_status || 'N/A'}
                    </strong>
                  </span>
                </div>

                {contactAudit.journey && contactAudit.journey.length > 0 ? (
                  <div className='flex items-center gap-1.5 flex-wrap pt-0.5'>
                    {contactAudit.journey.map((step: any, idx: number) => {
                      const isCE =
                        String(step.name || '')
                          .toLowerCase()
                          .trim() === 'contact established';
                      return (
                        <div
                          key={idx}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs border ${
                            isCE
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-700 font-semibold ring-1 ring-emerald-400/50'
                              : 'bg-muted/40 text-foreground/80 border-border/70 font-medium'
                          }`}
                          title={`${step.name} (${step.duration || 'N/A'})${
                            step.startDate
                              ? ` | ${step.startDate} - ${step.endDate || 'Present'}`
                              : ''
                          }${step.updatedBy ? ` | by ${step.updatedBy}` : ''}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isCE ? 'bg-emerald-500' : 'bg-muted-foreground/60'
                            }`}
                          />
                          <span>{step.name}</span>
                          <span className='text-[10px] font-mono opacity-80'>
                            · {step.duration || 'N/A'}
                          </span>
                          {idx < contactAudit.journey.length - 1 && (
                            <span className='text-muted-foreground/40 ml-1'>
                              →
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className='text-xs text-muted-foreground italic'>
                    No status journey recorded for this account.
                  </p>
                )}
              </div>
            </div>
          )}

        <div className='bg-linear-to-br from-card via-muted/30 to-muted/50 p-3.5 rounded-xl border shadow-xs space-y-3 mt-2'>
          <div className='text-lg font-semibold'>Account Task Information</div>
          <form onSubmit={handleSubmit} className='space-y-4 py-2'>
            {/* Module Name & Account Selection in 2 Columns */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <Label className='text-xs font-medium'>Module Name</Label>
                <Input
                  value='Account'
                  disabled
                  className='h-9 text-xs bg-muted'
                />
              </div>

              <div className='space-y-1.5 relative'>
                <Label className='text-xs font-medium'>Account Name *</Label>
                {fixedAccountId ? (
                  <Input
                    value={fixedAccountName || `Account #${fixedAccountId}`}
                    disabled
                    className='h-9 text-xs bg-muted'
                    required={true}
                  />
                ) : (
                  <div className='relative'>
                    <Input
                      placeholder='Search Account Name...'
                      value={accountSearch}
                      onChange={(e) => {
                        setAccountSearch(e.target.value);
                        setIsSearchingAccount(true);
                        setAccountId(undefined);
                        setSelectedAccountName('');
                      }}
                      onFocus={() => setIsSearchingAccount(true)}
                      className='h-9 text-xs'
                    />
                    {selectedAccountName && (
                      <span className='text-[11px] text-green-600 block mt-1 font-medium'>
                        Selected: {selectedAccountName}
                      </span>
                    )}
                    {isSearchingAccount &&
                      accountSearchResults &&
                      accountSearchResults.length > 0 && (
                        <div className='absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto'>
                          {accountSearchResults.map((acc: any) => (
                            <div
                              key={acc.id}
                              className='p-2 text-xs hover:bg-accent cursor-pointer border-b last:border-0'
                              onClick={() => {
                                setAccountId(acc.id);
                                setSelectedAccountName(
                                  acc.account_name || `Account #${acc.id}`,
                                );
                                setAccountSearch(
                                  acc.account_name || `Account #${acc.id}`,
                                );
                                setIsSearchingAccount(false);
                              }}
                            >
                              <div className='font-medium text-foreground'>
                                {acc.account_name || 'Unnamed Account'}
                              </div>
                              <div className='text-[11px] text-muted-foreground'>
                                Status: {acc.account_status || 'N/A'} | Stage:{' '}
                                {acc.account_stage || 'N/A'}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>

            {/* Task Type & Task Status in 2 Columns */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <Label className='text-xs font-medium'>Task Type *</Label>
                <Select
                  value={taskType}
                  onValueChange={(val: TaskType) => setTaskType(val)}
                >
                  <SelectTrigger className='h-9 text-xs'>
                    <SelectValue placeholder='Select Task Type' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Call'>Call</SelectItem>
                    <SelectItem value='Update Record'>Update Record</SelectItem>
                    <SelectItem value='Email'>Email</SelectItem>
                    <SelectItem value='Move Status'>Move Status</SelectItem>
                    <SelectItem value='Visit'>Visit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-1.5'>
                <Label className='text-xs font-medium'>Task Status *</Label>
                <Select
                  value={taskStatus}
                  onValueChange={(val: TaskStatus) => {
                    setTaskStatus(val);
                    if (val === 'Assigned') {
                      if (!taskAssignedDateTime) {
                        setTaskAssignedDateTime(toLocalISOString(new Date()));
                      }
                    } else if (val === 'Unassigned') {
                      setTaskAssignedDateTime('');
                    }
                  }}
                >
                  <SelectTrigger className='h-9 text-xs'>
                    <SelectValue placeholder='Select Task Status' />
                  </SelectTrigger>
                  <SelectContent>
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

              <div className='space-y-1.5'>
                <Label className='text-xs font-medium'>
                  Targeted Account Status *
                </Label>
                <Select
                  value={targetAccountStatus}
                  onValueChange={(val: TargetAccountStatus) =>
                    setTargetAccountStatus(val)
                  }
                >
                  <SelectTrigger className='h-9 text-xs'>
                    <SelectValue placeholder='Select Task Status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Yet to be dialed'>
                      Yet to be dialed
                    </SelectItem>
                    <SelectItem value='Wrong Number'>Wrong Number</SelectItem>
                    <SelectItem value='Contact Established'>
                      Contact Established
                    </SelectItem>
                    <SelectItem value='Contact Not Established'>
                      Contact Not Established
                    </SelectItem>
                    <SelectItem value='Awareness'>Awareness</SelectItem>
                    <SelectItem value='Attention'>Attention</SelectItem>
                    <SelectItem value='Assessment'>Assessment</SelectItem>
                    <SelectItem value='Lender Review'>Lender Review</SelectItem>
                    <SelectItem value='On Hold'>On Hold</SelectItem>
                    <SelectItem value='business closed'>Business Closed</SelectItem>
                    <SelectItem value='Not Interested'>
                      Not Interested
                    </SelectItem>
                    <SelectItem value='Location Unserviceable'>
                      Location Unserviceable
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-1.5'>
                <Label className='text-xs font-medium'>
                  Targeted Call Back Date & Time
                </Label>
                <DateField
                  value={targetCallBackDateTime}
                  isEdit={true}
                  showTime={true}
                  disablePast={true}
                  maxDate={
                    targetAccountStatus === 'On Hold'
                      ? undefined
                      : new Date(Date.now() + 48 * 60 * 60 * 1000)
                  }
                  onChange={(d) => setTargetCallBackDateTime(d)}
                />
              </div>
            </div>

            {/* Assigned & Due Dates in 2 Columns */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <Label className='text-xs font-medium'>
                  Assigned Date/Time
                </Label>
                <Input
                  type='datetime-local'
                  value={taskAssignedDateTime}
                  onChange={(e) => setTaskAssignedDateTime(e.target.value)}
                  className='h-9 text-xs'
                />
              </div>

              <div className='space-y-1.5'>
                <Label className='text-xs font-medium'>Due Date/Time</Label>
                <Input
                  type='datetime-local'
                  value={taskDueDateTime}
                  onChange={(e) => setTaskDueDateTime(e.target.value)}
                  className='h-9 text-xs'
                />
              </div>
            </div>

            {/* Task Description */}
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium'>Description</Label>
              <Textarea
                placeholder='Enter task details or description...'
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                rows={3}
                className='text-xs resize-none'
              />
            </div>

            <DialogFooter className='pt-2'>
              <Button
                type='button'
                variant='outline'
                className='h-9 text-xs cursor-pointer'
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type='submit'
                className='h-9 text-xs cursor-pointer'
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
