import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, LinkIcon, Pencil } from 'lucide-react'
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
import { ENV, USERS_MAP } from '@/conf'
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

const PRIORITY_STYLES: Record<string, string> = {
  Low: 'text-emerald-600',
  Medium: 'text-amber-600',
  High: 'text-orange-600',
  Critical: 'text-red-600',
}

const TYPE_STYLES: Record<string, string> = {
  Feature: 'bg-blue-50 text-blue-600',
  Bug: 'bg-red-50 text-red-600',
  Enhancement: 'bg-violet-50 text-violet-600',
  Research: 'bg-amber-50 text-amber-600',
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
  return (
    <div
      className={` border rounded-md p-3 transition-shadow
      ${isDragging ? 'shadow-lg  opacity-90 rotate-1' : 'hover:shadow-sm cursor-grab'}`}
      onClick={onClick}
    >
      <p className='text-sm font-medium leading-snug mb-2'>{task.title}</p>
      <div className='flex items-center gap-1.5 flex-wrap'>
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${TYPE_STYLES[task.type] ?? 'bg-zinc-100 text-zinc-500'}`}
        >
          {task.type}
        </span>
        <span
          className={`text-[10px] font-medium ${PRIORITY_STYLES[task.priority]}`}
        >
          {task.priority}
        </span>
      </div>
      <div className='flex items-center justify-between mt-2'>
        <p className='text-[11px] text-zinc-400'>{task.assignee}</p>
        {onClick && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onClick}
            className='text-zinc-300 hover:text-zinc-500 transition-colors'
          >
            <Pencil size={14} className='cursor-pointer' />
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
        },
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
      })),
    )
  }, [tasksData])
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
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
    String(user.user_id) === String(project.approver_id)
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
      prev.map((t) => (t.id === active.id ? { ...t, status: newStatus } : t)),
    )

    // persist to DB
    await fetch(
      `${ENV.VITE_BACKEND_BASE_URL}/projects/${id}/tasks/${active.id}`,
      {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: REVERSE_MAP[newStatus] }),
      },
    )
  }

  return (
    <div className='min-h-screen bg-zinc-50'>
      {/* Header Section */}
      <div className='bg-white border-b px-6 py-6 shadow-sm'>
        <button
          onClick={() => navigate('/projects')}
          className='flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 transition-colors mb-4 cursor-pointer'
        >
          <ArrowLeft size={13} /> Back to Projects
        </button>

        <div className='flex items-start justify-between mb-6'>
          <div>
            <div className='flex items-center gap-3 mb-1'>
              <h1 className='text-xl font-bold text-zinc-900'>
                {project?.name}
              </h1>
              <span className='text-xs font-mono bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded'>
                #{project?.id}
              </span>
              <span className='text-xs uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded font-semibold'>
                {project?.project_type}
              </span>
            </div>
            <p className='text-sm text-zinc-600 max-w-3xl mt-2'>
              {project?.description}
            </p>
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
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-zinc-50 border rounded-lg p-4 mb-4'>
          <div className='flex flex-col gap-1'>
            <span className='text-xs text-zinc-500 uppercase'>
              Status & Priority
            </span>
            <div className='flex items-center gap-2'>
              <span className='text-xs capitalize px-2 py-0.5 rounded border border-zinc-200 bg-white font-medium'>
                {project?.status}
              </span>
              <span className='text-xs capitalize px-2 py-0.5 rounded border border-zinc-200 bg-white font-medium'>
                {project?.priority}
              </span>
            </div>
          </div>

          <div className='flex flex-col gap-1'>
            <span className='text-xs text-zinc-500 uppercase'>Timeline</span>
            <span className='font-medium text-zinc-900'>
              {project?.start_date} → {project?.end_date}
            </span>
          </div>

          <div className='flex flex-col gap-1'>
            <span className='text-xs text-zinc-500 uppercase'>Created</span>
            <span className='font-medium text-zinc-900'>
              {USERS_MAP[project?.created_by]}
            </span>
            <span className='text-xs text-zinc-500'>{project?.created_at}</span>
          </div>

          <div className='flex flex-col gap-1'>
            <span className='text-xs text-zinc-500 uppercase'>Team</span>
            <span className='text-xs text-zinc-700'>
              <span className='font-medium'>Approver:</span>{' '}
              {USERS_MAP[project?.approver_id]}
            </span>
            <span className='text-xs text-zinc-700 truncate'>
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
            <span className='text-xs text-zinc-500 font-medium uppercase'>
              Attachments
            </span>
            <div className='flex flex-wrap gap-2'>
              {project?.attachment_links.map((link: string, idx: number) => (
                <a
                  key={idx}
                  href={link}
                  target='_blank'
                  rel='noreferrer'
                  className='flex items-center gap-2 bg-white border border-zinc-200 hover:border-blue-300 hover:bg-blue-50 rounded px-3 py-1.5 transition-colors group'
                >
                  <LinkIcon
                    size={12}
                    className='text-zinc-400 group-hover:text-blue-500 shrink-0'
                  />
                  <span className='text-xs truncate max-w-[250px] text-zinc-700 group-hover:text-blue-700'>
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
                : t,
            ),
          )
        }}
      />
    </div>
  )
}
