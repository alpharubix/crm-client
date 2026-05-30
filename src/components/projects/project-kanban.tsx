import { ENV, USERS_MAP } from '@/conf'
import type { Project } from '@/types/project-types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import EditProjectModal from './edit-project'
import { Card, CardContent } from '../ui/card'
import { Pencil } from 'lucide-react'
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
import { useAuth } from '@/context/auth-context'

// 1. Add this interface at the top
export interface ProjectFilters {
  search: string
  assignee_id: string
  start_date: string
  end_date: string
  project_type: string
  status: string
}
export const STATUS_MAP: Record<string, string> = {
  Planning: 'planning',
  Active: 'active',
  'On Hold': 'on_hold',
  Completed: 'completed',
  Cancelled: 'cancelled',
  'Pending Approve': 'pending_for_approve',
  'Pending Review': 'pending_for_review',
  Rejected: 'rejected',
}

const COLUMN_STYLES: Record<string, { header: string; dot: string }> = {
  Planning: { header: 'text-zinc-500 border-zinc-300', dot: 'bg-zinc-400' },
  Active: { header: 'text-blue-600 border-blue-300', dot: 'bg-blue-500' },
  'On Hold': { header: 'text-amber-600 border-amber-300', dot: 'bg-amber-500' },
  Completed: {
    header: 'text-emerald-600 border-emerald-300',
    dot: 'bg-emerald-500',
  },
  Cancelled: {
    header: 'text-orange-700 border-orange-300',
    dot: 'bg-orange-500',
  },
  'Pending Approve': {
    header: 'text-purple-600 border-purple-300',
    dot: 'bg-purple-500',
  },
  'Pending Review': {
    header: 'text-pink-600 border-pink-300',
    dot: 'bg-pink-500',
  },
  Rejected: {
    header: 'text-red-700 border-red-300',
    dot: 'bg-red-500',
  },
}

const TYPE_STYLES: Record<string, string> = {
  Internal: 'bg-blue-50 text-blue-700',
  External: 'bg-violet-50 text-violet-700',
  'R&d': 'bg-emerald-50 text-emerald-700',
  Support: 'bg-amber-50 text-amber-700',
}

const PRIORITY_STYLES: Record<string, string> = {
  Low: 'text-emerald-600',
  Medium: 'text-amber-600',
  High: 'text-orange-600',
  Critical: 'text-red-600',
}
// ── Constants ──────────────────────────────────────────────────────────────

const COLUMNS = [
  'Pending Approve',
  'Planning',
  'Active',
  'On Hold',
  'Cancelled',
  'Pending Review',
  'Rejected',
  'Completed',
]

// ── Helpers ────────────────────────────────────────────────────────────────

