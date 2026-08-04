import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, LinkIcon, Pencil, Clock, Star, User } from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import { ENV, SUPER_APPROVER_IDS, USERS_MAP } from '@/conf'
import { useQuery } from '@tanstack/react-query'
import CreateTaskModal from './create-task'
import { Button } from '../ui/button'
import EditTaskModal from './edit-task'
import { useAuth } from '@/context/auth-context'

// ── Types ──────────────────────────────────────────────────────────────────

type TaskStatus = 'To Do' | 'In Progress' | 'Review' | 'Done'

interface Task {
  id: string
  title: string
  type: string
  priority: string
  status: TaskStatus
  assignee: string
  assignee_id?: string
  expected_completion_date?: string
  task_rating?: number
  projectId: string
}

// ── Styles ─────────────────────────────────────────────────────────────────

const COLUMNS: TaskStatus[] = ['To Do', 'In Progress', 'Review', 'Done']

const COLUMN_STYLES: Record<TaskStatus, { header: string; dot: string }> = {
  'To Do': { header: 'text-zinc-500 border-zinc-300', dot: 'bg-zinc-400' },
  'In Progress': {
    header: 'text-blue-600 border-blue-300',
    dot: 'bg-blue-500',
  },
  Review: { header: 'text-amber-600 border-amber-300', dot: 'bg-amber-500' },
  Done: {
    header: 'text-emerald-600 border-emerald-300',
    dot: 'bg-emerald-500',
  },
}

const PRIORITY_STYLES: Record<string, { badge: string; dot: string }> = {
  Low: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  Medium: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  High: {
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    dot: 'bg-orange-500',
  },
  Critical: {
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
  },
}

const TYPE_STYLES: Record<string, string> = {
  Feature: 'bg-sky-50 text-sky-700 border-sky-200',
  Bug: 'bg-rose-50 text-rose-700 border-rose-200',
  Enhancement: 'bg-violet-50 text-violet-700 border-violet-200',
  Research: 'bg-amber-50 text-amber-700 border-amber-200',
}

// ── TaskCard ───────────────────────────────────────────────────────────────

function TaskCard({
  task,
  isDragging = false,
  onClick,
}: {
  task: Task
  isDragging?: boolean
  onClick?: () => void
}) {
  const prioKey =
    task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1).toLowerCase() : 'Low'
  const prioConfig = PRIORITY_STYLES[prioKey] || PRIORITY_STYLES.Low
  const typeFormatted =
    task.type ? task.type.charAt(0).toUpperCase() + task.type.slice(1).toLowerCase() : 'Task'

  return (
    <div
      className={`rounded-xl p-3.5 bg-card border border-border/80 transition-all duration-200
      ${
        isDragging
          ? 'shadow-xl opacity-90 rotate-1 border-primary/50'
          : 'hover:shadow-md hover:border-zinc-300 cursor-grab active:cursor-grabbing'
      }`}
    >
      <p className='text-sm font-semibold text-foreground leading-snug mb-2.5 line-clamp-3'>
        {task.title}
      </p>

      {/* Badges Bar */}
      <div className='flex items-center gap-1.5 flex-wrap mb-2.5'>
        <span
          className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border shadow-2xs ${TYPE_STYLES[typeFormatted] ?? 'bg-zinc-100 text-zinc-600 border-zinc-200'}`}
        >
          {typeFormatted}
        </span>

        <span
          className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border shadow-2xs flex items-center gap-1 ${prioConfig.badge}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${prioConfig.dot}`} />
          {task.priority}
        </span>

        {task.task_rating && (
          <span className='text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/90 flex items-center gap-1 shadow-2xs'>
            <Star className='w-3 h-3 fill-amber-400 text-amber-500' />
            {task.task_rating}/5
          </span>
        )}
      </div>

      {/* Expected Completion Date */}
      {task.expected_completion_date && (
        <div className='flex items-center gap-1 text-[11px] text-muted-foreground font-medium my-2 bg-muted/40 px-2 py-1 rounded-md border border-muted/60'>
          <Clock className='w-3 h-3 text-zinc-400 shrink-0' />
          <span className='truncate'>Exp: {task.expected_completion_date}</span>
        </div>
      )}

      {/* Footer Assignee */}
      <div className='flex items-center justify-between pt-2 border-t border-border/50 mt-1'>
        <div className='flex items-center gap-1.5 min-w-0'>
          <div className='w-5 h-5 rounded-full bg-zinc-200 text-zinc-700 font-bold flex items-center justify-center text-[10px] shrink-0 uppercase'>
            {task.assignee ? task.assignee[0] : '?'}
          </div>
          <p className='text-[11px] font-medium text-muted-foreground truncate max-w-[130px]'>
            {task.assignee || 'Unassigned'}
          </p>
        </div>
        {onClick && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onClick}
            className='cursor-pointer p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-all shrink-0'
            title='Edit Task'
          >
            <Pencil size={12} />
          </button>
        )}
      </div>
    </div>
  )
}

