import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
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
import users from '@/utils/users.json'

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

// Language options for multi-select
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

// Shows "—" only for empty values
function display(v: any) {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'string' && v.trim() === '') return '—'
  return v
}

// Multi-Select Component
function MultiSelectField({
  value,
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

  const filteredOptions = options.filter(
    (opt) =>
      opt.toLowerCase()?.includes(searchTerm.toLowerCase()) &&
      !value?.includes(opt),
  )

  const addLanguage = (lang: string) => {
    onChange([...value, lang])
    setSearchTerm('')
  }

  const removeLanguage = (lang: string) => {
    onChange(value.filter((l) => l !== lang))
  }

  if (!isEdit) {
    return <span>{display(value?.join(', '))}</span>
  }

  return (
    <div className='relative'>
      <div className='flex flex-wrap gap-1 mb-2'>
        {value.map((lang) => (
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

// Map API response to form values (UPDATED for new structure)
function mapAccountToForm(apiData: any): UpdateAccountFormValues {
  return {
    // Account Status Section
    assignmentDate: apiData.assignment_date
      ? new Date(apiData.assignment_date)
      : undefined,
    source: apiData.source ?? '',
    accountOwnerId: apiData.account_owner_id ?? 0,
    sourceType: apiData.source_type ?? '',
    sourceOther: apiData.source_other ?? '',
    distributorCode: apiData.distributor_code ?? '',
    wabaInterested: apiData.waba_interested ?? false,
    callBackDate: apiData.call_back_date_time
      ? new Date(apiData.call_back_date_time)
      : undefined,
    accountStatus: apiData.account_status ?? '',
    accountStage: apiData.account_stage ?? '',
    businessStatus: apiData.business_status ?? '',

    // Customer Basic Details
    firstName: apiData.first_name ?? '',
    lastName: apiData.last_name ?? '',
    phone: apiData.phone ?? '',
    email: apiData.email ?? '',
    mothersName: apiData.mothers_name ?? '',
    preferredLanguages: Array.isArray(apiData.preferred_languages)
      ? apiData.preferred_languages
      : [],
    createdBy: apiData.created_by?.full_name ?? '',

    // Customer Business Details (NEW JSONB structure)
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
    // Address Information - Business Premise (NEW JSONB structure)
    businessStreet: apiData.business_premise_address?.street ?? '',
    businessCity: apiData.business_premise_address?.city ?? '',
    businessState: apiData.business_premise_address?.state ?? '',
    businessCountry: apiData.business_premise_address?.country ?? 'India',
    businessPincode: apiData.business_premise_address?.pincode ?? '',
    businessYearsResiding:
      apiData.business_premise_address?.years_residing?.toString() ?? '',
    businessGpsLocation: apiData.business_premise_address?.gps_location ?? '',
    businessOwnership: apiData.business_premise_address?.ownership_type ?? '',

    // Address Information - Applicant Residence (NEW JSONB structure)
    applicantStreet: apiData.applicant_residence_address?.street ?? '',
    applicantCity: apiData.applicant_residence_address?.city ?? '',
    applicantState: apiData.applicant_residence_address?.state ?? '',
    applicantCountry: apiData.applicant_residence_address?.country ?? 'India',
    applicantPincode: apiData.applicant_residence_address?.pincode ?? '',
    applicantYearsResiding:
      apiData.applicant_residence_address?.years_residing?.toString() ?? '',
    applicantGpsLocation:
      apiData.applicant_residence_address?.gps_location ?? '',

    // Address Information - Co-Applicant Residence (NEW)
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
    noOfBusinessYears: apiData.business_premise_address?.years_residing ?? '',
    gpsLocation: apiData.business_premise_address?.gps_location ?? '',

    coApplicantCode: apiData.co_applicant_residence_address?.pincode ?? '',
    coApplicantYears:
      apiData.co_applicant_residence_address?.years_residing ?? '',
    // References (UPDATED with relationship and address)
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

// Map form values to API payload (UPDATED for new structure)
function mapFormToApi(
  formData: UpdateAccountFormValues,
  dirtyFields: Partial<Record<keyof UpdateAccountFormValues, boolean>>,
): any {
  const payload: any = {}

  // Simple fields
  if (dirtyFields.assignmentDate)
    payload.assignment_date = formData.assignmentDate
  if (dirtyFields.source) payload.source = formData.source
  if (dirtyFields.sourceType) payload.source_type = formData.sourceType
  if (dirtyFields.sourceOther) payload.source_other = formData.sourceOther
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

  // Business Details JSONB
  const businessDetails: any = {}
  if (dirtyFields.businessRegistrationType)
    businessDetails.registration_type = formData.businessRegistrationType
  if (dirtyFields.businessVintage)
    businessDetails.vintage_years = parseInt(formData.businessVintage) || 0
  if (dirtyFields.suppliers) businessDetails.suppliers = formData.suppliers
  if (dirtyFields.description)
    businessDetails.description = formData.description
  if (dirtyFields.typeOfBusiness)
    businessDetails.type_of_business = formData.typeOfBusiness
  if (dirtyFields.industry) businessDetails.industry = formData.industry
  if (dirtyFields.gstn) businessDetails.gstn = formData.gstn
  if (dirtyFields.pan) businessDetails.pan = formData.pan
  if (Object.keys(businessDetails).length > 0)
    payload.business_details = businessDetails

  // Business Premise Address JSONB
  const businessPremiseAddress: any = {}
  if (dirtyFields.businessStreet)
    businessPremiseAddress.street = formData.businessStreet
  if (dirtyFields.businessCity)
    businessPremiseAddress.city = formData.businessCity
  if (dirtyFields.businessState)
    businessPremiseAddress.state = formData.businessState
  if (dirtyFields.businessCountry)
    businessPremiseAddress.country = formData.businessCountry
  if (dirtyFields.businessPincode)
    businessPremiseAddress.pincode = formData.businessPincode
  if (dirtyFields.businessYearsResiding)
    businessPremiseAddress.years_residing =
      parseInt(formData.businessYearsResiding) || 0
  if (dirtyFields.businessGpsLocation)
    businessPremiseAddress.gps_location = formData.businessGpsLocation
  if (dirtyFields.businessOwnership)
    businessPremiseAddress.ownership_type = formData.businessOwnership
  if (Object.keys(businessPremiseAddress).length > 0)
    payload.business_premise_address = businessPremiseAddress

  // Applicant Residence Address JSONB
  const applicantResidenceAddress: any = {}
  if (dirtyFields.applicantStreet)
    applicantResidenceAddress.street = formData.applicantStreet
  if (dirtyFields.applicantCity)
    applicantResidenceAddress.city = formData.applicantCity
  if (dirtyFields.applicantState)
    applicantResidenceAddress.state = formData.applicantState
  if (dirtyFields.applicantCountry)
    applicantResidenceAddress.country = formData.applicantCountry
  if (dirtyFields.applicantPincode)
    applicantResidenceAddress.pincode = formData.applicantPincode
  if (dirtyFields.applicantYearsResiding)
    applicantResidenceAddress.years_residing =
      parseInt(formData.applicantYearsResiding) || 0
  if (dirtyFields.applicantGpsLocation)
    applicantResidenceAddress.gps_location = formData.applicantGpsLocation
  if (dirtyFields.applicantOwnership)
    applicantResidenceAddress.ownership_type = formData.applicantOwnership
  if (Object.keys(applicantResidenceAddress).length > 0)
    payload.applicant_residence_address = applicantResidenceAddress

  // Co-Applicant Residence Address JSONB
  const coApplicantResidenceAddress: any = {}
  if (dirtyFields.coApplicantName)
    coApplicantResidenceAddress.name = formData.coApplicantName
  if (dirtyFields.coApplicantPhone)
    coApplicantResidenceAddress.phone = formData.coApplicantPhone
  if (dirtyFields.coApplicantRelationship)
    coApplicantResidenceAddress.relationship = formData.coApplicantRelationship
  if (dirtyFields.coApplicantEmail)
    coApplicantResidenceAddress.email = formData.coApplicantEmail
  if (dirtyFields.coApplicantStreet)
    coApplicantResidenceAddress.street = formData.coApplicantStreet
  if (dirtyFields.coApplicantCity)
    coApplicantResidenceAddress.city = formData.coApplicantCity
  if (dirtyFields.coApplicantState)
    coApplicantResidenceAddress.state = formData.coApplicantState
  if (dirtyFields.coApplicantCountry)
    coApplicantResidenceAddress.country = formData.coApplicantCountry
  if (dirtyFields.coApplicantPincode)
    coApplicantResidenceAddress.pincode = formData.coApplicantPincode
  if (dirtyFields.coApplicantYearsResiding)
    coApplicantResidenceAddress.years_residing =
      parseInt(formData.coApplicantYearsResiding) || 0
  if (dirtyFields.coApplicantGpsLocation)
    coApplicantResidenceAddress.gps_location = formData.coApplicantGpsLocation
  if (dirtyFields.coApplicantOwnership)
    coApplicantResidenceAddress.ownership_type = formData.coApplicantOwnership
  if (Object.keys(coApplicantResidenceAddress).length > 0)
    payload.co_applicant_residence_address = coApplicantResidenceAddress

  // In mapFormToApi - add these to the respective JSONB objects
  // Add to business_premise_address
  if (dirtyFields.noOfBusinessYears) {
    businessPremiseAddress.years_residing =
      parseInt(formData.noOfBusinessYears) || 0
  }
  if (dirtyFields.gpsLocation) {
    businessPremiseAddress.gps_location = formData.gpsLocation
  }

  // Add to applicant_residence_address
  if (dirtyFields.applicantCity)
    applicantResidenceAddress.city = formData.applicantCity
  if (dirtyFields.applicantCountry)
    applicantResidenceAddress.country = formData.applicantCountry
  if (dirtyFields.applicantPincode)
    applicantResidenceAddress.pincode = formData.applicantCode
  if (dirtyFields.applicantYearsResiding)
    applicantResidenceAddress.years_residing = parseInt(formData.noOfYears) || 0

  // Add to co_applicant_residence_address
  if (dirtyFields.coApplicantStreet)
    coApplicantResidenceAddress.street = formData.coApplicantStreet
  if (dirtyFields.coApplicantState)
    coApplicantResidenceAddress.state = formData.coApplicantState
  if (dirtyFields.coApplicantCity)
    coApplicantResidenceAddress.city = formData.coApplicantCity
  if (dirtyFields.coApplicantCountry)
    coApplicantResidenceAddress.country = formData.coApplicantCountry
  if (dirtyFields.coApplicantPincode)
    coApplicantResidenceAddress.pincode = formData.coApplicantCode
  if (dirtyFields.coApplicantYearsResiding)
    coApplicantResidenceAddress.years_residing =
      parseInt(formData.coApplicantYears) || 0
  if (dirtyFields.coApplicantOwnership)
    coApplicantResidenceAddress.ownership_type = formData.coApplicantOwnership
  // Customer References JSONB (UPDATED with relationship and address)
  const customerReferences: any = {}
  const person1: any = {}
  const person2: any = {}

  if (dirtyFields.ref1Name) person1.name = formData.ref1Name
  if (dirtyFields.ref1Phone) person1.phone = formData.ref1Phone
  if (dirtyFields.ref1Email) person1.email = formData.ref1Email
  if (dirtyFields.ref1Relationship)
    person1.relationship = formData.ref1Relationship
  if (dirtyFields.ref1Address) person1.address = formData.ref1Address
  if (Object.keys(person1).length > 0) customerReferences.person1 = person1

  if (dirtyFields.ref2Name) person2.name = formData.ref2Name
  if (dirtyFields.ref2Phone) person2.phone = formData.ref2Phone
  if (dirtyFields.ref2Email) person2.email = formData.ref2Email
  if (dirtyFields.ref2Relationship)
    person2.relationship = formData.ref2Relationship
  if (dirtyFields.ref2Address) person2.address = formData.ref2Address
  if (Object.keys(person2).length > 0) customerReferences.person2 = person2

  if (Object.keys(customerReferences).length > 0)
    payload.customer_references = customerReferences

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
  // For Business Premise State
  const [businessStateSearch, setBusinessStateSearch] = useState('')
  const [businessStateOpen, setBusinessStateOpen] = useState(false)
  const [businessCitySearch, setBusinessCitySearch] = useState('')
  const [businessCityOpen, setBusinessCityOpen] = useState(false)
  const [businessPincodeSearch, setBusinessPincodeSearch] = useState('')
  const [businessPincodeOpen, setBusinessPincodeOpen] = useState(false)

  const form = useForm<UpdateAccountFormValues>({
    resolver: zodResolver(updateAccountSchema),
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty, dirtyFields },
  } = form

  // Fetch account data
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
      reset(variables)
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
        <div>
          <h1 className='text-lg font-semibold'>
            Account Name: {accountData?.account_name}
          </h1>
          <h1 className='text-base font-medium'>
            Account Owner:{' '}
            <span className='text-base font-bold'>{ownerName}</span>
          </h1>
        </div>
        {!isEdit ? (
          <Button
            size='sm'
            className='cursor-pointer'
            onClick={() => setIsEdit(true)}
          >
            Update
          </Button>
        ) : (
          <div className='flex gap-2'>
            <Button
              size='sm'
              className='cursor-pointer'
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
              className='cursor-pointer'
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
              <span>
                {formatExactDate(
                  data.assignmentDate?.toISOString() || '',
                  'dd MMM yyyy, hh:mm a',
                ) || '—'}
              </span>
            </FieldRow>

            <FieldRow label='Source' error={errors.source?.message}>
              <SelectField
                value={data.source}
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
                ]}
                onChange={(v) => setValue('source', v, { shouldDirty: true })}
              />
            </FieldRow>

            {/* NEW: Source Type */}
            <FieldRow label='Source Type' error={errors.sourceType?.message}>
              <SelectField
                value={data.sourceType}
                isEdit={isEdit}
                options={['Direct', 'Referral', 'Partner', 'Website', 'Other']}
                onChange={(v) =>
                  setValue('sourceType', v, { shouldDirty: true })
                }
              />
            </FieldRow>

            {/* NEW: Source (Others) - Shows only when Source Type is 'Other' */}
            {data.sourceType === 'Other' && (
              <FieldRow label='Source (Others)'>
                {isEdit ? (
                  <Input {...register('sourceOther')} className='h-8' />
                ) : (
                  <span>{display(data.sourceOther)}</span>
                )}
              </FieldRow>
            )}

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
              <SelectField
                value={
                  data.wabaInterested === null ||
                  data.wabaInterested === undefined
                    ? '—'
                    : data.wabaInterested
                      ? 'Yes'
                      : 'No'
                }
                isEdit={isEdit}
                options={['Yes', 'No']}
                onChange={(v) =>
                  setValue('wabaInterested', v === 'Yes', { shouldDirty: true })
                }
              />
            </FieldRow>
          </div>

          <div>
            <FieldRow label='Call Back Date/ Time'>
              <DateField
                value={data.callBackDate}
                isEdit={isEdit}
                showTime={true}
                disablePast={true}
                onChange={(d) =>
                  setValue('callBackDate', d, { shouldDirty: true })
                }
              />
            </FieldRow>

            <FieldRow
              label='Account Status'
              error={errors.accountStatus?.message}
            >
              <SelectField
                value={data.accountStatus}
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
                onChange={(v) =>
                  setValue('accountStatus', v, { shouldDirty: true })
                }
              />
            </FieldRow>

            <FieldRow
              label='Account Stage'
              error={errors.accountStage?.message}
            >
              <SelectField
                value={data.accountStage}
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
                onChange={(v) =>
                  setValue('accountStage', v, { shouldDirty: true })
                }
              />
            </FieldRow>

            <FieldRow
              label='Business Status'
              error={errors.businessStatus?.message}
            >
              <SelectField
                value={data.businessStatus}
                isEdit={isEdit}
                options={['Active', 'Inactive', 'Not Sure']}
                onChange={(v) =>
                  setValue('businessStatus', v, { shouldDirty: true })
                }
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

            {/* UPDATED: Mothers Name - now direct column */}
            <FieldRow label="Mother's Name">
              {isEdit ? (
                <Input {...register('mothersName')} className='h-8' />
              ) : (
                <span>{display(data.mothersName)}</span>
              )}
            </FieldRow>

            {/* UPDATED: Preferred Language - now multi-select */}
            <FieldRow label='Preferred Language Support'>
              <MultiSelectField
                value={data.preferredLanguages}
                options={LANGUAGE_OPTIONS}
                isEdit={isEdit}
                onChange={(v) =>
                  setValue('preferredLanguages', v, { shouldDirty: true })
                }
                placeholder='Select languages...'
              />
            </FieldRow>
          </div>
        </CardContent>

        {/* ================= Customer Business Details ================= */}
        <SectionHeader title='Customer Business Details' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2'>
          <div className='md:border-r'>
            {/* UPDATED: Business Vintage - from business_details */}
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

            {/* UPDATED: Business Registration Type - from business_details */}
            <FieldRow label='Business Registration Type'>
              <SelectField
                value={display(data.businessRegistrationType)}
                isEdit={isEdit}
                options={[
                  '-None-',
                  'Proprietorship',
                  'Partnership',
                  'Private Limited',
                ]}
                onChange={(v) =>
                  setValue('businessRegistrationType', v, { shouldDirty: true })
                }
              />
            </FieldRow>

            {/* UPDATED: Suppliers - from business_details */}
            <FieldRow label='Suppliers'>
              {isEdit ? (
                <Input {...register('suppliers')} className='h-8' />
              ) : (
                <span>{display(data.suppliers)}</span>
              )}
            </FieldRow>

            {/* UPDATED: Description - from business_details */}
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

            {/* NEW: GSTN */}
            <FieldRow label='GSTN'>
              {isEdit ? (
                <Input {...register('gstn')} className='h-8' />
              ) : (
                <span>{display(data.gstn)}</span>
              )}
            </FieldRow>
          </div>

          <div>
            <FieldRow label='Parent Account'>
              <span>{display(data.parentAccount)}</span>
            </FieldRow>

            {/* UPDATED: Type of Business - from business_details */}
            <FieldRow label='Type of Business'>
              <SelectField
                value={display(data.typeOfBusiness)}
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
                onChange={(v) =>
                  setValue('typeOfBusiness', v, { shouldDirty: true })
                }
              />
            </FieldRow>

            {/* UPDATED: Industry - from business_details */}
            <FieldRow label='Industry'>
              <SelectField
                value={display(data.industry)}
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
                onChange={(v) => setValue('industry', v, { shouldDirty: true })}
              />
            </FieldRow>

            {/* NEW: PAN */}
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
              <SelectField
                value={display(data.businessOwnership)}
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
                onChange={(v) =>
                  setValue('businessOwnership', v, { shouldDirty: true })
                }
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

            <FieldRow label='State'>
              <StateSelector
                value={data.applicantState}
                onChange={(val) =>
                  setValue('applicantState', val, { shouldDirty: true })
                }
                isEdit={isEdit}
              />
            </FieldRow>

            <FieldRow label='City'>
              <CitySelector
                value={data.applicantCity}
                onChange={(val) =>
                  setValue('applicantCity', val, { shouldDirty: true })
                }
                isEdit={isEdit}
              />
            </FieldRow>
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
            <FieldRow label='Pincode'>
              <PincodeSelector
                value={data.applicantCode}
                onChange={(val) =>
                  setValue('applicantCode', val, { shouldDirty: true })
                }
                isEdit={isEdit}
              />
            </FieldRow>

            <FieldRow label='No of Years residing in current residence'>
              {isEdit ? (
                <Input {...register('noOfYears')} className='h-8' />
              ) : (
                <span>{display(data.noOfYears)}</span>
              )}
            </FieldRow>

            <FieldRow label='Residence Ownership'>
              <SelectField
                value={display(data.applicantOwnership)}
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
                onChange={(v) =>
                  setValue('applicantOwnership', v, { shouldDirty: true })
                }
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

            <FieldRow label='State'>
              <StateSelector
                value={data.coApplicantState}
                onChange={(val) =>
                  setValue('coApplicantState', val, { shouldDirty: true })
                }
                isEdit={isEdit}
              />
            </FieldRow>

            <FieldRow label='City'>
              <CitySelector
                value={data.coApplicantCity}
                onChange={(val) =>
                  setValue('coApplicantCity', val, { shouldDirty: true })
                }
                isEdit={isEdit}
              />
            </FieldRow>
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

            <FieldRow label='Pincode'>
              <PincodeSelector
                value={data.coApplicantCode}
                onChange={(val) =>
                  setValue('coApplicantCode', val, { shouldDirty: true })
                }
                isEdit={isEdit}
              />
            </FieldRow>

            <FieldRow label='No of Years residing in current residence'>
              {isEdit ? (
                <Input {...register('coApplicantYears')} className='h-8' />
              ) : (
                <span>{display(data.coApplicantYears)}</span>
              )}
            </FieldRow>

            <FieldRow label='Residence Ownership'>
              <SelectField
                value={display(data.coApplicantOwnership)}
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
                onChange={(v) =>
                  setValue('coApplicantOwnership', v, { shouldDirty: true })
                }
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
            {/* NEW: Person 1 Relationship */}
            <FieldRow label='Person 1 Relationship with Borrower'>
              {isEdit ? (
                <Input {...register('ref1Relationship')} className='h-8' />
              ) : (
                <span>{display(data.ref1Relationship)}</span>
              )}
            </FieldRow>
            {/* NEW: Person 1 Address */}
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
            {/* NEW: Person 2 Relationship */}
            <FieldRow label='Person 2 Relationship with Borrower'>
              {isEdit ? (
                <Input {...register('ref2Relationship')} className='h-8' />
              ) : (
                <span>{display(data.ref2Relationship)}</span>
              )}
            </FieldRow>
            {/* NEW: Person 2 Address */}
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
                              {(users as Record<string, string>)[
                                deal.deal_owner_id
                              ] || '—'}
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
                      colSpan={5}
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
                        {(users as Record<string, string>)[
                          deal.deal_owner_id
                        ] || '—'}
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