function checkOverdue(endDate: string, status: string): boolean {
  if (!endDate || status === 'completed' || status === 'cancelled') return false
  const end = new Date(endDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return end < today
}

// ── DraggableProjectCard ───────────────────────────────────────────────────

function DraggableProjectCard({
  project,
  onEdit,
  onStatusChange,
  navigate,
}: {
  project: any
  onEdit: (p: any) => void
  navigate: (path: string) => void
  onStatusChange: (id: string, status: string) => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: String(project.id),
  })
  const { user } = useAuth()
  const actionerNames =
    project.actioner_ids
      ?.map((id: string) => USERS_MAP[id])
      .filter(Boolean)
      .join(', ') || '-'
  // Derive role for the current user on this project
  const isOwner =
    user &&
    project &&
    String(user.user_id) === String((project as any).created_by)
  const isApprover =
    user &&
    project &&
    String(user.user_id) === String((project as any).approver_id)
  const isAssigneeOnly = !isOwner && !isApprover
  const isPending =
    project.status === 'pending_for_approve' ||
    project.status === 'pending_for_review'

  const isCompleted = project.status === 'completed'
  const isRejected = project.status === 'rejected'

  const canDrag = !isCompleted && !isRejected && (!isPending || !!isApprover)

  // An Approver can change Status + Team. Only Owner can change everything else.
  const overdue = checkOverdue(project.end_date, project.status)
  const isInitiator =
    user && String(user.user_id) === String(project.created_by)

  const handleAction = async (e: React.MouseEvent, toStatus: string) => {
    e.stopPropagation()
    onStatusChange(project.id, toStatus)
    await fetch(`${ENV.VITE_BACKEND_BASE_URL}/projects/${project.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: toStatus }),
    })
  }
  return (
    <div
      ref={setNodeRef}
      {...(canDrag ? listeners : {})}
      {...(canDrag ? attributes : {})}
      className={isDragging ? 'opacity-50' : ''}
    >
      <Card
        className={`transition-colors py-0 gap-0 overflow-hidden border ${
          canDrag ? 'cursor-grab' : 'cursor-default'
        } ${overdue ? '' : 'hover:shadow-sm'}`}
        onClick={() => {
          if (isOwner || isApprover || isAssigneeOnly)
            navigate(`/projects/${project.id}`)
        }}
      >
        <CardContent className='p-3 flex flex-col gap-3'>
          {/* Header */}
          <div className='flex justify-between items-start gap-2'>
            <h3 className='font-semibold text-sm leading-snug line-clamp-2'>
              {project.name}
            </h3>
            {/* {(isOwner || isApprover) && ( */}
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                onEdit(project)
              }}
              className='cursor-pointer transition-colors shrink-0 p-0.5 rounded '
            >
              <Pencil className='w-3.5 h-3.5' />
            </button>
            {/* )} */}
          </div>

          {/* Metadata */}
          <div className='flex flex-col gap-1.5 text-xs'>
            <div className='flex items-center justify-between'>
              <span className='font-medium'>Initiator</span>
              <span
                className='font-medium  truncate max-w-[140px]'
                title={USERS_MAP[project.created_by] || project.created_by}
              >
                {USERS_MAP[project.created_by] || 'Unknown'}
              </span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='font-medium'>Actioner</span>
              <span
                className='font-medium  truncate max-w-[140px]'
                title={actionerNames}
              >
                {actionerNames || '-'}
              </span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='font-medium'>Timeline</span>
              <span className='font-medium '>
                {project.start_date || '-'} → {project.end_date || '-'}
              </span>
            </div>
          </div>

          {/* Footer Badges */}
          <div className='flex items-center justify-between pt-2.5 border-t border-zinc-100'>
            <div className='flex items-center gap-1.5'>
              <span className='text-[10px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600'>
                {project.project_type || '-'}
              </span>
              <span className='text-[10px] uppercase tracking-wide font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100'>
                {project.priority || '-'}
              </span>
            </div>
            {overdue && (
              <span className='text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-100'>
                OVERDUE
              </span>
            )}
          </div>

          {/* Action Buttons */}
          {isApprover &&
            (project.status === 'pending_for_approve' ||
              project.status === 'pending_for_review') && (
              <div className='flex gap-2 pt-2'>
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) =>
                    handleAction(
                      e,
                      project.status === 'pending_for_approve'
                        ? 'planning'
                        : 'completed',
                    )
                  }
                  className='flex-1 text-[11px] font-bold py-1.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors'
                >
                  Approve
                </button>
                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => handleAction(e, 'rejected')}
                  className='flex-1 text-[11px] font-bold py-1.5 rounded bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors'
                >
                  Reject
                </button>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── DroppableProjectColumn ─────────────────────────────────────────────────

function DroppableProjectColumn({
  status,
  projects,
  onEdit,
  navigate,
  onStatusChange,
}: {
  status: string
  projects: any[]
  onEdit: (p: any) => void
  navigate: (path: string) => void
  onStatusChange: (id: string, status: string) => void
}) {
  console.log({ projects })
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const style = COLUMN_STYLES[status]
  return (
    <div
      ref={setNodeRef}
      className={`min-w-[320px] w-[320px] flex flex-col gap-3 h-full p-3 rounded-lg transition-colors ${
        isOver ? 'border-blue-300 bg-blue-50/50' : ''
      }`}
    >
      <div
        className={`flex items-center gap-2 pb-2 mb-1 border-b  ${style.header}`}
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />
        <span className='text-xs font-bold uppercase tracking-wider '>
          {status}
        </span>
        <span className='ml-auto text-[11px] font-mono px-1.5 py-0.5 rounded-md'>
          {projects.length}
        </span>
      </div>
      <div className='flex flex-col gap-3 flex-1 overflow-y-auto pr-1 pb-2'>
        {projects.map((p) => (
          <DraggableProjectCard
            key={p.id}
            project={p}
            onEdit={onEdit}
            navigate={navigate}
            onStatusChange={onStatusChange}
          />
        ))}
        {projects.length === 0 && (
          <div
            className={`border-2 border-dashed rounded-md p-6 flex items-center justify-center text-xs font-medium transition-colors h-24 ${
              isOver
                ? 'border-blue-300 text-blue-500 bg-blue-50/50'
                : 'border-zinc-200 text-zinc-400'
            }`}
          >
            Drop project here
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProjectKanban({
  filters,
}: {
  filters: ProjectFilters
}) {
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [activeProject, setActiveProject] = useState<any>(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [projectList, setProjectList] = useState<any[]>([])
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const { data: projects } = useQuery({
    // Include filters in the queryKey so it refetches when filters change
    queryKey: ['projects', filters],
    queryFn: async () => {
      // Build the query string
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.assignee_id !== 'all')
        params.append('assignee_id', filters.assignee_id)
      if (filters.start_date) params.append('start_date', filters.start_date)
      if (filters.end_date) params.append('end_date', filters.end_date)
      if (filters.project_type !== 'all')
        params.append('project_type', filters.project_type)
      if (filters.status !== 'all') params.append('status', filters.status)

      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/projects?${params.toString()}`,
        {
          credentials: 'include',
        },
      )
      if (res.status === 403) return { forbidden: true }
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
  })

  // const projectList: any[] = projects?.data || []
  useEffect(() => {
    if (projects?.data) {
      setProjectList(
        projects.data.map((p: any) => ({
          ...p,
          id: String(p.id),
          actioner_ids: (p.actioner_ids ?? []).map(String),
        })),
      )
    }
  }, [projects])

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveProject(null)
    if (!over) return
    if (over.id === 'Completed') return
    const newStatus = STATUS_MAP[String(over.id)]

    // optimistic update
    setProjectList((prev) =>
      prev.map((p) =>
        String(p.id) === String(active.id) ? { ...p, status: newStatus } : p,
      ),
    )

    // persist
    updateProjectStatus({ id: String(active.id), status: newStatus })
  }
  const { mutate: updateProjectStatus } = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/projects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })

  function onDragStart(event: DragStartEvent) {
    const p = projectList.find((p) => String(p.id) === String(event.active.id))
    if (p) setActiveProject(p)
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className='flex gap-5 pb-6 overflow-x-auto items-start h-[calc(92vh-140px)] min-h-0 px-1'>
          {COLUMNS.map((col) => {
            const colProjects = projectList.filter(
              (p) => p.status === STATUS_MAP[col],
            )
            return (
              <DroppableProjectColumn
                key={col}
                status={col}
                projects={colProjects}
                onEdit={setEditProject}
                navigate={navigate}
                onStatusChange={(id, status) =>
                  setProjectList((prev) =>
                    prev.map((p) => (p.id === id ? { ...p, status } : p)),
                  )
                }
              />
            )
          })}
        </div>

        <DragOverlay>
          {activeProject && (
            <Card className='cursor-grabbing shadow-xl shadow-zinc-200/50 border border-blue-200 opacity-90 scale-105 rotate-2 py-0'>
              <CardContent className='p-3 text-sm bg-white rounded-lg'>
                <p className='font-semibold text-zinc-900 line-clamp-2'>
                  {activeProject.name}
                </p>
                <div className='flex items-center gap-1.5 mt-2'>
                  <span className='text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600'>
                    {activeProject.project_type || 'N/A'}
                  </span>
                  <span className='text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100'>
                    {activeProject.priority || 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </DragOverlay>
      </DndContext>

      <EditProjectModal
        open={!!editProject}
        onClose={() => setEditProject(null)}
        project={editProject}
        onUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ['projects'] })
          setEditProject(null)
        }}
      />
    </>
  )
}
