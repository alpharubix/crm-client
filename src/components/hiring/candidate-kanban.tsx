import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, X, RotateCcw, MapPin } from 'lucide-react'
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
  UG_QUALIFICATIONS,
  CANDIDATE_INDUSTRIES,
  LANGUAGE_OPTIONS,
} from '@/utils/hiring-constants'

interface Candidate {
  id: string
  candidate_name: string
  candidate_status?: string
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
  language_proficiency?: string[] | string // Backend might return string or array depending on your Model
}

// ── Standalone Candidate Modal ──────────────────────────────────
function CandidateModal({
  onClose,
  initialData,
}: {
  onClose: () => void
  initialData?: Candidate
}) {
  const queryClient = useQueryClient()
  const isEdit = !!initialData

  // Clean initial data for form state
  const [form, setForm] = useState<Record<string, any>>(
    initialData ? { ...initialData } : { candidate_status: 'New Application' },
  )

  // Handle languages (UI-only state, then merged on submit)
  const [languages, setLanguages] = useState<string[]>(
    Array.isArray(initialData?.language_proficiency)
      ? initialData.language_proficiency
      : [],
  )

  const set = (k: string, v: any) => setForm((prev) => ({ ...prev, [k]: v }))
  const toggleLang = (l: string) =>
    setLanguages((p) => (p.includes(l) ? p.filter((i) => i !== l) : [...p, l]))

  const mutation = useMutation({
    mutationFn: async () => {
      const url = isEdit
        ? `${ENV.VITE_BACKEND_BASE_URL}/candidates/${initialData.id}`
        : `${ENV.VITE_BACKEND_BASE_URL}/candidates`

      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          // Ensure we don't send technical ID strings in POST body
          id: isEdit ? initialData.id : undefined,
          language_proficiency: languages,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed to save candidate')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Candidate Updated' : 'Candidate Created')
      queryClient.invalidateQueries({ queryKey: ['all-candidates'] })
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.message)
    },
  })

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'>
      <div className='bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col'>
        <div className='flex items-center justify-between p-6 bg-teal-600 text-white'>
          <h2 className='text-xl font-bold'>
            {isEdit ? 'Edit Candidate' : 'New Candidate'}
          </h2>
          <button onClick={onClose} className='hover:bg-teal-700 p-1 rounded'>
            <X size={24} />
          </button>
        </div>

        <div className='flex-1 overflow-y-auto p-8 grid grid-cols-2 gap-6 bg-zinc-50'>
          <div className='col-span-2 space-y-1'>
            <Label>Candidate Name</Label>
            <Input
              placeholder='Full Name'
              value={form.candidate_name || ''}
              onChange={(e) => set('candidate_name', e.target.value)}
            />
          </div>
          <div className='space-y-1'>
            <Label>Current Status</Label>
            <Select
              value={form.candidate_status || ''}
              onValueChange={(v) => set('candidate_status', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder='Select Status' />
              </SelectTrigger>
              <SelectContent>
                {CANDIDATE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-1'>
            <Label>City / Location</Label>
            <Input
              value={form.location_city || ''}
              onChange={(e) => set('location_city', e.target.value)}
            />
          </div>
          <div className='space-y-1'>
            <Label>Phone Number</Label>
            <Input
              value={form.phone_no || ''}
              onChange={(e) => set('phone_no', e.target.value)}
            />
          </div>
          <div className='space-y-1'>
            <Label>Email Address</Label>
            <Input
              type='email'
              value={form.email || ''}
              onChange={(e) => set('email', e.target.value)}
            />
          </div>

          <div className='col-span-2 border-b pt-4 font-bold text-teal-600 uppercase text-[10px] tracking-wider'>
            Education & Experience
          </div>
          <div className='space-y-1'>
            <Label>UG Qualification</Label>
            <Select
              value={form.educational_qualification_ug || ''}
              onValueChange={(v) => set('educational_qualification_ug', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UG_QUALIFICATIONS.map((q) => (
                  <SelectItem key={q} value={q}>
                    {q}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-1'>
            <Label>Passing Year (UG)</Label>
            <Input
              value={form.year_of_passing_ug || ''}
              onChange={(e) => set('year_of_passing_ug', e.target.value)}
            />
          </div>
          <div className='space-y-1'>
            <Label>Total Experience (Years)</Label>
            <Input
              value={form.work_experience || ''}
              onChange={(e) => set('work_experience', e.target.value)}
            />
          </div>
          <div className='space-y-1'>
            <Label>Industry</Label>
            <Select
              value={form.industry || ''}
              onValueChange={(v) => set('industry', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CANDIDATE_INDUSTRIES.map((i) => (
                  <SelectItem key={i} value={i}>
                    {i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='col-span-2 space-y-1'>
            <Label>Resume Link (URL)</Label>
            <Input
              placeholder='https://...'
              value={form.resume || ''}
              onChange={(e) => set('resume', e.target.value)}
            />
          </div>
          <div className='col-span-2 space-y-1'>
            <Label>Languages</Label>
            <div className='flex flex-wrap gap-2'>
              {LANGUAGE_OPTIONS.map((l) => (
                <button
                  key={l}
                  type='button'
                  onClick={() => toggleLang(l)}
                  className={`px-3 py-1 rounded-full border text-xs transition-colors ${
                    languages.includes(l)
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-zinc-500 hover:border-teal-300'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className='p-6 border-t flex justify-end gap-3 bg-white'>
          <Button
            variant='outline'
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            className='bg-teal-600 hover:bg-teal-700'
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Saving...' : 'Save Candidate'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function CandidateKanban() {
  const queryClient = useQueryClient()
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null,
  )
  const [showCreate, setShowCreate] = useState(false)
  const [filters, setFilters] = useState({
    candidate_status: '',
    candidate_name: '',
  })

  // Fetching data using your Backend Pagination/Filter logic
  const { data, isLoading } = useQuery({
    queryKey: ['all-candidates', filters],
    queryFn: async () => {
      const p = new URLSearchParams()
      p.set('page', '1') // Hardcoded to 1 for Kanban view
      if (filters.candidate_status)
        p.set('candidate_status', filters.candidate_status)
      if (filters.candidate_name)
        p.set('candidate_name', filters.candidate_name)

      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/candidates?${p}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to fetch candidates')
      return res.json()
    },
  })

  const candidates = data?.data ?? []

  // Re-grouping data for Kanban columns
  const grouped = CANDIDATE_KANBAN_COLUMNS.reduce(
    (acc, s) => ({
      ...acc,
      [s]: candidates.filter(
        (c: Candidate) => (c.candidate_status || 'New Application') === s,
      ),
    }),
    {} as Record<string, Candidate[]>,
  )

  return (
    <div className='w-full h-full p-6 flex flex-col max-w-[1600px] mx-auto'>
      {(showCreate || selectedCandidate) && (
        <CandidateModal
          onClose={() => {
            setShowCreate(false)
            setSelectedCandidate(null)
          }}
          initialData={selectedCandidate || undefined}
        />
      )}

      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-2xl font-black text-zinc-900'>
            Recruitment Pipeline
          </h1>
          <p className='text-sm text-zinc-500'>
            Manage and track candidate progress
          </p>
        </div>
        <Button
          className='bg-teal-600 hover:bg-teal-700'
          onClick={() => setShowCreate(true)}
        >
          <Plus size={16} className='mr-2' /> New Candidate
        </Button>
      </div>

      {/* Filters */}
      <div className='flex gap-3 mb-6 p-3 border rounded-xl bg-white shadow-sm items-center'>
        <Input
          placeholder='Search by name...'
          className='w-64 h-8 text-xs'
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
          <SelectTrigger className='w-48 h-8 text-xs'>
            <SelectValue placeholder='Filter by Status' />
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

        {(filters.candidate_status || filters.candidate_name) && (
          <Button
            variant='ghost'
            size='sm'
            className='h-8 text-xs text-zinc-500'
            onClick={() =>
              setFilters({ candidate_status: '', candidate_name: '' })
            }
          >
            <RotateCcw size={14} className='mr-2' /> Reset
          </Button>
        )}
      </div>

      {/* Kanban Board */}
      <div className='flex gap-5 overflow-x-auto flex-1 pb-4'>
        {CANDIDATE_KANBAN_COLUMNS.map((s) => (
          <div
            key={s}
            className='min-w-[320px] max-w-[320px] flex flex-col gap-4 p-3 border bg-zinc-50/50 rounded-2xl'
          >
            <div className='text-[11px] font-black uppercase text-zinc-400 border-b pb-2 px-1 flex justify-between items-center'>
              <span>{s}</span>
              <span className='bg-zinc-200 text-zinc-700 px-2 py-0.5 rounded-full'>
                {grouped[s]?.length || 0}
              </span>
            </div>

            <div className='flex flex-col gap-3 overflow-y-auto pr-1'>
              {isLoading ? (
                <div className='text-center py-10 text-zinc-400 text-xs'>
                  Loading...
                </div>
              ) : (
                grouped[s]?.map((c: Candidate) => (
                  <Card
                    key={c.id}
                    className='cursor-pointer hover:border-teal-500 hover:shadow-md transition-all group'
                    onClick={() => setSelectedCandidate(c)}
                  >
                    <CardContent className='p-4'>
                      <p className='font-bold text-zinc-800 group-hover:text-teal-700 transition-colors'>
                        {c.candidate_name}
                      </p>
                      <div className='flex items-center text-[10px] text-zinc-500 mt-3'>
                        <MapPin size={10} className='mr-1' />
                        {c.location_city || 'Remote / Not Set'}
                      </div>
                      <div className='mt-3 pt-3 border-t flex justify-between items-center'>
                        <span className='text-[10px] font-medium px-2 py-0.5 bg-zinc-100 rounded text-zinc-600'>
                          Exp: {c.work_experience || '0'} Yrs
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
