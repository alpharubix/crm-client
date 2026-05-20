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

// Mock representation of the context session state matching your router interceptors.
// In production, fetch these values from your Auth Context providers.
const useAuthSession = () => {
  return {
    userId: '1001', // The active context user ID string
    role: 'manager', // e.g., "admin", "manager", "recruiter"
  }
}

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
  const { userId, role } = useAuthSession()
  const [errors, setErrors] = useState<{
    hiring_position?: boolean
    department?: boolean
  }>({})
  const [form, setForm] = useState<Record<string, any>>({})
  const [languages, setLanguages] = useState<string[]>([])
  const [ugQualifications, setUgQualifications] = useState<string[]>([])
  const [pgQualifications, setPgQualifications] = useState<string[]>([])

  const isEdit = !!id
  // 1. Define your workflow status columns clearly
  const WORKFLOW_STATUSES = ['pending_approval', 'approved', 'rejected']

  const { data: jrData, isLoading: isJrDataLoading } = useQuery({
    queryKey: ['job-requirements'],
    queryFn: async () => {
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/job-requirements`, {
        credentials: 'include',
      })
      return res.json()
    },
  })

  // Normalize incoming records safely whether it's wrapped in an array or object root key
  const rawList = jrData?.data
    ? Array.isArray(jrData.data)
      ? jrData.data
      : [jrData.data]
    : []

  // Group your incoming requirements dynamically without worrying about runtime exceptions
  const groupedRequirements = rawList.reduce(
    (acc: any, jr: any) => {
      if (!jr) return acc

      // Use 'pending_approval' as a safe structural workflow fallback matching database defaults
      const currentStatus = jr.status || 'pending_approval'

      if (!acc[currentStatus]) {
        acc[currentStatus] = []
      }
      acc[currentStatus].push(jr)
      return acc
    },
    { pending_approval: [], approved: [], rejected: [] },
  )
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
    if (detailData?.data) {
      // Safely access backend structures regardless of object vs single list mapping layouts
      const d = Array.isArray(detailData.data)
        ? detailData.data[0]
        : detailData.data
      if (d) {
        setForm({
          ...d,
          // Extract the absolute string ID from the relationship dictionary returned by backend
          approver_id: d.approver?.id || d.approver_id || '',
          assignee_id: d.assignee?.id || d.assignee_id || '',
        })
        setLanguages(d.language_proficiency || [])
        setUgQualifications(d.educational_qualification_ug || [])
        setPgQualifications(d.educational_qualification_pg || [])
      }
    }
  }, [detailData])

  const set = (key: string, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const getVal = (key: string) => form[key] || ''

  const originalApproverId = String(form['approver_id'] || '')
  const canModifyAssignment =
    isEdit &&
    (userId === originalApproverId || ['admin', 'manager'].includes(role))

  const mutation = useMutation({
    mutationFn: async () => {
      if (!form.hiring_position || !form.hiring_position.trim()) {
        throw new Error('Hiring Position is mandatory')
      }
      if (!form.department || !form.department.trim()) {
        throw new Error('Department is mandatory')
      }
      const payload = {
        ...form,
        approver_id: form.approver_id ? String(form.approver_id) : null,
        assignee_id: form.assignee_id ? String(form.assignee_id) : null,
        status: isEdit ? form.status || 'pending_approval' : 'pending_approval', // Sets initial structure safely
        no_of_vacancies: form.no_of_vacancies
          ? parseInt(form.no_of_vacancies, 10)
          : null,
        age_limit: form.age_limit ? parseInt(form.age_limit, 10) : null,
        language_proficiency: languages,
        educational_qualification_ug: ugQualifications,
        educational_qualification_pg: pgQualifications,
      }

      const res = await fetch(
        isEdit
          ? `${ENV.VITE_BACKEND_BASE_URL}/job-requirements/${id}`
          : `${ENV.VITE_BACKEND_BASE_URL}/job-requirements`,
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        },
      )
      if (!res.ok) throw new Error('Failed to save')
      return res.json()
    },
    onSuccess: () => {
      toast.success(
        isEdit
          ? 'Requirement Updated'
          : 'Requirement Created and Sent for Approval',
      )
      queryClient.invalidateQueries({ queryKey: ['job-requirements'] })
      navigate('/hiring') // Redirects back to your board view instantly
    },
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
            disabled={mutation.isPending}
            onClick={() => {
              const newErrors = {
                hiring_position:
                  !form.hiring_position || !String(form.hiring_position).trim(),
                department: !form.department || !String(form.department).trim(),
              }

              // Set error state to trigger the red outlines on your field rows
              if (typeof setErrors === 'function') {
                setErrors(newErrors)
              }

              if (newErrors.hiring_position || newErrors.department) {
                toast.error('Please fill in all mandatory fields.')
                return // Blocks mutation execution
              }

              mutation.mutate()
            }}
          >
            {mutation.isPending ? (
              <Spinner className='mr-2 h-4 w-4' />
            ) : (
              'Save Requirement'
            )}
          </Button>
        </div>
      </div>

      <Card className='overflow-hidden space-y-1 pb-32'>
        {/* --- HIRING REQUIREMENTS --- */}
        <SectionHeader title='Hiring Requirements' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2'>
          <div className='md:border-r'>
            <FieldRow label='Hiring Position *'>
              <div
                className={
                  errors.hiring_position
                    ? 'rounded-md border-2 border-red-500 bg-red-50/20 p-0.5'
                    : ''
                }
              >
                <SelectField
                  value={getVal('hiring_position')}
                  isEdit={true}
                  options={HIRING_POSITIONS}
                  onChange={(v) => set('hiring_position', v)}
                />
              </div>
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
            {/* 1. Show Approval Controls ONLY in Edit Mode */}
            {isEdit && (
              <FieldRow label='Workflow Status'>
                <div className='flex items-center gap-3'>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium uppercase ${
                      getVal('status') === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {getVal('status') || 'pending_approval'}
                  </span>

                  {/* Show Approval actions if user is the assigned approver and it isn't approved yet */}
                  {getVal('status') !== 'approved' &&
                    userId === String(getVal('approver_id')) && (
                      <Button
                        type='button'
                        size='xs'
                        className='h-7 bg-green-600 hover:bg-green-700 text-white text-xs'
                        onClick={() => {
                          set('status', 'approved')
                          toast.info(
                            "Status set to Approved. Click 'Save Requirement' to apply changes.",
                          )
                        }}
                      >
                        Approve Request
                      </Button>
                    )}
                </div>
              </FieldRow>
            )}
            {/* 2. Recruiter Assignment Gate: Only visible once the Job Requirement has been Approved */}
            {isEdit && getVal('status') === 'approved' && (
              <FieldRow label='Assignee (HR Recruiter)'>
                <Input
                  value={getVal('assignee_id')}
                  disabled={
                    userId !== String(getVal('approver_id')) &&
                    !['admin', 'manager'].includes(role)
                  }
                  onChange={(e) => set('assignee_id', e.target.value)}
                  className='h-8'
                  placeholder='Enter Recruiter User ID to allocate role'
                />
              </FieldRow>
            )}
            {/* <FieldRow label='Approver'>
              <SelectField
                value={getVal('approver_id')}
                isEdit={true}
                options={users
                  .filter(
                    (u) =>
                      String(u.id) === '3899927000000201013' ||
                      u.name === 'Anslem Prathap',
                  )
                  .map((s) => ({ label: s.name, value: String(s.id) }))}
                onChange={(v) => set('approver_id', v)}
              />
            </FieldRow> */}
            {/* CRITICAL EXCEL RULES GATEWAY: Show/lock fields depending on Approver Status roles */}
            {isEdit && (
              <FieldRow label='Assignee (Recruiter)'>
                <Input
                  value={getVal('assignee_id')}
                  disabled={!canModifyAssignment}
                  onChange={(e) => set('assignee_id', e.target.value)}
                  className='h-8'
                  placeholder={
                    canModifyAssignment
                      ? 'Enter HR Recruiter User ID'
                      : 'Locked — Only assigned Approver can allocate'
                  }
                />
              </FieldRow>
            )}
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
            <FieldRow label='Department *'>
              <div
                className={
                  errors.department
                    ? 'rounded-md border-2 border-red-500 bg-red-50/20 p-0.5'
                    : ''
                }
              >
                <SelectField
                  value={getVal('department')}
                  isEdit={true}
                  options={DEPARTMENTS}
                  onChange={(v) => set('department', v)}
                />
              </div>
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
