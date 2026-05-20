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

// ── Create/Edit Modal ───────────────────────────────────────────
function CreateJRModal({
  onClose,
  initialData,
}: {
  onClose: () => void
  initialData?: JR
}) {
  const queryClient = useQueryClient()
  const isEdit = !!initialData

  // Fetch full details if editing to populate live Mongo Notes
  const { data: detailData } = useQuery({
    queryKey: ['job-requirement-detail', initialData?.id],
    queryFn: async () => {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/job-requirements?jr_id=${initialData?.id}`,
        { credentials: 'include' },
      )
      return res.json()
    },
    enabled: isEdit,
  })

  const fullJR = detailData?.data?.[0] || initialData

  const [form, setForm] = useState<Record<string, any>>({})
  const [languages, setLanguages] = useState<string[]>([])
  const [ugQualifications, setUgQualifications] = useState<string[]>([])
  const [pgQualifications, setPgQualifications] = useState<string[]>([])
  const [newNote, setNewNote] = useState('')

  useEffect(() => {
    if (fullJR) {
      setForm({ ...fullJR })
      setLanguages(fullJR.language_proficiency || [])
      setUgQualifications(fullJR.educational_qualification_ug || [])
      setPgQualifications(fullJR.educational_qualification_pg || [])
    } else {
      setForm({})
      setLanguages([])
      setUgQualifications([])
      setPgQualifications([])
    }
  }, [fullJR])

  const set = (key: string, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const toggleItem = (
    list: string[],
    setList: (v: string[]) => void,
    item: string,
  ) => {
    setList(
      list.includes(item) ? list.filter((i) => i !== item) : [...list, item],
    )
  }

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        language_proficiency: languages,
        educational_qualification_ug: ugQualifications,
        educational_qualification_pg: pgQualifications,
      }
      const url = isEdit
        ? `${ENV.VITE_BACKEND_BASE_URL}/job-requirements/${initialData.id}`
        : `${ENV.VITE_BACKEND_BASE_URL}/job-requirements`

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to save')
      return res.json()
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Requirement Updated' : 'Requirement Created')
      queryClient.invalidateQueries({ queryKey: ['job-requirements'] })
      onClose()
    },
    onError: (e: any) => toast.error(e.message),
  })

  const noteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          parent_id: String(initialData?.id),
          module: 'JobRequirement',
          content: newNote,
        }),
      })
      if (!res.ok) throw new Error('Failed to post note')
      return res.json()
    },
    onSuccess: () => {
      setNewNote('')
      queryClient.invalidateQueries({
        queryKey: ['job-requirement-detail', initialData?.id],
      })
      toast.success('Note Added')
    },
    onError: (e: any) => toast.error(e.message),
  })

  const getVal = (key: string) => form[key] || ''

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'>
      <div className='bg-background rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b bg-blue-600 text-white'>
          <h2 className='text-xl font-bold'>
            {isEdit ? 'Edit Job Requirement' : 'New Job Requirement'}
          </h2>
          <button
            onClick={onClose}
            className='hover:bg-blue-500 rounded-full p-1'
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Body */}
        <div className='flex-1 overflow-y-auto p-8 bg-zinc-50/50 space-y-8'>
          <div className='grid grid-cols-3 gap-x-8 gap-y-6'>
            {/* --- SECTION 1: HIRING REQUIREMENTS --- */}
            <div className='col-span-3 border-b pb-2'>
              <h3 className='text-sm font-black text-blue-600 tracking-widest uppercase'>
                Hiring Requirements
              </h3>
            </div>

            <div className='space-y-1'>
              <Label>Hiring Position</Label>
              <Select
                value={getVal('hiring_position')}
                onValueChange={(v) => set('hiring_position', v)}
              >
                <SelectTrigger className='h-9'>
                  <SelectValue placeholder='Select Position' />
                </SelectTrigger>
                <SelectContent>
                  {HIRING_POSITIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-1'>
              <Label>Department</Label>
              <Select
                value={getVal('department')}
                onValueChange={(v) => set('department', v)}
              >
                <SelectTrigger className='h-9'>
                  <SelectValue placeholder='Select Department' />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-1'>
              <Label>Level</Label>
              <Select
                value={getVal('level')}
                onValueChange={(v) => set('level', v)}
              >
                <SelectTrigger className='h-9'>
                  <SelectValue placeholder='Select Level' />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-1'>
              <Label>Sub Level</Label>
              <Select
                value={getVal('sub_level')}
                onValueChange={(v) => set('sub_level', v)}
              >
                <SelectTrigger className='h-9'>
                  <SelectValue placeholder='Select Sub level' />
                </SelectTrigger>
                <SelectContent>
                  {SUB_LEVELS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-1'>
              <Label>No of Vacancies</Label>
              <Input
                type='number'
                value={getVal('no_of_vacancies')}
                className='h-9'
                onChange={(e) => set('no_of_vacancies', e.target.value)}
              />
            </div>

            <div className='space-y-1'>
              <Label>Location (City)</Label>
              <Select
                value={getVal('hiring_location_city')}
                onValueChange={(v) => set('hiring_location_city', v)}
              >
                <SelectTrigger className='h-9'>
                  <SelectValue placeholder='Select City' />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-1'>
              <Label>Gender</Label>
              <Select
                value={getVal('gender')}
                onValueChange={(v) => set('gender', v)}
              >
                <SelectTrigger className='h-9'>
                  <SelectValue placeholder='Select Gender' />
                </SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-1'>
              <Label>Age Limit</Label>
              <Input
                type='number'
                value={getVal('age_limit')}
                className='h-9'
                placeholder='Max Age'
                onChange={(e) => set('age_limit', e.target.value)}
              />
            </div>

            <div className='space-y-1'>
              <Label>TAT (Days)</Label>
              <Input
                type='number'
                value={getVal('tat')}
                className='h-9'
                onChange={(e) => set('tat', e.target.value)}
              />
            </div>

            {/* --- SECTION 2: COMPENSATION & TIMELINE --- */}
            <div className='col-span-3 border-b pb-2 pt-2'>
              <h3 className='text-sm font-black text-blue-600 tracking-widest uppercase'>
                Compensation & Timeline
              </h3>
            </div>

            <div className='space-y-1'>
              <Label>Min Annual CTC</Label>
              <Input
                value={getVal('min_annual_ctc')}
                className='h-9'
                placeholder='Currency Min'
                onChange={(e) => set('min_annual_ctc', e.target.value)}
              />
            </div>

            <div className='space-y-1'>
              <Label>Max Annual CTC</Label>
              <Input
                value={getVal('max_annual_ctc')}
                className='h-9'
                placeholder='Currency Max'
                onChange={(e) => set('max_annual_ctc', e.target.value)}
              />
            </div>

            <div className='space-y-1'>
              <Label>Position Open Date</Label>
              <Input
                type='date'
                value={getVal('position_open_date')?.split('T')[0]}
                className='h-9'
                onChange={(e) => set('position_open_date', e.target.value)}
              />
            </div>

            <div className='space-y-1'>
              <Label>Joining Date</Label>
              <Input
                type='date'
                value={getVal('tentative_joining_date')?.split('T')[0]}
                className='h-9'
                onChange={(e) => set('tentative_joining_date', e.target.value)}
              />
            </div>

            <div className='space-y-1 col-span-2'>
              <Label>Qualification (Single Line Overview)</Label>
              <Input
                value={getVal('qualification')}
                className='h-9'
                placeholder='e.g. Graduate with Banking Knowledge'
                onChange={(e) => set('qualification', e.target.value)}
              />
            </div>

            {/* --- SECTION 3: EDUCATION (Multi-select) --- */}
            <div className='col-span-3 border-b pb-2 pt-2'>
              <h3 className='text-sm font-black text-blue-600 tracking-widest uppercase'>
                Education Requirements
              </h3>
            </div>

            <div className='col-span-3 space-y-2'>
              <Label>Educational Qualification (UG)</Label>
              <div className='flex flex-wrap gap-2'>
                {['B.Tech', 'B.E', 'BCA', 'B.Sc', 'B.Com', 'BBA'].map((q) => (
                  <button
                    key={q}
                    type='button'
                    onClick={() =>
                      toggleItem(ugQualifications, setUgQualifications, q)
                    }
                    className={`px-3 py-1 rounded-full text-[10px] border font-bold transition-all ${ugQualifications.includes(q) ? 'bg-blue-600 text-white' : 'bg-white text-zinc-500'}`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div className='col-span-3 space-y-2'>
              <Label>Educational Qualification (PG)</Label>
              <div className='flex flex-wrap gap-2'>
                {['M.Tech', 'ME', 'MCA', 'M.Sc', 'MBA', 'MA'].map((q) => (
                  <button
                    key={q}
                    type='button'
                    onClick={() =>
                      toggleItem(pgQualifications, setPgQualifications, q)
                    }
                    className={`px-3 py-1 rounded-full text-[10px] border font-bold transition-all ${pgQualifications.includes(q) ? 'bg-blue-600 text-white' : 'bg-white text-zinc-500'}`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* --- SECTION 4: WORK EXPERIENCE --- */}
            <div className='col-span-3 border-b pb-2 pt-2'>
              <h3 className='text-sm font-black text-blue-600 tracking-widest uppercase'>
                Work Experience
              </h3>
            </div>

            <div className='space-y-1'>
              <Label>Experience Range</Label>
              <Select
                value={getVal('experience')}
                onValueChange={(v) => set('experience', v)}
              >
                <SelectTrigger className='h-9'>
                  <SelectValue placeholder='Select Picklist' />
                </SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_OPTIONS.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-1'>
              <Label>Exp. Department</Label>
              <Select
                value={getVal('work_experience_department')}
                onValueChange={(v) => set('work_experience_department', v)}
              >
                <SelectTrigger className='h-9'>
                  <SelectValue placeholder='Select Exp Dept' />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='col-span-3 space-y-1'>
              <Label>Work Description</Label>
              <textarea
                className='w-full border rounded-xl p-3 text-sm min-h-[80px] bg-white outline-none'
                value={getVal('work_description')}
                onChange={(e) => set('work_description', e.target.value)}
              />
            </div>

            {/* --- SECTION 5: SKILLS & LANGUAGES --- */}
            <div className='col-span-3 border-b pb-2 pt-2'>
              <h3 className='text-sm font-black text-blue-600 tracking-widest uppercase'>
                Skills & Languages
              </h3>
            </div>

            <div className='col-span-3 space-y-1'>
              <Label>Skills Required</Label>
              <Input
                value={getVal('skills')}
                className='h-9'
                placeholder='Skills separated by comma'
                onChange={(e) => set('skills', e.target.value)}
              />
            </div>

            <div className='col-span-3 space-y-2'>
              <Label>Language Proficiency</Label>
              <div className='flex flex-wrap gap-2'>
                {LANGUAGE_OPTIONS.map((l) => (
                  <button
                    key={l}
                    type='button'
                    onClick={() => toggleItem(languages, setLanguages, l)}
                    className={`px-4 py-1 rounded-full text-xs font-semibold border transition-all ${languages.includes(l) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-zinc-500'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* --- SECTION 6: ASSIGNMENT --- */}
            <div className='col-span-3 border-b pb-2 pt-2'>
              <h3 className='text-sm font-black text-blue-600 tracking-widest uppercase'>
                Assignment & Description
              </h3>
            </div>

            <div className='space-y-1'>
              <Label>Approver ID</Label>
              <Input
                value={getVal('approver_id')}
                placeholder='User ID'
                onChange={(e) => set('approver_id', e.target.value)}
                className='h-9'
              />
            </div>

            <div className='space-y-1'>
              <Label>Assignee ID</Label>
              <Input
                value={getVal('assignee_id')}
                placeholder='HR Dept User ID'
                onChange={(e) => set('assignee_id', e.target.value)}
                className='h-9'
              />
            </div>

            <div className='space-y-1'>
              <Label>Reporting Manager</Label>
              <Input
                value={getVal('reporting_manager')}
                placeholder='Manager Name/Title'
                onChange={(e) => set('reporting_manager', e.target.value)}
                className='h-9'
              />
            </div>

            <div className='col-span-3 space-y-1'>
              <Label>Job Description</Label>
              <textarea
                className='w-full border rounded-xl p-4 text-sm min-h-[120px] bg-white outline-none'
                value={getVal('job_description')}
                onChange={(e) => set('job_description', e.target.value)}
              />
            </div>
          </div>

          {/* --- MONGO NOTES WORKFLOW TIMELINE SECTION --- */}
          {isEdit && (
            <div className='border-t pt-6 space-y-4'>
              <h3 className='text-sm font-black text-zinc-700 uppercase tracking-wider'>
                Notes Timeline
              </h3>

              <div className='bg-zinc-100/60 p-4 rounded-xl space-y-3 max-h-48 overflow-y-auto border border-zinc-200'>
                {fullJR?.notes && fullJR.notes.length > 0 ? (
                  fullJR.notes.map((n: any, index: number) => (
                    <div
                      key={index}
                      className='bg-white p-3 rounded-lg border shadow-sm text-xs space-y-1'
                    >
                      <p className='text-zinc-800 font-medium'>{n.content}</p>
                      <div className='text-[10px] text-zinc-400 flex justify-between'>
                        <span>By: {n.user_name || 'System User'}</span>
                        <span>
                          {n.created_time
                            ? new Date(n.created_time).toLocaleString()
                            : ''}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className='text-center text-zinc-400 text-xs py-4 uppercase font-bold'>
                    No Thread Activity Found
                  </p>
                )}
              </div>

              <div className='flex gap-3 items-end'>
                <div className='flex-1 space-y-1'>
                  <Label>Write Activity Note</Label>
                  <Input
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder='Type transaction update note...'
                    className='h-10 bg-white'
                  />
                </div>
                <Button
                  onClick={() => noteMutation.mutate()}
                  disabled={noteMutation.isPending || !newNote.strip()}
                  className='bg-zinc-800 hover:bg-zinc-900 h-10 px-6 font-bold text-xs uppercase'
                >
                  Post Note
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='p-6 border-t bg-white flex justify-end gap-3 shrink-0'>
          <Button variant='outline' className='px-8' onClick={onClose}>
            Cancel
          </Button>
          <Button
            className='bg-blue-600 px-10 font-bold'
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Saving...' : 'Save Requirement'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────
export default function HiringKanban() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [selectedJR, setSelectedJR] = useState<JR | null>(null)
  const [filters, setFilters] = useState({
    department: '',
    hiring_position: '',
    hiring_location_city: '',
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
      {(showCreate || selectedJR) && (
        <CreateJRModal
          onClose={() => {
            setShowCreate(false)
            setSelectedJR(null)
          }}
          initialData={selectedJR || undefined}
        />
      )}

      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-2xl font-black text-zinc-900 uppercase tracking-tighter'>
          Hiring Board
        </h1>
        <Button
          size='sm'
          className='bg-blue-600 hover:bg-blue-700'
          onClick={() => setShowCreate(true)}
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

        {(filters.department ||
          filters.hiring_position ||
          filters.hiring_location_city) && (
          <Button
            variant='ghost'
            size='sm'
            className='h-8 text-xs text-zinc-500 hover:text-blue-600'
            onClick={() =>
              setFilters({
                department: '',
                hiring_position: '',
                hiring_location_city: '',
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
            onEdit={(jr) => setSelectedJR(jr)}
          />
        ))}
      </div>
    </div>
  )
}
