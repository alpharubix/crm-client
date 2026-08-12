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
import { ENV } from '@/conf'
import type { TaskType, TaskStatus } from '@/types/account-task'

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

        <form onSubmit={handleSubmit} className='space-y-4 py-2'>
          {/* Module Name Field (Default Account) */}
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label className='text-right font-medium'>Module Name</Label>
            <Input value='Account' disabled className='col-span-3 bg-muted' />
          </div>

          {/* Account Selection */}
          <div className='grid grid-cols-4 items-center gap-4 relative'>
            <Label className='text-right font-medium'>Account *</Label>
            {fixedAccountId ? (
              <Input value={fixedAccountName || `Account #${fixedAccountId}`} disabled className='col-span-3 bg-muted' />
            ) : (
              <div className='col-span-3 relative'>
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
                />
                {selectedAccountName && (
                  <span className='text-xs text-green-600 block mt-1'>
                    Selected: {selectedAccountName} (ID: {accountId})
                  </span>
                )}
                {isSearchingAccount && accountSearchResults && accountSearchResults.length > 0 && (
                  <div className='absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto'>
                    {accountSearchResults.map((acc: any) => (
                      <div
                        key={acc.id}
                        className='p-2 text-sm hover:bg-accent cursor-pointer'
                        onClick={() => {
                          setAccountId(acc.id)
                          setSelectedAccountName(acc.account_name || `Account #${acc.id}`)
                          setAccountSearch(acc.account_name || `Account #${acc.id}`)
                          setIsSearchingAccount(false)
                        }}
                      >
                        <div className='font-medium'>{acc.account_name || 'Unnamed Account'}</div>
                        <div className='text-xs text-muted-foreground'>Status: {acc.account_status || 'N/A'} | Stage: {acc.account_stage || 'N/A'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Task Type Dropdown */}
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label className='text-right font-medium'>Task Type *</Label>
            <Select value={taskType} onValueChange={(val: TaskType) => setTaskType(val)}>
              <SelectTrigger className='col-span-3'>
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

          {/* Task Status Dropdown */}
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label className='text-right font-medium'>Task Status *</Label>
            <Select value={taskStatus} onValueChange={(val: TaskStatus) => setTaskStatus(val)}>
              <SelectTrigger className='col-span-3'>
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

          {/* Task Assigned Date & Time */}
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label className='text-right font-medium text-xs'>Assigned Date/Time</Label>
            <Input
              type='datetime-local'
              value={taskAssignedDateTime}
              onChange={(e) => setTaskAssignedDateTime(e.target.value)}
              className='col-span-3'
            />
          </div>

          {/* Task Due Date & Time */}
          <div className='grid grid-cols-4 items-center gap-4'>
            <Label className='text-right font-medium text-xs'>Due Date/Time</Label>
            <Input
              type='datetime-local'
              value={taskDueDateTime}
              onChange={(e) => setTaskDueDateTime(e.target.value)}
              className='col-span-3'
            />
          </div>

          {/* Task Description */}
          <div className='grid grid-cols-4 items-start gap-4'>
            <Label className='text-right font-medium pt-2'>Description</Label>
            <Textarea
              placeholder='Enter task details or description...'
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              rows={3}
              className='col-span-3'
            />
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
