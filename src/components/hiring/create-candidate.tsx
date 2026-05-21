import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ENV, HR_USER_IDS, MANAGER_USER_IDS } from '@/conf'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, X } from 'lucide-react'
import SectionHeader from '@/components/shared/section-header'
import FieldRow from '@/components/shared/field-row'
import { Card, CardContent } from '@/components/ui/card'
import MultiSelectField from '@/components/shared/multi-select-field'
import SelectField from '@/components/shared/select-field'
import { Spinner } from '@/components/ui/spinner'

import {
  CANDIDATE_STATUSES,
  CANDIDATE_INDUSTRIES,
  LANGUAGE_OPTIONS,
  LOCATIONS,
  UG_QUALIFICATIONS,
  PG_QUALIFICATIONS,
} from '@/utils/hiring-constants'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import NoteDialog from '../shared/note-dialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { useAuth } from '@/context/auth-context'
import { formatExactDate } from '@/utils/date-formatter'

export default function CreateCandidate() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  // FIX: Track validation state exceptions for all three required parameters
  const [errors, setErrors] = useState<{
    candidate_name?: boolean
    phone_no?: boolean
    email?: boolean
  }>({})

  // Try to get jrId from search params (e.g. ?jr_id=123) if creating a candidate for a specific job requirement
  const searchParams = new URLSearchParams(location.search)
  const initialJrId = searchParams.get('jr_id')

  const [form, setForm] = useState<Record<string, any>>({
    jr_id: initialJrId || '',
  })
  const [languages, setLanguages] = useState<string[]>([])

  const isEdit = !!id

  // ── CORE ROLE & OPERATION ACCESS FLAGS ──
  const { user } = useAuth()
  const currentUserId = user?.user_id ? String(user.user_id) : ''
  const currentUserRole = user?.role || ''

  const isSuperAdmin = currentUserRole === 'super_admin'
  const isAdmin = currentUserRole === 'admin'
  const isHRTeam = HR_USER_IDS.includes(currentUserId)
  const isManager = MANAGER_USER_IDS.includes(currentUserId)

  // Super Admin, Admin, and HR roles hold modification rights over core data profiles
  const canModifyCandidateDetails = isSuperAdmin || isAdmin || isHRTeam

  // Managers hold operational note mapping authorization
  const canAddCandidateNotes = isSuperAdmin || isAdmin || isHRTeam || isManager

  // ── NOTES STATE & HANDLER CHANGES (CANDIDATE LEVEL) ────────────────
  const sortedNotes = [...(form.notes || [])].sort((a: any, b: any) => {
    return (
      new Date(b.Created_Time).getTime() - new Date(a.Created_Time).getTime()
    )
  })

  const [openAllNotes, setOpenAllNotes] = useState(false)
  const MAX_NOTES_VISIBLE = 3
  const showViewMore = sortedNotes.length > MAX_NOTES_VISIBLE
  const visibleNotes = showViewMore
    ? sortedNotes.slice(0, MAX_NOTES_VISIBLE)
    : sortedNotes

  const handleAddNote = async (note: { description: string }) => {
    try {
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: String(id), // Target Candidate ID
          note: note.description, // Text Content
          module: 'Candidates', // Module indicator
          Parent_Id: String(id), // Flat payload key fallback override matching parent tree configuration
        }),
      })

      if (res.ok) {
        toast.success('Note added successfully')
        queryClient.invalidateQueries({ queryKey: ['candidate-detail', id] })
      } else {
        toast.error('Failed to add note')
      }
    } catch (err) {
      toast.error('Network error')
    }
  }

  const { data: detailData, isLoading } = useQuery({
    queryKey: ['candidate-detail', id],
    queryFn: async () => {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/candidates?candidate_id=${id}`,
        { credentials: 'include' },
      )
      return res.json()
    },
    enabled: isEdit,
    refetchOnMount: 'always',
  })

  // Fetch dynamic users registry from backend instead of hardcoding
  const { data: ownersData } = useQuery({
    queryKey: ['account-owners'],
    queryFn: async () => {
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/user/filter`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to fetch owners')
      return res.json()
    },
    retry: false,
  })

  useEffect(() => {
    if (detailData?.data?.[0]) {
      const d = detailData.data[0]
      setForm({ ...d })
      setLanguages(d.language_proficiency || [])
    }
  }, [detailData])

  const set = (key: string, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const getVal = (key: string) => form[key] || ''

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        language_proficiency: languages,
      }
      // FIX: Force assignee_id to string and remove read-only system IDs
      delete payload.assignee_id
      delete payload.created_by_id
      delete payload.created_time
      delete payload.modified_time

      delete payload.created_by
      delete payload.assignee
      delete payload.notes
      const url = isEdit
        ? `${ENV.VITE_BACKEND_BASE_URL}/candidates/${id}`
        : `${ENV.VITE_BACKEND_BASE_URL}/candidates`

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
      toast.success(isEdit ? 'Candidate Updated' : 'Candidate Created')
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      navigate(-1)
    },
    onError: (e: any) => toast.error(e.message),
  })

  if (isEdit && isLoading) {
    return (
      <div className='flex justify-center items-center h-screen bg-background'>
        <Spinner className='h-10 w-10' />
      </div>
    )
  }

  return (
    <div className='p-4 space-y-4'>
      <Card className='rounded-sm shadow-sm overflow-hidden border-border'>
        {/* Main Title Row */}
        <div className='flex justify-between items-center p-2 border-b font-bold text-sm'>
          <div className='text-2xl'>
            Candidate Form
            <br />
            Id: {isEdit ? id : 'New'}
          </div>
          <div className='text-2xl'>Job Requirement ID : {initialJrId}</div>
          <div className='flex gap-2'>
            <Button variant='outline' size='sm' onClick={() => navigate(-1)}>
              Cancel
            </Button>

            {/* Save Button rendering wrapper control */}
            {canModifyCandidateDetails && (
              <Button
                size='sm'
                disabled={mutation.isPending}
                className='bg-blue-600 hover:bg-blue-700'
                onClick={() => {
                  const nameError =
                    !form.candidate_name || !String(form.candidate_name).trim()
                  const phoneError =
                    !form.phone_no || !String(form.phone_no).trim()
                  const emailError = !form.email || !String(form.email).trim()

                  setErrors({
                    candidate_name: nameError,
                    phone_no: phoneError,
                    email: emailError,
                  })

                  if (nameError || phoneError || emailError) {
                    toast.error(
                      'Please complete all mandatory fields highlighted in red.',
                    )
                    return // Stop execution flow
                  }

                  mutation.mutate()
                }}
              >
                {mutation.isPending ? 'Saving...' : 'Save Candidate'}
              </Button>
            )}
          </div>
        </div>

        {/* --- CANDIDATE INFO --- */}
        <SectionHeader title='Candidate Info' />

        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2'>
          {/* Left Column */}
          <div className='md:border-r'>
            <FieldRow
              label={<span className=' font-semibold'>Candidate Name *</span>}
            >
              <div
                className={
                  errors.candidate_name
                    ? 'rounded-md border-2 border-red-500 bg-red-50/20 p-0.5'
                    : ''
                }
              >
                <Input
                  value={getVal('candidate_name')}
                  disabled={!canModifyCandidateDetails}
                  onChange={(e) => {
                    set('candidate_name', e.target.value)
                    if (e.target.value.trim())
                      setErrors((prev) => ({ ...prev, candidate_name: false }))
                  }}
                  className='h-8'
                  placeholder='Single Line'
                />
              </div>
            </FieldRow>
            <FieldRow label='Location (City)'>
              <SelectField
                value={getVal('location_city')}
                isEdit={canModifyCandidateDetails}
                options={LOCATIONS}
                onChange={(v) => set('location_city', v)}
              />
            </FieldRow>
            <FieldRow label='Created by'>
              <div className='h-8 flex items-center px-3 text-sm text-muted-foreground bg-muted/30 rounded-md border border-transparent'>
                System Driven (User)
              </div>
            </FieldRow>
            <FieldRow label='Assignee (owner)'>
              <Select
                value={getVal('assignee_owner')}
                disabled={!canModifyCandidateDetails}
                onValueChange={(val) => set('assignee_owner', val)}
              >
                <SelectTrigger className='h-8 w-full text-sm mt-1'>
                  <SelectValue placeholder='Select Assignee Owner' />
                </SelectTrigger>
                <SelectContent>
                  {(Array.isArray(ownersData)
                    ? ownersData
                    : ownersData?.data || []
                  ).map((user: any) => (
                    <SelectItem
                      key={String(user.id)}
                      value={String(user.id)}
                      className='text-sm'
                    >
                      {user.full_name ||
                        user.name ||
                        user.username ||
                        'Unknown User'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label='Resume'>
              <Input
                value={getVal('resume')}
                disabled={!canModifyCandidateDetails}
                onChange={(e) => set('resume', e.target.value)}
                className='h-8'
                placeholder='Attachment /Link'
              />
            </FieldRow>
          </div>
          {/* Right Column */}
          <div>
            <FieldRow label='Candidate Status'>
              <SelectField
                value={getVal('candidate_status')}
                isEdit={canModifyCandidateDetails}
                options={CANDIDATE_STATUSES}
                onChange={(v) => set('candidate_status', v)}
              />
            </FieldRow>
            <FieldRow label='Status Date'>
              <span className='text-sm font-medium text-muted-foreground h-8 flex items-center'>
                {getVal('status_date')
                  ? new Date(getVal('status_date')).toLocaleString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true,
                    })
                  : 'No status updates yet'}
              </span>
            </FieldRow>
            <FieldRow label='Call Back Date'>
              <Input
                type='date'
                value={getVal('call_back_date')?.split('T')[0]}
                disabled={!canModifyCandidateDetails}
                onChange={(e) => set('call_back_date', e.target.value)}
                className='h-8'
              />
            </FieldRow>
            <FieldRow label={<span className='font-semibold'>Phone No *</span>}>
              <div
                className={
                  errors.phone_no
                    ? 'rounded-md border-2 border-red-500 bg-red-50/20 p-0.5'
                    : ''
                }
              >
                <Input
                  value={getVal('phone_no')}
                  disabled={!canModifyCandidateDetails}
                  onChange={(e) => {
                    set('phone_no', e.target.value)
                    if (e.target.value.trim())
                      setErrors((prev) => ({ ...prev, phone_no: false }))
                  }}
                  className='h-8'
                  placeholder='Phone'
                  type='number'
                />
              </div>
            </FieldRow>
            <FieldRow label={<span className='font-semibold'>Email *</span>}>
              <div
                className={
                  errors.email
                    ? 'rounded-md border-2 border-red-500 bg-red-50/20 p-0.5'
                    : ''
                }
              >
                <Input
                  value={getVal('email')}
                  disabled={!canModifyCandidateDetails}
                  onChange={(e) => {
                    set('email', e.target.value)
                    if (e.target.value.trim())
                      setErrors((prev) => ({ ...prev, email: false }))
                  }}
                  className='h-8'
                  type='email'
                  placeholder='Email'
                />
              </div>
            </FieldRow>
          </div>
        </CardContent>

        {/* --- EDUCATION --- */}
        <SectionHeader title='Education' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2'>
          {/* Left Column */}
          <div className='md:border-r'>
            <FieldRow label='Educational Qualification(UG)'>
              <SelectField
                value={getVal('educational_qualification_ug')}
                isEdit={canModifyCandidateDetails}
                options={UG_QUALIFICATIONS}
                onChange={(v) => set('educational_qualification_ug', v)}
              />
            </FieldRow>
            <FieldRow label='Educational Qualification(PG)'>
              <SelectField
                value={getVal('educational_qualification_pg')}
                isEdit={canModifyCandidateDetails}
                options={PG_QUALIFICATIONS}
                onChange={(v) => set('educational_qualification_pg', v)}
              />
            </FieldRow>
          </div>
          {/* Right Column */}
          <div>
            <FieldRow label='Year of Passing (UG)'>
              <Input
                type='number'
                value={getVal('year_of_passing_ug')}
                disabled={!canModifyCandidateDetails}
                onChange={(e) => set('year_of_passing_ug', e.target.value)}
                className='h-8'
                placeholder='YYYY'
              />
            </FieldRow>
            <FieldRow label='Year of Passing (PG)'>
              <Input
                type='number'
                value={getVal('year_of_passing_pg')}
                disabled={!canModifyCandidateDetails}
                onChange={(e) => set('year_of_passing_pg', e.target.value)}
                className='h-8'
                placeholder='YYYY'
              />
            </FieldRow>
          </div>
        </CardContent>

        {/* --- WORK EXPERIENCE --- */}
        <SectionHeader title='Work Experience' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2'>
          {/* Left Column */}
          <div className='md:border-r'>
            <FieldRow label='Work Experience'>
              <Input
                value={getVal('work_experience')}
                disabled={!canModifyCandidateDetails}
                onChange={(e) => set('work_experience', e.target.value)}
                className='h-8'
                placeholder='Duration (2y 8m)'
              />
            </FieldRow>
          </div>
          {/* Right Column */}
          <div>
            <FieldRow label='Industry'>
              <SelectField
                value={getVal('industry')}
                isEdit={canModifyCandidateDetails}
                options={CANDIDATE_INDUSTRIES}
                onChange={(v) => set('industry', v)}
              />
            </FieldRow>
          </div>
        </CardContent>

        {/* --- SKILLS --- */}
        <SectionHeader title='Skills' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2'>
          {/* Left Column */}
          <div className='md:border-r'>
            <FieldRow label='Skills'>
              <Input
                value={getVal('skills')}
                disabled={!canModifyCandidateDetails}
                onChange={(e) => set('skills', e.target.value)}
                className='h-8'
                placeholder='Single Line'
              />
            </FieldRow>
          </div>
          {/* Right Column */}
          <div>
            <FieldRow label='Language Proficiency'>
              <MultiSelectField
                value={languages}
                options={LANGUAGE_OPTIONS}
                onChange={canModifyCandidateDetails ? setLanguages : () => {}}
              />
            </FieldRow>
          </div>
        </CardContent>

        {/* ================= SECTION 5: NOTES SYSTEM (CANDIDATES) ================= */}
        <SectionHeader title='Notes' />

        <CardContent className='p-4 space-y-3'>
          <div className='flex items-center justify-between'>
            <p className='text-sm text-muted-foreground'>
              Total Notes:{' '}
              <span className='font-semibold'>{sortedNotes.length}</span>
            </p>

            <div className='flex gap-2 items-center'>
              {showViewMore && (
                <Dialog open={openAllNotes} onOpenChange={setOpenAllNotes}>
                  <DialogTrigger asChild>
                    <Button
                      size='sm'
                      className='cursor-pointer'
                      variant='outline'
                    >
                      View More
                    </Button>
                  </DialogTrigger>

                  <DialogContent className='min-w-4xl max-w-4xl'>
                    <DialogHeader>
                      <DialogTitle>
                        All Candidate Notes ({sortedNotes.length})
                      </DialogTitle>
                    </DialogHeader>

                    <div className='max-h-[70vh] overflow-y-auto space-y-3 pr-2 mt-2'>
                      {sortedNotes.map((note: any, i: number) => (
                        <div
                          key={note.parent_id || i}
                          className='bg-muted/30 p-3 rounded-lg border'
                        >
                          <p className='text-sm'>{note.Note_Content}</p>
                          <div className='flex flex-wrap gap-3 text-[11px] text-muted-foreground uppercase mt-2 w-full font-medium'>
                            <span>
                              Created By: {note.Created_By?.name || '—'}
                            </span>
                            <span>
                              Created Date:{' '}
                              {note.Created_Time
                                ? new Date(note.Created_Time).toLocaleString()
                                : '—'}
                            </span>
                            <div className='font-bold ml-auto text-teal-600 bg-teal-50 px-1.5 rounded border border-teal-100 text-[9px]'>
                              Module : {note.module}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {sortedNotes.length === 0 ? (
            <p className='text-sm text-muted-foreground'>No notes available</p>
          ) : (
            visibleNotes.map((note: any, i: number) => (
              <div
                key={note.parent_id || i}
                className='bg-muted/30 p-3 rounded-lg border'
              >
                <p className='text-sm'>{note.Note_Content}</p>
                <div className='flex flex-wrap gap-3 text-[11px] text-muted-foreground uppercase mt-2 w-full font-medium'>
                  <span>Created By: {note.Created_By?.name || '—'}</span>
                  <span>
                    Created Date:{' '}
                    {note.Created_Time
                      ? new Date(note.Created_Time).toLocaleString()
                      : '—'}
                  </span>
                  <div className='font-bold ml-auto text-teal-600 bg-teal-50 px-1.5 rounded border border-teal-100 text-[9px]'>
                    Module : {note.module}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Render input modal context trigger box if record exists and user holds permission */}
          {isEdit && canAddCandidateNotes && (
            <NoteDialog onAddNote={handleAddNote} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
