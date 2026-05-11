import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import SectionHeader from '@/components/shared/section-header'
import FieldRow from '@/components/shared/field-row'
import SelectField from '@/components/shared/select-field'
import DateField from '@/components/shared/date-field'
import { Spinner } from '@/components/ui/spinner'
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
} from '@/components/ui/select'
import {
  updateAccountSchema,
  type UpdateAccountFormValues,
} from '@/validators/updateAccount.schema'
import { ENV } from '@/conf'
import { X } from 'lucide-react'

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

function display(v: any) {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'string' && v.trim() === '') return '—'
  return v
}

// Multi-Select Component
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

  const addLanguage = (lang: string) => {
    onChange([...value, lang])
    setSearchTerm('')
  }

  const removeLanguage = (lang: string) => {
    onChange(value.filter((l) => l !== lang))
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
            <button type='button' onClick={() => removeLanguage(lang)}>
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

// Map form values to API payload for CREATE

export default function CreateAccount() {
  const navigate = useNavigate()

  const [businessStateSearch, setBusinessStateSearch] = useState('')
  const [businessStateOpen, setBusinessStateOpen] = useState(false)
  const [businessCitySearch, setBusinessCitySearch] = useState('')
  const [businessCityOpen, setBusinessCityOpen] = useState(false)
  const [businessPincodeSearch, setBusinessPincodeSearch] = useState('')
  const [businessPincodeOpen, setBusinessPincodeOpen] = useState(false)

  const form = useForm<UpdateAccountFormValues>({
    resolver: zodResolver(updateAccountSchema),
    defaultValues: {
      preferredLanguages: [],
      wabaInterested: false,
      accountStatus: 'Yet to be dialed',
      businessCountry: 'India',
      applicantCountry: 'India',
      coApplicantCountry: 'India',
      accountOwnerId: '',
    },
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = form

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

  const users = usersData?.data || []

  function mapFormToCreatePayload(formData: UpdateAccountFormValues): any {
    console.log('FormData accountOwnerId:', formData.accountOwnerId)
    return {
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      account_name: `${formData.firstName} ${formData.lastName}`.trim(),
      source: formData.source,
      source_type: formData.sourceType,
      source_other: formData.sourceOther,
      distributor_code: formData.distributorCode,
      waba_interested: formData.wabaInterested,
      call_back_date_time: formData.callBackDate,
      account_owner_id: formData.accountOwnerId,
      account_status: formData.accountStatus,
      account_stage: formData.accountStage,
      business_status: formData.businessStatus,
      mothers_name: formData.mothersName,
      preferred_languages: formData.preferredLanguages,

      // Business Details
      business_details: {
        vintage_years: formData.businessVintage
          ? parseInt(formData.businessVintage)
          : null,
        registration_type: formData.businessRegistrationType,
        suppliers: formData.suppliers,
        description: formData.description,
        type_of_business: formData.typeOfBusiness,
        industry: formData.industry,
        gstn: formData.gstn,
        pan: formData.pan,
      },

      // Business Premise Address
      business_premise_address: {
        street: formData.businessStreet,
        city: formData.businessCity,
        state: formData.businessState,
        country: formData.businessCountry || 'India',
        pincode: formData.businessPincode,
        years_residing: formData.businessYearsResiding
          ? parseInt(formData.businessYearsResiding)
          : null,
        gps_location: formData.businessGpsLocation,
        ownership_type: formData.businessOwnership,
      },

      // Applicant Residence Address
      applicant_residence_address: {
        street: formData.applicantStreet,
        city: formData.applicantCity,
        state: formData.applicantState,
        country: formData.applicantCountry || 'India',
        pincode: formData.applicantPincode,
        years_residing: formData.applicantYearsResiding
          ? parseInt(formData.applicantYearsResiding)
          : null,
        gps_location: formData.applicantGpsLocation,
        ownership_type: formData.applicantOwnership,
      },

      // Co-Applicant Residence Address
      co_applicant_residence_address: {
        name: formData.coApplicantName,
        phone: formData.coApplicantPhone,
        relationship: formData.coApplicantRelationship,
        email: formData.coApplicantEmail,
        street: formData.coApplicantStreet,
        city: formData.coApplicantCity,
        state: formData.coApplicantState,
        country: formData.coApplicantCountry || 'India',
        pincode: formData.coApplicantPincode,
        years_residing: formData.coApplicantYearsResiding
          ? parseInt(formData.coApplicantYearsResiding)
          : null,
        gps_location: formData.coApplicantGpsLocation,
        ownership_type: formData.coApplicantOwnership,
      },

      // References
      customer_references: {
        person1: {
          name: formData.ref1Name,
          phone: formData.ref1Phone,
          email: formData.ref1Email,
          relationship: formData.ref1Relationship,
          address: formData.ref1Address,
        },
        person2: {
          name: formData.ref2Name,
          phone: formData.ref2Phone,
          email: formData.ref2Email,
          relationship: formData.ref2Relationship,
          address: formData.ref2Address,
        },
      },
    }
  }

  const data = watch()

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

  const createMutation = useMutation({
    mutationFn: async (values: UpdateAccountFormValues) => {
      const payload = mapFormToCreatePayload(values)
      console.log('Sending payload:', payload)
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.detail || 'Failed to create account')
      }
      return res.json()
    },
    onSuccess: (response) => {
      toast.success('Account created successfully!')
      // Log the response to see its structure
      console.log('Create response:', response)
      // Try different paths based on your API response
      navigate(`/accounts/${response.id || response.data?.id}`)
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create account')
    },
  })

  const onSubmit = (values: UpdateAccountFormValues) => {
    createMutation.mutate(values)
  }

  return (
    <div className='space-y-6 bg-background min-h-screen p-6'>
      {/* HEADER */}
      <div className='flex justify-between items-center border p-4 rounded-xl bg-card'>
        <div>
          <h1 className='text-lg font-semibold'>Create New Account</h1>
        </div>
        <div className='flex gap-2'>
          <Button size='sm' variant='outline' onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button
            size='sm'
            disabled={isSubmitting || createMutation.isPending}
            onClick={handleSubmit(onSubmit)}
            type='submit'
          >
            {createMutation.isPending ? (
              <Spinner className='mr-2 h-4 w-4' />
            ) : (
              'Create Account'
            )}
          </Button>
        </div>
      </div>

      <Card className='overflow-hidden space-y-1'>
        {/* ================= Account Status ================= */}
        <SectionHeader title='Account Status' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2'>
          <div className='md:border-r'>
            <FieldRow
              label='Account Owner *'
              error={errors.accountOwnerId?.message}
            >
              <Select
                value={data.accountOwnerId || ''}
                onValueChange={(val) =>
                  setValue('accountOwnerId', val, { shouldDirty: true })
                }
              >
                <SelectTrigger className='h-8'>
                  <SelectValue placeholder='Select Account Owner' />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label='Source' error={errors.source?.message}>
              <SelectField
                value={data.source}
                isEdit={true}
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
                onChange={(v) => setValue('source', v)}
              />
            </FieldRow>

            <FieldRow label='Source Type' error={errors.sourceType?.message}>
              <SelectField
                value={data.sourceType}
                isEdit={true}
                options={['Direct', 'Referral', 'Partner', 'Website', 'Other']}
                onChange={(v) => setValue('sourceType', v)}
              />
            </FieldRow>

            {data.sourceType === 'Other' && (
              <FieldRow label='Source (Others)'>
                <Input {...register('sourceOther')} className='h-8' />
              </FieldRow>
            )}

            <FieldRow
              label='Distributor Code'
              error={errors.distributorCode?.message}
            >
              <Input {...register('distributorCode')} className='h-8' />
            </FieldRow>

            <FieldRow label='WABA Interested'>
              <SelectField
                value={data.wabaInterested ? 'Yes' : 'No'}
                isEdit={true}
                options={['Yes', 'No']}
                onChange={(v) => setValue('wabaInterested', v === 'Yes')}
              />
            </FieldRow>
          </div>

          <div>
            <FieldRow label='Call Back Date/ Time'>
              <DateField
                value={data.callBackDate}
                isEdit={true}
                showTime={true}
                disablePast={true}
                onChange={(d) => setValue('callBackDate', d)}
              />
            </FieldRow>

            <FieldRow
              label='Account Status'
              error={errors.accountStatus?.message}
            >
              <SelectField
                value={data.accountStatus}
                isEdit={true}
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
                onChange={(v) => setValue('accountStatus', v)}
              />
            </FieldRow>

            <FieldRow
              label='Account Stage *'
              error={errors.accountStage?.message}
            >
              <SelectField
                value={data.accountStage}
                isEdit={true}
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
                onChange={(v) => setValue('accountStage', v)}
              />
            </FieldRow>

            <FieldRow
              label='Business Status'
              error={errors.businessStatus?.message}
            >
              <SelectField
                value={data.businessStatus}
                isEdit={true}
                options={['Active', 'Inactive', 'Not Sure']}
                onChange={(v) => setValue('businessStatus', v)}
              />
            </FieldRow>
          </div>
        </CardContent>

        {/* ================= Customer Basic Details ================= */}
        <SectionHeader title='Customer Basic Details' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2'>
          <div className='md:border-r'>
            <FieldRow label='First Name *' error={errors.firstName?.message}>
              <Input {...register('firstName')} className='h-8' />
            </FieldRow>
            <FieldRow label='Phone No *' error={errors.phone?.message}>
              <Input {...register('phone')} className='h-8' />
            </FieldRow>
            <FieldRow label='Email *' error={errors.email?.message}>
              <Input {...register('email')} className='h-8' />
            </FieldRow>
          </div>
          <div>
            <FieldRow label='Last Name' error={errors.lastName?.message}>
              <Input {...register('lastName')} className='h-8' />
            </FieldRow>
            <FieldRow label="Mother's Name">
              <Input {...register('mothersName')} className='h-8' />
            </FieldRow>
            <FieldRow label='Preferred Language Support'>
              <MultiSelectField
                value={data.preferredLanguages}
                options={LANGUAGE_OPTIONS}
                onChange={(v) => setValue('preferredLanguages', v)}
                placeholder='Select languages...'
              />
            </FieldRow>
          </div>
        </CardContent>

        {/* ================= Customer Business Details ================= */}
        <SectionHeader title='Customer Business Details' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2'>
          <div className='md:border-r'>
            <FieldRow label='Business Vintage (No of Years)'>
              <Input
                {...register('businessVintage')}
                className='h-8'
                type='number'
              />
            </FieldRow>
            <FieldRow label='Business Registration Type'>
              <SelectField
                value={data.businessRegistrationType}
                isEdit={true}
                options={[
                  '-None-',
                  'Proprietorship',
                  'Partnership',
                  'Private Limited',
                ]}
                onChange={(v) => setValue('businessRegistrationType', v)}
              />
            </FieldRow>
            <FieldRow label='Suppliers'>
              <Input {...register('suppliers')} className='h-8' />
            </FieldRow>
            <FieldRow label='Description'>
              <textarea
                {...register('description')}
                className='w-full h-20 px-2 border rounded-md text-sm'
              />
            </FieldRow>
            <FieldRow label='GSTN'>
              <Input {...register('gstn')} className='h-8' />
            </FieldRow>
          </div>
          <div>
            <FieldRow label='Type of Business'>
              <SelectField
                value={data.typeOfBusiness}
                isEdit={true}
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
                onChange={(v) => setValue('typeOfBusiness', v)}
              />
            </FieldRow>
            <FieldRow label='Industry'>
              <SelectField
                value={data.industry}
                isEdit={true}
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
                onChange={(v) => setValue('industry', v)}
              />
            </FieldRow>
            <FieldRow label='PAN'>
              <Input {...register('pan')} className='h-8' />
            </FieldRow>
          </div>
        </CardContent>

        {/* ================= Address Information of Business Premise ================= */}
        <SectionHeader title='Address Information of Business Premise' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2'>
          <div className='md:border-r'>
            <FieldRow label='Street'>
              <Input {...register('businessStreet')} className='h-8' />
            </FieldRow>
            <FieldRow label='State'>
              <div className='relative'>
                <Input
                  value={businessStateSearch}
                  onChange={(e) => {
                    setBusinessStateSearch(e.target.value)
                    setBusinessStateOpen(true)
                    setValue('businessState', e.target.value)
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
                          setValue('businessState', state)
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
            </FieldRow>
            <FieldRow label='Pincode'>
              <div className='relative'>
                <Input
                  value={businessPincodeSearch}
                  onChange={(e) => {
                    setBusinessPincodeSearch(e.target.value)
                    setBusinessPincodeOpen(true)
                    setValue('businessPincode', e.target.value)
                  }}
                  onFocus={() => setBusinessPincodeOpen(true)}
                  onBlur={() =>
                    setTimeout(() => setBusinessPincodeOpen(false), 200)
                  }
                  placeholder='Search Pincode...'
                  className='h-8'
                />
                {businessPincodeOpen && filteredBusinessPincodes.length > 0 && (
                  <div className='absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto'>
                    {filteredBusinessPincodes.map((pincode: string) => (
                      <div
                        key={pincode}
                        className='p-2 hover:bg-muted cursor-pointer text-sm'
                        onMouseDown={() => {
                          setValue('businessPincode', pincode)
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
            </FieldRow>
            <FieldRow label='Residential Location GPS'>
              <Input {...register('businessGpsLocation')} className='h-8' />
            </FieldRow>
          </div>
          <div>
            <FieldRow label='City'>
              <div className='relative'>
                <Input
                  value={businessCitySearch}
                  onChange={(e) => {
                    setBusinessCitySearch(e.target.value)
                    setBusinessCityOpen(true)
                    setValue('businessCity', e.target.value)
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
                          setValue('businessCity', city)
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
            </FieldRow>
            <FieldRow label='Country'>
              <Input
                {...register('businessCountry')}
                className='h-8'
                defaultValue='India'
              />
            </FieldRow>
            <FieldRow label='No of Years residing in Business Premise'>
              <Input
                {...register('businessYearsResiding')}
                className='h-8'
                type='number'
              />
            </FieldRow>
            <FieldRow label='Business Premise Ownership'>
              <SelectField
                value={data.businessOwnership}
                isEdit={true}
                options={[
                  'Self Owned',
                  'Rented',
                  'Parent Owned',
                  'Leased',
                  'Children Owned',
                  'Spouse Owned',
                  'Relative Owned',
                ]}
                onChange={(v) => setValue('businessOwnership', v)}
              />
            </FieldRow>
          </div>
        </CardContent>

        {/* ================= Address Information of Residence - Applicant ================= */}
        <SectionHeader title='Address Information of Residence - Applicant' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2'>
          <div className='md:border-r'>
            <FieldRow label='Street'>
              <Input {...register('applicantStreet')} className='h-8' />
            </FieldRow>
            <FieldRow label='State'>
              <StateSelector
                value={data.applicantState}
                onChange={(val) => setValue('applicantState', val)}
                isEdit={true}
              />
            </FieldRow>
            <FieldRow label='City'>
              <CitySelector
                value={data.applicantCity}
                onChange={(val) => setValue('applicantCity', val)}
                isEdit={true}
              />
            </FieldRow>
            <FieldRow label='Country'>
              <Input
                {...register('applicantCountry')}
                className='h-8'
                defaultValue='India'
              />
            </FieldRow>
          </div>
          <div>
            <FieldRow label='Pincode'>
              <PincodeSelector
                value={data.applicantPincode}
                onChange={(val) => setValue('applicantPincode', val)}
                isEdit={true}
              />
            </FieldRow>
            <FieldRow label='No of Years residing in current residence'>
              <Input
                {...register('applicantYearsResiding')}
                className='h-8'
                type='number'
              />
            </FieldRow>
            <FieldRow label='Residence Ownership'>
              <SelectField
                value={data.applicantOwnership}
                isEdit={true}
                options={[
                  'Self Owned',
                  'Rented',
                  'Parent Owned',
                  'Leased',
                  'Children Owned',
                  'Spouse Owned',
                  'Relative Owned',
                ]}
                onChange={(v) => setValue('applicantOwnership', v)}
              />
            </FieldRow>
            <FieldRow label='Residential Location GPS'>
              <Input {...register('applicantGpsLocation')} className='h-8' />
            </FieldRow>
          </div>
        </CardContent>

        {/* ================= Address Information of Residence - Co Applicant ================= */}
        <SectionHeader title='Address Information of Residence - Co Applicant' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2'>
          <div className='md:border-r'>
            <FieldRow label='Name'>
              <Input {...register('coApplicantName')} className='h-8' />
            </FieldRow>
            <FieldRow label='Phone'>
              <Input {...register('coApplicantPhone')} className='h-8' />
            </FieldRow>
            <FieldRow label='Relationship'>
              <Input {...register('coApplicantRelationship')} className='h-8' />
            </FieldRow>
            <FieldRow label='Email'>
              <Input {...register('coApplicantEmail')} className='h-8' />
            </FieldRow>
            <FieldRow label='Street'>
              <Input {...register('coApplicantStreet')} className='h-8' />
            </FieldRow>
            <FieldRow label='State'>
              <StateSelector
                value={data.coApplicantState}
                onChange={(val) => setValue('coApplicantState', val)}
                isEdit={true}
              />
            </FieldRow>
            <FieldRow label='City'>
              <CitySelector
                value={data.coApplicantCity}
                onChange={(val) => setValue('coApplicantCity', val)}
                isEdit={true}
              />
            </FieldRow>
          </div>
          <div>
            <FieldRow label='Country'>
              <Input
                {...register('coApplicantCountry')}
                className='h-8'
                defaultValue='India'
              />
            </FieldRow>
            <FieldRow label='Pincode'>
              <PincodeSelector
                value={data.coApplicantPincode}
                onChange={(val) => setValue('coApplicantPincode', val)}
                isEdit={true}
              />
            </FieldRow>
            <FieldRow label='No of Years residing in current residence'>
              <Input
                {...register('coApplicantYearsResiding')}
                className='h-8'
                type='number'
              />
            </FieldRow>
            <FieldRow label='Residence Ownership'>
              <SelectField
                value={data.coApplicantOwnership}
                isEdit={true}
                options={[
                  'Self Owned',
                  'Rented',
                  'Parent Owned',
                  'Leased',
                  'Children Owned',
                  'Spouse Owned',
                  'Relative Owned',
                ]}
                onChange={(v) => setValue('coApplicantOwnership', v)}
              />
            </FieldRow>
            <FieldRow label='Residential Location GPS'>
              <Input {...register('coApplicantGpsLocation')} className='h-8' />
            </FieldRow>
          </div>
        </CardContent>

        {/* ================= References from Customer ================= */}
        <SectionHeader title='References from Customer' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2'>
          <div className='md:border-r'>
            <FieldRow label='Name of Person 1'>
              <Input {...register('ref1Name')} className='h-8' />
            </FieldRow>
            <FieldRow
              label='Phone of Person 1'
              error={errors.ref1Phone?.message}
            >
              <Input {...register('ref1Phone')} className='h-8' />
            </FieldRow>
            <FieldRow
              label='Email ID Person 1'
              error={errors.ref1Email?.message}
            >
              <Input {...register('ref1Email')} className='h-8' />
            </FieldRow>
            <FieldRow label='Person 1 Relationship with Borrower'>
              <Input {...register('ref1Relationship')} className='h-8' />
            </FieldRow>
            <FieldRow label='Address of Person 1'>
              <Input {...register('ref1Address')} className='h-8' />
            </FieldRow>
          </div>
          <div>
            <FieldRow label='Name of Person 2'>
              <Input {...register('ref2Name')} className='h-8' />
            </FieldRow>
            <FieldRow
              label='Phone of Person 2'
              error={errors.ref2Phone?.message}
            >
              <Input {...register('ref2Phone')} className='h-8' />
            </FieldRow>
            <FieldRow
              label='Email ID Person 2'
              error={errors.ref2Email?.message}
            >
              <Input {...register('ref2Email')} className='h-8' />
            </FieldRow>
            <FieldRow label='Person 2 Relationship with Borrower'>
              <Input {...register('ref2Relationship')} className='h-8' />
            </FieldRow>
            <FieldRow label='Address of Person 2'>
              <Input {...register('ref2Address')} className='h-8' />
            </FieldRow>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
