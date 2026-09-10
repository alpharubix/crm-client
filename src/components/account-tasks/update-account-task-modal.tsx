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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ENV } from '@/conf';
import type {
  AccountTask,
  TaskType,
  TaskStatus,
  TargetAccountStatus,
} from '@/types/account-task';
import {
  MessageSquare,
  Plus,
  Send,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import users from '@/utils/users.json';
import DateField from '../shared/date-field';
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

interface UpdateAccountTaskModalProps {
  taskId: string | number | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function UpdateAccountTaskModal({
  taskId,
  isOpen,
  onClose,
}: UpdateAccountTaskModalProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = String(user?.role || '').toLowerCase();
  const canEditFields = ['super_admin', 'admin', 'manager'].includes(role);

  const [taskType, setTaskType] = useState<TaskType>('Call');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('Unassigned');
  const [targetAccountStatus, setTargetAccountStatus] =
    useState<TargetAccountStatus>('Awareness');
  const [targetCallBackDateTime, setTargetCallBackDateTime] = useState<Date>();
  const [taskDescription, setTaskDescription] = useState('');
  const [taskAssignedDateTime, setTaskAssignedDateTime] = useState('');
  const [taskDueDateTime, setTaskDueDateTime] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Fetch task details
  const { data: taskData, isLoading } = useQuery({
    queryKey: ['account-task-detail', taskId],
    queryFn: async () => {
      if (!taskId) return null;
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/account-tasks/${taskId}`,
        {
          credentials: 'include',
        },
      );
      if (!res.ok) throw new Error('Failed to fetch task details');
      return res.json() as Promise<AccountTask>;
    },
    enabled: !!taskId && isOpen,
  });

  const notesData = (taskData as any)?.notes || [];

  // Query Account notes directly for the Account Information panel
  const accountIdForNotes = taskData?.account_id;
  const { data: accountNotesRes } = useQuery({
    queryKey: ['account-direct-notes', accountIdForNotes],
    queryFn: async () => {
      if (!accountIdForNotes) return [];
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/notes/${accountIdForNotes}`,
        { credentials: 'include' },
      );
      if (!res.ok) return [];
      const data = await res.json();
      return data.data || [];
    },
    enabled: !!accountIdForNotes && isOpen,
  });

  const lastAccountNote =
    accountNotesRes && accountNotesRes.length > 0
      ? [...accountNotesRes].sort(
          (a: any, b: any) =>
            new Date(
              b.Created_Time || b.Created_time || b.created_at || 0,
            ).getTime() -
            new Date(
              a.Created_Time || a.Created_time || a.created_at || 0,
            ).getTime(),
        )[0]
      : null;

  const toLocalISOString = (dateInput?: string | Date | null) => {
    if (!dateInput) return '';
    const dt = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(dt.getTime())) return '';
    const offset = dt.getTimezoneOffset() * 60000;
    return new Date(dt.getTime() - offset).toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (taskData && isOpen) {
      setTaskType(taskData.task_type as TaskType);
      setTaskStatus(taskData.task_status as TaskStatus);
      setTaskDescription(taskData.task_description || '');
      setTargetAccountStatus(
        taskData.target_account_status as TargetAccountStatus,
      );
      if (taskData.target_call_back_date_time) {
        const d = new Date(taskData.target_call_back_date_time);
        setTargetCallBackDateTime(!isNaN(d.getTime()) ? d : undefined);
      } else {
        setTargetCallBackDateTime(undefined);
      }
      setTaskAssignedDateTime(
        toLocalISOString(taskData.task_assigned_date_time),
      );
      setTaskDueDateTime(toLocalISOString(taskData.task_due_date_time));
    }
  }, [taskData, isOpen, taskId]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!taskId) return;
      const payload = {
        task_type: taskType,
        task_status: taskStatus,
        task_description: taskDescription,
        target_account_status: targetAccountStatus,
        target_call_back_date_time: targetCallBackDateTime
          ? new Date(targetCallBackDateTime).toISOString()
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

      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/account-tasks/${taskId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) throw new Error('Failed to update task');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Account Task updated successfully');
      queryClient.invalidateQueries({ queryKey: ['account-tasks'] });
      queryClient.invalidateQueries({
        queryKey: ['account-task-detail', taskId],
      });
      onClose();
    },
    onError: () => {
      toast.error('Failed to update task');
    },
  });

  const markAsCompletedMutation = useMutation({
    mutationFn: async () => {
      if (!taskId) return;
      const payload = {
        task_status: 'Completed',
        target_account_status: targetAccountStatus,
        target_call_back_date_time: targetCallBackDateTime
          ? new Date(targetCallBackDateTime).toISOString()
          : null,
      };
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/account-tasks/${taskId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) throw new Error('Failed to mark task as completed');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Task marked as Completed!');
      queryClient.invalidateQueries({ queryKey: ['account-tasks'] });
      queryClient.invalidateQueries({
        queryKey: ['account-task-detail', taskId],
      });
      onClose();
    },
    onError: () => {
      toast.error('Failed to mark task as completed');
    },
  });

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !taskId) return;
    setIsAddingNote(true);

    try {
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: taskId.toString(),
          note: newNote,
          module: 'Account_Tasks',
        }),
      });

      if (res.ok) {
        toast.success('Note added successfully');
        setNewNote('');
        queryClient.invalidateQueries({
          queryKey: ['account-task-detail', taskId],
        });
      } else {
        toast.error('Failed to add note');
      }
    } catch {
      toast.error('Failed to add note');
    } finally {
      setIsAddingNote(false);
    }
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  const currentUserId =
    user?.user_id || (user as any)?.id || (user as any)?.zuid;
  const isAccountOwner = Boolean(
    taskData?.account_owner_id &&
    String(taskData.account_owner_id) === String(currentUserId),
  );
  const isAssignee = Boolean(
    taskData?.assigned_to_id &&
    String(taskData.assigned_to_id) === String(currentUserId),
  );
  const isAdminOrManager = ['super_admin', 'admin'].includes(role);
  
  const canEditStatus = isAssignee || isAccountOwner || isAdminOrManager;
  const isCompleted = taskData?.task_status === 'Completed';
  const canEditOtherFields =
    (isAdminOrManager);

  const allowedStatuses: TaskStatus[] = isAssignee
    ? ['Pending', 'In Progress', 'Completed', 'Verified']
    : [
        'Unassigned',
        'Assigned',
        'Pending',
        'In Progress',
        'Completed',
        'Verified',
        'Overdue',
      ];

  const statusOptions =
    isAssignee && !allowedStatuses.includes(taskStatus)
      ? [
          { value: taskStatus, disabled: true },
          ...allowedStatuses.map((s) => ({ value: s, disabled: false })),
        ]
      : allowedStatuses.map((s) => ({ value: s, disabled: false }));

  const allowedTargetAccountStatuses: TargetAccountStatus[] = isAssignee
    ? [
        'Yet to be dialed',
        'Wrong Number',
        'Contact Established',
        'Contact Not Established',
        'Awareness',
        'Attention',
        'Assessment',
        'Lender Review',
        'On Hold',
        'Not Interested',
        'Location Unserviceable',
        'business closed'
      ]
    : [
        'Yet to be dialed',
        'Wrong Number',
        'Contact Established',
        'Contact Not Established',
        'Awareness',
        'Attention',
        'Assessment',
        'Lender Review',
        'On Hold',
        'Not Interested',
        'Location Unserviceable',
        'business closed'
      ];

  const targetAccountStatusOptions =
    isAssignee && !allowedTargetAccountStatuses.includes(targetAccountStatus)
      ? [
          { value: targetAccountStatus, disabled: true },
          ...allowedTargetAccountStatuses.map((s) => ({
            value: s,
            disabled: false,
          })),
        ]
      : allowedTargetAccountStatuses.map((s) => ({
          value: s,
          disabled: false,
        }));

  function renderMentions(text: string) {
    return text.replace(/crm\[user#([^\]]+)\]crm/g, (_, userId) => {
      const userName = (usersData as Record<string, string>)[userId];
      return userName ? `@${userName}` : '@Unknown User';
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-[650px] max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center justify-between pr-6'>
            <span>Task #{taskId} Details</span>
            {taskData?.call_back_date_status && (
              <Badge variant='outline' className='text-xs font-normal'>
                Call Back: {taskData.call_back_date_status}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className='py-8 text-center text-muted-foreground'>
            Loading task details...
          </div>
        ) : (
          <Tabs defaultValue='details' className='w-full mt-2'>
            <TabsList className='w-full grid grid-cols-2'>
              <TabsTrigger value='details'>Task Overview & Edit</TabsTrigger>
              <TabsTrigger value='notes'>
                Notes ({notesData?.length || 0})
              </TabsTrigger>
            </TabsList>

            {/* Overview / Edit Tab */}
            <TabsContent value='details' className='pt-3 space-y-4'>
              {/* Linked Account Readonly Summary Panel with 9 Fields */}
              <div className='bg-linear-to-br from-card via-muted/30 to-muted/50 p-3.5 rounded-xl border shadow-xs space-y-3'>
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
                      Record #{taskData?.account_id || 'N/A'}
                    </Badge>
                    <Badge
                      variant='secondary'
                      className='text-[10px] font-mono'
                    >
                      Module: {taskData?.module_name || 'Account'}
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
                      title={taskData?.account_name}
                    >
                      {taskData?.account_name || 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className='text-muted-foreground text-[11px] font-medium block'>
                      Created By
                    </span>
                    <span
                      className='font-semibold text-foreground truncate block'
                      title={taskData?.created_by_id}
                    >
                      {(users as Record<string, string>)[
                        taskData?.created_by_id
                      ] || 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className='text-muted-foreground text-[11px] font-medium block'>
                      Account Owner
                    </span>
                    <span
                      className='font-semibold text-foreground truncate block'
                      title={taskData?.account_owner}
                    >
                      {taskData?.account_owner || 'Unassigned'}
                    </span>
                  </div>

                  <div>
                    <span className='text-muted-foreground text-[11px] font-medium block'>
                      Assigned Date & Time
                    </span>
                    <span
                      className='font-medium text-foreground/90 truncate block'
                      title={formatDate(taskData?.account_assigned_date_time)}
                    >
                      {formatDate(taskData?.account_assigned_date_time)}
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
                      {taskData?.account_status || 'N/A'}
                    </Badge>
                  </div>

                  <div>
                    <span className='text-muted-foreground text-[11px] font-medium block'>
                      Call Back Date
                    </span>
                    <span
                      className='font-medium text-foreground/90 truncate block'
                      title={
                        formatDate(taskData?.call_back_date_time) !== 'N/A'
                          ? formatDate(taskData?.call_back_date_time)
                          : taskData?.call_back_date_status
                      }
                    >
                      {formatDate(taskData?.call_back_date_time) !== 'N/A'
                        ? formatDate(taskData?.call_back_date_time)
                        : taskData?.call_back_date_status || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Last Account Note Section */}
                <div className='mt-2.5 pt-2.5 border-t border-border/60 bg-background/90 p-2.5 rounded-lg border space-y-1.5'>
                  <div className='flex items-center justify-between text-[11px] text-muted-foreground'>
                    <span className='font-semibold flex items-center gap-1.5 text-foreground'>
                      <MessageSquare className='w-3.5 h-3.5 text-primary' />{' '}
                      Last Account Note
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

              <form onSubmit={handleSubmit} className='space-y-4'>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1.5'>
                    <Label className='text-xs font-medium'>Module Name</Label>
                    <Input
                      value='Account'
                      disabled
                      className='h-9 text-xs bg-muted'
                    />
                  </div>

                  <div className='space-y-1.5'>
                    <Label className='text-xs font-medium'>Task Type *</Label>
                    <Select
                      key={`task-type-${taskId}-${taskType}`}
                      value={taskType}
                      onValueChange={(val: TaskType) => setTaskType(val)}
                      disabled={!canEditOtherFields}
                    >
                      <SelectTrigger className='h-9 text-xs'>
                        <SelectValue placeholder='Select Task Type' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='Call'>Call</SelectItem>
                        <SelectItem value='Update Record'>
                          Update Record
                        </SelectItem>
                        <SelectItem value='Email'>Email</SelectItem>
                        <SelectItem value='Move Status'>Move Status</SelectItem>
                        <SelectItem value='Visit'>Visit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1.5'>
                    <Label className='text-xs font-medium'>Task Status *</Label>
                    <Select
                      key={`task-status-${taskId}-${taskStatus}`}
                      value={taskStatus}
                      onValueChange={(val: TaskStatus) => {
                        setTaskStatus(val);
                        if (val === 'Assigned') {
                          if (!taskAssignedDateTime || taskData?.task_status !== 'Assigned') {
                            setTaskAssignedDateTime(toLocalISOString(new Date()));
                          }
                        } else if (val === 'Unassigned') {
                          setTaskAssignedDateTime('');
                        }
                      }}
                      disabled={isCompleted}
                    >
                      <SelectTrigger className='h-9 text-xs'>
                        <SelectValue placeholder='Select Task Status' />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((opt) => (
                          <SelectItem
                            key={opt.value}
                            value={opt.value}
                            disabled={opt.disabled}
                          >
                            {opt.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-1.5'>
                    <Label className='text-xs font-medium'>
                      Assigned Date/Time
                    </Label>
                    <Input
                      type='datetime-local'
                      value={taskAssignedDateTime}
                      onChange={(e) => setTaskAssignedDateTime(e.target.value)}
                      disabled={!canEditOtherFields}
                      className='h-9 text-xs'
                    />
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1.5'>
                    <Label className='text-xs font-medium'>
                      Targeted Account Status *
                    </Label>
                    <Select
                      key={`task-status-${taskId}-${targetAccountStatus}`}
                      value={targetAccountStatus}
                      onValueChange={(val: TargetAccountStatus) =>
                        setTargetAccountStatus(val)
                      }
                      disabled={!canEditOtherFields}
                    >
                      <SelectTrigger className='h-9 text-xs'>
                        <SelectValue placeholder='Select Task Status' />
                      </SelectTrigger>
                      <SelectContent>
                        {targetAccountStatusOptions.map((opt) => (
                          <SelectItem
                            key={opt.value}
                            value={opt.value}
                            disabled={opt.disabled}
                          >
                            {opt.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-1.5'>
                    <Label className='text-xs font-medium'>
                      Target Call Back Date/Time
                    </Label>
                    <div className='space-y-1.5'>
                      <DateField
                        value={targetCallBackDateTime}
                        isEdit={canEditOtherFields}
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
                </div>
                <div className='space-y-1.5'>
                  <Label className='text-xs font-medium'>Due Date/Time</Label>
                  <Input
                    type='datetime-local'
                    value={taskDueDateTime}
                    onChange={(e) => setTaskDueDateTime(e.target.value)}
                    disabled={!canEditOtherFields}
                    className='h-9 text-xs'
                  />
                </div>

                <div className='space-y-1.5'>
                  <Label className='text-xs font-medium'>Description</Label>
                  <Textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    disabled={!canEditOtherFields}
                    rows={3}
                    className='text-xs resize-none'
                  />
                </div>

                <DialogFooter className='pt-2 gap-2 flex-wrap'>
                  <Button type='button' variant='outline' onClick={onClose}>
                    Close
                  </Button>

                  {taskStatus !== 'Completed' && isAccountOwner && (
                    <Button
                      type='button'
                      className='bg-green-600 hover:bg-green-700 text-white'
                      onClick={() => markAsCompletedMutation.mutate()}
                      disabled={markAsCompletedMutation.isPending}
                    >
                      <CheckCircle2 className='w-4 h-4 mr-1.5' />
                      {markAsCompletedMutation.isPending
                        ? 'Marking...'
                        : 'Mark as Completed'}
                    </Button>
                  )}

                  {canEditStatus && (
                    <Button type='submit' disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  )}
                </DialogFooter>
              </form>
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value='notes' className='pt-3 space-y-4'>
              <form onSubmit={handleAddNote} className='space-y-2'>
                <div className='flex gap-2'>
                  <Textarea
                    placeholder='Add a note to this task...'
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    rows={2}
                    className='flex-1'
                  />
                  <Button
                    type='submit'
                    size='icon'
                    className='h-auto self-end p-3'
                    disabled={isAddingNote || !newNote.trim()}
                  >
                    <Send className='h-4 w-4' />
                  </Button>
                </div>
              </form>

              <div className='space-y-3 mt-4 max-h-60 overflow-y-auto pr-1'>
                {notesData && notesData.length > 0 ? (
                  notesData.map((note: any, idx: number) => (
                    <div
                      key={note._id || idx}
                      className='p-3 border rounded-lg bg-card text-sm space-y-1'
                    >
                      <div className='flex justify-between items-center text-xs text-muted-foreground'>
                        <span className='font-medium text-foreground'>
                          {note.Owner?.first_name ||
                            note.Created_By?.name ||
                            'User'}
                        </span>
                        <span>{note.Created_Time || ''}</span>
                      </div>
                      <p className='text-foreground whitespace-pre-wrap'>
                        {note.Note_Content}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className='text-center py-6 text-muted-foreground text-sm'>
                    No notes available for this task yet.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
