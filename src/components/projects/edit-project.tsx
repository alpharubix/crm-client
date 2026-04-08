import { useEffect, useState } from 'react'
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
import { Badge } from '../ui/badge'
import { X, Link as LinkIcon } from 'lucide-react'
import {
  API_TO_STATUS,
  ENV,
  PRIORITIES,
  PROJECT_TYPES,
  STATUSES,
  USERS_MAP,
} from '@/conf'
import type {
  Priority,
  Project,
  ProjectType,
  ProjectUser,
  Status,
} from '@/types/project-types'
import { useAuth } from '@/context/auth-context'
import { STATUS_MAP } from './project-kanban'

interface EditProjectModalProps {
  open: boolean
  onClose: () => void
  project: Project | null
  onUpdated: (p: Project) => void
}

export default function EditProjectModal({
  open,
  onClose,
  project,
  onUpdated,
}: EditProjectModalProps) {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details')

  // Derive role for the current user on this project
  const isOwner =
    user &&
    project &&
    String(user.user_id) === String((project as any).created_by)
  const isApprover =
    user &&
    project &&
    String(user.user_id) === String((project as any).approver_id)

  const [form, setForm] = useState({
    name: '',
    description: '',
    priority: '' as Priority | '',
    status: '' as Status | '',
    assignees: [] as ProjectUser[],
    startDate: '',
    endDate: '',
    projectType: '',
    approverId: '',
    attachment_links: [] as string[], // ADDED THIS
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [currentLink, setCurrentLink] = useState('') // Local state for link input

  // ─── FETCH LOGS & TASKS (For History Tab) ─────────────────────────────
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['project-logs', project?.id],
    queryFn: async () => {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/projects/${project?.id}/logs`,
        { credentials: 'include' },
      )
      if (!res.ok) throw new Error('Failed to fetch logs')
      return res.json()
    },
    enabled: !!project?.id && open && activeTab === 'history',
    staleTime: 0,
    refetchOnMount: true,
  })

  const { data: tasksData } = useQuery({
    queryKey: ['project-tasks', project?.id],
    queryFn: async () => {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/projects/${project?.id}/tasks`,
        {
          credentials: 'include',
        },
      )
      if (!res.ok) throw new Error('Failed to fetch tasks')
      return res.json()
    },
    enabled: !!project?.id && open && activeTab === 'history',
  })

  const tasksMap = (tasksData?.data ?? []).reduce((acc: any, t: any) => {
    acc[t.id] = t.title
    return acc
  }, {})
  // ──────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (project && open) {
      setForm({
        name: project.name ?? '',
        description: project.description ?? '',
        priority: project.priority
          ? ((project.priority.charAt(0).toUpperCase() +
              project.priority.slice(1)) as Priority)
          : '',
        status: API_TO_STATUS[project.status ?? ''] ?? '',
        assignees: ((project as any).actioner_ids ?? []).map((id: number) => ({
          id: String(id),
          name: String(id),
        })),
        startDate: (project as any).start_date ?? '',
        endDate: (project as any).end_date ?? '',
        projectType: (project as any).project_type
          ? (project as any).project_type.charAt(0).toUpperCase() +
            (project as any).project_type.slice(1)
          : '',
        approverId: String((project as any).approver_id ?? ''),
        attachment_links: (project as any).attachment_links || [], // FETCH EXISTING LINKS
      })
      setActiveTab('details')
      setErrors({})
      setCurrentLink('')
    }
  }, [project?.id, open])

  const users = Object.entries(USERS_MAP).map(([id, name]) => ({ id, name }))

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  function toggleAssignee(user: any) {
    if (!isOwner && !isApprover) return
    const mapped: any = { id: user.id, name: user.name }
    setForm((f) => {
      const exists = f.assignees.some((u) => u.id === mapped.id)
      return {
        ...f,
        assignees: exists
          ? f.assignees.filter((u) => u.id !== mapped.id)
          : [...f.assignees, mapped],
      }
    })
  }

  // LINK HANDLERS
  function handleAddLink() {
    if (!currentLink.trim()) return
    setForm((f) => ({
      ...f,
      attachment_links: [...f.attachment_links, currentLink.trim()],
    }))
    setCurrentLink('')
  }

  function handleRemoveLink(index: number) {
    if (!isOwner && !isApprover) return
    setForm((f) => ({
      ...f,
      attachment_links: f.attachment_links.filter((_, i) => i !== index),
    }))
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Required'
    if (!form.priority) e.priority = 'Required'
    if (!form.status) e.status = 'Required'
    if (!form.startDate) e.startDate = 'Required'
    if (!form.endDate) e.endDate = 'Required'
    if (form.startDate && form.endDate && form.endDate < form.startDate)
      e.endDate = 'Must be after start date'
    return e
  }

  const mutation = useMutation({
    mutationFn: async (body: typeof form) => {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/projects/${project?.id}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: body.name,
            description: body.description,
            priority: body.priority.toLowerCase(),
            status: STATUS_MAP[body.status] ?? body.status.toLowerCase(),
            start_date: body.startDate,
            end_date: body.endDate,
            actioner_ids: body.assignees.map((u) => u.id),
            approver_id: body.approverId,
            attachment_links: body.attachment_links, // PASSED TO BACKEND
          }),
        },
      )
      if (!res.ok) throw new Error('Failed to update project')
      return res.json()
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      onUpdated(updated)
      onClose()
    },
  })

  function handleSubmit() {
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    mutation.mutate(form)
  }

  // Helper to format values elegantly
  const formatVal = (val: any) => {
    if (typeof val === 'string') {
      return val.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    }
    return val
  }

  // ── LOG RENDERING HELPER ──
  const renderLogDetails = (log: any) => {
    const changes = log.changes || {}
    const keys = Object.keys(changes)
    const taskName = log.task_id
      ? tasksMap[log.task_id] || `Task #${log.task_id.slice(-4)}`
      : ''

    if (log.action === 'CREATED') {
      if (log.entity_type === 'PROJECT')
        return <span className='text-zinc-600'>Created the project</span>
      return (
        <div className='text-zinc-600'>
          <span>
            Created task{' '}
            <span className='font-medium text-zinc-800'>
              {changes.title || taskName}
            </span>
          </span>
        </div>
      )
    }

    if (log.action === 'COMMENTED') {
      return (
        <span className='text-zinc-600'>
          Commented on{' '}
          <span className='font-medium text-zinc-800'>{taskName}</span>:{' '}
          <span className='italic text-zinc-800'>"{changes.content}"</span>
        </span>
      )
    }

    if (log.action === 'UPDATED') {
      if (keys.length === 0)
        return (
          <span className='text-zinc-600'>
            Updated {log.entity_type.toLowerCase()} details
          </span>
        )

      return (
        <div className='text-zinc-600'>
          <span>
            Updated{' '}
            {log.entity_type === 'TASK' ? (
              <span className='font-medium text-zinc-800'>{taskName}</span>
            ) : (
              'project'
            )}{' '}
            details:
          </span>
          <div className='mt-1 pl-1 border-l-2 border-zinc-200 ml-1 space-y-0.5'>
            {keys.map((key) => {
              let val = changes[key]
              let formattedKey = key.replace('_', ' ')

              if (val === null || val === undefined || key === 'modified_by')
                return null

              if (key === 'assignee_id' || key === 'approver_id') {
                val = USERS_MAP[String(val)] || 'Unassigned'
                formattedKey = key === 'assignee_id' ? 'assignee' : 'approver'
              } else if (key === 'actioner_ids' || key === 'attachment_links') {
                val = Array.isArray(val) ? `${val.length} item(s)` : val
              } else {
                val = formatVal(val)
              }

              return (
                <div key={key} className='text-[11px] text-zinc-500'>
                  <span className='text-zinc-400'>↳</span> Changed{' '}
                  <span className='font-medium text-zinc-700 capitalize'>
                    {formattedKey}
                  </span>{' '}
                  to <span className='font-medium text-zinc-700'>{val}</span>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    return <span className='text-zinc-600'>Performed an action</span>
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
    >
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-base font-semibold'>
            {project?.name || 'Edit Project'}
          </DialogTitle>
        </DialogHeader>

        {/* TABS */}
        <div className='flex items-center gap-4 border-b mt-2'>
          <button
            className={`text-xs font-semibold pb-2 px-1 cursor-pointer ${activeTab === 'details' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-zinc-500'}`}
            onClick={() => setActiveTab('details')}
          >
            Project Details
          </button>
          <button
            className={`text-xs font-semibold pb-2 px-1 cursor-pointer ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-zinc-500'}`}
            onClick={() => setActiveTab('history')}
          >
            Activity History
          </button>
        </div>

        {/* TAB CONTENTS */}
        <div className='max-h-[60vh] overflow-y-auto pr-1 py-2'>
          {/* --- DETAILS TAB --- */}
          {activeTab === 'details' && (
            <div className='space-y-4'>
              {/* Name */}
              <div>
                <Label className='text-xs font-medium'>
                  Project Name <span className='text-red-500'>*</span>
                </Label>
                <Input
                  className='mt-1 h-8 text-sm'
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  disabled={!isOwner && !isApprover}
                />
                {errors.name && (
                  <p className='text-xs text-red-500 mt-1'>{errors.name}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <Label className='text-xs font-medium'>Description</Label>
                <Textarea
                  className='mt-1 text-sm resize-y'
                  rows={5}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  disabled={!isOwner && !isApprover}
                />
              </div>

              {/* Attachment Links (NEW) */}
              <div>
                <Label className='text-xs font-medium'>Attachment Links</Label>
                {(isOwner || isApprover) && (
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
                )}

                {form.attachment_links.length > 0 ? (
                  <div
                    className={`flex flex-col gap-1.5 ${!isOwner && !isApprover ? 'mt-1' : 'mt-2'}`}
                  >
                    {form.attachment_links.map((link, idx) => (
                      <div
                        key={idx}
                        className='flex items-center justify-between bg-zinc-50 border rounded px-2 py-1.5'
                      >
                        <div className='flex items-center gap-2 overflow-hidden'>
                          <LinkIcon
                            size={12}
                            className='text-zinc-400 shrink-0'
                          />
                          <span className='text-xs truncate max-w-[300px] text-blue-600 hover:underline'>
                            <a href={link} target='_blank' rel='noreferrer'>
                              {link}
                            </a>
                          </span>
                        </div>
                        {(!isOwner || !isApprover) && (
                          <button
                            type='button'
                            onClick={() => handleRemoveLink(idx)}
                            className='text-zinc-400 hover:text-red-500 shrink-0 ml-2'
                          >
                            <X size={18} className='cursor-pointer' />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  !isOwner &&
                  !isApprover && (
                    <p className='text-xs text-zinc-400 mt-1'>
                      No attachments provided.
                    </p>
                  )
                )}
              </div>

              {/* Priority + Status + Type */}
              <div className='flex items-center gap-4 flex-wrap'>
                <div>
                  <Label className='text-xs font-medium'>
                    Priority <span className='text-red-500'>*</span>
                  </Label>
                  <Select
                    value={form.priority}
                    onValueChange={(v) => set('priority', v as Priority)}
                    disabled={!isOwner && !isApprover}
                  >
                    <SelectTrigger className='mt-1 h-8 text-sm'>
                      <SelectValue placeholder='Select' />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p} className='text-sm'>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.priority && (
                    <p className='text-xs text-red-500 mt-1'>
                      {errors.priority}
                    </p>
                  )}
                </div>
                <div>
                  <Label className='text-xs font-medium'>
                    Status <span className='text-red-500'>*</span>
                  </Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => set('status', v as Status)}
                    disabled={!isOwner && !isApprover}
                  >
                    <SelectTrigger className='mt-1 h-8 text-sm'>
                      <SelectValue placeholder='Select' />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className='text-sm'>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.status && (
                    <p className='text-xs text-red-500 mt-1'>{errors.status}</p>
                  )}
                </div>

                <div>
                  <Label className='text-xs font-medium'>
                    Project Type <span className='text-red-500'>*</span>
                  </Label>
                  <Select
                    value={form.projectType}
                    onValueChange={(v) => set('projectType', v as ProjectType)}
                    disabled={!isOwner && !isApprover}
                  >
                    <SelectTrigger className='mt-1 h-8 text-sm'>
                      <SelectValue placeholder='Select' />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_TYPES.map((s) => (
                        <SelectItem key={s} value={s} className='text-sm'>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className='text-xs font-medium'>Approver</Label>
                  <Select
                    value={form.approverId}
                    onValueChange={(v) => set('approverId', v)}
                    disabled={!isOwner && !isApprover}
                  >
                    <SelectTrigger className='mt-1 h-8 text-sm'>
                      <SelectValue placeholder='Select' />
                    </SelectTrigger>
                    <SelectContent>
                      {users
                        .filter(
                          (u) =>
                            String(u.id) === '3899927000000201013' ||
                            u.name === 'Anslem Prathap',
                        )
                        .map((u) => (
                          <SelectItem
                            key={u.id}
                            value={u.id}
                            className='text-sm'
                          >
                            {u.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='text-sm mt-4'>
                  <span className='font-medium block'>
                    {USERS_MAP[project?.created_by || ''] || 'Unknown User'}{' '}
                    (Initiator)
                  </span>
                </div>
              </div>

              {/* Dates */}
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <Label className='text-xs font-medium'>
                    Start Date <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    type='date'
                    className='mt-1 h-8 text-sm'
                    value={form.startDate}
                    onChange={(e) => set('startDate', e.target.value)}
                    disabled={!isOwner && !isApprover}
                  />
                  {errors.startDate && (
                    <p className='text-xs text-red-500 mt-1'>
                      {errors.startDate}
                    </p>
                  )}
                </div>
                <div>
                  <Label className='text-xs font-medium'>
                    End Date <span className='text-red-500'>*</span>
                  </Label>
                  <Input
                    type='date'
                    className='mt-1 h-8 text-sm'
                    value={form.endDate}
                    onChange={(e) => set('endDate', e.target.value)}
                    disabled={!isOwner && !isApprover}
                  />
                  {errors.endDate && (
                    <p className='text-xs text-red-500 mt-1'>
                      {errors.endDate}
                    </p>
                  )}
                </div>
              </div>

              {/* Team */}
              <div>
                <Label className='text-xs font-medium'>Team Members</Label>
                <div
                  className={`mt-1 border rounded-md overflow-hidden divide-y max-h-40 overflow-y-auto ${!isOwner && !isApprover ? 'opacity-70 pointer-events-none' : ''}`}
                >
                  {users.map((user: { id: string; name: string }) => {
                    const selected = form.assignees.some(
                      (u) => u.id === user.id,
                    )
                    return (
                      <div
                        key={user.id}
                        onClick={() => toggleAssignee(user)}
                        className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer select-none transition-colors ${selected ? 'bg-accent' : 'hover:bg-accent'}`}
                      >
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${selected ? 'bg-zinc-900' : 'border-zinc-300'}`}
                        >
                          {selected && (
                            <svg
                              className='w-2.5 h-2.5'
                              fill='none'
                              viewBox='0 0 10 10'
                            >
                              <path
                                d='M1.5 5l2.5 2.5 4.5-4.5'
                                stroke='currentColor'
                                strokeWidth='1.5'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                              />
                            </svg>
                          )}
                        </div>
                        <div className='w-6 h-6 rounded-full bg-zinc-200 text-zinc-600 flex items-center justify-center text-xs font-semibold shrink-0'>
                          {user.name[0]}
                        </div>
                        <div className='min-w-0'>
                          <p className='text-sm leading-none '>{user.name}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {form.assignees.length > 0 && (
                  <div className='flex flex-wrap gap-1 mt-2'>
                    {form.assignees.map((u) => (
                      <Badge
                        key={u.id}
                        variant='secondary'
                        className='text-xs gap-1 pl-2 pr-1'
                      >
                        {USERS_MAP[u.id]}
                        {(isOwner || isApprover) && (
                          <button
                            onClick={() =>
                              toggleAssignee({ id: u.id, name: u.name })
                            }
                            className='hover:text-red-500 transition-colors ml-0.5'
                          >
                            <X size={10} />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* --- HISTORY TAB --- */}
          {activeTab === 'history' && (
            <div className='space-y-4'>
              {logsLoading && (
                <p className='text-xs text-zinc-500'>Loading history...</p>
              )}

              {!logsLoading && (logsData?.data ?? []).length === 0 && (
                <p className='text-xs text-zinc-400'>
                  No activity recorded yet.
                </p>
              )}

              {!logsLoading &&
                Array.isArray(logsData?.data) &&
                logsData.data.map((log: any) => (
                  <div key={log.id} className='flex gap-3 text-xs'>
                    <div className='w-2 h-2 rounded-full bg-zinc-300 mt-1 shrink-0'></div>
                    <div className='flex-1 pb-3 border-b border-zinc-100 last:border-0'>
                      <div className='mb-0.5'>
                        <span className='font-medium text-zinc-800'>
                          {USERS_MAP[String(log.user_id)] || 'Unknown User'}
                        </span>{' '}
                      </div>
                      {renderLogDetails(log)}
                      <div className='text-[10px] text-zinc-400 mt-1.5'>
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <DialogFooter className='gap-2 mt-2 pt-2 border-t'>
          <Button variant='outline' size='sm' onClick={onClose}>
            Cancel
          </Button>
          {activeTab === 'details' && (
            <Button
              size='sm'
              onClick={handleSubmit}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
