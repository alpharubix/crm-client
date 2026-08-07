import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { ENV, USERS_MAP } from '@/conf'
import { X, Link as LinkIcon } from 'lucide-react'
import { useAuth } from '@/context/auth-context' // <-- Added for "Created By"

interface CreateTaskModalProps {
  open: boolean
  onClose: () => void
  projectId: string
  onCreated: (task: any) => void
}

const TYPES = ['feature', 'bug', 'enhancement', 'research']
const PRIORITIES = ['low', 'medium', 'high', 'critical']

const emptyForm = () => ({
  title: '',
  description: '',
  type: '',
  priority: '',
  assignee_id: '',
  start_date: '',
  end_date: '',
  expected_completion_date: '',
  task_rating: '',
  attachment_links: [] as string[],
})

export default function CreateTaskModal({
  open,
  onClose,
  projectId,
  onCreated,
}: CreateTaskModalProps) {
  const [form, setForm] = useState(emptyForm())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [currentLink, setCurrentLink] = useState('')
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const { data: projectData } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/projects/${projectId}`,
        {
          credentials: 'include',
        },
      )
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
  })

  const users = (projectData?.actioner_ids ?? []).map((id: string) => ({
    id: String(id),
    name: USERS_MAP[String(id)] ?? id,
  }))

  function set(key: string, value: any) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  function handleAddLink() {
    if (!currentLink.trim()) return
    setForm((f) => ({
      ...f,
      attachment_links: [...(f.attachment_links || []), currentLink.trim()],
    }))
    setCurrentLink('')
  }

  function handleRemoveLink(index: number) {
    setForm((f) => ({
      ...f,
      attachment_links: (f.attachment_links || []).filter(
        (_, i) => i !== index,
      ),
    }))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.title.trim()) e.title = 'Required'
    if (!form.type) e.type = 'Required'
    if (!form.priority) e.priority = 'Required'
    if (form.start_date && form.end_date && form.start_date > form.end_date) {
      e.end_date = 'Must be after start date'
    }
    return e
  }

  const mutation = useMutation({
    mutationFn: async (body: typeof form) => {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/projects/${projectId}/tasks`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: body.title,
            description: body.description,
            type: body.type,
            priority: body.priority,
            assignee_id: body.assignee_id ? body.assignee_id : null,
            start_date: body.start_date ? body.start_date : null,
            end_date: body.end_date ? body.end_date : null,
            expected_completion_date: body.expected_completion_date ? body.expected_completion_date : null,
            task_rating: body.task_rating ? Number(body.task_rating) : null,
            attachment_links: body.attachment_links,
          }),
        },
      )
      if (!res.ok) throw new Error('Failed to create task')
      return res.json()
    },
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      onCreated(newTask)
      setForm(emptyForm())
      setCurrentLink('')
      onClose()
    },
  })

  function handleSubmit() {
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    const finalForm = { ...form }
    if (currentLink.trim()) {
      finalForm.attachment_links = [
        ...(finalForm.attachment_links || []),
        currentLink.trim(),
      ]
      setCurrentLink('')
    }

    mutation.mutate(finalForm)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
    >
      <DialogContent className='max-w-md max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-base font-semibold'>
            New Task
          </DialogTitle>
          <div className='flex justify-between items-center mt-0.5'>
            {projectData?.name && (
              <p className='text-xs text-muted-foreground'>
                {projectData.name}
              </p>
            )}
            {user?.user_name && (
              <p className='text-xs font-medium text-zinc-500'>
                Creator: {user.user_name}
              </p>
            )}
          </div>
        </DialogHeader>

        <div className='space-y-4 py-1'>
          {/* Title */}
          <div>
            <Label className='text-xs font-medium'>
              Title <span className='text-red-500'>*</span>
            </Label>
            <Input
              className='mt-1 h-8 text-sm'
              placeholder='Task title'
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
            {errors.title && (
              <p className='text-xs text-red-500 mt-1'>{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label className='text-xs font-medium'>Description</Label>
            <Textarea
              className='mt-1 text-sm resize-none'
              rows={2}
              placeholder='Optional'
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          {/* Attachment Links */}
          <div>
            <Label className='text-xs font-medium'>Attachment Links</Label>
            <div className='flex gap-2 mt-1'>
              <Input
                className='h-8 text-sm flex-1'
                placeholder='https://...'
                value={currentLink}
                onChange={(e) => setCurrentLink(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddLink()
                  }
                }}
              />
              <Button
                type='button'
                size='sm'
                variant='secondary'
                onClick={handleAddLink}
                className='h-8 px-3'
              >
                Add
              </Button>
            </div>
            {form.attachment_links?.length > 0 && (
              <div className='flex flex-col gap-1.5 mt-2'>
                {form.attachment_links.map((link, idx) => (
                  <div
                    key={idx}
                    className='flex items-center justify-between border rounded px-2 py-1.5'
                  >
                    <div className='flex items-center gap-2 overflow-hidden'>
                      <LinkIcon size={12} className='text-zinc-400 shrink-0' />
                      <span className='text-xs truncate max-w-75 text-blue-600 hover:underline'>
                        <a href={link} target='_blank' rel='noreferrer'>
                          {link}
                        </a>
                      </span>
                    </div>
                    <button
                      type='button'
                      onClick={() => handleRemoveLink(idx)}
                      className='text-zinc-400 hover:text-red-500 shrink-0 ml-2'
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Type + Priority */}
          <div className='grid grid-cols-2 gap-3'>
            <div>
              <Label className='text-xs font-medium'>
                Type <span className='text-red-500'>*</span>
              </Label>
              <Select value={form.type} onValueChange={(v) => set('type', v)}>
                <SelectTrigger className='mt-1 h-8 text-sm'>
                  <SelectValue placeholder='Select' />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem
                      key={t}
                      value={t}
                      className='text-sm capitalize'
                    >
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className='text-xs text-red-500 mt-1'>{errors.type}</p>
              )}
            </div>

            <div>
              <Label className='text-xs font-medium'>
                Priority <span className='text-red-500'>*</span>
              </Label>
              <Select
                value={form.priority}
                onValueChange={(v) => set('priority', v)}
              >
                <SelectTrigger className='mt-1 h-8 text-sm'>
                  <SelectValue placeholder='Select' />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem
                      key={p}
                      value={p}
                      className='text-sm capitalize'
                    >
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.priority && (
                <p className='text-xs text-red-500 mt-1'>{errors.priority}</p>
              )}
            </div>
          </div>

          {/* Start Date + End Date */}
          <div className='grid grid-cols-2 gap-3'>
            <div>
              <Label className='text-xs font-medium'>Start Date & Time</Label>
              <Input
                type='datetime-local'
                className='mt-1 h-8 text-sm'
                value={form.start_date}
                onChange={(e) => set('start_date', e.target.value)}
              />
            </div>

            <div>
              <Label className='text-xs font-medium'>
                End Date & Time
              </Label>
              <Input
                type='datetime-local'
                className='mt-1 h-8 text-sm'
                value={form.end_date}
                onChange={(e) => set('end_date', e.target.value)}
              />
              {errors.end_date && (
                <p className='text-xs text-red-500 mt-1'>{errors.end_date}</p>
              )}
            </div>
          </div>

          {/* Expected Completion Date + Task Rating */}
          <div className='grid grid-cols-2 gap-3'>
            <div>
              <Label className='text-xs font-medium'>Expected Completion Date & Time</Label>
              <Input
                type='datetime-local'
                className='mt-1 h-8 text-sm'
                value={form.expected_completion_date}
                onChange={(e) => set('expected_completion_date', e.target.value)}
              />
            </div>

            <div>
              <Label className='text-xs font-medium'>Task Rating (1-5)</Label>
              <Select
                value={String(form.task_rating)}
                onValueChange={(v) => set('task_rating', v)}
              >
                <SelectTrigger className='mt-1 h-8 text-sm'>
                  <SelectValue placeholder='Rating' />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((r) => (
                    <SelectItem key={r} value={String(r)} className='text-sm'>
                      {r} Star{r > 1 ? 's' : ''} ({r})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignee */}
          <div>
            <Label className='text-xs font-medium'>Assignee</Label>
            <Select
              value={form.assignee_id}
              onValueChange={(v) => set('assignee_id', v)}
            >
              <SelectTrigger className='mt-1 h-8 text-sm'>
                <SelectValue placeholder='Select user' />
              </SelectTrigger>
              <SelectContent>
                {users.map((u: { id: string; name: string }) => (
                  <SelectItem
                    key={u.id}
                    value={String(u.id)}
                    className='text-sm'
                  >
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className='gap-2 mt-2'>
          <Button variant='outline' size='sm' onClick={onClose}>
            Cancel
          </Button>
          <Button
            size='sm'
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className='cursor-pointer'
          >
            {mutation.isPending ? 'Creating...' : 'Create Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
