import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Plus, RotateCcw, Pencil, Check, X } from 'lucide-react'
import { ENV } from '@/conf'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BUSINESS_VERTICAL,
  DEPARTMENTS,
  HIRING_POSITIONS,
  LOCATIONS,
  POSITION_TYPE,
} from '@/utils/hiring-constants'
import { Label } from '../ui/label'
import { useAuth } from '@/context/auth-context'

interface JR {
  id: number
  status?: string
  hiring_position?: string
  department?: string
  experience?: string
  no_of_vacancies?: number
  hiring_location_city?: string
  approver_id?: string
  language_proficiency?: string[]
}

// ── JR Card Component with Inline Workflow Actions ─────────────────
function JRCard({
  jr,
  onNavigate,
  onEdit,
  onStatusChange,
}: {
  jr: JR
  onNavigate: (id: number) => void
  onEdit: (jr: JR) => void
  onStatusChange: (id: number, nextStatus: string) => void
}) {
  // ── FIX: CONNECT LIVE AUTH CONTEXT HERE ──
  const { user } = useAuth()
  const currentUserRole = user?.role || ''

  // Enforce access rules: ONLY super_admin is allowed to approve/reject requirements directly on the cards
  const showWorkflowActions =
    jr.status !== 'approved' &&
    jr.status !== 'rejected' &&
    currentUserRole === 'super_admin'

  return (
    <Card
      className='cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group relative bg-white'
      onClick={() => onNavigate(jr.id)}
    >
      <CardContent className='p-3 text-sm grid gap-1'>
        <div className='flex justify-between items-start'>
          <p className='font-semibold text-sm leading-tight pr-6 uppercase text-zinc-900'>
            {jr.hiring_position || '—'}
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(jr)
            }}
            className='p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-blue-600 transition-colors'
          >
            <Pencil size={15} />
          </button>
        </div>

        <div className='grid grid-cols-[80px_1fr] gap-x-2 gap-y-0.5 mt-1.5 text-[11px]'>
          <span className='text-muted-foreground'>Location</span>
          <span className='text-zinc-700'>
            {jr.hiring_location_city || '—'}
          </span>
          <span className='text-muted-foreground'>Vacancies</span>
          <span className='font-bold text-zinc-800'>
            {jr.no_of_vacancies ?? '—'}
          </span>
          <span className='text-muted-foreground'>Languages</span>
          <span className='font-bold text-zinc-800'>
            {jr.language_proficiency?.join(', ') ?? '—'}
          </span>
        </div>

        {/* Action Triggers Grid Block directly inside the Kanban Item row */}
        {showWorkflowActions ? (
          <div
            className='mt-3 pt-2 border-t grid grid-cols-2 gap-2'
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              size='sm'
              variant='outline'
              className='h-7 text-[11px] font-bold border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 flex items-center justify-center gap-1'
              onClick={() => onStatusChange(jr.id, 'approved')}
            >
              <Check size={12} /> Approve
            </Button>
            <Button
              size='sm'
              variant='outline'
              className='h-7 text-[11px] font-bold border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 flex items-center justify-center gap-1'
              onClick={() => onStatusChange(jr.id, 'rejected')}
            >
              <X size={12} /> Reject
            </Button>
          </div>
        ) : (
          <div className='mt-2 pt-2 border-t flex justify-between items-center text-[10px] text-zinc-400 font-mono'>
            <span>ID: #{jr.id}</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border ${
                jr.status === 'approved'
                  ? 'bg-green-50 text-green-700 border-green-100'
                  : jr.status === 'rejected'
                    ? 'bg-red-50 text-red-700 border-red-100'
                    : 'bg-yellow-50 text-yellow-700 border-yellow-100'
              }`}
            >
              {jr.status || 'pending'}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Kanban Column Component ──────────────────────────────────────
function KanbanColumn({
  title,
  jrs,
  onNavigate,
  onEdit,
  onStatusChange,
  isPendingCol,
}: {
  title: string
  jrs: JR[]
  onNavigate: (id: number) => void
  onEdit: (jr: JR) => void
  onStatusChange: (id: number, nextStatus: string) => void
  isPendingCol: boolean
}) {
  return (
    <div
      className={`min-w-[290px] w-full flex flex-col gap-3 h-full p-2.5 rounded-xl border ${
        isPendingCol
          ? 'border-yellow-200 bg-yellow-50/20'
          : 'border-border bg-zinc-50/30'
      }`}
    >
      <div className='flex items-center gap-2 pb-2 border-b'>
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${isPendingCol ? 'bg-yellow-500 animate-pulse' : 'bg-blue-500'}`}
        />
        <span
          className={`text-xs font-black uppercase tracking-wide ${isPendingCol ? 'text-yellow-700' : 'text-blue-600'}`}
        >
          {title}
        </span>
        <span className='ml-auto text-xs font-mono text-muted-foreground bg-white px-2 py-0.5 rounded border shadow-sm'>
          {jrs.length}
        </span>
      </div>
      <div className='flex flex-col gap-3 flex-1 overflow-y-auto pr-1 pb-2'>
        {jrs.map((jr) => (
          <JRCard
            key={jr.id}
            jr={jr}
            onNavigate={onNavigate}
            onEdit={onEdit}
            onStatusChange={onStatusChange}
          />
        ))}
        {jrs.length === 0 && (
          <div className='border border-dashed rounded-xl p-8 text-center text-[10px] uppercase font-bold text-zinc-300 bg-white/40'>
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

  // ── FIX: READ LIVE PERMISSIONS TO PROTECT THE MUTATION FLOWS ──
  const { user } = useAuth()
  const currentUserRole = user?.role || ''

  const [filters, setFilters] = useState({
    department: '',
    hiring_position: '',
    hiring_location_city: '',
    tentative_joining_date: '',
    business_vertical: '',
    position_type: '',
  })

  const KANBAN_COLUMNS = ['Pending Approval', ...DEPARTMENTS]

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

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      // API Backstop Protection
      if (currentUserRole !== 'super_admin') {
        throw new Error(
          'Unauthorized: Admin role does not hold approval permissions.',
        )
      }

      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/job-requirements/${id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status }),
        },
      )
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.detail || 'Workflow transmission error')
      }
      return res.json()
    },
    onSuccess: (_, variables) => {
      toast.success(
        `Requirement marked as ${variables.status.toUpperCase()} successfully`,
      )
      queryClient.invalidateQueries({ queryKey: ['job-requirements'] })
    },
    onError: (err: any) => toast.error(err.message),
  })

  const rawJrs: JR[] = data?.data ?? []
  const jrsList = Array.isArray(rawJrs) ? rawJrs : [rawJrs]

  const grouped: Record<string, JR[]> = {}
  KANBAN_COLUMNS.forEach((col) => {
    grouped[col] = []
  })

  jrsList.forEach((jr) => {
    if (!jr) return
    if (jr.status !== 'approved') {
      grouped['Pending Approval'].push(jr)
    } else {
      const deptKey = jr.department || 'Operations'
      if (grouped[deptKey]) {
        grouped[deptKey].push(jr)
      } else {
        if (!grouped['Operations']) grouped['Operations'] = []
        grouped['Operations'].push(jr)
      }
    }
  })

  const handleQuickStatusChange = (id: number, status: string) => {
    statusMutation.mutate({ id, status })
  }

  return (
    <div className='w-full h-full p-4 flex flex-col max-w-[1140px] mx-auto'>
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

      {/* Filters Form Control Element Rows */}
      <div className='flex flex-wrap gap-3 mb-6 p-3 border rounded-xl shadow-sm shrink-0 bg-white items-center'>
        <Select
          value={filters.department || 'all'}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, department: v === 'all' ? '' : v }))
          }
        >
          <SelectTrigger className='h-8 text-xs w-40'>
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
          value={filters.hiring_position || 'all'}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, hiring_position: v === 'all' ? '' : v }))
          }
        >
          <SelectTrigger className='h-8 text-xs w-45'>
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

        {/* <Select
          value={filters.hiring_location_city || 'all'}
          onValueChange={(v) =>
            setFilters((f) => ({
              ...f,
              hiring_location_city: v === 'all' ? '' : v,
            }))
          }
        >
          <SelectTrigger className='h-8 text-xs w-35'>
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
        </Select> */}

        <div className='space-y-1'>
          <Input
            placeholder='City'
            className='h-8 text-xs w-40'
            value={filters.hiring_location_city}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                hiring_location_city: e.target.value,
              }))
            }
          />
        </div>

        <Select
          value={filters.business_vertical || 'all'}
          onValueChange={(v) =>
            setFilters((f) => ({
              ...f,
              business_vertical: v === 'all' ? '' : v,
            }))
          }
        >
          <SelectTrigger className='h-8 text-xs w-35'>
            <SelectValue placeholder='Vertical' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Verticals</SelectItem>
            {BUSINESS_VERTICAL.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.position_type || 'all'}
          onValueChange={(v) =>
            setFilters((f) => ({
              ...f,
              position_type: v === 'all' ? '' : v,
            }))
          }
        >
          <SelectTrigger className='h-8 text-xs w-35'>
            <SelectValue placeholder='Positions' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Positions</SelectItem>
            {POSITION_TYPE.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Label className='text-xs text-zinc-500'>Joining Date</Label>
        <Input
          type='date'
          className='h-8 text-xs w-40'
          value={filters.tentative_joining_date}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              tentative_joining_date: e.target.value,
            }))
          }
        />

        {(filters.department ||
          filters.hiring_position ||
          filters.hiring_location_city ||
          filters.tentative_joining_date ||
          filters.business_vertical ||
          filters.position_type) && (
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
                business_vertical: '',
                position_type: '',
              })
            }
          >
            <RotateCcw size={14} className='mr-2' /> Reset Board
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className='flex items-center justify-center py-20 text-zinc-400 text-xs font-medium uppercase tracking-wider'>
          Loading Hiring Board Pipelines...
        </div>
      ) : (
        <div className='flex gap-5 pb-6 overflow-x-auto items-start h-[calc(92vh-140px)] min-h-0 px-1'>
          {KANBAN_COLUMNS.map((columnName) => (
            <KanbanColumn
              key={columnName}
              title={columnName}
              jrs={grouped[columnName] ?? []}
              isPendingCol={columnName === 'Pending Approval'}
              onNavigate={(id) => navigate(`/jr/${id}`)}
              onEdit={(jr) => navigate(`/hiring/${jr.id}/edit`)}
              onStatusChange={handleQuickStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}
