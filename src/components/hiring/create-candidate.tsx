import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ENV } from '@/conf'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'
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

export default function CreateCandidate() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  // Try to get jrId from search params (e.g. ?jr_id=123) if creating a candidate for a specific job requirement
  const searchParams = new URLSearchParams(location.search)
  const initialJrId = searchParams.get('jr_id')

  const [form, setForm] = useState<Record<string, any>>({
    jr_id: initialJrId || '',
  })
  const [languages, setLanguages] = useState<string[]>([])

  const isEdit = !!id

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
      {/* Page Action Header */}
      <div className='flex items-center justify-between mb-2'>

      </div>

      <Card className='rounded-sm shadow-sm overflow-hidden border-border'>
        {/* Main Title Row */}
        <div className='flex justify-between items-center p-2 border-b font-bold text-sm'>
          <div className='text-2xl'>
            Candidate Form
            <br />
            Id: {isEdit ? id : 'New'}
          </div>
          <div className='flex gap-2'>
            <Button variant='outline' size='sm' onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button
              size='sm'
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className='bg-blue-600 hover:bg-blue-700'
            >
              {mutation.isPending ? 'Saving...' : 'Save Candidate'}
            </Button>
          </div>
        </div>

        {/* --- CANDIDATE INFO --- */}
        <SectionHeader title='Candidate Info' />

        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2'>
          {/* Left Column */}
          <div className='md:border-r'>
            <FieldRow label={<span className=" font-semibold">Candidate Name</span>}>
              <Input
                value={getVal('candidate_name')}
                onChange={(e) => set('candidate_name', e.target.value)}
                className='h-8'
                placeholder='Single Line'
              />
            </FieldRow>
            <FieldRow label='Location (City)'>
              <SelectField
                value={getVal('location_city')}
                isEdit={true}
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
              <Input
                value={getVal('assignee_owner')}
                onChange={(e) => set('assignee_owner', e.target.value)}
                className='h-8'
                placeholder='User'
              />
            </FieldRow>
            <FieldRow label='Resume'>
              <Input
                value={getVal('resume')}
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
                isEdit={true}
                options={CANDIDATE_STATUSES}
                onChange={(v) => set('candidate_status', v)}
              />
            </FieldRow>
            <FieldRow label='Status Date'>
              <Input
                type='date'
                value={getVal('status_date')?.split('T')[0]}
                onChange={(e) => set('status_date', e.target.value)}
                className='h-8'
              />
            </FieldRow>
            <FieldRow label='Call Back Date'>
              <Input
                type='date'
                value={getVal('call_back_date')?.split('T')[0]}
                onChange={(e) => set('call_back_date', e.target.value)}
                className='h-8'
              />
            </FieldRow>
            <FieldRow label={<span className="font-semibold">Phone No</span>}>
              <Input
                value={getVal('phone_no')}
                onChange={(e) => set('phone_no', e.target.value)}
                className='h-8'
                placeholder='Phone'
              />
            </FieldRow>
            <FieldRow label={<span className="font-semibold">Email</span>}>
              <Input
                value={getVal('email')}
                onChange={(e) => set('email', e.target.value)}
                className='h-8'
                type='email'
                placeholder='Email'
              />
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
                isEdit={true}
                options={UG_QUALIFICATIONS}
                onChange={(v) => set('educational_qualification_ug', v)}
              />
            </FieldRow>
            <FieldRow label='Educational Qualification(PG)'>
              <SelectField
                value={getVal('educational_qualification_pg')}
                isEdit={true}
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
                onChange={(e) => set('year_of_passing_ug', e.target.value)}
                className='h-8'
                placeholder='YYYY'
              />
            </FieldRow>
            <FieldRow label='Year of Passing (PG)'>
              <Input
                type='number'
                value={getVal('year_of_passing_pg')}
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
                value={getVal('work_experience_duration')}
                onChange={(e) => set('work_experience_duration', e.target.value)}
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
                isEdit={true}
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
                onChange={setLanguages}
              />
            </FieldRow>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
