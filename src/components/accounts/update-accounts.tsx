import { useCallback, useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useBeforeUnload, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import SectionHeader from '@/components/shared/section-header'
import FieldRow from '@/components/shared/field-row'
import SelectField from '@/components/shared/select-field'
import DateField from '@/components/shared/date-field'
import NoteDialog from '@/components/shared/note-dialog'
import { Spinner } from '@/components/ui/spinner'

import {
  updateAccountSchema,
  type UpdateAccountFormValues,
} from '@/validators/updateAccount.schema'
import { ENV } from '@/conf'
import { formatExactDate } from '@/utils/date-formatter'
import { Plus, X } from 'lucide-react'
import { formatAmount } from '@/utils/number-formatter'
import { CitySelector } from '../shared/city-selector'
import { StateSelector } from '../shared/state-selector'
import { PincodeSelector } from '../shared/pincode-selector'
import CITIES from '@/utils/cities.json'
import STATES from '@/utils/states.json'
import PINCODES from '@/utils/pincodes.json'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { useAuth } from '@/context/auth-context'

const LANGUAGE_OPTIONS = [
  'English',
  'Hindi',
  'Tamil',
  'Telugu',
  'Kannada',
  'Malayalam',
  'Marathi',
  'Gujarati',
  'Bengali',
  'Punjabi',
]

function display(v: any) {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'string' && v.trim() === '') return '—'
  return v
}