// ── DraggableCard ──────────────────────────────────────────────────────────

function DraggableCard({
  task,
  onEdit,
  canDrag = true,
}: {
  task: Task
  onEdit: (t: Task) => void
  canDrag?: boolean
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
  })
  return (
    <div
      ref={setNodeRef}
      {...(canDrag ? listeners : {})}
      {...(canDrag ? attributes : {})}
      className={isDragging ? 'opacity-70' : ''}
    >
      <TaskCard
        task={task}
        isDragging={isDragging}
        onClick={() => onEdit(task)}
      />
    </div>
  )
}

// ── DroppableColumn ────────────────────────────────────────────────────────

function DroppableColumn({
  status,
  tasks,
  onEdit,
  getUserCanDragTask,
}: {
  status: TaskStatus
  tasks: Task[]
  onEdit: (t: Task) => void
  getUserCanDragTask: (task: Task) => boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const style = COLUMN_STYLES[status]

  return (
    <div className='flex flex-col gap-2'>
      <div className={`flex items-center gap-2 pb-2 border-b ${style.header}`}>
        <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
        <span className='text-xs font-semibold uppercase tracking-wide'>
          {status}
        </span>
        <span className='ml-auto text-xs font-mono'>{tasks.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 min-h-[120px] rounded-md transition-colors p-1
          ${isOver ? 'bg-accent' : ''}`}
      >
        {tasks.map((task) => (
          <DraggableCard
            key={task.id}
            task={task}
            onEdit={onEdit}
            canDrag={getUserCanDragTask(task)}
          />
        ))}
        {tasks.length === 0 && (
          <div
            className={`border border-dashed rounded-md p-4 text-center text-xs transition-colors
            ${isOver ? 'border-zinc-400 text-zinc-400' : 'border-zinc-200 text-zinc-300'}`}
          >
            Drop here
          </div>
        )}
      </div>
    </div>
  )
}

// ── ProjectDetailPage ──────────────────────────────────────────────────────

export default function Task() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const { user } = useAuth()

  const [tasks, setTasks] = useState<Task[]>([])

  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/projects/${id}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
  })

  const { data: tasksData } = useQuery({
    queryKey: ['tasks', id],
    queryFn: async () => {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/projects/${id}/tasks`,
        {
          credentials: 'include',
        }
      )
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
  })

  useEffect(() => {
    if (!tasksData?.data) return
    setTasks(
      tasksData.data.map((t: any) => ({
        ...t,
        status:
          (
            {
              todo: 'To Do',
              in_progress: 'In Progress',
              review: 'Review',
              done: 'Done',
            } as any
          )[t.status] ?? t.status,
        priority: t.priority.charAt(0).toUpperCase() + t.priority.slice(1),
        type: t.type.charAt(0).toUpperCase() + t.type.slice(1),
        assignee: t.assignee_name ?? '—',
      }))
    )
  }, [tasksData])
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  // Role checks ── owner or approver have full access; anyone else is assignee-only
  const isOwner = !!(
    user &&
    project &&
    String(user.user_id) === String(project.created_by)
  )
  const isApprover = !!(
    user &&
    project &&
    (String(user.user_id) === String(project.approver_id) ||
      SUPER_APPROVER_IDS.includes(String(user.user_id)))
  )
  const isAssigneeOnly = !isOwner && !isApprover

  // Assignees can only drag tasks where they are the assignee
  const getUserCanDragTask = (task: Task): boolean => {
    if (!isAssigneeOnly) return true
    return user ? String(task.assignee_id) === String(user.user_id) : false
  }

  function onDragStart(event: DragStartEvent) {
    const task = tasks.find((t) => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTask(null)
    if (!over) return

    const newStatus = over.id as TaskStatus

    const REVERSE_MAP: Record<TaskStatus, string> = {
      'To Do': 'todo',
      'In Progress': 'in_progress',
      Review: 'review',
      Done: 'done',
    }

    // update locally immediately
    setTasks((prev) =>
      prev.map((t) => (t.id === active.id ? { ...t, status: newStatus } : t))
    )

    // persist to DB
    await fetch(
      `${ENV.VITE_BACKEND_BASE_URL}/projects/${id}/tasks/${active.id}`,
      {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: REVERSE_MAP[newStatus] }),
      }
    )
  }

  return (
    <div className='min-h-screen '>
      {/* Header Section */}
      <div className='px-6 py-6 shadow-sm'>
        <button
          onClick={() => navigate('/projects')}
          className='flex items-center gap-1.5 text-xs transition-colors mb-4 cursor-pointer'
        >
          <ArrowLeft size={13} /> Back to Projects
        </button>

        <div className='flex items-start justify-between mb-6'>
          <div>
            <div className='flex items-center gap-3 mb-1'>
              <h1 className='text-xl font-bold '>{project?.name}</h1>
              <span className='text-xs font-mono px-2 py-0.5 rounded'>
                #{project?.id}
              </span>
              <span className='text-xs uppercase tracking-wider  text-blue-700 border px-2 py-0.5 rounded font-semibold'>
                {project?.project_type}
              </span>
            </div>
            <p className='text-sm max-w-3xl mt-2'>{project?.description}</p>
          </div>

          <Button
            size='sm'
            onClick={() => setTaskModalOpen(true)}
            className='cursor-pointer shrink-0'
          >
            + Add Task
          </Button>
        </div>

        {/* Metadata Grid */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border rounded-lg p-4 mb-4'>
          <div className='flex flex-col gap-1'>
            <span className='text-xs  uppercase'>Status & Priority</span>
            <div className='flex items-center gap-2'>
              <span className='text-xs capitalize px-2 py-0.5 rounded border font-medium'>
                {project?.status}
              </span>
              <span className='text-xs capitalize px-2 py-0.5 rounded border font-medium'>
                {project?.priority}
              </span>
            </div>
          </div>

          <div className='flex flex-col gap-1'>
            <span className='text-xs  uppercase'>Timeline</span>
            <span className='font-medium '>
              {project?.start_date} → {project?.end_date}
            </span>
          </div>

          <div className='flex flex-col gap-1'>
            <span className='text-xs  uppercase'>Created</span>
            <span className='font-medium '>
              {USERS_MAP[project?.created_by]}
            </span>
            <span className='text-xs '>{project?.created_at}</span>
          </div>

          <div className='flex flex-col gap-1'>
            <span className='text-xs  uppercase'>Team</span>
            <span className='text-xs '>
              <span className='font-medium'>Approver:</span>{' '}
              {USERS_MAP[project?.approver_id]}
            </span>
            <span className='text-xs  truncate'>
              <span className='font-medium'>Actioners:</span>{' '}
              {project?.actioner_ids
                ?.map((id: string) => USERS_MAP[id])
                .join(', ')}
            </span>
          </div>
        </div>

        {/* Attachments */}
        {project?.attachment_links?.length > 0 && (
          <div className='flex flex-col gap-2'>
            <span className='text-xs  font-medium uppercase'>Attachments</span>
            <div className='flex flex-wrap gap-2'>
              {project?.attachment_links.map((link: string, idx: number) => (
                <a
                  key={idx}
                  href={link}
                  target='_blank'
                  rel='noreferrer'
                  className='flex items-center gap-2 rounded px-3 py-1.5 transition-colors group text-blue-500'
                >
                  <LinkIcon size={12} className='shrink-0' />
                  <span className='text-xs truncate max-w-[250px] group-hover:text-blue-700'>
                    {link}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Kanban */}
      <div className='p-6'>
        <DndContext
          sensors={sensors}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          <div className='grid grid-cols-4 gap-4'>
            {COLUMNS.map((col) => (
              <DroppableColumn
                key={col}
                status={col}
                tasks={tasks.filter((t) => t.status === col)}
                onEdit={(t) => setEditTask(t)}
                getUserCanDragTask={getUserCanDragTask}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask && <TaskCard task={activeTask} isDragging />}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Modals */}
      <CreateTaskModal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        projectId={id!}
        onCreated={(newTask) => {
          setTasks((prev) => [
            ...prev,
            {
              ...newTask,
              status:
                (
                  {
                    todo: 'To Do',
                    in_progress: 'In Progress',
                    review: 'Review',
                    done: 'Done',
                  } as any
                )[newTask.status] ?? newTask.status,
              priority:
                newTask.priority.charAt(0).toUpperCase() +
                newTask.priority.slice(1),
              type:
                newTask.type.charAt(0).toUpperCase() + newTask.type.slice(1),
            },
          ])
        }}
      />
      <EditTaskModal
        open={!!editTask}
        onClose={() => setEditTask(null)}
        task={editTask}
        projectId={id!}
        onUpdated={(updated) => {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === updated.id
                ? {
                    ...updated,
                    status:
                      (
                        {
                          todo: 'To Do',
                          in_progress: 'In Progress',
                          review: 'Review',
                          done: 'Done',
                        } as any
                      )[updated.status] ?? updated.status,
                    priority:
                      updated.priority.charAt(0).toUpperCase() +
                      updated.priority.slice(1),
                    type:
                      updated.type.charAt(0).toUpperCase() +
                      updated.type.slice(1),
                    assignee: updated.assignee_name ?? '—',
                  }
                : t
            )
          )
        }}
      />
    </div>
  )
}
