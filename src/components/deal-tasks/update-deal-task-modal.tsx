import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ENV } from '@/conf'
import type { DealTask, TaskType, TaskStatus } from '@/types/deal-task'
import {
  MessageSquare,
  Send,
  CheckCircle2,
  Briefcase,
  Clock,
} from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import users from '@/utils/users.json'
import usersData from '@/utils/users.json'
import { extractErrorMessage } from '@/utils/error-extractor'
import { DEAL_STATUS_OPTIONS } from './create-deal-task-modal'

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return 'N/A'
  const dt = new Date(dateStr)
  if (isNaN(dt.getTime())) return dateStr
  return dt.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

interface UpdateDealTaskModalProps {
  taskId: string | number | null
  isOpen: boolean
  onClose: () => void
}

export default function UpdateDealTaskModal({
  taskId,
  isOpen,
  onClose,
}: UpdateDealTaskModalProps) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const role = String(user?.role || '').toLowerCase()
  const canEditFields = ['super_admin', 'admin', 'manager'].includes(role)

  const [taskType, setTaskType] = useState<TaskType>('Call')
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('Unassigned')
  const [targetDealStatus, setTargetDealStatus] = useState<string>('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskAssignedDateTime, setTaskAssignedDateTime] = useState('')
  const [taskDueDateTime, setTaskDueDateTime] = useState('')

  // Tab State
  const [activeTab, setActiveTab] = useState<'details' | 'notes'>('details')

  // New Note State
  const [newNote, setNewNote] = useState('')
  const [isAddingNote, setIsAddingNote] = useState(false)

  // Fetch Task Details
  const { data: taskData, isLoading } = useQuery({
    queryKey: ['deal-task-detail', taskId],
    queryFn: async () => {
      if (!taskId) return null
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/deal-tasks/${taskId}`,
        {
          credentials: 'include',
        },
      )
      if (!res.ok) throw new Error('Failed to fetch deal task details')
      return res.json() as Promise<DealTask>
    },
    enabled: !!taskId && isOpen,
  })

  const notesData = (taskData as any)?.notes || []

  const toLocalISOString = (dateInput?: string | Date | null) => {
    if (!dateInput) return ''
    const dt = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    if (isNaN(dt.getTime())) return ''
    const offset = dt.getTimezoneOffset() * 60000
    return new Date(dt.getTime() - offset).toISOString().slice(0, 16)
  }

  useEffect(() => {
    if (taskData && isOpen) {
      setTaskType((taskData.task_type || 'Call') as TaskType)
      setTaskStatus((taskData.task_status || 'Unassigned') as TaskStatus)
      setTaskDescription(taskData.task_description || '')
      setTargetDealStatus(taskData.target_deal_status || '')
      setTaskAssignedDateTime(
        toLocalISOString(taskData.task_assigned_date_time),
      )
      setTaskDueDateTime(toLocalISOString(taskData.task_due_date_time))
    }
  }, [taskData, isOpen, taskId])

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!taskId) return
      const payload: any = {
        task_type: taskType,
        task_status: taskStatus,
        task_description: taskDescription,
        target_deal_status: targetDealStatus || null,
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
      }

      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/deal-tasks/${taskId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        },
      )

      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        throw new Error(
          extractErrorMessage(errorData, 'Failed to update deal task'),
        )
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Deal Task updated successfully')
      queryClient.invalidateQueries({ queryKey: ['deal-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['deal-tasks-list'] })
      queryClient.invalidateQueries({
        queryKey: ['deal-task-detail', taskId],
      })
      onClose()
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to update deal task')
    },
  })

  const markAsCompletedMutation = useMutation({
    mutationFn: async () => {
      if (!taskId) return
      const payload = {
        task_status: 'Completed',
        target_deal_status: targetDealStatus || null,
      }
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/deal-tasks/${taskId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        },
      )

      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        throw new Error(
          extractErrorMessage(
            errorData,
            'Failed to mark deal task as completed',
          ),
        )
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Deal Task marked as Completed!')
      queryClient.invalidateQueries({ queryKey: ['deal-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['deal-tasks-list'] })
      queryClient.invalidateQueries({
        queryKey: ['deal-task-detail', taskId],
      })
      onClose()
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to mark deal task as completed')
    },
  })

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNote.trim() || !taskId) return
    setIsAddingNote(true)

    try {
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: taskId.toString(),
          note: newNote,
          module: 'Deal_Tasks',
        }),
      })

      if (res.ok) {
        toast.success('Note added successfully')
        setNewNote('')
        queryClient.invalidateQueries({
          queryKey: ['deal-task-detail', taskId],
        })
      } else {
        toast.error('Failed to add note')
      }
    } catch {
      toast.error('Failed to add note')
    } finally {
      setIsAddingNote(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate()
  }

  const currentUserId =
    user?.user_id || (user as any)?.id || (user as any)?.zuid
  const isDealOwner = Boolean(
    taskData?.deal_owner_id &&
    String(taskData.deal_owner_id) === String(currentUserId),
  )
  const isAssignee = Boolean(
    taskData?.assigned_to_id &&
    String(taskData.assigned_to_id) === String(currentUserId),
  )
  const isAdminOrManager = ['super_admin', 'admin', 'manager'].includes(role)

  const canEditStatus = isAssignee || isDealOwner || isAdminOrManager;
  const isCompleted = taskData?.task_status === 'Completed';

  const editableIds = [
    '3899927000000201013',
    '3899927000000282463',
    '3899927000000434365',
    '3899927000000484472',
  ];

  const userCanEdit = editableIds.includes(String(user?.user_id));

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
      ]

  const statusOptions = (
    isAssignee && taskStatus && !allowedStatuses.includes(taskStatus)
      ? [
          { value: taskStatus, disabled: true },
          ...allowedStatuses.map((s) => ({ value: s, disabled: false })),
        ]
      : allowedStatuses.map((s) => ({ value: s, disabled: false }))
  ).filter((opt) => Boolean(opt.value && String(opt.value).trim() !== ''))

  function renderMentions(text: string) {
    return text.replace(/crm\[user#([^\]]+)\]crm/g, (_, userId) => {
      const userName = (usersData as Record<string, string>)[userId]
      return userName ? `@${userName}` : '@Unknown User'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-[650px] max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center justify-between pr-6'>
            <span>Deal Task #{taskId} Details</span>
            {taskData?.call_back_date_status && (
              <Badge variant='outline' className='text-xs'>
                {taskData.call_back_date_status}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className='sr-only'>
            View and manage deal task #{taskId} details
          </DialogDescription>
        </DialogHeader>

        {/* Readonly Deal Information Panel */}
        {taskData && (
          <div className='bg-linear-to-br from-card via-muted/30 to-muted/50 p-3.5 rounded-xl border shadow-xs space-y-3 mt-2'>
            <div className='flex items-center justify-between border-b border-border/60 pb-2'>
              <div className='flex items-center gap-2'>
                <Briefcase className='w-4 h-4 text-primary' />
                <span className='font-semibold text-xs uppercase tracking-wider text-muted-foreground'>
                  Deal Information
                </span>
              </div>
              <div className='flex items-center gap-1.5 flex-wrap'>
                <Badge
                  variant='outline'
                  className='text-[10px] font-mono bg-background/80'
                >
                  Deal #{taskData.deal_id}
                </Badge>
                <Badge variant='secondary' className='text-[10px] font-mono'>
                  Module: Deal
                </Badge>
              </div>
            </div>

            <div className='grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs'>
              <div>
                <span className='text-muted-foreground text-[11px] font-medium block'>
                  Deal Name
                </span>
                <span
                  className='font-semibold text-foreground truncate block'
                  title={taskData.deal_name || taskData.account_name}
                >
                  {taskData.deal_name || taskData.account_name || 'N/A'}
                </span>
              </div>

              <div>
                <span className='text-muted-foreground text-[11px] font-medium block'>
                  Account Name
                </span>
                <span className='font-semibold text-foreground truncate block'>
                  {taskData.account_name || 'N/A'}
                </span>
              </div>

              <div>
                <span className='text-muted-foreground text-[11px] font-medium block'>
                  Deal Owner
                </span>
                <span className='font-semibold text-foreground truncate block'>
                  {taskData.deal_owner ||
                    (usersData as Record<string, string>)[
                      taskData.deal_owner_id || ''
                    ] ||
                    'Unassigned'}
                </span>
              </div>

              <div>
                <span className='text-muted-foreground text-[11px] font-medium block'>
                  Deal Status
                </span>
                <Badge
                  variant='outline'
                  className='mt-0.5 text-[10px] font-medium bg-blue-50/60 text-blue-700 border-blue-200'
                >
                  {taskData.deal_status || 'N/A'}
                </Badge>
              </div>

              <div>
                <span className='text-muted-foreground text-[11px] font-medium block'>
                  Loan Type
                </span>
                <span className='font-medium text-foreground/90 truncate block'>
                  {taskData.loan_type || 'N/A'}
                </span>
              </div>

              <div>
                <span className='text-muted-foreground text-[11px] font-medium block'>
                  Lender Name
                </span>
                <span className='font-medium text-foreground/90 truncate block'>
                  {taskData.lender_name || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={(val: any) => setActiveTab(val)}
          className='w-full'
        >
          <TabsList className='grid grid-cols-2 w-full'>
            <TabsTrigger value='details' className='text-xs'>
              Task Details
            </TabsTrigger>
            <TabsTrigger
              value='notes'
              className='text-xs flex items-center gap-1.5'
            >
              <MessageSquare className='w-3.5 h-3.5' />
              Notes ({notesData.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value='details' className='mt-3 space-y-4'>
            {isLoading ? (
              <div className='py-8 text-center text-xs text-muted-foreground'>
                Loading task details...
              </div>
            ) : (
              <form onSubmit={handleSubmit} className='space-y-4'>
                {/* Module Name & Deal */}
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1.5'>
                    <Label className='text-xs font-medium'>Module Name</Label>
                    <Input
                      value='Deal'
                      disabled
                      className='h-9 text-xs bg-muted'
                    />
                  </div>

                  <div className='space-y-1.5'>
                    <Label className='text-xs font-medium'>
                      Deal / Account Name
                    </Label>
                    <Input
                      value={
                        taskData?.deal_name ||
                        taskData?.account_name ||
                        `Deal #${taskData?.deal_id}`
                      }
                      disabled
                      className='h-9 text-xs bg-muted'
                    />
                  </div>
                </div>

                {/* Task Type & Task Status */}
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1.5'>
                    <Label className='text-xs font-medium'>Task Type *</Label>
                    <Select
                      value={taskType}
                      onValueChange={(val: TaskType) => setTaskType(val)}
                      disabled={!userCanEdit}
                    >
                      <SelectTrigger className='h-9 text-xs'>
                        <SelectValue placeholder='Select Type' />
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

                  <div className='space-y-1.5'>
                    <Label className='text-xs font-medium'>Task Status</Label>
                    <Select
                      value={taskStatus || undefined}
                      onValueChange={(val: TaskStatus) => setTaskStatus(val)}
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
                </div>

                {/* Target Deal Status */}
                <div className='space-y-1.5'>
                  <Label className='text-xs font-medium'>
                    Targeted Deal Status
                  </Label>
                  <Select
                    value={targetDealStatus || undefined}
                    onValueChange={(val: string) => setTargetDealStatus(val)}
                    disabled={!userCanEdit}
                  >
                    <SelectTrigger className='h-9 text-xs'>
                      <SelectValue placeholder='Select Target Deal Status' />
                    </SelectTrigger>
                    <SelectContent>
                      {DEAL_STATUS_OPTIONS.filter((st) => Boolean(st && String(st).trim() !== '')).map((st) => (
                        <SelectItem key={st} value={st}>
                          {st}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Assigned & Due Dates */}
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1.5'>
                    <Label className='text-xs font-medium'>
                      Assigned Date/Time
                    </Label>
                    <Input
                      type='datetime-local'
                      value={taskAssignedDateTime}
                      onChange={(e) => setTaskAssignedDateTime(e.target.value)}
                      disabled={!userCanEdit}
                      className='h-9 text-xs'
                    />
                  </div>

                  <div className='space-y-1.5'>
                    <Label className='text-xs font-medium'>Due Date/Time</Label>
                    <Input
                      type='datetime-local'
                      value={taskDueDateTime}
                      onChange={(e) => setTaskDueDateTime(e.target.value)}
                      disabled={!userCanEdit}
                      className='h-9 text-xs'
                    />
                  </div>
                </div>

                {/* Task Description */}
                <div className='space-y-1.5'>
                  <Label className='text-xs font-medium'>Description</Label>
                  <Textarea
                    placeholder='Enter task description...'
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    disabled={!userCanEdit}
                    className='text-xs resize-none h-20'
                  />
                </div>

                {/* Audit Information */}
                <div className='border-t pt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground'>
                  <div>
                    Created By:{' '}
                    <span className='font-medium text-foreground'>
                      {(users as Record<string, string>)[
                        taskData?.created_by_id || ''
                      ] ||
                        taskData?.created_by_name ||
                        'N/A'}
                    </span>
                  </div>
                  <div>
                    Created At:{' '}
                    <span className='font-medium text-foreground'>
                      {formatDate(taskData?.created_at)}
                    </span>
                  </div>
                  {taskData?.completed_at && (
                    <div className='col-span-2 text-emerald-600 font-medium'>
                      Completed At: {formatDate(taskData.completed_at)}
                    </div>
                  )}
                </div>

                <DialogFooter className='pt-3 flex items-center justify-between'>
                  <div>
                    {!isCompleted && canEditStatus && (
                      <Button
                        type='button'
                        variant='default'
                        size='sm'
                        onClick={() => markAsCompletedMutation.mutate()}
                        disabled={markAsCompletedMutation.isPending}
                        className='bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs h-9 cursor-pointer'
                      >
                        <CheckCircle2 className='w-4 h-4' /> Mark as Completed
                      </Button>
                    )}
                  </div>

                  <div className='flex items-center gap-2'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={onClose}
                      className='text-xs h-9 cursor-pointer'
                    >
                      Close
                    </Button>
                    {!isCompleted && (
                      <Button
                        type='submit'
                        disabled={updateMutation.isPending}
                        className='text-xs h-9 cursor-pointer'
                      >
                        {updateMutation.isPending
                          ? 'Saving...'
                          : 'Save Changes'}
                      </Button>
                    )}
                  </div>
                </DialogFooter>
              </form>
            )}
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value='notes' className='mt-3 space-y-4'>
            {/* Add Note Input */}
            <form onSubmit={handleAddNote} className='space-y-2'>
              <Textarea
                placeholder='Add a note to this deal task...'
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className='text-xs resize-none h-18'
              />
              <div className='flex justify-end'>
                <Button
                  type='submit'
                  size='sm'
                  disabled={isAddingNote || !newNote.trim()}
                  className='text-xs gap-1.5 cursor-pointer'
                >
                  <Send className='w-3 h-3' />
                  {isAddingNote ? 'Adding...' : 'Post Note'}
                </Button>
              </div>
            </form>

            {/* Notes List */}
            <div className='space-y-2.5 max-h-72 overflow-y-auto pr-1'>
              {notesData.length === 0 ? (
                <div className='text-center py-8 text-xs text-muted-foreground'>
                  No notes added to this task yet.
                </div>
              ) : (
                notesData.map((note: any, idx: number) => (
                  <div
                    key={note.id || idx}
                    className='bg-muted/40 p-3 rounded-lg border text-xs space-y-1'
                  >
                    <div className='flex items-center justify-between text-muted-foreground text-[11px]'>
                      <span className='font-semibold text-foreground'>
                        {note.Created_By?.name ||
                          note.Owner?.first_name ||
                          'CRM User'}
                      </span>
                      <span>
                        {note.Created_Time || note.created_at || 'Recently'}
                      </span>
                    </div>
                    <p className='text-foreground/90 whitespace-pre-wrap'>
                      {renderMentions(note.Note_Content || note.note || '')}
                    </p>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
