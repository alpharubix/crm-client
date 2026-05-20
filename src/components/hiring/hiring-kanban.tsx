import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Plus, RotateCcw, X, Pencil } from 'lucide-react'
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
  DEPARTMENTS,
  HIRING_POSITIONS,
  LEVELS,
  SUB_LEVELS,
  EXPERIENCE_OPTIONS,
  GENDERS,
  LANGUAGE_OPTIONS,
  LOCATIONS,
  JR_KANBAN_COLUMNS,
} from '@/utils/hiring-constants'

interface JR {
  id: number
  hiring_position?: string
  department?: string
  level?: string
  sub_level?: string
  experience?: string
  skills?: string
  min_annual_ctc?: string
  max_annual_ctc?: string
  position_open_date?: string
  no_of_vacancies?: number
  tentative_joining_date?: string
  tat?: number
  age_limit?: number
  gender?: string
  reporting_manager?: string
  qualification?: string
  educational_qualification_ug?: string[]
  educational_qualification_pg?: string[]
  hiring_location_city?: string
  language_proficiency?: string[]
  job_description?: string
  work_experience_department?: string
  work_description?: string
  notes?: Array<{
    id?: string
    content: string
    created_time?: string
    user_name?: string
  }>
}

// ── JR Card Component ───────────────────────────────────────────
function JRCard({
  jr,
  onNavigate,
  onEdit,
}: {
  jr: JR
  onNavigate: (id: number) => void
  onEdit: (jr: JR) => void
}) {
  return (
    <Card
      className='cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group relative'
      onClick={() => onNavigate(jr.id)}
    >
      <CardContent className='p-3 text-sm grid gap-1'>
        <div className='flex justify-between items-start'>
          <p className='font-semibold text-base leading-tight pr-6 uppercase'>
            {jr.hiring_position || '—'}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(jr)
            }}
            className='p-1.5 rounded-md hover:bg-blue-100 text-zinc-400 hover:text-blue-600 transition-colors'
          >
            <Pencil size={14} />
          </button>
        </div>

        <div className='grid grid-cols-[100px_1fr] gap-x-2 gap-y-1 mt-2 text-xs'>
          <span className='text-muted-foreground'>Location</span>
          <span>{jr.hiring_location_city || '—'}</span>
          <span className='text-muted-foreground'>Experience</span>
          <span>{jr.experience || '—'}</span>
          <span className='text-muted-foreground'>Vacancies</span>
          <span className='font-bold'>{jr.no_of_vacancies ?? '—'}</span>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Kanban Column Component ──────────────────────────────────────
function KanbanColumn({
  dept,
  jrs,
  onNavigate,
  onEdit,
}: {
  dept: string
  jrs: JR[]
  onNavigate: (id: number) => void
  onEdit: (jr: JR) => void
}) {
  return (
    <div className='min-w-[280px] w-full flex flex-col gap-3 h-full p-2 rounded border border-border bg-zinc-50/30'>
      <div className='flex items-center gap-2 pb-2 border-b'>
        <span className='w-2 h-2 rounded bg-blue-500 shrink-0' />
        <span className='text-xs font-black uppercase tracking-wide text-blue-600'>
          {dept}
        </span>
        <span className='ml-auto text-xs font-mono text-muted-foreground bg-white px-2 py-0.5 rounded border'>
          {jrs.length}
        </span>
      </div>
      <div className='flex flex-col gap-3 flex-1 overflow-y-auto pr-1 pb-2'>
        {jrs.map((jr) => (
          <JRCard key={jr.id} jr={jr} onNavigate={onNavigate} onEdit={onEdit} />
        ))}
        {jrs.length === 0 && (
          <div className='border border-dashed rounded-xl p-8 text-center text-[10px] uppercase font-bold text-zinc-300'>
            No Requirements
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────
export default function HiringKanban() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({
    department: '',
    hiring_position: '',
    hiring_location_city: '',
    tentative_joining_date: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['job-requirements', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.set(k, v)
      })
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/job-requirements?${params}`,
        { credentials: 'include' },
      )
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
  })

  const jrs: JR[] = data?.data ?? []
  const grouped: Record<string, JR[]> = {}
  JR_KANBAN_COLUMNS.forEach((col) => {
    grouped[col] = []
  })
  jrs.forEach((jr) => {
    const dept = jr.department || 'Other'
    if (grouped[dept]) grouped[dept].push(jr)
  })

  return (
    <div className='w-full h-full p-6 flex flex-col max-w-[1600px] mx-auto'>

      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-2xl font-black text-zinc-900 uppercase tracking-tighter'>
          Hiring Board
        </h1>
        <Button
          size='sm'
          className='bg-blue-600 hover:bg-blue-700'
          onClick={() => navigate('/hiring-create')}
        >
          <Plus size={16} className='mr-2' /> New Requirement
        </Button>
      </div>

      <div className='flex flex-wrap gap-3 mb-4 p-3 border rounded-md shadow-sm shrink-0 bg-white'>
        <Select
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, department: v === 'all' ? '' : v }))
          }
        >
          <SelectTrigger className='h-8 text-xs w-[160px]'>
            <SelectValue placeholder='Department' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Departments</SelectItem>
            {DEPARTMENTS.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, hiring_position: v === 'all' ? '' : v }))
          }
        >
          <SelectTrigger className='h-8 text-xs w-[180px]'>
            <SelectValue placeholder='Hiring Position' />
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
          onValueChange={(v) =>
            setFilters((f) => ({
              ...f,
              hiring_location_city: v === 'all' ? '' : v,
            }))
          }
        >
          <SelectTrigger className='h-8 text-xs w-[140px]'>
            <SelectValue placeholder='Location' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Locations</SelectItem>
            {LOCATIONS.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type='date'
          className='h-8 text-xs w-[160px]'
          value={filters.tentative_joining_date}
          onChange={(e) =>
            setFilters((f) => ({ ...f, tentative_joining_date: e.target.value }))
          }
          placeholder='Tentative Joining Date'
        />

        {(filters.department ||
          filters.hiring_position ||
          filters.hiring_location_city ||
          filters.tentative_joining_date) && (
          <Button
            variant='ghost'
            size='sm'
            className='h-8 text-xs text-zinc-500 hover:text-blue-600'
            onClick={() =>
              setFilters({
                department: '',
                hiring_position: '',
                hiring_location_city: '',
                tentative_joining_date: '',
              })
            }
          >
            <RotateCcw size={14} className='mr-2' /> Reset Board
          </Button>
        )}
      </div>

      {/* Kanban Board */}
      <div className='flex gap-5 pb-6 overflow-x-auto items-start flex-1'>
        {JR_KANBAN_COLUMNS.map((dept) => (
          <KanbanColumn
            key={dept}
            dept={dept}
            jrs={grouped[dept] ?? []}
            onNavigate={(id) => navigate(`/jr/${id}`)}
            onEdit={(jr) => navigate(`/hiring/${jr.id}/edit`)}
          />
        ))}
      </div>
    </div>
  )
}
