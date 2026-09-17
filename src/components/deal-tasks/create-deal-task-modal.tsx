import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ENV } from '@/conf'
import type { TaskType, TaskStatus } from '@/types/deal-task'
import { Building2, MessageSquare, Clock, Briefcase } from 'lucide-react'
import { useAuth } from '@/context/auth-context'
import usersData from '@/utils/users.json'

export const DEAL_STATUS_OPTIONS = [
  'Deal Created',
  'Lender Review',
  'Lender Rejected',
  'Achievement',
  'Not Interested',
]

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

interface CreateDealTaskModalProps {
  isOpen: boolean
  onClose: () => void
  fixedDealId?: string | number
  fixedDealName?: string
  fixedAccountId?: string | number
  fixedAccountName?: string
}

export default function CreateDealTaskModal({
  isOpen,
  onClose,
  fixedDealId,
  fixedDealName,
  fixedAccountId,
  fixedAccountName,
}: CreateDealTaskModalProps) {
  const queryClient = useQueryClient()

  const [dealId, setDealId] = useState<string | number | undefined>(fixedDealId)
  const [dealSearch, setDealSearch] = useState<string>(
    fixedDealName || fixedAccountName || '',
  )
  const [selectedDealName, setSelectedDealName] = useState<string>(
    fixedDealName || fixedAccountName || '',
  )
  const [taskType, setTaskType] = useState<TaskType>('Call')
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('Unassigned')
  const [targetDealStatus, setTargetDealStatus] = useState<string>('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskAssignedDateTime, setTaskAssignedDateTime] = useState('')
  const [taskDueDateTime, setTaskDueDateTime] = useState('')
  const [isSearchingDeal, setIsSearchingDeal] = useState(false)

  const toLocalISOString = (dateInput?: string | Date | null) => {
    if (!dateInput) return ''
    const dt = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    if (isNaN(dt.getTime())) return ''
    const offset = dt.getTimezoneOffset() * 60000
    return new Date(dt.getTime() - offset).toISOString().slice(0, 16)
  }

  const { user } = useAuth()

  useEffect(() => {
    if (fixedDealId) {
      setDealId(fixedDealId)
    }
    if (fixedDealName) {
      setDealSearch(fixedDealName)
      setSelectedDealName(fixedDealName)
    }
  }, [fixedDealId, fixedDealName])

  // Query deals for dropdown if not fixed
  const { data: dealSearchResults } = useQuery({
    queryKey: ['deal-search-for-task', dealSearch],
    queryFn: async () => {
      if (!dealSearch || fixedDealId) return []
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/deals?account_name=${encodeURIComponent(dealSearch)}`,
        { credentials: 'include' },
      )
      if (!res.ok) return []
      const data = await res.json()
      return data.data || []
    },
    enabled: !fixedDealId && dealSearch.length > 1 && isSearchingDeal,
  })

  // Query deal details when a deal is selected
  const { data: selectedDealDetails } = useQuery({
    queryKey: ['deal-details-for-task', dealId],
    queryFn: async () => {
      if (!dealId) return null
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/deals?deal_id=${dealId}`,
        { credentials: 'include' },
      )
      if (!res.ok) return null
      return res.json()
    },
    enabled: !!dealId && isOpen,
    staleTime: 0,
  })

  const dealData = selectedDealDetails?.data?.[0]

  // Query notes for selected deal
  const { data: dealCreateNotes } = useQuery({
    queryKey: ['deal-create-notes', dealId],
    queryFn: async () => {
      if (!dealId) return []
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/notes/${dealId}`, {
        credentials: 'include',
      })
      if (!res.ok) return []
      const data = await res.json()
      return data.data || []
    },
    enabled: !!dealId && isOpen,
  })

  const lastDealNote =
    dealCreateNotes && dealCreateNotes.length > 0
      ? [...dealCreateNotes].sort(
          (a: any, b: any) =>
            new Date(
              b.Created_Time || b.Created_time || b.created_at || 0,
            ).getTime() -
            new Date(
              a.Created_Time || a.Created_time || a.created_at || 0,
            ).getTime(),
        )[0]
      : null

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!dealId) {
        throw new Error('Please select a Deal')
      }
      const payload = {
        module_name: 'Deal',
        deal_id: dealId,
        task_type: taskType,
        task_status: taskStatus || 'Unassigned',
        task_description: taskDescription,
        target_deal_status: targetDealStatus || null,
        task_assigned_date_time:
          taskStatus === 'Assigned'
            ? (taskAssignedDateTime ? new Date(taskAssignedDateTime).toISOString() : new Date().toISOString())
            : null,
        task_due_date_time: taskDueDateTime
          ? new Date(taskDueDateTime).toISOString()
          : null,
      }

      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/deal-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Failed to create Deal task')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Deal Task created successfully!')
      queryClient.invalidateQueries({ queryKey: ['deal-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['deal-tasks-list'] })
      onClose()
      resetForm()
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error creating deal task')
    },
  })

  const resetForm = () => {
    if (!fixedDealId) {
      setDealId(undefined)
      setDealSearch('')
      setSelectedDealName('')
    }
    setTaskType('Call')
    setTaskStatus('Unassigned')
    setTargetDealStatus('')
    setTaskDescription('')
    setTaskAssignedDateTime('')
    setTaskDueDateTime('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate()
  }

  function renderMentions(text: string) {
    return text.replace(/crm\[user#([^\]]+)\]crm/g, (_, userId) => {
      const userName = (usersData as Record<string, string>)[userId]
      return userName ? `@${userName}` : '@Unknown User'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-150 max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Create Deal Task</DialogTitle>
        </DialogHeader>

        {/* Selected Deal Readonly Details Panel */}
        {dealId && dealData && (
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
                  Deal #{dealData.id || dealId}
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
                  title={dealData.deal_name || dealData.account_name}
                >
                  {dealData.deal_name ||
                    dealData.account_name ||
                    selectedDealName ||
                    'N/A'}
                </span>
              </div>

              <div>
                <span className='text-muted-foreground text-[11px] font-medium block'>
                  Account Name
                </span>
                <span className='font-semibold text-foreground truncate block'>
                  {dealData.account_name || 'N/A'}
                </span>
              </div>

              <div>
                <span className='text-muted-foreground text-[11px] font-medium block'>
                  Account Owner
                </span>
                <span className='font-semibold text-foreground truncate block'>
                  {dealData.account_owner ||
                    (usersData as Record<string, string>)[
                      dealData.account_owner_id
                    ] ||
                    'Unassigned'}
                </span>
              </div>

              <div>
                <span className='text-muted-foreground text-[11px] font-medium block'>
                  Deal Owner
                </span>
                <span className='font-semibold text-foreground truncate block'>
                  {dealData.owner?.full_name ||
                    (usersData as Record<string, string>)[
                      dealData.deal_owner_id
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
                  {dealData.deal_status || 'N/A'}
                </Badge>
              </div>

              <div>
                <span className='text-muted-foreground text-[11px] font-medium block'>
                  Loan Type
                </span>
                <span className='font-medium text-foreground/90 truncate block'>
                  {dealData.loan_type || 'N/A'}
                </span>
              </div>

              <div>
                <span className='text-muted-foreground text-[11px] font-medium block'>
                  Lender
                </span>
                <span className='font-medium text-foreground/90 truncate block'>
                  {dealData.lender_name || 'N/A'}
                </span>
              </div>
            </div>

            {/* Last Deal Note Section */}
            {lastDealNote && (
              <div className='mt-2.5 pt-2.5 border-t border-border/60 bg-background/90 p-2.5 rounded-lg border space-y-1.5'>
                <div className='flex items-center justify-between text-[11px] text-muted-foreground'>
                  <span className='font-semibold flex items-center gap-1.5 text-foreground'>
                    <MessageSquare className='w-3.5 h-3.5 text-primary' /> Last
                    Deal Note
                  </span>
                  <span className='font-mono text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20'>
                    {lastDealNote?.Created_Time ||
                      lastDealNote?.created_at ||
                      'Date N/A'}
                  </span>
                </div>
                <p className='text-xs text-foreground/90 line-clamp-3 italic bg-muted/20 p-2 rounded border border-muted/40'>
                  {renderMentions(lastDealNote?.Note_Content || '')}
                </p>
              </div>
            )}
          </div>
        )}

        <div className='bg-linear-to-br from-card via-muted/30 to-muted/50 p-3.5 rounded-xl border shadow-xs space-y-3 mt-2'>
          <div className='text-lg font-semibold'>Deal Task Information</div>
          <form onSubmit={handleSubmit} className='space-y-4 py-2'>
            {/* Module Name & Deal Selection in 2 Columns */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <Label className='text-xs font-medium'>Module Name</Label>
                <Input value='Deal' disabled className='h-9 text-xs bg-muted' />
              </div>

              <div className='space-y-1.5 relative'>
                <Label className='text-xs font-medium'>
                  Deal Name *
                </Label>
                {fixedDealId ? (
                  <Input
                    value={fixedDealName || `Deal #${fixedDealId}`}
                    disabled
                    className='h-9 text-xs bg-muted'
                    required={true}
                  />
                ) : (
                  <div className='relative'>
                    <Input
                      placeholder='Search Deal or Account...'
                      value={dealSearch}
                      onChange={(e) => {
                        setDealSearch(e.target.value)
                        setIsSearchingDeal(true)
                        setDealId(undefined)
                        setSelectedDealName('')
                      }}
                      onFocus={() => setIsSearchingDeal(true)}
                      className='h-9 text-xs'
                    />
                    {selectedDealName && (
                      <span className='text-[11px] text-green-600 block mt-1 font-medium'>
                        Selected: {selectedDealName}
                      </span>
                    )}
                    {isSearchingDeal &&
                      dealSearchResults &&
                      dealSearchResults.length > 0 && (
                        <div className='absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto'>
                          {dealSearchResults.map((deal: any) => (
                            <div
                              key={deal.id}
                              className='p-2 text-xs hover:bg-accent cursor-pointer border-b last:border-0'
                              onClick={() => {
                                setDealId(deal.id)
                                setSelectedDealName(
                                  deal.deal_name ||
                                    deal.account_name ||
                                    `Deal #${deal.id}`,
                                )
                                setDealSearch(
                                  deal.deal_name ||
                                    deal.account_name ||
                                    `Deal #${deal.id}`,
                                )
                                setIsSearchingDeal(false)
                              }}
                            >
                              <div className='font-medium text-foreground'>
                                {deal.deal_name ||
                                  deal.account_name ||
                                  'Unnamed Deal'}
                              </div>
                              <div className='text-[11px] text-muted-foreground'>
                                Acc: {deal.account_name || 'N/A'} | Status:{' '}
                                {deal.deal_status || 'N/A'} | Loan:{' '}
                                {deal.loan_type || 'N/A'}
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
                  required={true}
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
                <Label className='text-xs font-medium'>Task Status</Label>
                <Select
                  value={taskStatus}
                  onValueChange={(val: TaskStatus) => {
                    setTaskStatus(val)
                    if (val === 'Assigned') {
                      setTaskAssignedDateTime(toLocalISOString(new Date()))
                    } else {
                      setTaskAssignedDateTime('')
                    }
                  }}
                >
                  <SelectTrigger className='h-9 text-xs'>
                    <SelectValue placeholder='Select Task Status'>
                      {taskStatus || 'Select Task Status'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(taskStatus === 'Unassigned'
                      ? [
                          'Unassigned',
                          'Assigned',
                          'Pending',
                          'In Progress',
                          'Completed',
                          'Verified',
                          'Overdue',
                        ]
                      : [
                          'Assigned',
                          'Pending',
                          'In Progress',
                          'Completed',
                          'Verified',
                          'Overdue',
                        ]
                    ).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Target Deal Status (No Callback Date Time) */}
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium'>
                Targeted Deal Status
              </Label>
              <Select
                value={targetDealStatus}
                onValueChange={(val: string) => setTargetDealStatus(val)}
              >
                <SelectTrigger className='h-9 text-xs'>
                  <SelectValue placeholder='Select Target Deal Status' />
                </SelectTrigger>
                <SelectContent>
                  {DEAL_STATUS_OPTIONS.map((st) => (
                    <SelectItem key={st} value={st}>
                      {st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assigned & Due Dates in 2 Columns */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-1.5'>
                <Label className='text-xs font-medium'>
                  Assigned Date/Time
                </Label>
                <Input
                  type='datetime-local'
                  value={taskStatus === 'Assigned' ? taskAssignedDateTime : ''}
                  disabled={true}
                  readOnly={true}
                  className='h-9 text-xs bg-muted cursor-not-allowed'
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
                placeholder='Enter task description...'
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                className='text-xs resize-none h-20'
              />
            </div>

            <DialogFooter className='pt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={onClose}
                className='text-xs h-9 cursor-pointer'
              >
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={createMutation.isPending || !dealId}
                className='text-xs h-9 bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer'
              >
                {createMutation.isPending ? 'Creating...' : 'Create Deal Task'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
