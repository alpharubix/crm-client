import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ENV } from '@/conf'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import SectionHeader from '@/components/shared/section-header'
import FieldRow from '@/components/shared/field-row'
import SelectField from '@/components/shared/select-field'
import { Spinner } from '@/components/ui/spinner'
import {
  DEPARTMENTS,
  HIRING_POSITIONS,
  LEVELS,
  SUB_LEVELS,
  EXPERIENCE_OPTIONS,
  GENDERS,
  LANGUAGE_OPTIONS,
  LOCATIONS,
  EMPLOYEE_OPTIONS,
} from '@/utils/hiring-constants'
import { X } from 'lucide-react'

// Multi-Select Component (similar to the one in CreateAccount)
function MultiSelectField({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: string[]
  options: string[]
  onChange: (val: string[]) => void
  placeholder?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredOptions = options.filter(
    (opt) =>
      opt.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !value.includes(opt),
  )

  const addItem = (item: string) => {
    onChange([...value, item])
    setSearchTerm('')
  }

  const removeItem = (item: string) => {
    onChange(value.filter((i) => i !== item))
  }

  return (
    <div className='relative'>
      <div className='flex flex-wrap gap-1 mb-2'>
        {value.map((item) => (
          <span
            key={item}
            className='bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md text-sm flex items-center gap-1'
          >
            {item}
            <button type='button' onClick={() => removeItem(item)}>
              <X className='h-3 w-3' />
            </button>
          </span>
        ))}
      </div>
      <div className='relative'>
        <input
          type='text'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder={placeholder || 'Search and select...'}
          className='w-full h-8 px-2 border rounded-md text-sm'
        />
        {isOpen && filteredOptions.length > 0 && (
          <div className='absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-auto'>
            {filteredOptions.map((opt) => (
              <button
                key={opt}
                type='button'
                onClick={() => addItem(opt)}
                className='w-full text-left px-2 py-1 text-sm hover:bg-gray-100'
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CreateJobRequirement() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<Record<string, any>>({})
  const [languages, setLanguages] = useState<string[]>([])
  const [ugQualifications, setUgQualifications] = useState<string[]>([])
  const [pgQualifications, setPgQualifications] = useState<string[]>([])

  const isEdit = !!id

  const { data: detailData, isLoading } = useQuery({
    queryKey: ['job-requirement-detail', id],
    queryFn: async () => {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/job-requirements?jr_id=${id}`,
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
      setUgQualifications(d.educational_qualification_ug || [])
      setPgQualifications(d.educational_qualification_pg || [])
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
        educational_qualification_ug: ugQualifications,
        educational_qualification_pg: pgQualifications,
      }
      const url = isEdit
        ? `${ENV.VITE_BACKEND_BASE_URL}/job-requirements/${id}`
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
      navigate('/hiring')
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
    <div className='space-y-6 bg-background min-h-screen p-6'>
      <div className='flex justify-between items-center border p-4 rounded-xl bg-card'>
        <div>
          <h1 className='text-lg font-semibold'>
            {isEdit ? 'Edit Job Requirement' : 'Create New Requirement'}
          </h1>
        </div>
        <div className='flex gap-2'>
          <Button size='sm' variant='outline' onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button
            size='sm'
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? <Spinner className='mr-2 h-4 w-4' /> : 'Save Requirement'}
          </Button>
        </div>
      </div>

      <Card className='overflow-hidden space-y-1'>
        {/* --- HIRING REQUIREMENTS --- */}
        <SectionHeader title='Hiring Requirements' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2'>
          <div className='md:border-r'>
            <FieldRow label='Hiring Position'>
              <SelectField
                value={getVal('hiring_position')}
                isEdit={true}
                options={HIRING_POSITIONS}
                onChange={(v) => set('hiring_position', v)}
              />
            </FieldRow>
            <FieldRow label='Level'>
              <SelectField
                value={getVal('level')}
                isEdit={true}
                options={LEVELS}
                onChange={(v) => set('level', v)}
              />
            </FieldRow>
            <FieldRow label='Sub-level'>
              <SelectField
                value={getVal('sub_level')}
                isEdit={true}
                options={SUB_LEVELS}
                onChange={(v) => set('sub_level', v)}
              />
            </FieldRow>
            <FieldRow label='Position Open date'>
              <Input
                type='date'
                value={getVal('position_open_date')?.split('T')[0] || ''}
                onChange={(e) => set('position_open_date', e.target.value)}
                className='h-8'
              />
            </FieldRow>
            <FieldRow label='Joining Date'>
              <Input
                type='date'
                value={getVal('tentative_joining_date')?.split('T')[0] || ''}
                onChange={(e) => set('tentative_joining_date', e.target.value)}
                className='h-8'
              />
            </FieldRow>
            <FieldRow label='Max Age Limit'>
              <Input
                type='number'
                value={getVal('age_limit')}
                onChange={(e) => set('age_limit', e.target.value)}
                className='h-8'
              />
            </FieldRow>
            <FieldRow label='Reporting Manager'>
              <SelectField
                value={getVal('reporting_manager')}
                isEdit={true}
                options={EMPLOYEE_OPTIONS}
                onChange={(v) => set('reporting_manager', v)}
              />
            </FieldRow>
            <FieldRow label='Job Description'>
              <textarea
                value={getVal('job_description')}
                onChange={(e) => set('job_description', e.target.value)}
                className='w-full h-20 px-2 border rounded-md text-sm outline-none'
              />
            </FieldRow>
          </div>
          <div>
            <FieldRow label='Min Annual CTC'>
              <Input
                value={getVal('min_annual_ctc')}
                onChange={(e) => set('min_annual_ctc', e.target.value)}
                className='h-8'
                placeholder='Currency'
              />
            </FieldRow>
            <FieldRow label='Max Annual CTC'>
              <Input
                value={getVal('max_annual_ctc')}
                onChange={(e) => set('max_annual_ctc', e.target.value)}
                className='h-8'
                placeholder='Currency'
              />
            </FieldRow>
            <FieldRow label='No of vacancies'>
              <Input
                type='number'
                value={getVal('no_of_vacancies')}
                onChange={(e) => set('no_of_vacancies', e.target.value)}
                className='h-8'
              />
            </FieldRow>
            <FieldRow label='Gender'>
              <SelectField
                value={getVal('gender')}
                isEdit={true}
                options={GENDERS}
                onChange={(v) => set('gender', v)}
              />
            </FieldRow>
            <FieldRow label='Approver'>
              {/* <Input
                value={getVal('approver_id')}
                onChange={(e) => set('approver_id', e.target.value)}
                className='h-8'
                placeholder='User (ID)'
              /> */}
              <SelectField
                value={getVal('approver_id')}
                isEdit={true}
                options={['Anslem prathap']}
                onChange={(v) => set('approver_id', v)}
              />
            </FieldRow>
            <FieldRow label='Assignee'>
              <Input
                value={getVal('assignee_id')}
                onChange={(e) => set('assignee_id', e.target.value)}
                className='h-8'
                placeholder='User (Hr Dept)'
              />
            </FieldRow>
            <FieldRow label='Hiring Location (City)'>
              <SelectField
                value={getVal('hiring_location_city')}
                isEdit={true}
                options={LOCATIONS}
                onChange={(v) => set('hiring_location_city', v)}
              />
            </FieldRow>
          </div>
        </CardContent>

        {/* --- EDUCATION --- */}
        <SectionHeader title='Education' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2'>
          <div className='md:border-r'>
            <FieldRow label='Educational Qualification(UG)'>
              <MultiSelectField
                value={ugQualifications}
                options={['B.Tech', 'B.E', 'BCA', 'B.Sc', 'B.Com', 'BBA']}
                onChange={setUgQualifications}
              />
            </FieldRow>
          </div>
          <div>
            <FieldRow label='Educational Qualification(PG)'>
              <MultiSelectField
                value={pgQualifications}
                options={['M.Tech', 'ME', 'MCA', 'M.Sc', 'MBA', 'MA']}
                onChange={setPgQualifications}
              />
            </FieldRow>
          </div>
        </CardContent>

        {/* --- WORK EXPERIENCE --- */}
        <SectionHeader title='Work Experience' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2'>
          <div className='md:border-r'>
            <FieldRow label='Experience'>
              <SelectField
                value={getVal('experience')}
                isEdit={true}
                options={EXPERIENCE_OPTIONS}
                onChange={(v) => set('experience', v)}
              />
            </FieldRow>
            <FieldRow label='Work Description'>
              <textarea
                value={getVal('work_description')}
                onChange={(e) => set('work_description', e.target.value)}
                className='w-full h-20 px-2 border rounded-md text-sm outline-none'
              />
            </FieldRow>
          </div>
          <div>
            <FieldRow label='Department'>
              <SelectField
                value={getVal('department')}
                isEdit={true}
                options={DEPARTMENTS}
                onChange={(v) => set('department', v)}
              />
            </FieldRow>
          </div>
        </CardContent>

        {/* --- SKILLS --- */}
        <SectionHeader title='Skills' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2'>
          <div className='md:border-r'>
            <FieldRow label='Skills Required'>
              <Input
                value={getVal('skills')}
                onChange={(e) => set('skills', e.target.value)}
                className='h-8'
                placeholder='Single Line'
              />
            </FieldRow>
          </div>
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
