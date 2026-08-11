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
import type { AccountTask, TaskType, TaskStatus } from '@/types/account-task'
import { MessageSquare, Plus, Send } from 'lucide-react'

interface UpdateAccountTaskModalProps {
  taskId: number | null
  isOpen: boolean
  onClose: () => void
}

export default function UpdateAccountTaskModal({
  taskId,
  isOpen,
  onClose,
}: UpdateAccountTaskModalProps) {
  const queryClient = useQueryClient()
  const [taskType, setTaskType] = useState<TaskType>('Call')
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('Unassigned')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskAssignedDateTime, setTaskAssignedDateTime] = useState('')
  const [taskDueDateTime, setTaskDueDateTime] = useState('')
  const [newNote, setNewNote] = useState('')
  const [isAddingNote, setIsAddingNote] = useState(false)

  // Fetch task details
  const { data: taskData, isLoading } = useQuery({
    queryKey: ['account-task-detail', taskId],
    queryFn: async () => {
      if (!taskId) return null
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/account-tasks/${taskId}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to fetch task details')
      return res.json() as Promise<AccountTask>
    },
    enabled: !!taskId && isOpen,
  })

  const notesData = (taskData as any)?.notes || []

  useEffect(() => {
    if (taskData) {
      setTaskType(taskData.task_type)
      setTaskStatus(taskData.task_status)
      setTaskDescription(taskData.task_description || '')

      if (taskData.task_assigned_date_time) {
        const dt = new Date(taskData.task_assigned_date_time)
        setTaskAssignedDateTime(dt.toISOString().slice(0, 16))
      } else {
        setTaskAssignedDateTime('')
      }

      if (taskData.task_due_date_time) {
        const dt = new Date(taskData.task_due_date_time)
        setTaskDueDateTime(dt.toISOString().slice(0, 16))
      } else {
        setTaskDueDateTime('')
      }
    }
  }, [taskData])

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!taskId) return
      const payload = {
        task_type: taskType,
        task_status: taskStatus,
        task_description: taskDescription,
        task_assigned_date_time: taskAssignedDateTime ? new Date(taskAssignedDateTime).toISOString() : null,
        task_due_date_time: taskDueDateTime ? new Date(taskDueDateTime).toISOString() : null,
      }

      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/account-tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Failed to update task')
      return res.json()
    },
    onSuccess: () => {
      toast.success('Account Task updated successfully')
      queryClient.invalidateQueries({ queryKey: ['account-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['account-task-detail', taskId] })
      onClose()
    },
    onError: () => {
      toast.error('Failed to update task')
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
          module: 'Account_Tasks',
        }),
      })

      if (res.ok) {
        toast.success('Note added successfully')
        setNewNote('')
        queryClient.invalidateQueries({ queryKey: ['account-task-detail', taskId] })
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
          <div className='py-8 text-center text-muted-foreground'>Loading task details...</div>
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
              {/* Linked Account Readonly Summary */}
              <div className='bg-muted/50 p-3 rounded-lg grid grid-cols-2 gap-2 text-sm border'>
                <div>
                  <span className='text-muted-foreground text-xs block'>Account Name</span>
                  <span className='font-medium'>{taskData?.account_name || 'N/A'}</span>
                </div>
                <div>
                  <span className='text-muted-foreground text-xs block'>Account Owner</span>
                  <span className='font-medium'>{taskData?.account_owner || 'Unassigned'}</span>
                </div>
                <div>
                  <span className='text-muted-foreground text-xs block'>Account Status</span>
                  <span className='font-medium'>{taskData?.account_status || 'N/A'}</span>
                </div>
                <div>
                  <span className='text-muted-foreground text-xs block'>Account Stage</span>
                  <span className='font-medium'>{taskData?.account_stage || 'N/A'}</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className='space-y-4'>
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label className='text-right font-medium'>Module Name</Label>
                  <Input value='Account' disabled className='col-span-3 bg-muted' />
                </div>

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

                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label className='text-right font-medium text-xs'>Assigned Date/Time</Label>
                  <Input
                    type='datetime-local'
                    value={taskAssignedDateTime}
                    onChange={(e) => setTaskAssignedDateTime(e.target.value)}
                    className='col-span-3'
                  />
                </div>

                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label className='text-right font-medium text-xs'>Due Date/Time</Label>
                  <Input
                    type='datetime-local'
                    value={taskDueDateTime}
                    onChange={(e) => setTaskDueDateTime(e.target.value)}
                    className='col-span-3'
                  />
                </div>

                <div className='grid grid-cols-4 items-start gap-4'>
                  <Label className='text-right font-medium pt-2'>Description</Label>
                  <Textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    rows={3}
                    className='col-span-3'
                  />
                </div>

                <DialogFooter className='pt-2'>
                  <Button type='button' variant='outline' onClick={onClose}>
                    Close
                  </Button>
                  <Button type='submit' disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
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
                  <Button type='submit' size='icon' className='h-auto self-end p-3' disabled={isAddingNote || !newNote.trim()}>
                    <Send className='h-4 w-4' />
                  </Button>
                </div>
              </form>

              <div className='space-y-3 mt-4 max-h-60 overflow-y-auto pr-1'>
                {notesData && notesData.length > 0 ? (
                  notesData.map((note: any, idx: number) => (
                    <div key={note._id || idx} className='p-3 border rounded-lg bg-card text-sm space-y-1'>
                      <div className='flex justify-between items-center text-xs text-muted-foreground'>
                        <span className='font-medium text-foreground'>
                          {note.Owner?.first_name || note.Created_By?.name || 'User'}
                        </span>
                        <span>
                          {note.Created_Time ? new Date(note.Created_Time).toLocaleString() : ''}
                        </span>
                      </div>
                      <p className='text-foreground whitespace-pre-wrap'>{note.Note_Content}</p>
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
  )
}