function MultiSelectField({
  value = [],
  options,
  isEdit,
  onChange,
  placeholder,
}: {
  value: string[]
  options: string[]
  isEdit: boolean
  onChange: (val: string[]) => void
  placeholder?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const safeValue = Array.isArray(value) ? value : []

  const filteredOptions = options.filter(
    (opt) =>
      opt.toLowerCase()?.includes(searchTerm.toLowerCase()) &&
      !safeValue?.includes(opt),
  )

  const addLanguage = (lang: string) => {
    onChange([...safeValue, lang])
    setSearchTerm('')
  }

  const removeLanguage = (lang: string) => {
    onChange(safeValue.filter((l) => l !== lang))
  }

  if (!isEdit) {
    return <span>{display(safeValue?.join(', '))}</span>
  }

  return (
    <div className='relative'>
      <div className='flex flex-wrap gap-1 mb-2'>
        {safeValue.map((lang) => (
          <span
            key={lang}
            className='bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md text-sm flex items-center gap-1'
          >
            {lang}
            <button
              type='button'
              onClick={() => removeLanguage(lang)}
              className='hover:text-blue-600'
            >
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
                onClick={() => addLanguage(opt)}
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

function mapAccountToForm(apiData: any): UpdateAccountFormValues {
  return {
    assignmentDate: apiData.assignment_date
      ? new Date(apiData.assignment_date)
      : undefined,
    source: apiData.source ?? '',
    accountName: apiData.account_name ?? '',
    accountOwnerId: apiData.account_owner_id
      ? String(apiData.account_owner_id)
      : '',
    sourceType: apiData.source_type ?? '',
    sourceOther: apiData.source_other ?? '',
    sourceDate: apiData.source_date
      ? new Date(apiData.source_date)
      : undefined,
    sourceDescription: apiData.source_description ?? '',
    distributorCode: apiData.distributor_code ?? '',
    wabaInterested: apiData.waba_interested ?? false,
    callBackDate: apiData.call_back_date_time
      ? new Date(apiData.call_back_date_time)
      : undefined,
    accountStatus: apiData.account_status ?? '',
    accountStage: apiData.account_stage ?? '',
    businessStatus: apiData.business_status ?? '',

    firstName: apiData.first_name ?? '',
    lastName: apiData.last_name ?? '',
    phone: apiData.phone ?? '',
    email: apiData.email ?? '',
    mothersName: apiData.mothers_name ?? '',
    preferredLanguages: Array.isArray(apiData.preferred_languages)
      ? apiData.preferred_languages
      : [],
    createdBy: apiData.created_by?.full_name ?? '',

    businessVintage: apiData.business_details?.vintage_years?.toString() ?? '',
    businessRegistrationType: apiData.business_details?.registration_type ?? '',
    suppliers: apiData.business_details?.suppliers ?? '',
    description: apiData.business_details?.description ?? '',
    typeOfBusiness:
      apiData.business_details?.type_of_business ??
      apiData.type_of_business ??
      '',
    industry: apiData.business_details?.industry ?? apiData.industry ?? '',
    gstn: apiData.business_details?.gstn ?? '',
    pan: apiData.business_details?.pan ?? '',
    parentAccount: apiData.parent_account ?? '',
    applicantOwnership:
      apiData.applicant_residence_address?.ownership_type ?? '',

    businessStreet: apiData.business_premise_address?.street ?? '',
    businessCity: apiData.business_premise_address?.city ?? '',
    businessState: apiData.business_premise_address?.state ?? '',
    businessCountry: apiData.business_premise_address?.country ?? 'India',
    businessPincode: apiData.business_premise_address?.pincode ?? '',
    businessYearsResiding:
      apiData.business_premise_address?.years_residing?.toString() ?? '',
    businessGpsLocation: apiData.business_premise_address?.gps_location ?? '',
    businessOwnership: apiData.business_premise_address?.ownership_type ?? '',

    applicantStreet: apiData.applicant_residence_address?.street ?? '',
    applicantCity: apiData.applicant_residence_address?.city ?? '',
    applicantState: apiData.applicant_residence_address?.state ?? '',
    applicantCountry: apiData.applicant_residence_address?.country ?? 'India',
    applicantPincode: apiData.applicant_residence_address?.pincode ?? '',
    applicantYearsResiding:
      apiData.applicant_residence_address?.years_residing?.toString() ?? '',
    applicantGpsLocation:
      apiData.applicant_residence_address?.gps_location ?? '',

    coApplicantName: apiData.co_applicant_residence_address?.name ?? '',
    coApplicantPhone: apiData.co_applicant_residence_address?.phone ?? '',
    coApplicantRelationship:
      apiData.co_applicant_residence_address?.relationship ?? '',
    coApplicantEmail: apiData.co_applicant_residence_address?.email ?? '',
    coApplicantStreet: apiData.co_applicant_residence_address?.street ?? '',
    coApplicantCity: apiData.co_applicant_residence_address?.city ?? '',
    coApplicantState: apiData.co_applicant_residence_address?.state ?? '',
    coApplicantCountry:
      apiData.co_applicant_residence_address?.country ?? 'India',
    coApplicantPincode: apiData.co_applicant_residence_address?.pincode ?? '',
    coApplicantYearsResiding:
      apiData.co_applicant_residence_address?.years_residing?.toString() ?? '',
    coApplicantGpsLocation:
      apiData.co_applicant_residence_address?.gps_location ?? '',
    coApplicantOwnership:
      apiData.co_applicant_residence_address?.ownership_type ?? '',

    applicantCode:
      apiData.applicant_residence_address?.pincode ??
      apiData.custom_fields?.applicant_code ??
      '',
    noOfBusinessYears:
      apiData.business_premise_address?.years_residing?.toString() ?? '',
    gpsLocation: apiData.business_premise_address?.gps_location ?? '',
    noOfYears:
      apiData.applicant_residence_address?.years_residing?.toString() ?? '',
    // applicantGpsLocation:
    //   apiData.applicant_residence_address?.gps_location ?? '',

    // coApplicantCode: apiData.co_applicant_residence_address?.pincode ?? '',
    // coApplicantYears:
    //   apiData.co_applicant_residence_address?.years_residing?.toString() ?? '',

    ref1Name: apiData.customer_references?.person1?.name ?? '',
    ref1Phone: apiData.customer_references?.person1?.phone ?? '',
    ref1Email: apiData.customer_references?.person1?.email ?? '',
    ref1Relationship: apiData.customer_references?.person1?.relationship ?? '',
    ref1Address: apiData.customer_references?.person1?.address ?? '',
    ref2Name: apiData.customer_references?.person2?.name ?? '',
    ref2Phone: apiData.customer_references?.person2?.phone ?? '',
    ref2Email: apiData.customer_references?.person2?.email ?? '',
    ref2Relationship: apiData.customer_references?.person2?.relationship ?? '',
    ref2Address: apiData.customer_references?.person2?.address ?? '',
  }
}

function mapFormToApi(
  formData: UpdateAccountFormValues,
  dirtyFields: Partial<Record<keyof UpdateAccountFormValues, boolean>>,
): any {
  const payload: any = {}

  // 1. Simple / Core Database Columns
  if (dirtyFields.source) payload.source = formData.source
  if (dirtyFields.accountName) payload.account_name = formData.accountName
  if (dirtyFields.sourceType) payload.source_type = formData.sourceType
  if (dirtyFields.sourceOther) payload.source_other = formData.sourceOther
  if (dirtyFields.sourceDate)
    payload.source_date = formData.sourceDate
      ? formData.sourceDate.toISOString().split('T')[0]
      : null
  if (dirtyFields.sourceDescription)
    payload.source_description = formData.sourceDescription
  if (dirtyFields.accountOwnerId)
    payload.account_owner_id = formData.accountOwnerId
  if (dirtyFields.distributorCode)
    payload.distributor_code = formData.distributorCode
  if (dirtyFields.wabaInterested)
    payload.waba_interested = formData.wabaInterested
  if (dirtyFields.callBackDate)
    payload.call_back_date_time = formData.callBackDate
  if (dirtyFields.accountStatus) payload.account_status = formData.accountStatus
  if (dirtyFields.accountStage) payload.account_stage = formData.accountStage
  if (dirtyFields.businessStatus)
    payload.business_status = formData.businessStatus
  if (dirtyFields.firstName) payload.first_name = formData.firstName
  if (dirtyFields.lastName) payload.last_name = formData.lastName
  if (dirtyFields.phone) payload.phone = formData.phone
  if (dirtyFields.email) payload.email = formData.email
  if (dirtyFields.mothersName) payload.mothers_name = formData.mothersName
  if (dirtyFields.preferredLanguages)
    payload.preferred_languages = formData.preferredLanguages
  if (dirtyFields.parentAccount) payload.parent_account = formData.parentAccount

  // 2. Business Details Object Block
  if (
    dirtyFields.businessRegistrationType ||
    dirtyFields.businessVintage ||
    dirtyFields.suppliers ||
    dirtyFields.description ||
    dirtyFields.typeOfBusiness ||
    dirtyFields.industry ||
    dirtyFields.gstn ||
    dirtyFields.pan
  ) {
    payload.business_details = {
      registration_type: formData.businessRegistrationType || null,
      vintage_years: parseInt(formData.businessVintage) || 0,
      suppliers: formData.suppliers || null,
      description: formData.description || null,
      type_of_business: formData.typeOfBusiness || null,
      industry: formData.industry || null,
      gstn: formData.gstn || null,
      pan: formData.pan || null,
    }
  }

  // 3. Business Premise Address Object Block
  if (
    dirtyFields.businessStreet ||
    dirtyFields.businessCity ||
    dirtyFields.businessState ||
    dirtyFields.businessCountry ||
    dirtyFields.businessPincode ||
    dirtyFields.businessYearsResiding ||
    dirtyFields.noOfBusinessYears ||
    dirtyFields.businessGpsLocation ||
    dirtyFields.gpsLocation ||
    dirtyFields.businessOwnership
  ) {
    payload.business_premise_address = {
      street: formData.businessStreet || null,
      city: formData.businessCity || null,
      state: formData.businessState || null,
      country: formData.businessCountry || 'India',
      pincode: formData.businessPincode || null,
      years_residing:
        parseInt(
          formData.businessYearsResiding || formData.noOfBusinessYears,
        ) || 0,
      gps_location:
        formData.businessGpsLocation || formData.gpsLocation || null,
      ownership_type: formData.businessOwnership || null,
    }
  }

  // 4. Applicant Residence Address Object Block
  if (
    dirtyFields.applicantStreet ||
    dirtyFields.applicantCity ||
    dirtyFields.applicantState ||
    dirtyFields.applicantCountry ||
    dirtyFields.applicantPincode ||
    dirtyFields.applicantCode ||
    dirtyFields.applicantYearsResiding ||
    dirtyFields.noOfYears ||
    dirtyFields.applicantGpsLocation ||
    dirtyFields.applicantOwnership
  ) {
    payload.applicant_residence_address = {
      street: formData.applicantStreet || null,
      city: formData.applicantCity || null,
      state: formData.applicantState || null,
      country: formData.applicantCountry || 'India',
      pincode: formData.applicantPincode || formData.applicantCode || null,
      years_residing:
        parseInt(formData.applicantYearsResiding || formData.noOfYears) || 0,
      gps_location: formData.applicantGpsLocation || null,
      ownership_type: formData.applicantOwnership || null,
    }
  }

  // 5. Co-Applicant Residence Address Object Block
  if (
    dirtyFields.coApplicantName ||
    dirtyFields.coApplicantPhone ||
    dirtyFields.coApplicantRelationship ||
    dirtyFields.coApplicantEmail ||
    dirtyFields.coApplicantStreet ||
    dirtyFields.coApplicantCity ||
    dirtyFields.coApplicantState ||
    dirtyFields.coApplicantCountry ||
    dirtyFields.coApplicantPincode ||
    dirtyFields.coApplicantCode ||
    dirtyFields.coApplicantYearsResiding ||
    dirtyFields.coApplicantYears ||
    dirtyFields.coApplicantGpsLocation ||
    dirtyFields.coApplicantOwnership
  ) {
    payload.co_applicant_residence_address = {
      name: formData.coApplicantName || null,
      phone: formData.coApplicantPhone || null,
      relationship: formData.coApplicantRelationship || null,
      email: formData.coApplicantEmail || null,
      street: formData.coApplicantStreet || null,
      city: formData.coApplicantCity || null,
      state: formData.coApplicantState || null,
      country: formData.coApplicantCountry || 'India',
      pincode: formData.coApplicantPincode || formData.coApplicantCode || null,
      years_residing:
        parseInt(
          formData.coApplicantYearsResiding || formData.coApplicantYears,
        ) || 0,
      gps_location: formData.coApplicantGpsLocation || null,
      ownership_type: formData.coApplicantOwnership || null,
    }
  }

  // 6. Customer References Object Block
  const customerReferences: any = {}

  if (
    dirtyFields.ref1Name ||
    dirtyFields.ref1Phone ||
    dirtyFields.ref1Email ||
    dirtyFields.ref1Relationship ||
    dirtyFields.ref1Address
  ) {
    customerReferences.person1 = {
      name: formData.ref1Name || null,
      phone: formData.ref1Phone || null,
      email: formData.ref1Email || null,
      relationship: formData.ref1Relationship || null,
      address: formData.ref1Address || null,
    }
  } else if (formData.ref1Name || formData.ref1Phone) {
    // Retain existing form state if the sibling person changed instead
    customerReferences.person1 = {
      name: formData.ref1Name || null,
      phone: formData.ref1Phone || null,
      email: formData.ref1Email || null,
      relationship: formData.ref1Relationship || null,
      address: formData.ref1Address || null,
    }
  }

  if (
    dirtyFields.ref2Name ||
    dirtyFields.ref2Phone ||
    dirtyFields.ref2Email ||
    dirtyFields.ref2Relationship ||
    dirtyFields.ref2Address
  ) {
    customerReferences.person2 = {
      name: formData.ref2Name || null,
      phone: formData.ref2Phone || null,
      email: formData.ref2Email || null,
      relationship: formData.ref2Relationship || null,
      address: formData.ref2Address || null,
    }
  } else if (formData.ref2Name || formData.ref2Phone) {
    // Retain existing form state if the sibling person changed instead
    customerReferences.person2 = {
      name: formData.ref2Name || null,
      phone: formData.ref2Phone || null,
      email: formData.ref2Email || null,
      relationship: formData.ref2Relationship || null,
      address: formData.ref2Address || null,
    }
  }

  if (Object.keys(customerReferences).length > 0) {
    payload.customer_references = customerReferences
  }

  return payload
}

export default function UpdateAccounts() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const [isEdit, setIsEdit] = useState(false)
  const [openAllNotes, setOpenAllNotes] = useState(false)
  const [openAllContacts, setOpenAllContacts] = useState(false)
  const [openAllDeals, setOpenAllDeals] = useState(false)

  const navigate = useNavigate()
  const [businessStateSearch, setBusinessStateSearch] = useState('')
  const [businessStateOpen, setBusinessStateOpen] = useState(false)
  const [businessCitySearch, setBusinessCitySearch] = useState('')
  const [businessCityOpen, setBusinessCityOpen] = useState(false)
  const [businessPincodeSearch, setBusinessPincodeSearch] = useState('')
  const [businessPincodeOpen, setBusinessPincodeOpen] = useState(false)
  const { user } = useAuth()

  const isAllow =
    user?.role === 'super_admin' ||
    user?.role === 'admin' ||
    user?.role === 'manager'

  const form = useForm<UpdateAccountFormValues>({
    resolver: zodResolver(updateAccountSchema),
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    control,
    formState: { errors, isDirty, dirtyFields },
  } = form

  const {
    data: apiResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['account', id],
    queryFn: async () => {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/accounts?account_id=${id}`,
        { credentials: 'include' },
      )
      if (!res.ok) throw new Error('Failed to fetch account')
      return res.json()
    },
    enabled: !!id,
  })

  const accountData = apiResponse?.data?.[0]
  const Deals = accountData?.deals || []
  const contacts = accountData?.account_linked_contact || []
  const notes = accountData?.notes || []

  const sortedNotes = [...notes].sort((a: any, b: any) => {
    return (
      new Date(b.Created_Time).getTime() - new Date(a.Created_Time).getTime()
    )
  })

  const ownerName = accountData?.owner?.full_name || 'User'

  useEffect(() => {
    if (accountData) {
      const formValues = mapAccountToForm(accountData)
      reset(formValues)
      if (formValues.businessState)
        setBusinessStateSearch(formValues.businessState)
      if (formValues.businessCity)
        setBusinessCitySearch(formValues.businessCity)
      if (formValues.businessPincode)
        setBusinessPincodeSearch(formValues.businessPincode)
    }
  }, [accountData, reset])

  const updateMutation = useMutation({
    mutationFn: async (values: UpdateAccountFormValues) => {
      const payload = mapFormToApi(values, dirtyFields)
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to update account')
      return res.json()
    },
    onSuccess: (data, variables) => {
      toast.success('Account updated successfully')
      setIsEdit(false)
      queryClient.invalidateQueries({ queryKey: ['account', id] })
    },
    onError: () => {
      toast.error('Failed to update account')
    },
  })

  useBeforeUnload(
    useCallback(
      (e) => {
        if (isDirty) {
          e.preventDefault()
          e.returnValue = ''
        }
      },
      [isDirty],
    ),
  )

  const filteredBusinessStates =
    businessStateSearch.length > 1
      ? STATES.filter((s: string) =>
          s.toLowerCase().includes(businessStateSearch.toLowerCase()),
        ).slice(0, 50)
      : []

  const filteredBusinessCities =
    businessCitySearch.length > 1
      ? CITIES.filter((c: string) =>
          c.toLowerCase().includes(businessCitySearch.toLowerCase()),
        ).slice(0, 50)
      : []

  const filteredBusinessPincodes =
    businessPincodeSearch.length > 1
      ? PINCODES.filter((p: string) => p.includes(businessPincodeSearch)).slice(
          0,
          50,
        )
      : []

  const data = watch()

  const onSave = (values: UpdateAccountFormValues) => {
    updateMutation.mutate(values)
  }

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/user/filter`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to fetch users')
      return res.json()
    },
  })
  const usersList = usersData?.data || []

  const handleAddNote = async (note: { description: string }) => {
    try {
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: id,
          note: note.description,
          module: 'Accounts',
        }),
      })
      if (res.ok) {
        toast.success('Note added successfully')
        queryClient.invalidateQueries({ queryKey: ['account', id] })
      } else {
        toast.error('Failed to add note')
      }
    } catch (error) {
      toast.error('Network error')
    }
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Spinner className='h-8 w-8 text-muted-foreground' />
      </div>
    )
  }

  if (error || !accountData) {
    return <div className='p-4'>Account not found</div>
  }

  const MAX_NOTES_VISIBLE = 3
  const showViewMore = sortedNotes.length > MAX_NOTES_VISIBLE
  const visibleNotes = showViewMore
    ? sortedNotes.slice(0, MAX_NOTES_VISIBLE)
    : sortedNotes

  return (
    <div className='space-y-6 bg-background min-h-screen'>
      {/* HEADER */}
      <div className='flex justify-between items-center border p-4 rounded-xl bg-card'>
        <div className='space-y-2'>
          <FieldRow label='Account Name' error={errors.accountName?.message}>
            {isEdit && isAllow ? (
              <Input {...register('accountName')} className='h-8' />
            ) : (
              <span className='text-lg font-semibold'>
                {display(accountData?.account_name)}
              </span>
            )}
          </FieldRow>

          <FieldRow label='Account Owner'>
            {isEdit && isAllow ? (
              <Controller
                control={control}
                name='accountOwnerId'
                render={({ field }) => (
                  <Select
                    value={field.value || ''}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className='h-8'>
                      <SelectValue placeholder='Select Account Owner' />
                    </SelectTrigger>
                    <SelectContent>
                      {usersList?.map((u: any) => (
                        <SelectItem key={u.id} value={String(u.id)}>
                          {u.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            ) : (
              <span className='text-base font-bold'>{ownerName}</span>
            )}
          </FieldRow>
        </div>

        {!isEdit ? (
          <Button size='sm' onClick={() => setIsEdit(true)}>
            Update
          </Button>
        ) : (
          <div className='flex gap-2'>
            <Button
              size='sm'
              disabled={!isDirty || updateMutation.isPending}
              onClick={handleSubmit(onSave)}
            >
              {updateMutation.isPending ? (
                <Spinner className='mr-2 h-4 w-4' />
              ) : (
                'Save'
              )}
            </Button>
            <Button
              size='sm'
              variant='outline'
              onClick={() => {
                reset()
                setIsEdit(false)
              }}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      <Card className='overflow-hidden space-y-1'>
        {/* ================= Account Status ================= */}
        <SectionHeader title='Account Status' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2'>
          <div className='md:border-r'>
            <FieldRow label='Assignment Date'>
              <span className='text-sm font-medium text-muted-foreground'>
                {data.assignmentDate
                  ? formatExactDate(
                      data.assignmentDate.toISOString(),
                      'dd MMM yyyy, hh:mm a',
                    )
                  : 'Not assigned yet'}
              </span>
            </FieldRow>

            <FieldRow label='Source' error={errors.source?.message}>
              <Controller
                control={control}
                name='source'
                render={({ field }) => (
                  <SelectField
                    value={field.value}
                    isEdit={isEdit}
                    options={[
                      'Himalaya',
                      'CavinKare',
                      'Alpharubix',
                      'Condor Footwear',
                      'DVG Dist Petroleum',
                      'Havells',
                      'Liberty',
                      'Marico',
                      'Reference',
                      'Swastik',
                      'Unicharm',
                      'Vibhava Marketing',
                      'R1X Website',
                      '5pointcredit',
                      'Event',
                    ]}
                    onChange={field.onChange}
                  />
                )}
              />
            </FieldRow>

            <FieldRow label='Source Type' error={errors.sourceType?.message}>
              <Controller
                control={control}
                name='sourceType'
                render={({ field }) => (
                  <SelectField
                    value={field.value}
                    isEdit={isEdit}
                    options={[
                      'Direct',
                      'Referral',
                      'Partner',
                      'Website',
                      'Other',
                    ]}
                    onChange={field.onChange}
                  />
                )}
              />
            </FieldRow>

            {data.sourceType === 'Other' && (
              <FieldRow label='Source (Others)'>
                {isEdit ? (
                  <Input {...register('sourceOther')} className='h-8' />
                ) : (
                  <span>{display(data.sourceOther)}</span>
                )}
              </FieldRow>
            )}

            <FieldRow label='Source Date' error={errors.sourceDate?.message}>
              <Controller
                control={control}
                name='sourceDate'
                render={({ field }) => (
                  <DateField
                    value={field.value}
                    isEdit={isEdit}
                    onChange={field.onChange}
                  />
                )}
              />
            </FieldRow>

            <FieldRow label='Source Description' error={errors.sourceDescription?.message}>
              {isEdit ? (
                <textarea
                  {...register('sourceDescription')}
                  className='w-full h-20 px-2 border rounded-md text-sm'
                />
              ) : (
                <span>{display(data.sourceDescription)}</span>
              )}
            </FieldRow>

            <FieldRow
              label='Distributor Code'
              error={errors.distributorCode?.message}
            >
              {isEdit ? (
                <Input {...register('distributorCode')} className='h-8' />
              ) : (
                <span>{data.distributorCode || '—'}</span>
              )}
            </FieldRow>

            <FieldRow label='WABA Interested'>
              <Controller
                control={control}
                name='wabaInterested'
                render={({ field }) => (
                  <SelectField
                    value={field.value ? 'Yes' : 'No'}
                    isEdit={isEdit}
                    options={['Yes', 'No']}
                    onChange={(v) => field.onChange(v === 'Yes')}
                  />
                )}
              />
            </FieldRow>
          </div>

          <div>
            <FieldRow label='Call Back Date/ Time'>
              <Controller
                control={control}
                name='callBackDate'
                render={({ field }) => (
                  <DateField
                    value={field.value}
                    isEdit={isEdit}
                    showTime={true}
                    disablePast={true}
                    onChange={field.onChange}
                  />
                )}
              />
            </FieldRow>

            <FieldRow
              label='Account Status'
              error={errors.accountStatus?.message}
            >
              <Controller
                control={control}
                name='accountStatus'
                render={({ field }) => (
                  <SelectField
                    value={field.value}
                    isEdit={isEdit}
                    options={[
                      'Yet to be dialed',
                      'Wrong Number',
                      'Contact Established',
                      'Contact Not Established',
                      'Awareness',
                      'Attention',
                      'Assessment',
                      'Lender Review',
                      'Not Interested',
                      'Location Unserviceable',
                    ]}
                    onChange={field.onChange}
                  />
                )}
              />
            </FieldRow>

            <FieldRow
              label='Account Stage'
              error={errors.accountStage?.message}
            >
              <Controller
                control={control}
                name='accountStage'
                render={({ field }) => (
                  <SelectField
                    value={field.value}
                    isEdit={isEdit}
                    options={[
                      'Initial Pitch',
                      'Product Offering',
                      'Doc List Shared to Cust',
                      'Partial Docs Rec',
                      'Yet To Review',
                      'Under Internal Review',
                      'In Review with Lender',
                      'Interested',
                      'Commercial NI',
                      'Location not doable',
                      'No Requirement',
                    ]}
                    onChange={field.onChange}
                  />
                )}
              />
            </FieldRow>

            <FieldRow
              label='Business Status'
              error={errors.businessStatus?.message}
            >
              <Controller
                control={control}
                name='businessStatus'
                render={({ field }) => (
                  <SelectField
                    value={field.value}
                    isEdit={isEdit}
                    options={['Active', 'Inactive', 'Not Sure']}
                    onChange={field.onChange}
                  />
                )}
              />
            </FieldRow>
          </div>
        </CardContent>

        {/* ================= Customer Basic Details ================= */}
        <SectionHeader title='Customer Basic Details' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2'>
          <div className='md:border-r'>
            <FieldRow label='First Name'>
              {isEdit ? (
                <Input {...register('firstName')} className='h-8' />
              ) : (
                <span>{display(data.firstName)}</span>
              )}
            </FieldRow>
            <FieldRow label='Phone No' error={errors.phone?.message}>
              {isEdit ? (
                <Input {...register('phone')} className='h-8' />
              ) : (
                <span>{display(data.phone)}</span>
              )}
            </FieldRow>
            <FieldRow label='Email' error={errors.email?.message}>
              {isEdit ? (
                <Input {...register('email')} className='h-8' />
              ) : (
                <span>{display(data.email)}</span>
              )}
            </FieldRow>
            <FieldRow label='Created By'>
              <span>{display(data.createdBy)}</span>
            </FieldRow>
          </div>

          <div>
            <FieldRow label='Last Name' error={errors.lastName?.message}>
              {isEdit ? (
                <Input {...register('lastName')} className='h-8' />
              ) : (
                <span>{display(data.lastName)}</span>
              )}
            </FieldRow>
            <FieldRow label="Mother's Name">
              {isEdit ? (
                <Input {...register('mothersName')} className='h-8' />
              ) : (
                <span>{display(data.mothersName)}</span>
              )}
            </FieldRow>
            <FieldRow label='Preferred Language Support'>
              <Controller
                control={control}
                name='preferredLanguages'
                render={({ field }) => (
                  <MultiSelectField
                    value={field.value}
                    options={LANGUAGE_OPTIONS}
                    isEdit={isEdit}
                    onChange={field.onChange}
                    placeholder='Select languages...'
                  />
                )}
              />
            </FieldRow>
          </div>
        </CardContent>

        {/* ================= Customer Business Details ================= */}
        <SectionHeader title='Customer Business Details' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2'>
          <div className='md:border-r'>
            <FieldRow
              label='Business Vintage (No of Years)'
              error={errors.businessVintage?.message}
            >
              {isEdit ? (
                <Input
                  {...register('businessVintage')}
                  className='h-8'
                  type='number'
                />
              ) : (
                <span>{display(data.businessVintage)}</span>
              )}
            </FieldRow>

            <FieldRow label='Business Registration Type'>
              <Controller
                control={control}
                name='businessRegistrationType'
                render={({ field }) => (
                  <SelectField
                    value={field.value}
                    isEdit={isEdit}
                    options={[
                      '-None-',
                      'Proprietorship',
                      'Partnership',
                      'Private Limited',
                    ]}
                    onChange={field.onChange}
                  />
                )}
              />
            </FieldRow>

            <FieldRow label='Suppliers'>
              {isEdit ? (
                <Input {...register('suppliers')} className='h-8' />
              ) : (
                <span>{display(data.suppliers)}</span>
              )}
            </FieldRow>
            <FieldRow label='Description'>
              {isEdit ? (
                <textarea
                  {...register('description')}
                  className='w-full h-20 px-2 border rounded-md text-sm'
                />
              ) : (
                <span>{display(data.description)}</span>
              )}
            </FieldRow>
            <FieldRow label='GSTN'>
              {isEdit ? (
                <Input {...register('gstn')} className='h-8' />
              ) : (
                <span>{display(data.gstn)}</span>
              )}
            </FieldRow>
          </div>

          <div>
            <FieldRow label='Type of Business'>
              <Controller
                control={control}
                name='typeOfBusiness'
                render={({ field }) => (
                  <SelectField
                    value={field.value}
                    isEdit={isEdit}
                    options={[
                      'Manufacturer',
                      'Distributor',
                      'Franchise/FOFO',
                      'Wholesale Trader',
                      'Retailer',
                      'Super Stockist',
                      'Sub Distributor',
                      'Inst Customers',
                      'Govt Institutions',
                      'Co Operative Society',
                    ]}
                    onChange={field.onChange}
                  />
                )}
              />
            </FieldRow>

            <FieldRow label='Industry'>
              <Controller
                control={control}
                name='industry'
                render={({ field }) => (
                  <SelectField
                    value={field.value}
                    isEdit={isEdit}
                    options={[
                      'Pharma',
                      'AHP',
                      'CPD',
                      'FMCG',
                      'OTX',
                      'Footwear',
                      'OTC',
                      'RAAGA',
                      'Hardware',
                      'Electronics',
                      'DVG Dist Petroleum',
                    ]}
                    onChange={field.onChange}
                  />
                )}
              />
            </FieldRow>

            <FieldRow label='PAN'>
              {isEdit ? (
                <Input {...register('pan')} className='h-8' />
              ) : (
                <span>{display(data.pan)}</span>
              )}
            </FieldRow>
          </div>
        </CardContent>

        {/* ================= Address Information of Business Premise ================= */}
        <SectionHeader title='Address Information of Business Premise' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2'>
          <div className='md:border-r'>
            <FieldRow label='Street'>
              {isEdit ? (
                <Input {...register('businessStreet')} className='h-8' />
              ) : (
                <span>{display(data.businessStreet)}</span>
              )}
            </FieldRow>
            <FieldRow label='State'>
              {isEdit ? (
                <div className='relative'>
                  <Input
                    value={businessStateSearch}
                    onChange={(e) => {
                      setBusinessStateSearch(e.target.value)
                      setBusinessStateOpen(true)
                      setValue('businessState', e.target.value, {
                        shouldDirty: true,
                      })
                    }}
                    onFocus={() => setBusinessStateOpen(true)}
                    onBlur={() =>
                      setTimeout(() => setBusinessStateOpen(false), 200)
                    }
                    placeholder='Search State...'
                    className='h-8'
                  />
                  {businessStateOpen && filteredBusinessStates.length > 0 && (
                    <div className='absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto'>
                      {filteredBusinessStates.map((state: string) => (
                        <div
                          key={state}
                          className='p-2 hover:bg-muted cursor-pointer text-sm'
                          onMouseDown={() => {
                            setValue('businessState', state, {
                              shouldDirty: true,
                            })
                            setBusinessStateSearch(state)
                            setBusinessStateOpen(false)
                          }}
                        >
                          {state}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <span>{display(data.businessState)}</span>
              )}
            </FieldRow>
            <FieldRow label='Pincode'>
              {isEdit ? (
                <div className='relative'>
                  <Input
                    value={businessPincodeSearch}
                    onChange={(e) => {
                      setBusinessPincodeSearch(e.target.value)
                      setBusinessPincodeOpen(true)
                      setValue('businessPincode', e.target.value, {
                        shouldDirty: true,
                      })
                    }}
                    onFocus={() => setBusinessPincodeOpen(true)}
                    onBlur={() =>
                      setTimeout(() => setBusinessPincodeOpen(false), 200)
                    }
                    placeholder='Search Pincode...'
                    className='h-8'
                  />
                  {businessPincodeOpen &&
                    filteredBusinessPincodes.length > 0 && (
                      <div className='absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto'>
                        {filteredBusinessPincodes.map((pincode: string) => (
                          <div
                            key={pincode}
                            className='p-2 hover:bg-muted cursor-pointer text-sm'
                            onMouseDown={() => {
                              setValue('businessPincode', pincode, {
                                shouldDirty: true,
                              })
                              setBusinessPincodeSearch(pincode)
                              setBusinessPincodeOpen(false)
                            }}
                          >
                            {pincode}
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              ) : (
                <span>{display(data.businessPincode)}</span>
              )}
            </FieldRow>
            <FieldRow label='Residential Location GPS'>
              {isEdit ? (
                <Input {...register('businessGpsLocation')} className='h-8' />
              ) : (
                <span>{display(data.businessGpsLocation)}</span>
              )}
            </FieldRow>
          </div>
          <div>
            <FieldRow label='City'>
              {isEdit ? (
                <div className='relative'>
                  <Input
                    value={businessCitySearch}
                    onChange={(e) => {
                      setBusinessCitySearch(e.target.value)
                      setBusinessCityOpen(true)
                      setValue('businessCity', e.target.value, {
                        shouldDirty: true,
                      })
                    }}
                    onFocus={() => setBusinessCityOpen(true)}
                    onBlur={() =>
                      setTimeout(() => setBusinessCityOpen(false), 200)
                    }
                    placeholder='Search City...'
                    className='h-8'
                  />
                  {businessCityOpen && filteredBusinessCities.length > 0 && (
                    <div className='absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto'>
                      {filteredBusinessCities.map((city: string) => (
                        <div
                          key={city}
                          className='p-2 hover:bg-muted cursor-pointer text-sm'
                          onMouseDown={() => {
                            setValue('businessCity', city, {
                              shouldDirty: true,
                            })
                            setBusinessCitySearch(city)
                            setBusinessCityOpen(false)
                          }}
                        >
                          {city}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <span>{display(data.businessCity)}</span>
              )}
            </FieldRow>
            <FieldRow label='Country'>
              {isEdit ? (
                <Input {...register('businessCountry')} className='h-8' />
              ) : (
                <span>{display(data.businessCountry)}</span>
              )}
            </FieldRow>
            <FieldRow label='No of Years residing in Business Premise'>
              {isEdit ? (
                <Input
                  {...register('businessYearsResiding')}
                  className='h-8'
                  type='number'
                />
              ) : (
                <span>{display(data.businessYearsResiding)}</span>
              )}
            </FieldRow>
            <FieldRow label='Business Premise Ownership'>
              <Controller
                control={control}
                name='businessOwnership'
                render={({ field }) => (
                  <SelectField
                    value={field.value}
                    isEdit={isEdit}
                    options={[
                      'Self Owned',
                      'Rented',
                      'Parent Owned',
                      'Leased',
                      'Children Owned',
                      'Spouse Owned',
                      'Relative Owned',
                    ]}
                    onChange={field.onChange}
                  />
                )}
              />
            </FieldRow>
          </div>
        </CardContent>

        {/* ================= Address Information of Residence - Applicant ================= */}
        <SectionHeader title='Address Information of Residence - Applicant' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2 border-b'>
          <div className='md:border-r'>
            <FieldRow label='Street'>
              {isEdit ? (
                <Input {...register('applicantStreet')} className='h-8' />
              ) : (
                <span>{display(data.applicantStreet)}</span>
              )}
            </FieldRow>
            {/* <FieldRow label='State'> */}
            <Controller
              control={control}
              name='applicantState'
              render={({ field }) => (
                <StateSelector
                  label='State'
                  value={field.value}
                  onChange={field.onChange}
                  isEdit={isEdit}
                />
              )}
            />
            {/* </FieldRow> */}
            {/* <FieldRow label='City'> */}
            <Controller
              control={control}
              name='applicantCity'
              render={({ field }) => (
                <CitySelector
                  label='City'
                  value={field.value}
                  onChange={field.onChange}
                  isEdit={isEdit}
                />
              )}
            />
            {/* </FieldRow> */}
            <FieldRow label='Country'>
              {isEdit ? (
                <Input
                  {...register('applicantCountry')}
                  className='h-8'
                  placeholder='India'
                />
              ) : (
                <span>{display(data.applicantCountry)}</span>
              )}
            </FieldRow>
          </div>

          <div>
            {/* <FieldRow label='Pincode'> */}
              <Controller
                control={control}
                name='applicantPincode'
                render={({ field }) => (
                  <PincodeSelector
                    label='Pincode'
                    value={field.value}
                    onChange={field.onChange}
                    isEdit={isEdit}
                  />
                )}
              />
            {/* </FieldRow> */}
            <FieldRow label='No of Years residing in current residence'>
              {isEdit ? (
                <Input {...register('applicantYearsResiding')} className='h-8' />
              ) : (
                <span>{display(data.applicantYearsResiding)}</span>
              )}
            </FieldRow>
            <FieldRow label='Residence Ownership'>
              <Controller
                control={control}
                name='applicantOwnership'
                render={({ field }) => (
                  <SelectField
                    value={field.value}
                    isEdit={isEdit}
                    options={[
                      'Self Owned',
                      'Rented',
                      'Parent Owned',
                      'Leased',
                      'Children Owned',
                      'Spouse Owned',
                      'Relative Owned',
                    ]}
                    onChange={field.onChange}
                  />
                )}
              />
            </FieldRow>
            <FieldRow label='Residential Location GPS'>
              {isEdit ? (
                <Input {...register('applicantGpsLocation')} className='h-8' />
              ) : (
                <span>{display(data.applicantGpsLocation)}</span>
              )}
            </FieldRow>
          </div>
        </CardContent>

        {/* ================= Address Information of Residence - Co Applicant ================= */}
        <SectionHeader title='Address Information of Residence - Co Applicant' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2'>
          <div className='md:border-r'>
            <FieldRow label='Street'>
              {isEdit ? (
                <Input {...register('coApplicantStreet')} className='h-8' />
              ) : (
                <span>{display(data.coApplicantStreet)}</span>
              )}
            </FieldRow>
            {/* <FieldRow label='State'> */}
            <Controller
              control={control}
              name='coApplicantState'
              render={({ field }) => (
                <StateSelector
                  label='State'
                  value={field.value}
                  onChange={field.onChange}
                  isEdit={isEdit}
                />
              )}
            />
            {/* </FieldRow> */}
            {/* <FieldRow label='City'> */}
            <Controller
              control={control}
              name='coApplicantCity'
              render={({ field }) => (
                <CitySelector
                  label='City'
                  value={field.value}
                  onChange={field.onChange}
                  isEdit={isEdit}
                />
              )}
            />
            {/* </FieldRow> */}
          </div>

          <div>
            <FieldRow label='Country'>
              {isEdit ? (
                <Input
                  {...register('coApplicantCountry')}
                  className='h-8'
                  placeholder='India'
                />
              ) : (
                <span>{display(data.coApplicantCountry)}</span>
              )}
            </FieldRow>
            {/* <FieldRow label='Pincode'> */}
            <Controller
              control={control}
              name='coApplicantPincode'
              render={({ field }) => (
                <PincodeSelector
                  label='Pincode'
                  value={field.value}
                  onChange={field.onChange}
                  isEdit={isEdit}
                />
              )}
            />
            {/* </FieldRow> */}
            <FieldRow label='No of Years residing in current residence'>
              {isEdit ? (
                <Input {...register('coApplicantYearsResiding')} className='h-8' />
              ) : (
                <span>{display(data.coApplicantYearsResiding)}</span>
              )}
            </FieldRow>
            <FieldRow label='Residence Ownership'>
              <Controller
                control={control}
                name='coApplicantOwnership'
                render={({ field }) => (
                  <SelectField
                    value={field.value}
                    isEdit={isEdit}
                    options={[
                      'Self Owned',
                      'Rented',
                      'Parent Owned',
                      'Leased',
                      'Children Owned',
                      'Spouse Owned',
                      'Relative Owned',
                    ]}
                    onChange={field.onChange}
                  />
                )}
              />
            </FieldRow>
            <FieldRow label='Residential Location GPS'>
              {isEdit ? (
                <Input
                  {...register('coApplicantGpsLocation')}
                  className='h-8'
                />
              ) : (
                <span>{display(data.coApplicantGpsLocation)}</span>
              )}
            </FieldRow>
          </div>
        </CardContent>

        {/* ================= References from Customer ================= */}
        <SectionHeader title='References from Customer' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2'>
          <div className='md:border-r'>
            <FieldRow label='Name of Person 1'>
              {isEdit ? (
                <Input {...register('ref1Name')} className='h-8' />
              ) : (
                <span>{display(data.ref1Name)}</span>
              )}
            </FieldRow>
            <FieldRow
              label='Phone of Person 1'
              error={errors.ref1Phone?.message}
            >
              {isEdit ? (
                <Input {...register('ref1Phone')} className='h-8' />
              ) : (
                <span>{display(data.ref1Phone)}</span>
              )}
            </FieldRow>
            <FieldRow
              label='Email ID Person 1'
              error={errors.ref1Email?.message}
            >
              {isEdit ? (
                <Input {...register('ref1Email')} className='h-8' />
              ) : (
                <span>{display(data.ref1Email)}</span>
              )}
            </FieldRow>
            <FieldRow label='Person 1 Relationship with Borrower'>
              {isEdit ? (
                <Input {...register('ref1Relationship')} className='h-8' />
              ) : (
                <span>{display(data.ref1Relationship)}</span>
              )}
            </FieldRow>
            <FieldRow label='Address of Person 1'>
              {isEdit ? (
                <Input {...register('ref1Address')} className='h-8' />
              ) : (
                <span>{display(data.ref1Address)}</span>
              )}
            </FieldRow>
          </div>
          <div>
            <FieldRow label='Name of Person 2'>
              {isEdit ? (
                <Input {...register('ref2Name')} className='h-8' />
              ) : (
                <span>{display(data.ref2Name)}</span>
              )}
            </FieldRow>
            <FieldRow
              label='Phone of Person 2'
              error={errors.ref2Phone?.message}
            >
              {isEdit ? (
                <Input {...register('ref2Phone')} className='h-8' />
              ) : (
                <span>{display(data.ref2Phone)}</span>
              )}
            </FieldRow>
            <FieldRow
              label='Email ID Person 2'
              error={errors.ref2Email?.message}
            >
              {isEdit ? (
                <Input {...register('ref2Email')} className='h-8' />
              ) : (
                <span>{display(data.ref2Email)}</span>
              )}
            </FieldRow>
            <FieldRow label='Person 2 Relationship with Borrower'>
              {isEdit ? (
                <Input {...register('ref2Relationship')} className='h-8' />
              ) : (
                <span>{display(data.ref2Relationship)}</span>
              )}
            </FieldRow>
            <FieldRow label='Address of Person 2'>
              {isEdit ? (
                <Input {...register('ref2Address')} className='h-8' />
              ) : (
                <span>{display(data.ref2Address)}</span>
              )}
            </FieldRow>
          </div>
        </CardContent>

        {/* ================= Notes ================= */}
        <SectionHeader title='Notes' />
        <CardContent className='p-4 space-y-3'>
          <div className='flex items-center justify-between'>
            <p className='text-sm text-muted-foreground'>
              Total Notes:{' '}
              <span className='font-semibold'>{sortedNotes.length}</span>
            </p>
            {showViewMore && (
              <Dialog open={openAllNotes} onOpenChange={setOpenAllNotes}>
                <DialogTrigger asChild>
                  <Button size='sm' variant='outline'>
                    View More
                  </Button>
                </DialogTrigger>
                <DialogContent className='min-w-4xl'>
                  <DialogHeader>
                    <DialogTitle>All Notes ({sortedNotes.length})</DialogTitle>
                  </DialogHeader>
                  <div className='max-h-[70vh] overflow-y-auto space-y-3 pr-2'>
                    {sortedNotes.map((note: any, i: number) => (
                      <div
                        key={note.parent_id || i}
                        className='bg-muted/30 p-3 rounded-lg border'
                      >
                        <p className='text-sm'>{note.Note_Content}</p>
                        <div className='flex flex-wrap gap-3 text-[11px] text-muted-foreground uppercase mt-2'>
                          <span>
                            Created By: {note.Created_By?.name || '—'}
                          </span>
                          <span>
                            Created Date:{' '}
                            {formatExactDate(
                              note.Created_Time,
                              'dd MMM yyyy, hh:mm a',
                            ) || '—'}
                          </span>
                          <div className='font-bold'>Module: {note.module}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          {notes.length === 0 ? (
            <p className='text-sm text-muted-foreground'>No notes available</p>
          ) : (
            visibleNotes.map((note: any, i: number) => (
              <div
                key={note.parent_id || i}
                className='bg-muted/30 p-3 rounded-lg border'
              >
                <p className='text-sm'>{note.Note_Content}</p>
                <div className='flex flex-wrap gap-3 text-[11px] text-muted-foreground uppercase mt-2'>
                  <span>Created By: {note.Created_By?.name || '—'}</span>
                  <span>
                    Created Date:{' '}
                    {formatExactDate(
                      note.Created_Time,
                      'dd MMM yyyy, hh:mm a',
                    ) || '—'}
                  </span>
                  <div className='font-bold'>Module: {note.module}</div>
                </div>
              </div>
            ))
          )}
          <NoteDialog onAddNote={handleAddNote} />
        </CardContent>

        {/* ================= Deals ================= */}
        <SectionHeader title='Deals' />
        <div className='space-y-4 mx-2'>
          <div className='flex items-center justify-between'>
            <p className='text-sm text-muted-foreground'>
              Total Deals: <span className='font-semibold'>{Deals.length}</span>
            </p>
            {Deals.length > 3 && (
              <Dialog open={openAllDeals} onOpenChange={setOpenAllDeals}>
                <DialogTrigger asChild>
                  <Button size='sm' variant='outline'>
                    View More
                  </Button>
                </DialogTrigger>
                <DialogContent className='min-w-4xl h-1/2'>
                  <DialogHeader>
                    <DialogTitle>All Deals ({Deals.length})</DialogTitle>
                  </DialogHeader>
                  <div className='overflow-auto'>
                    <Table>
                      <TableHeader className='bg-muted sticky top-0 z-10'>
                        <TableRow>
                          <TableHead>Owner</TableHead>
                          <TableHead>Deal Type</TableHead>
                          <TableHead>Deal Status</TableHead>
                          <TableHead>Lender Name</TableHead>
                          <TableHead>Disbursement Amount</TableHead>
                          <TableHead>Modified Date/Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Deals.map((deal: any) => (
                          <TableRow
                            key={deal.id}
                            onClick={() => {
                              navigate(`/deals/${deal.id}`)
                              setOpenAllDeals(false)
                            }}
                            className='cursor-pointer'
                          >
                            <TableCell>
                              {uListLookup(deal.deal_owner_id, usersList)}
                            </TableCell>
                            <TableCell>{deal.deal_type || '—'}</TableCell>
                            <TableCell>{deal.deal_status || '—'}</TableCell>
                            <TableCell>{deal.lender_name || '—'}</TableCell>
                            <TableCell>
                              {formatAmount(deal.disbursed_amount) || '—'}
                            </TableCell>
                            <TableCell>
                              {formatExactDate(
                                deal.updated_at,
                                'dd MMM yyyy, hh:mm a',
                              ) || '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <div className='border rounded-md overflow-hidden'>
            <Table>
              <TableHeader className='bg-muted'>
                <TableRow>
                  <TableHead>Owner</TableHead>
                  <TableHead>Deal Type</TableHead>
                  <TableHead>Deal Status</TableHead>
                  <TableHead>Lender Name</TableHead>
                  <TableHead>Disbursement Amount</TableHead>
                  <TableHead>Modified Date/Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Deals.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className='text-center text-muted-foreground'
                    >
                      No deals available
                    </TableCell>
                  </TableRow>
                ) : (
                  Deals.slice(0, 3).map((deal: any) => (
                    <TableRow
                      key={deal.id}
                      onClick={() => navigate(`/deals/${deal.id}`)}
                      className='cursor-pointer'
                    >
                      <TableCell>
                        {uListLookup(deal.deal_owner_id, usersList)}
                      </TableCell>
                      <TableCell>{deal.deal_type || '—'}</TableCell>
                      <TableCell>{deal.deal_status || '—'}</TableCell>
                      <TableCell>{deal.lender_name || '—'}</TableCell>
                      <TableCell>
                        {formatAmount(deal.disbursed_amount) || '—'}
                      </TableCell>
                      <TableCell>
                        {formatExactDate(
                          deal.updated_at,
                          'dd MMM yyyy, hh:mm a',
                        ) || '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className='flex justify-center'>
            <Button
              variant='outline'
              size='sm'
              onClick={() =>
                navigate(`/deals-create`, {
                  state: {
                    accountId: id,
                    accountName: accountData?.account_name,
                  },
                })
              }
            >
              <Plus className='h-4 w-4 mr-2' /> Add Deal
            </Button>
          </div>
        </div>

        {/* ================= Contacts ================= */}
        <SectionHeader title='Contacts' />
        <div className='space-y-4 mx-2'>
          <div className='flex items-center justify-between'>
            <p className='text-sm text-muted-foreground'>
              Total Contacts:{' '}
              <span className='font-semibold'>{contacts.length}</span>
            </p>
            {contacts.length > 3 && (
              <Dialog open={openAllContacts} onOpenChange={setOpenAllContacts}>
                <DialogTrigger asChild>
                  <Button size='sm' variant='outline'>
                    View More
                  </Button>
                </DialogTrigger>
                <DialogContent className='max-w-4xl max-h-[80vh] flex flex-col'>
                  <DialogHeader>
                    <DialogTitle>All Contacts ({contacts.length})</DialogTitle>
                  </DialogHeader>
                  <div className='overflow-auto'>
                    <Table>
                      <TableHeader className='bg-muted sticky top-0 z-10'>
                        <TableRow>
                          <TableHead>Contact Name</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Mobile</TableHead>
                          <TableHead>Email</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contacts.map((contact: any) => (
                          <TableRow
                            key={contact.id}
                            onClick={() => {
                              navigate(`/contacts/${contact.id}`)
                              setOpenAllContacts(false)
                            }}
                            className='cursor-pointer'
                          >
                            <TableCell>{contact.last_name || '—'}</TableCell>
                            <TableCell>{contact.phone || '—'}</TableCell>
                            <TableCell>{contact.mobile || '—'}</TableCell>
                            <TableCell>{contact.email || '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <div className='border rounded-md overflow-hidden'>
            <Table>
              <TableHeader className='bg-muted'>
                <TableRow>
                  <TableHead>Contact Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className='text-center text-muted-foreground'
                    >
                      No contacts available
                    </TableCell>
                  </TableRow>
                ) : (
                  contacts.slice(0, 3).map((contact: any) => (
                    <TableRow
                      key={contact.id}
                      onClick={() => navigate(`/contacts/${contact.id}`)}
                      className='cursor-pointer'
                    >
                      <TableCell>{contact.last_name || '—'}</TableCell>
                      <TableCell>{contact.phone || '—'}</TableCell>
                      <TableCell>{contact.mobile || '—'}</TableCell>
                      <TableCell>{contact.email || '—'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className='flex justify-center'>
            <Button
              variant='outline'
              size='sm'
              onClick={() =>
                navigate(`/contacts-create`, {
                  state: {
                    accountId: id,
                    accountName: accountData?.account_name,
                    leadSource: data.source,
                  },
                })
              }
            >
              <Plus className='h-4 w-4 mr-2' /> Add Contact
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

function uListLookup(ownerId: any, list: any[]) {
  if (!ownerId || !Array.isArray(list)) return '—'
  const found = list.find((u) => String(u.id) === String(ownerId))
  return found ? found.full_name : '—'
}
