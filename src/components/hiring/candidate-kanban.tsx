import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Plus, X, RotateCcw, Eye, Phone, MapPin, Briefcase } from 'lucide-react'
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
  PG_QUALIFICATIONS,
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
  language_proficiency?: string[]
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
  const [form, setForm] = useState<Record<string, any>>(
    initialData ? { ...initialData } : {},
  )
  const [languages, setLanguages] = useState<string[]>(
    initialData?.language_proficiency || [],
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
        body: JSON.stringify({ ...form, language_proficiency: languages }),
      })
      return res.json()
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Updated' : 'Created')
      queryClient.invalidateQueries({ queryKey: ['all-candidates'] })
      onClose()
    },
  })

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
      <div className='bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col'>
        <div className='flex items-center justify-between p-6 bg-teal-600 text-white'>
          <h2 className='text-xl font-bold'>
            {isEdit ? 'Edit Candidate' : 'New Candidate'}
          </h2>
          <button onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className='flex-1 overflow-y-auto p-8 grid grid-cols-2 gap-6 bg-zinc-50'>
          <div className='col-span-2 space-y-1'>
            <Label>Name</Label>
            <Input
              value={form.candidate_name || ''}
              onChange={(e) => set('candidate_name', e.target.value)}
            />
          </div>
          <div className='space-y-1'>
            <Label>Status</Label>
            <Select
              value={form.candidate_status || ''}
              onValueChange={(v) => set('candidate_status', v)}
            >
              <SelectTrigger>
                <SelectValue />
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
            <Label>City</Label>
            <Input
              value={form.location_city || ''}
              onChange={(e) => set('location_city', e.target.value)}
            />
          </div>
          <div className='space-y-1'>
            <Label>Phone</Label>
            <Input
              value={form.phone_no || ''}
              onChange={(e) => set('phone_no', e.target.value)}
            />
          </div>
          <div className='space-y-1'>
            <Label>Email</Label>
            <Input
              value={form.email || ''}
              onChange={(e) => set('email', e.target.value)}
            />
          </div>

          <div className='col-span-2 border-b pt-4 font-bold text-teal-600 uppercase text-xs'>
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
            <Label>Passing Year</Label>
            <Input
              value={form.year_of_passing_ug || ''}
              onChange={(e) => set('year_of_passing_ug', e.target.value)}
            />
          </div>
          <div className='space-y-1'>
            <Label>Total Experience</Label>
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
            <Label>Resume Link</Label>
            <Input
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
                  onClick={() => toggleLang(l)}
                  className={`px-3 py-1 rounded-full border text-xs ${languages.includes(l) ? 'bg-teal-600 text-white' : 'bg-white text-zinc-500'}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className='p-6 border-t flex justify-end gap-3'>
          <Button variant='outline' onClick={onClose}>
            Cancel
          </Button>
          <Button className='bg-teal-600' onClick={() => mutation.mutate()}>
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function CandidateKanban() {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null,
  )
  const [showCreate, setShowCreate] = useState(false)
  const [filters, setFilters] = useState({
    candidate_status: '',
    location_city: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['all-candidates', filters],
    queryFn: async () => {
      const p = new URLSearchParams()
      if (filters.candidate_status)
        p.set('candidate_status', filters.candidate_status)
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/candidates?${p}`, {
        credentials: 'include',
      })
      return res.json()
    },
  })

  const candidates = data?.data ?? []
  const grouped = CANDIDATE_KANBAN_COLUMNS.reduce(
    (acc, s) => ({
      ...acc,
      [s]: candidates.filter(
        (c: any) => (c.candidate_status || 'New Application') === s,
      ),
    }),
    {} as any,
  )

  return (
    <div className='w-full h-full p-6 flex flex-col max-w-[1600px] mx-auto'>
      {(showCreate || selectedCandidate) && (
        <CandidateModal
          key={selectedCandidate?.id || 'new'}
          onClose={() => {
            setShowCreate(false)
            setSelectedCandidate(null)
          }}
          initialData={selectedCandidate || undefined}
        />
      )}

      <div className='flex items-center justify-between mb-6'>
        <h1 className='text-2xl font-black text-zinc-900'>Candidate Module</h1>
        <Button className='bg-teal-600' onClick={() => setShowCreate(true)}>
          <Plus size={16} className='mr-2' /> New Candidate
        </Button>
      </div>

      <div className='flex gap-3 mb-6 p-3 border rounded-xl bg-white shadow-sm'>
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
        {filters.candidate_status && (
          <Button
            variant='ghost'
            size='sm'
            className='h-8 text-xs'
            onClick={() =>
              setFilters({ candidate_status: '', location_city: '' })
            }
          >
            <RotateCcw size={14} className='mr-2' /> Clear
          </Button>
        )}
      </div>

      <div className='flex gap-5 overflow-x-auto flex-1'>
        {CANDIDATE_KANBAN_COLUMNS.map((s) => (
          <div
            key={s}
            className='min-w-[300px] flex flex-col gap-4 p-3 border bg-zinc-50/50 rounded-2xl'
          >
            <div className='text-xs font-black uppercase text-zinc-500 border-b pb-2 flex justify-between'>
              <span>{s}</span>
              <span>{grouped[s]?.length || 0}</span>
            </div>
            <div className='flex flex-col gap-3 overflow-y-auto'>
              {grouped[s]?.map((c: any) => (
                <Card
                  key={c.id}
                  className='cursor-pointer hover:border-teal-500 transition-all'
                  onClick={() => setSelectedCandidate(c)}
                >
                  <CardContent className='p-4'>
                    <p className='font-bold'>{c.candidate_name}</p>
                    <div className='text-[10px] text-zinc-500 mt-2'>
                      <MapPin size={10} className='inline mr-1' />{' '}
                      {c.location_city}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
