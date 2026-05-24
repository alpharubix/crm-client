import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, X, RotateCcw, MapPin, ArrowLeft, Pencil } from 'lucide-react'
import { ENV } from '@/conf'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CANDIDATE_STATUSES,
  CANDIDATE_KANBAN_COLUMNS,
  LOCATIONS,
  HIRING_POSITIONS,
} from '@/utils/hiring-constants'
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

interface Candidate {
  id: string
  job_requirement_id?: string
  candidate_name: string
  candidate_status?: string
  status_date?: string
  call_back_date?: string
  phone_no?: string
  email?: string
  location_city?: string
  work_experience?: string
  industry?: string
  resume?: string
  educational_qualification_ug?: string
  year_of_passing_ug?: string
  educational_qualification_pg?: string
  year_of_passing_pg?: string
  skills?: string
  language_proficiency?: string[] | string
  rating?: number
  feedback_status?: string
  feedback_form_link?: string
}

// ── Draggable Candidate Card Component ───────────────────────────────────────────
function DraggableCandidateCard({
  c,
  jrId,
  navigate,
}: {
  c: Candidate
  jrId: string | undefined
  navigate: ReturnType<typeof useNavigate>
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: String(c.id),
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={isDragging ? 'opacity-40' : ''}
    >
      <Card
        className='cursor-grab bg-white border hover:border-teal-500 hover:shadow-md transition-all group relative'
        onClick={() => navigate(`/candidate/${c.id}/edit?jr_id=${jrId}`)}
      >
        <CardContent className='p-4'>
          <div className='flex justify-between items-start gap-2'>
            <p className='font-bold text-zinc-800 group-hover:text-teal-700 transition-colors uppercase tracking-tight line-clamp-1'>
              {c.candidate_name}
            </p>
            <button
              onPointerDown={(e) => e.stopPropagation()} // Stop drag capture on button click
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/candidate/${c.id}/edit?jr_id=${jrId}`)
              }}
              className='opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-teal-600 transition-all'
            >
              <Pencil size={15} />
            </button>
          </div>

          <div className='flex items-center text-[10px] text-zinc-500 mt-3'>
            <MapPin size={10} className='mr-1' />
            {c.location_city || 'Location N/A'}
          </div>
          <div className='mt-3 pt-3 border-t flex justify-between items-center'>
            <span className='text-[10px] font-medium px-2 py-0.5 bg-zinc-100 rounded text-zinc-600'>
              Exp: {c.work_experience || '0'} Yrs
            </span>
            <span className='text-[9px] font-mono text-zinc-400'>
              ID: #{c.id}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Droppable Pipeline Column Component ───────────────────────────────────────────
function DroppableCandidateColumn({
  status,
  candidates,
  isLoading,
  jrId,
  navigate,
}: {
  status: string
  candidates: Candidate[]
  isLoading: boolean
  jrId: string | undefined
  navigate: ReturnType<typeof useNavigate>
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={`min-w-[320px] max-w-[320px] flex flex-col gap-4 p-3 border rounded-2xl transition-colors ${
        isOver
          ? 'border-teal-300 bg-teal-50/20'
          : 'bg-zinc-50/50 border-zinc-200'
      }`}
    >
      <div className='text-[11px] font-black uppercase text-zinc-400 border-b pb-2 px-1 flex justify-between items-center'>
        <span>{status}</span>
        <span className='bg-zinc-200 text-zinc-700 px-2 py-0.5 rounded-full font-mono'>
          {candidates?.length || 0}
        </span>
      </div>

      <div className='flex flex-col gap-3 overflow-y-auto pr-1 flex-1 min-h-[450px]'>
        {isLoading ? (
          <div className='text-center py-10 text-zinc-400 text-xs'>
            Loading candidates...
          </div>
        ) : (
          candidates?.map((c) => (
            <DraggableCandidateCard
              key={c.id}
              c={c}
              jrId={jrId}
              navigate={navigate}
            />
          ))
        )}
        {!isLoading && candidates?.length === 0 && (
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center text-[10px] uppercase font-bold transition-colors py-12 ${
              isOver
                ? 'border-teal-300 text-teal-600 bg-teal-50/10'
                : 'border-zinc-200 text-zinc-300 bg-white/40'
            }`}
          >
            Drop Candidate Here
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Pipeline Component ──────────────────────────────────────────────────────
export default function CandidateKanban() {
  const { jrId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [candidateList, setCandidateList] = useState<Candidate[]>([])
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null)

  const [filters, setFilters] = useState({
    candidate_status: '',
    candidate_name: '',
    tentative_joining_date: '',
    department: '',
    hiring_position: '',
    location_city: '',
  })

  // Pointer constraint overrides to keep standard button elements interactive
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  // Fetching candidates specifically for this JR
  const { data, isLoading } = useQuery({
    queryKey: ['candidates', jrId, filters],
    queryFn: async () => {
      const p = new URLSearchParams()
      p.set('page', '1')
      p.set('job_requirement_id', jrId || '')
      if (filters.candidate_status)
        p.set('candidate_status', filters.candidate_status)
      if (filters.candidate_name)
        p.set('candidate_name', filters.candidate_name)
      if (filters.tentative_joining_date)
        p.set('tentative_joining_date', filters.tentative_joining_date)
      if (filters.department) p.set('department', filters.department)
      if (filters.hiring_position)
        p.set('hiring_position', filters.hiring_position)
      if (filters.location_city) p.set('location_city', filters.location_city)

      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/candidates?${p}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to fetch candidates')
      return res.json()
    },
    enabled: !!jrId,
  })

  const { data: jrData } = useQuery({
    queryKey: ['job-requirement', jrId],
    queryFn: async () => {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/job-requirements?jr_id=${jrId}`,
        { credentials: 'include' },
      )
      return res.json()
    },
    enabled: !!jrId,
  })

  // Synchronize incoming query data payload into state tracker
  useEffect(() => {
    if (data?.data) {
      const list = Array.isArray(data.data) ? data.data : [data.data]
      setCandidateList(list.map((c: any) => ({ ...c, id: String(c.id) })))
    } else {
      setCandidateList([])
    }
  }, [data])

  // Drag and drop save tracking mutation hook
  const { mutate: updateCandidateStatus } = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/candidates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ candidate_status: status }),
      })
      if (!res.ok) throw new Error('Failed to update candidate database status')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error syncing drop lifecycle')
    },
  })

  const jrInfo = jrData?.data?.[0]

  // Compute column distribution maps from tracking state data
  const grouped = CANDIDATE_KANBAN_COLUMNS.reduce(
    (acc, colName) => ({
      ...acc,
      [colName]: candidateList.filter(
        (c) => (c.candidate_status || 'New Application') === colName,
      ),
    }),
    {} as Record<string, Candidate[]>,
  )

  function onDragStart(event: DragStartEvent) {
    const candidate = candidateList.find(
      (c) => String(c.id) === String(event.active.id),
    )
    if (candidate) setActiveCandidate(candidate)
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveCandidate(null)
    if (!over) return

    const targetStatus = String(over.id)

    // Dynamic state swapping optimization logic
    setCandidateList((prev) =>
      prev.map((c) =>
        String(c.id) === String(active.id)
          ? { ...c, candidate_status: targetStatus }
          : c,
      ),
    )

    updateCandidateStatus({ id: String(active.id), status: targetStatus })
  }

  return (
    <div className='w-full h-full p-4 flex flex-col max-w-[1140px] mx-auto'>
      {/* Header with Navigation and Context */}
      <div className='flex items-center justify-between mb-8 pb-6 border-b'>
        <div className='flex items-center gap-4'>
          <Button
            variant='outline'
            size='icon'
            className='rounded-full'
            onClick={() => navigate('/hiring')}
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className='text-2xl font-black text-zinc-900'>
              {jrInfo?.hiring_position || 'Pipeline'}
            </h1>
            <p className='text-sm text-zinc-500'>
              {jrInfo?.department ? `${jrInfo.department} • ` : ''}
              {jrInfo?.hiring_location_city || 'Recruitment Pipeline'}
            </p>
          </div>
        </div>
        <Button
          className='bg-teal-600 hover:bg-teal-700 shadow-lg'
          onClick={() => navigate(`/candidate-create?jr_id=${jrId}`)}
        >
          <Plus size={16} className='mr-2' /> New Candidate
        </Button>
      </div>

      {/* ── ALL ORIGINAL FILTERS PRESERVED ── */}
      <div className='flex flex-wrap gap-3 mb-6 p-4 border rounded-2xl bg-white shadow-sm items-center'>
        <Input
          placeholder='Search candidates...'
          className='w-72 h-9 text-xs rounded-xl'
          value={filters.candidate_name}
          onChange={(e) =>
            setFilters((f) => ({ ...f, candidate_name: e.target.value }))
          }
        />
        <Select
          value={filters.candidate_status || 'all'}
          onValueChange={(v) =>
            setFilters((f) => ({
              ...f,
              candidate_status: v === 'all' ? '' : v,
            }))
          }
        >
          <SelectTrigger className='w-48 h-9 text-xs rounded-xl'>
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Statuses</SelectItem>
            {CANDIDATE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.hiring_position || 'all'}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, hiring_position: v === 'all' ? '' : v }))
          }
        >
          <SelectTrigger className='w-40 h-9 text-xs rounded-xl'>
            <SelectValue placeholder='Position' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Positions</SelectItem>
            {HIRING_POSITIONS.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.location_city || 'all'}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, location_city: v === 'all' ? '' : v }))
          }
        >
          <SelectTrigger className='w-32 h-9 text-xs rounded-xl'>
            <SelectValue placeholder='Location' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Locs</SelectItem>
            {LOCATIONS.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* <Label>Tentative Joining Date</Label>
        <Input
          type='date'
          className='w-40 h-9 text-xs rounded-xl'
          value={filters.tentative_joining_date}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              tentative_joining_date: e.target.value,
            }))
          }
        /> */}

        {(filters.candidate_status ||
          filters.candidate_name ||
          filters.tentative_joining_date ||
          filters.department ||
          filters.hiring_position ||
          filters.location_city) && (
          <Button
            variant='ghost'
            size='sm'
            className='h-9 text-xs text-zinc-500 hover:text-teal-600'
            onClick={() =>
              setFilters({
                candidate_status: '',
                candidate_name: '',
                tentative_joining_date: '',
                department: '',
                hiring_position: '',
                location_city: '',
              })
            }
          >
            <RotateCcw size={14} className='mr-2' /> Reset
          </Button>
        )}
      </div>

      {/* Kanban Board Container Wrapped inside DndContext Context Engine */}
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className='flex gap-5 overflow-x-auto flex-1 pb-4 items-start min-h-[500px]'>
          {CANDIDATE_KANBAN_COLUMNS.map((columnName) => (
            <DroppableCandidateColumn
              key={columnName}
              status={columnName}
              candidates={grouped[columnName] || []}
              isLoading={isLoading}
              jrId={jrId}
              navigate={navigate}
            />
          ))}
        </div>

        {/* Floating element proxy displayed during movement operation */}
        <DragOverlay>
          {activeCandidate && (
            <Card className='cursor-grabbing shadow-xl border border-teal-500 scale-105 rotate-1 bg-white min-w-[290px]'>
              <CardContent className='p-4 bg-white rounded-2xl'>
                <p className='font-bold text-teal-700 uppercase'>
                  {activeCandidate.candidate_name}
                </p>
                <div className='flex items-center text-[10px] text-zinc-500 mt-2'>
                  <MapPin size={10} className='mr-1' />
                  {activeCandidate.location_city || 'Location N/A'}
                </div>
              </CardContent>
            </Card>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
