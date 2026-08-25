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
import { ENV, USERS_MAP } from '@/conf'
import type { TaskType, TaskStatus } from '@/types/account-task'
import { Building2, MessageSquare } from 'lucide-react'

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

interface CreateAccountTaskModalProps {
  isOpen: boolean
  onClose: () => void
  fixedAccountId?: string | number
  fixedAccountName?: string
}

export default function CreateAccountTaskModal({
  isOpen,
  onClose,
  fixedAccountId,
  fixedAccountName,
}: CreateAccountTaskModalProps) {
  const queryClient = useQueryClient()

  const [accountId, setAccountId] = useState<string | number | undefined>(fixedAccountId)
  const [accountSearch, setAccountSearch] = useState<string>(fixedAccountName || '')
  const [selectedAccountName, setSelectedAccountName] = useState<string>(fixedAccountName || '')
  const [taskType, setTaskType] = useState<TaskType>('Call')
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('Unassigned')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskAssignedDateTime, setTaskAssignedDateTime] = useState('')
  const [taskDueDateTime, setTaskDueDateTime] = useState('')
  const [isSearchingAccount, setIsSearchingAccount] = useState(false)

  useEffect(() => {
    if (fixedAccountId) {
      setAccountId(fixedAccountId)
    }
    if (fixedAccountName) {
      setAccountSearch(fixedAccountName)
      setSelectedAccountName(fixedAccountName)
    }
  }, [fixedAccountId, fixedAccountName])

  // Query accounts for dropdown if not fixed
  const { data: accountSearchResults } = useQuery({
    queryKey: ['account-search', accountSearch],
    queryFn: async () => {
      if (!accountSearch || fixedAccountId) return []
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/accounts?account_name=${encodeURIComponent(accountSearch)}&page_size=10`,
        { credentials: 'include' },
      )
      if (!res.ok) return []
      const data = await res.json()
      return data.data || []
    },
    enabled: !fixedAccountId && accountSearch.length > 1 && isSearchingAccount,
  })

  // Query account details when an account is selected
  const { data: selectedAccountDetails } = useQuery({
    queryKey: ['account-details-for-task', accountId],
    queryFn: async () => {
      if (!accountId) return null
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/accounts/${accountId}`,
        { credentials: 'include' },
      )
      if (!res.ok) return null
      return res.json()
    },
    enabled: !!accountId && isOpen,
  })

  // Query notes for selected account
  const { data: accountCreateNotes } = useQuery({
    queryKey: ['account-create-notes', accountId],
    queryFn: async () => {
      if (!accountId) return []
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/notes/${accountId}`,
        { credentials: 'include' },
      )
      if (!res.ok) return []
      const data = await res.json()
      return data.data || []
    },
    enabled: !!accountId && isOpen,
  })

  const lastAccountNote = accountCreateNotes && accountCreateNotes.length > 0
    ? [...accountCreateNotes].sort((a: any, b: any) => new Date(b.Created_Time || b.Created_time || b.created_at || 0).getTime() - new Date(a.Created_Time || a.Created_time || a.created_at || 0).getTime())[0]
    : null

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!accountId) {
        throw new Error('Please select an Account')
      }
      const payload = {
        module_name: 'Account',
        account_id: accountId,
        task_type: taskType,
        task_status: taskStatus,
        task_description: taskDescription,
        task_assigned_date_time: taskAssignedDateTime ? new Date(taskAssignedDateTime).toISOString() : null,
        task_due_date_time: taskDueDateTime ? new Date(taskDueDateTime).toISOString() : null,
      }

      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/account-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Failed to create account task')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Account Task created successfully!')
      queryClient.invalidateQueries({ queryKey: ['account-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['account-tasks-list'] })
      onClose()
      resetForm()
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error creating task')
    },
  })

  const resetForm = () => {
    if (!fixedAccountId) {
      setAccountId(undefined)
      setAccountSearch('')
      setSelectedAccountName('')
    }
    setTaskType('Call')
    setTaskStatus('Unassigned')
    setTaskDescription('')
    setTaskAssignedDateTime('')
    setTaskDueDateTime('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-[550px]'>
        <DialogHeader>
          <DialogTitle>Create Account Task</DialogTitle>
        </DialogHeader>

        {/* Selected Account Readonly Details Panel */}
        {accountId && selectedAccountDetails && (
          <div className='bg-gradient-to-br from-card via-muted/30 to-muted/50 p-3.5 rounded-xl border shadow-xs space-y-3 mt-2'>
            <div className='flex items-center justify-between border-b border-border/60 pb-2'>
              <div className='flex items-center gap-2'>
                <Building2 className='w-4 h-4 text-primary' />
                <span className='font-semibold text-xs uppercase tracking-wider text-muted-foreground'>
                  Account Information
                </span>
              </div>
              <div className='flex items-center gap-1.5 flex-wrap'>
                <Badge variant='outline' className='text-[10px] font-mono bg-background/80'>
                  Record #{selectedAccountDetails.id || accountId}
                </Badge>
                <Badge variant='secondary' className='text-[10px] font-mono'>
                  Module: Account
                </Badge>
              </div>
            </div>

            <div className='grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs'>
              <div>
                <span className='text-muted-foreground text-[11px] font-medium block'>Account Name</span>
                <span className='font-semibold text-foreground truncate block' title={selectedAccountDetails.account_name}>
                  {selectedAccountDetails.account_name || selectedAccountName || 'N/A'}
                </span>
              </div>

              <div>
                <span className='text-muted-foreground text-[11px] font-medium block'>Account Owner</span>
                <span className='font-semibold text-foreground truncate block'>
                  {selectedAccountDetails.owner?.full_name || USERS_MAP[selectedAccountDetails.account_owner_id] || 'Unassigned'}
                </span>
              </div>

              <div>
                <span className='text-muted-foreground text-[11px] font-medium block'>Assigned Date & Time</span>
                <span className='font-medium text-foreground/90 truncate block'>
                  {formatDate(selectedAccountDetails.assignment_date)}
                </span>
              </div>

              <div>
                <span className='text-muted-foreground text-[11px] font-medium block'>Account Status</span>
                <Badge variant='outline' className='mt-0.5 text-[10px] font-medium bg-blue-50/60 text-blue-700 border-blue-200'>
                  {selectedAccountDetails.account_status || 'N/A'}
                </Badge>
              </div>

              <div>
                <span className='text-muted-foreground text-[11px] font-medium block'>Account Stage</span>
                <Badge variant='outline' className='mt-0.5 text-[10px] font-medium bg-purple-50/60 text-purple-700 border-purple-200'>
                  {selectedAccountDetails.account_stage || 'N/A'}
                </Badge>
              </div>

              <div>
                <span className='text-muted-foreground text-[11px] font-medium block'>Call Back Date</span>
                <span className='font-medium text-foreground/90 truncate block'>
                  {formatDate(selectedAccountDetails.call_back_date_time)}
                </span>
              </div>
            </div>

            {/* Last Account Note Section */}
            <div className='mt-2.5 pt-2.5 border-t border-border/60 bg-background/90 p-2.5 rounded-lg border space-y-1.5'>
              <div className='flex items-center justify-between text-[11px] text-muted-foreground'>
                <span className='font-semibold flex items-center gap-1.5 text-foreground'>
                  <MessageSquare className='w-3.5 h-3.5 text-primary' /> Last Account Note
                  {lastAccountNote?.Owner?.first_name || lastAccountNote?.Created_By?.name ? (
                    <span className='font-normal text-muted-foreground'>
                      by {lastAccountNote?.Owner?.first_name || lastAccountNote?.Created_By?.name}
                    </span>
                  ) : null}
                </span>
                <span className='font-mono text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20'>
                  {lastAccountNote?.Created_Time || lastAccountNote?.Modified_Time || 'Date N/A'}
                </span>
              </div>
              <p className='text-xs text-foreground/90 line-clamp-3 italic bg-muted/20 p-2 rounded border border-muted/40'>
                {lastAccountNote?.Note_Content ? `"${lastAccountNote.Note_Content}"` : 'No notes recorded for this account yet.'}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4 py-2'>
          {/* Module Name & Account Selection in 2 Columns */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium'>Module Name</Label>
              <Input value='Account' disabled className='h-9 text-xs bg-muted' />
            </div>

            <div className='space-y-1.5 relative'>
              <Label className='text-xs font-medium'>Account *</Label>
              {fixedAccountId ? (
                <Input
                  value={fixedAccountName || `Account #${fixedAccountId}`}
                  disabled
                  className='h-9 text-xs bg-muted'
                />
              ) : (
                <div className='relative'>
                  <Input
                    placeholder='Search Account Name...'
                    value={accountSearch}
                    onChange={(e) => {
                      setAccountSearch(e.target.value)
                      setIsSearchingAccount(true)
                      setAccountId(undefined)
                      setSelectedAccountName('')
                    }}
                    onFocus={() => setIsSearchingAccount(true)}
                    className='h-9 text-xs'
                  />
                  {selectedAccountName && (
                    <span className='text-[11px] text-green-600 block mt-1 font-medium'>
                      Selected: {selectedAccountName}
                    </span>
                  )}
                  {isSearchingAccount && accountSearchResults && accountSearchResults.length > 0 && (
                    <div className='absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto'>
                      {accountSearchResults.map((acc: any) => (
                        <div
                          key={acc.id}
                          className='p-2 text-xs hover:bg-accent cursor-pointer border-b last:border-0'
                          onClick={() => {
                            setAccountId(acc.id)
                            setSelectedAccountName(acc.account_name || `Account #${acc.id}`)
                            setAccountSearch(acc.account_name || `Account #${acc.id}`)
                            setIsSearchingAccount(false)
                          }}
                        >
                          <div className='font-medium text-foreground'>{acc.account_name || 'Unnamed Account'}</div>
                          <div className='text-[11px] text-muted-foreground'>
                            Status: {acc.account_status || 'N/A'} | Stage: {acc.account_stage || 'N/A'}
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
              <Select value={taskType} onValueChange={(val: TaskType) => setTaskType(val)}>
                <SelectTrigger className='h-9 text-xs'>
                  <SelectValue placeholder='Select Task Type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Call'>Call</SelectItem>
                  <SelectItem value='Update Record'>Update Record</SelectItem>
                  <SelectItem value='Email'>Email</SelectItem>
                  <SelectItem value='Move Status'>Move Status</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs font-medium'>Task Status *</Label>
              <Select value={taskStatus} onValueChange={(val: TaskStatus) => setTaskStatus(val)}>
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
          </div>

          {/* Assigned & Due Dates in 2 Columns */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium'>Assigned Date/Time</Label>
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
            <Button type='button' variant='outline' className='h-9 text-xs cursor-pointer' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' className='h-9 text-xs cursor-pointer' disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
