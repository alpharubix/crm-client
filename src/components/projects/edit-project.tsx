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
import { X, Link as LinkIcon, MessageSquare, Send } from 'lucide-react'
import {
  API_TO_STATUS,
  ENV,
  PRIORITIES,
  PROJECT_TYPES,
  STATUSES,
  SUPER_APPROVER_IDS,
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
  const { user: authUser } = useAuth() // Fix: Renamed 'user' to 'authUser' to avoid naming collisions within template maps

  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details')

  // Role permissions routing maps
  const isOwner =
    authUser &&
    project &&
    String(authUser.user_id) === String((project as any).created_by)
  const isApprover =
    authUser &&
    project &&
    (String(authUser.user_id) === String((project as any).approver_id) ||
      SUPER_APPROVER_IDS.includes(String(authUser.user_id)))

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
    attachment_links: [] as string[],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [currentLink, setCurrentLink] = useState('')
  const [newComment, setNewComment] = useState('') // Thread board message field state tracker

  // ─── QUERY: READ PROJECT COMMENT FEEDS ──────────────────────────────────
  const { data: commentsData } = useQuery({
    queryKey: ['project-comments', project?.id],
    queryFn: async () => {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/projects/${project?.id}/comments`,
        { credentials: 'include' },
      )
      if (!res.ok) throw new Error('Failed to fetch project comments')
      return res.json()
    },
    // FIX: Force React Query to pull fresh data from the server every single time the modal opens
    enabled: !!project?.id && open,
    staleTime: 0,
    refetchOnMount: true,
  })

  // ─── QUERY: ACTIVITY LOGS AUDIT PIPELINE ────────────────────────────────
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
        { credentials: 'include' },
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
          name: USERS_MAP[String(id)] || String(id),
        })),
        startDate: (project as any).start_date ?? '',
        endDate: (project as any).end_date ?? '',
        projectType: (project as any).project_type
          ? (project as any).project_type.charAt(0).toUpperCase() +
            (project as any).project_type.slice(1)
          : '',
        approverId: String((project as any).approver_id ?? ''),
        attachment_links: (project as any).attachment_links || [],
      })
      setActiveTab('details')
      setErrors({})
      setCurrentLink('')
      setNewComment('')
    }
  }, [project?.id, open])

  const projectUsersList = Object.entries(USERS_MAP).map(([id, name]) => ({
    id,
    name,
  }))

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  function toggleAssignee(uItem: any) {
    if (!isOwner && !isApprover) return
    const mapped: any = { id: uItem.id, name: uItem.name }
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

  // MUTATION: PATCH SAVE DISPATCH MANAGEMENT
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
            project_type: body.projectType.toLowerCase(),
            attachment_links: body.attachment_links,
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

  // MUTATION: WRITE NEW COMMENT SUBMISSION PIPELINE
  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/projects/${project?.id}/comments`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        },
      )
      if (!res.ok) throw new Error('Failed to post project comment')
      return res.json()
    },
    onSuccess: () => {
      setNewComment('')
      queryClient.invalidateQueries({
        queryKey: ['project-comments', project?.id],
      })
    },
  })

  function handleSendComment() {
    if (!newComment.trim() || commentMutation.isPending) return
    commentMutation.mutate(newComment.trim())
  }

  function handleSubmit() {
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    mutation.mutate(form)
  }

  const formatVal = (val: any) => {
    if (typeof val === 'string') {
      return val.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    }
    return val
  }

  const renderLogDetails = (log: any) => {
    const changes = log.changes || {}
    const keys = Object.keys(changes)
    const taskName = log.task_id
      ? tasksMap[log.task_id] || `Task #${log.task_id.slice(-4)}`
      : ''

    if (log.action === 'CREATED') {
      if (log.entity_type === 'PROJECT') return <span>Created the project</span>
      return (
        <div>
          <span>
            Created task{' '}
            <span className='font-medium'>{changes.title || taskName}</span>
          </span>
        </div>
      )
    }

    if (log.action === 'COMMENTED') {
      return (
        <span>
          Commented on <span className='font-medium'>{taskName}</span>:{' '}
          <span className='italic'>"{changes.content}"</span>
        </span>
      )
    }

    if (log.action === 'UPDATED') {
      if (keys.length === 0)
        return <span>Updated {log.entity_type.toLowerCase()} details</span>

      return (
        <div>
          <span>
            Updated{' '}
            {log.entity_type === 'TASK' ? (
              <span className='font-medium'>{taskName}</span>
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
                <div key={key} className='text-[11px]'>
                  <span>↳</span> Changed{' '}
                  <span className='font-medium capitalize'>{formattedKey}</span>{' '}
                  to <span className='font-medium'>{val}</span>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    return <span>Performed an action</span>
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose()
      }}
    >
      <DialogContent className='max-w-md flex flex-col max-h-[85vh]'>
        <DialogHeader>
          <DialogTitle className='text-base font-semibold'>
            {project?.name || 'Edit Project'}
          </DialogTitle>
        </DialogHeader>

        {/* TABS SELECTION CONTROLS */}
        <div className='flex items-center gap-4 border-b mt-2 shrink-0'>
          <button
            className={`text-xs font-semibold pb-2 px-1 ${activeTab === 'details' ? 'text-blue-600 border-b-2 border-blue-600' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            Project Details
          </button>
          <button
            className={`text-xs font-semibold pb-2 px-1 ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Activity History
          </button>
        </div>

        {/* UNIFIED CONTAINER */}
        <div className='flex-1 overflow-y-auto pr-1 py-2 space-y-4 min-h-0'>
          {activeTab === 'details' && (
            <div className='space-y-4'>
              {/* Project Name Field */}
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

              {/* Description TextBox */}
              <div>
                <Label className='text-xs font-medium'>Description</Label>
                <Textarea
                  className='mt-1 text-sm resize-none'
                  rows={2}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  disabled={!isOwner && !isApprover}
                />
              </div>

              {/* External Documents Reference Lists */}
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
                        className='flex items-center justify-between border rounded px-2 py-1.5'
                      >
                        <div className='flex items-center gap-2 overflow-hidden'>
                          <LinkIcon size={12} className='shrink-0' />
                          <span className='text-xs truncate max-w-[300px] text-blue-600 hover:underline'>
                            <a href={link} target='_blank' rel='noreferrer'>
                              {link}
                            </a>
                          </span>
                        </div>
                        {(isOwner || isApprover) && (
                          <button
                            type='button'
                            onClick={() => handleRemoveLink(idx)}
                            className='hover:text-red-500 shrink-0 ml-2'
                          >
                            <X size={14} className='cursor-pointer' />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  !isOwner &&
                  !isApprover && (
                    <p className='text-xs mt-1 text-muted-foreground'>
                      No attachments provided.
                    </p>
                  )
                )}
              </div>

              {/* Status Metric Parameters Matrix Grid */}
              <div className='grid grid-cols-2 gap-3'>
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
                    onValueChange={(v) => set('projectType', v)}
                    disabled={!isOwner && !isApprover}
                  >
                    <SelectTrigger className='mt-1 h-8 text-sm'>
                      <SelectValue placeholder='Select' />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_TYPES.map((t) => (
                        <SelectItem key={t} value={t} className='text-sm'>
                          {t}
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
                      {projectUsersList
                        .filter(
                          (u) =>
                            u.name === 'Anslem Prathap' ||
                            u.name === 'Subhasini T S' ||
                            u.id === '3899927000000201013' ||
                            u.id === '3899927000005965002',
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
              </div>

              {/* Deadlines Schedule Selectors */}
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

              {/* Assignment Distribution Map List Selection Block */}
              <div>
                <Label className='text-xs font-medium'>Team Members</Label>
                <div
                  className={`mt-1 border rounded-md overflow-hidden divide-y max-h-32 overflow-y-auto ${!isOwner && !isApprover ? 'opacity-70 pointer-events-none' : ''}`}
                >
                  {projectUsersList.map((uItem) => {
                    const selected = form.assignees.some(
                      (u) => u.id === uItem.id,
                    )
                    return (
                      <div
                        key={uItem.id}
                        onClick={() => toggleAssignee(uItem)}
                        className={`flex items-center gap-2.5 px-3 py-1.5 cursor-pointer text-sm hover:bg-muted ${selected ? 'bg-accent' : ''}`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${selected ? 'bg-zinc-900 border-zinc-900 text-white' : 'border-zinc-300'}`}
                        >
                          {selected && (
                            <svg
                              className='w-2 h-2'
                              fill='none'
                              viewBox='0 0 10 10'
                            >
                              <path
                                d='M1.5 5l2.5 2.5 4.5-4.5'
                                stroke='currentColor'
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                              />
                            </svg>
                          )}
                        </div>
                        <div className='w-5 h-5 rounded-full bg-zinc-200 text-zinc-600 flex items-center justify-center text-[10px] font-semibold'>
                          {uItem.name[0]}
                        </div>
                        <span className='truncate text-xs'>{uItem.name}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* PROJECT NOTES CHAT TIMELINE BOARD ELEMENT */}
              {/* COMMENTS UI COMPONENT */}
              <div className='border-t pt-4 space-y-3'>
                <div className='flex items-center gap-2 text-xs font-semibold text-zinc-700'>
                  <MessageSquare size={14} />
                  <span>Project Discussion Board</span>
                </div>

                {/* 1. Project-Specific Discussion Thread */}
                <Label className='text-[11px] font-medium text-zinc-500 uppercase tracking-wider block mt-2'>
                  Project Notes
                </Label>
                <div className='space-y-2 max-h-32 overflow-y-auto border rounded-md p-2 bg-zinc-50/50'>
                  {(commentsData?.project_comments ?? []).length === 0 ? (
                    <p className='text-xs text-muted-foreground text-center py-2'>
                      No project-level discussions yet.
                    </p>
                  ) : (
                    commentsData.project_comments.map((c: any) => (
                      <div
                        key={`p-comm-${c.id}`}
                        className='text-xs border-b last:border-none pb-1.5 mb-1.5 last:pb-0 last:mb-0'
                      >
                        <div className='flex justify-between items-center text-[10px] text-muted-foreground mb-0.5'>
                          <span className='font-semibold text-zinc-800'>
                            {c.user_name || 'System User'}
                          </span>
                          <span>{c.created_at}</span>
                        </div>
                        <p className='text-zinc-600 leading-relaxed'>
                          {c.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* 2. Sub-Task Cascading Contextual Feed Timeline */}
                <Label className='text-[11px] font-medium text-zinc-500 uppercase tracking-wider block mt-2'>
                  Activity on Sub-Tasks
                </Label>
                <div className='space-y-2 max-h-32 overflow-y-auto border rounded-md p-2 bg-zinc-50/50'>
                  {(commentsData?.cascading_task_comments ?? []).length ===
                  0 ? (
                    <p className='text-xs text-muted-foreground text-center py-2'>
                      No activity recorded on tasks yet.
                    </p>
                  ) : (
                    commentsData.cascading_task_comments.map((c: any) => (
                      <div
                        key={`t-comm-${c.id}`}
                        className='text-xs border-b last:border-none pb-1.5 mb-1.5 last:pb-0 last:mb-0'
                      >
                        <div className='flex justify-between items-center text-[10px] text-muted-foreground mb-0.5'>
                          <span className='font-semibold text-zinc-800'>
                            {c.user_name || 'System User'}{' '}
                            <Badge
                              variant='outline'
                              className='text-[9px] px-1 py-0 ml-1 bg-zinc-100 text-zinc-600'
                            >
                              Task #{c.task_id}
                            </Badge>
                          </span>
                          <span>{c.created_at}</span>
                        </div>
                        <p className='text-zinc-600 leading-relaxed'>
                          {c.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Write Action Input Controls Area */}
                <div className='flex gap-2 items-center mt-2'>
                  <Input
                    className='h-8 text-xs flex-1'
                    placeholder='Type a project comment...'
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleSendComment()
                      }
                    }}
                  />
                  <Button
                    type='button'
                    size='sm'
                    className='h-8 w-8 p-0 shrink-0'
                    onClick={handleSendComment}
                    disabled={!newComment.trim() || commentMutation.isPending}
                  >
                    <Send size={12} />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* --- HISTORY TAB --- */}
          {activeTab === 'history' && (
            <div className='space-y-4'>
              {logsLoading && <p className='text-xs'>Loading history...</p>}
              {!logsLoading && (logsData?.data ?? []).length === 0 && (
                <p className='text-xs'>No activity recorded yet.</p>
              )}
              {!logsLoading &&
                Array.isArray(logsData?.data) &&
                logsData.data.map((log: any) => (
                  <div
                    key={log.id}
                    className='flex gap-3 text-xs border-b pb-2 last:border-none'
                  >
                    <div className='flex-1'>
                      <div className='mb-0.5 text-muted-foreground'>
                        <span className='font-semibold text-zinc-800'>
                          {USERS_MAP[String(log.user_id)] || 'Unknown User'}
                        </span>
                      </div>
                      {renderLogDetails(log)}
                      <div className='text-[10px] text-muted-foreground mt-1'>
                        {new Date(log.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        <DialogFooter className='gap-2 mt-2 pt-2 border-t shrink-0'>
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
