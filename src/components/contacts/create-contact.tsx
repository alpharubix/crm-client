import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ENV } from '@/conf'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'

import SectionHeader from '@/components/shared/section-header'
import FieldRow from '@/components/shared/field-row'

import {
  createContactSchema,
  type CreateContactFormValues,
} from '@/validators/createContact.schema'

export default function CreateContact() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefilledData = location.state || {}

  const form = useForm<CreateContactFormValues>({
    resolver: zodResolver(createContactSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      designation: '',
      accountId: prefilledData.accountId || '',
      email: '',
      secondaryEmail: '',
      mobile: '',
      phone: '',
      leadSource: prefilledData.leadSource || '',
      street: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
    },
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting, isValid },
  } = form

  const formValues = watch()

  const [searchTerm, setSearchTerm] = useState(prefilledData.accountName || '')
  const [debouncedSearch, setDebouncedSearch] = useState(
    prefilledData.accountName || '',
  )
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 1000)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Fetch Accounts for dropdown
  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: [debouncedSearch],
    queryFn: async () => {
      // If search term is present, use lookup API
      if (debouncedSearch) {
        const res = await fetch(
          `${ENV.VITE_BACKEND_BASE_URL}/accounts/lookup?account_name=${debouncedSearch}`,
          { credentials: 'include' },
        )
        if (!res.ok) throw new Error('Failed to fetch accounts')
        return res.json()
      }
      return { data: [] }
    },
  })

  // Ensure accounts is an array
  const accounts = Array.isArray(accountsData?.data) ? accountsData.data : []
  // console.log(accounts)

  const createMutation = useMutation({
    mutationFn: async (values: CreateContactFormValues) => {
      const payload = {
        first_name: values.firstName,
        last_name: values.lastName,
        designation: values.designation,
        account_id: values.accountId,
        email: values.email || undefined,
        secondary_email: values.secondaryEmail || undefined,
        mobile: values.mobile || undefined,
        phone: values.phone || undefined,
        lead_source: values.leadSource,
        street: values.street,
        city: values.city,
        state: values.state,
        country: values.country,
        pincode: values.pincode,
      }

      // console.log('Creating contact with payload:', payload)

      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to create contact')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Contact created successfully')
      navigate('/contacts')
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  // console.log(formValues.accountId);

  const onSubmit = (values: CreateContactFormValues) => {
    createMutation.mutate(values)
  }

  return (
    <div className='space-y-6 mb-10'>
      <div className='flex justify-between items-center border p-4 rounded-xl bg-card'>
        <h1 className='text-2xl font-bold'>Create Contact</h1>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            className='cursor-pointer'
            onClick={() => navigate('/contacts')}
          >
            Cancel
          </Button>
          <Button
            className='cursor-pointer'
            onClick={handleSubmit(onSubmit)}
            disabled={!isValid || isSubmitting || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Spinner className='mr-2 h-4 w-4' />
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </div>

      <Card>
        <SectionHeader title='Contact Information' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2 border-b'>
          <div className='md:border-r'>
            <FieldRow label='First Name' error={errors.firstName?.message}>
              <Input
                {...register('firstName')}
                placeholder='First Name'
                className='h-8'
              />
            </FieldRow>

            <FieldRow label='Account Name *' error={errors.accountId?.message}>
              <div className='relative'>
                <Input
                  placeholder='Search Account...'
                  className='h-8'
                  value={searchTerm}
                  disabled={!!prefilledData.accountId}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setIsOpen(true)
                    // Clear the ID when the user changes the text to ensure consistency
                    // but we keep the ID if the text matches initialized label until configured
                    if (formValues.accountId) {
                      setValue('accountId', '', { shouldValidate: true })
                    }
                  }}
                  onFocus={() => setIsOpen(true)}
                  onBlur={() => {
                    // Delay hiding to allow click event on list items to process
                    setTimeout(() => setIsOpen(false), 200)
                  }}
                />

                {isOpen && !prefilledData.accountId && (
                  <div className='absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto'>
                    {isLoadingAccounts ? (
                      <div className='p-2 flex justify-center'>
                        <Spinner className='h-4 w-4' />
                      </div>
                    ) : accounts.length > 0 ? (
                      accounts.map((acc: any, idx: number) => (
                        <div
                          key={idx}
                          className='p-2 hover:bg-muted cursor-pointer text-sm'
                          onMouseDown={() => {
                            // Using onMouseDown because it fires before onBlur
                            setValue('accountId', String(acc.id), {
                              shouldValidate: true,
                            })
                            setSearchTerm(acc.account_name)
                            setIsOpen(false)
                          }}
                        >
                          {acc.account_name}
                        </div>
                      ))
                    ) : (
                      <div className='p-2 text-sm text-muted-foreground'>
                        No accounts found.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </FieldRow>

            <FieldRow label='Lead Source *' error={errors.leadSource?.message}>
              {prefilledData.leadSource ? (
                <Input
                  value={prefilledData.leadSource}
                  disabled
                  className='h-8'
                />
              ) : (
                <Select
                  value={formValues.leadSource}
                  onValueChange={(val) => setValue('leadSource', val)}
                >
                  <SelectTrigger className='h-8 w-full'>
                    <SelectValue placeholder='Select Source' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Himalaya'>Himalaya</SelectItem>
                    <SelectItem value='CavinKare'>CavinKare</SelectItem>
                    <SelectItem value='ALL INDIA CHEMISTS AND DRUGGISTS ASSOCIATION OF INDIA'>
                      ALL INDIA CHEMISTS AND DRUGGISTS ASSOCIATION OF INDIA
                    </SelectItem>
                    <SelectItem value='All India Hardware Association (Based in Mumbai Charni Road)'>
                      All India Hardware Association (Based in Mumbai Charni
                      Road)
                    </SelectItem>
                    <SelectItem value='Alpharubix'>Alpharubix</SelectItem>
                    <SelectItem value='Condor Footwear'>
                      Condor Footwear
                    </SelectItem>
                    <SelectItem value='DVG Dist Petroleum'>
                      DVG Dist Petroleum
                    </SelectItem>
                    <SelectItem value='Federation of Hotel and Restaurant Association of India (Based in New Delhi)'>
                      Federation of Hotel and Restaurant Association of India
                      (Based in New Delhi)
                    </SelectItem>
                    <SelectItem value='Havells'>Havells</SelectItem>
                    <SelectItem value='Liberty'>Liberty</SelectItem>
                    <SelectItem value='Marico'>Marico</SelectItem>
                    <SelectItem value='Reference'>Reference</SelectItem>
                    <SelectItem value='Retail Association of India'>
                      Retail Association of India
                    </SelectItem>
                    <SelectItem value='SME CHAMBER'>SME CHAMBER</SelectItem>
                    <SelectItem value='Swastik'>Swastik</SelectItem>
                    <SelectItem value='Unicharm'>Unicharm</SelectItem>
                    <SelectItem value='Vibhava Marketing'>
                      Vibhava Marketing
                    </SelectItem>
                    <SelectItem value='R1X Website'>R1X Website</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </FieldRow>
          </div>

          <div>
            <FieldRow label='Last Name *' error={errors.lastName?.message}>
              <Input
                {...register('lastName')}
                placeholder='Last Name'
                className='h-8'
              />
            </FieldRow>
            <FieldRow label='Designation' error={errors.designation?.message}>
              <Input
                {...register('designation')}
                placeholder='Designation'
                className='h-8'
              />
            </FieldRow>
          </div>
        </CardContent>

        <SectionHeader title='Contact Details' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2 border-b'>
          <div className='md:border-r'>
            <FieldRow label='Email *' error={errors.email?.message}>
              <Input
                {...register('email')}
                placeholder='Email'
                className='h-8'
              />
            </FieldRow>
            <FieldRow label='Mobile *' error={errors.mobile?.message}>
              <Input
                {...register('mobile')}
                placeholder='Mobile'
                className='h-8'
              />
            </FieldRow>
          </div>
          <div>
            <FieldRow
              label='Secondary Email'
              error={errors.secondaryEmail?.message}
            >
              <Input
                {...register('secondaryEmail')}
                placeholder='Secondary Email'
                className='h-8'
              />
            </FieldRow>
            <FieldRow label='Phone' error={errors.phone?.message}>
              <Input
                {...register('phone')}
                placeholder='Phone'
                className='h-8'
              />
            </FieldRow>
          </div>
        </CardContent>

        <SectionHeader title='Address Information' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2'>
          <div className='md:border-r'>
            <FieldRow label='Street' error={errors.street?.message}>
              <Input
                {...register('street')}
                placeholder='Street'
                className='h-8'
              />
            </FieldRow>
            <FieldRow label='State' error={errors.state?.message}>
              <Input
                {...register('state')}
                placeholder='State'
                className='h-8'
              />
            </FieldRow>
            <FieldRow label='Pincode' error={errors.pincode?.message}>
              <Input
                {...register('pincode')}
                placeholder='Pincode'
                className='h-8'
              />
            </FieldRow>
          </div>
          <div>
            <FieldRow label='City' error={errors.city?.message}>
              <Input {...register('city')} placeholder='City' className='h-8' />
            </FieldRow>
            <FieldRow label='Country' error={errors.country?.message}>
              <Input
                {...register('country')}
                placeholder='Country'
                className='h-8'
              />
            </FieldRow>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
