import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ENV } from '@/conf'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'

import SectionHeader from '@/components/shared/section-header'
import FieldRow from '@/components/shared/field-row'
import LENDER_NAMES from '@/utils/lenders.json'


import {
  revenueSchema,
  type RevenueFormValues,
} from '@/validators/revenue.schema'
import DateField from '../shared/date-field'
import { format } from 'date-fns'

export default function CreateRevenue() {
  const navigate = useNavigate()

  const form = useForm<RevenueFormValues>({
    resolver: zodResolver(revenueSchema),
    defaultValues: {
      accountName: '',
      lenderName: '',
      referenceNumber: '',
      incomeBookingDate: '',
      typeOfRevenue: '',
      amount: '' as unknown as number,
      gstAmount: '' as unknown as number,
    },
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = form

  const formValues = watch()
  console.log(formValues.incomeBookingDate);


  const [lenderSearch, setLenderSearch] = useState('')
  const [lenderOpen, setLenderOpen] = useState(false)

  const filteredLenders =
    lenderSearch.length > 1
      ? LENDER_NAMES.filter((l: string) =>
        l.toLowerCase().includes(lenderSearch.toLowerCase()),
      ).slice(0, 50)
      : []

  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const [accountSearch, setAccountSearch] = useState('')
  const [debouncedAccountSearch, setDebouncedAccountSearch] = useState('')
  const [isAccountOpen, setIsAccountOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 1000)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedAccountSearch(accountSearch), 1000)
    return () => clearTimeout(timer)
  }, [accountSearch])

  const { data: dealsData, isLoading: isLoadingDeals } = useQuery({
    queryKey: ['deals-lookup', debouncedSearch],
    queryFn: async () => {
      if (debouncedSearch) {
        const res = await fetch(
          `${ENV.VITE_BACKEND_BASE_URL}/deals/hot-lookup?deal_name=${debouncedSearch}`,
          { credentials: 'include' }
        )
        if (!res.ok) throw new Error('Failed to fetch deals')
        return res.json()
      }
      return { data: [] }
    },
  })

  const deals = Array.isArray(dealsData?.data) ? dealsData.data : []

  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['accounts-lookup', debouncedAccountSearch],
    queryFn: async () => {
      if (debouncedAccountSearch) {
        const res = await fetch(
          `${ENV.VITE_BACKEND_BASE_URL}/accounts/lookup?account_name=${debouncedAccountSearch}`,
          { credentials: 'include' }
        )
        if (!res.ok) throw new Error('Failed to fetch accounts')
        return res.json()
      }
      return { data: [] }
    },
  })

  const accounts = Array.isArray(accountsData?.data) ? accountsData.data : []

  const createMutation = useMutation({
    mutationFn: async (values: RevenueFormValues) => {
      const payload: any = {
        deal_id: values.dealId ? Number(values.dealId) : undefined,
        account_name: values.accountName || undefined,
        lender_name: values.lenderName || undefined,
        reference_number: values.referenceNumber || undefined,
        income_booking_date: values.incomeBookingDate || undefined,
        type_of_revenue: values.typeOfRevenue || undefined,
        amount: values.amount !== undefined ? Number(values.amount) : undefined,
        gst_amount: values.gstAmount !== undefined ? Number(values.gstAmount) : undefined,
      }

      Object.keys(payload).forEach(
        (key) => payload[key] === undefined && delete payload[key]
      )

      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/revenue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to create revenue')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Revenue created successfully')
      navigate('/revenue')
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const onSubmit = (values: RevenueFormValues) => {
    createMutation.mutate(values)
  }

  return (
    <div className='space-y-6 mb-10'>
      <div className='flex justify-between items-center border p-4 rounded-xl bg-card'>
        <h1 className='text-2xl font-bold'>Create Revenue</h1>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={() => navigate('/revenue')}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting || createMutation.isPending}
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
        <SectionHeader title='Revenue Details' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2 border-b'>
          <div className='md:border-r'>
            <FieldRow label='Deal Lookup' error={errors.dealId?.message}>
              <div className='relative'>
                <Input
                  placeholder='Search Deal Name...'
                  className='h-8'
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setIsOpen(true)
                    if (formValues.dealId) {
                      setValue('dealId', '', { shouldValidate: true })
                      setValue('accountName', '')
                    }
                  }}
                  onFocus={() => setIsOpen(true)}
                  onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                />
                {isOpen && (
                  <div className='absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto'>
                    {isLoadingDeals ? (
                      <div className='p-2 flex justify-center'>
                        <Spinner className='h-4 w-4' />
                      </div>
                    ) : deals.length > 0 ? (
                      deals.map((deal: any, idx: number) => (
                        <div
                          key={idx}
                          className='p-2 hover:bg-muted cursor-pointer text-sm'
                          onMouseDown={() => {
                            setValue('dealId', String(deal.id), {
                              shouldValidate: true,
                            })
                            setSearchTerm(deal.account_name)
                            setIsOpen(false)
                          }}
                        >
                          {deal.account_name}
                        </div>
                      ))
                    ) : (
                      <div className='p-2 text-sm text-muted-foreground'>
                        {debouncedSearch ? 'No deals found.' : 'Type to search...'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </FieldRow>

            <FieldRow label='Account Name' error={errors.accountName?.message}>
              <div className='relative'>
                <Input
                  placeholder='Search Account Name...'
                  className='h-8'
                  value={accountSearch}
                  onChange={(e) => {
                    setAccountSearch(e.target.value)
                    setIsAccountOpen(true)
                  }}
                  onFocus={() => setIsAccountOpen(true)}
                  onBlur={() => setTimeout(() => setIsAccountOpen(false), 200)}
                />
                {isAccountOpen && (
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
                            setValue('accountName', acc.account_name, {
                              shouldValidate: true,
                            })
                            setAccountSearch(acc.account_name)
                            setIsAccountOpen(false)
                          }}
                        >
                          {acc.account_name}
                        </div>
                      ))
                    ) : (
                      <div className='p-2 text-sm text-muted-foreground'>
                        {debouncedAccountSearch ? 'No accounts found.' : 'Type to search...'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </FieldRow>

            <FieldRow label='Lender Name *' error={errors.lenderName?.message}>
              <div className='relative'>
                <Input
                  value={lenderSearch}
                  onChange={(e) => {
                    setLenderSearch(e.target.value)
                    setLenderOpen(true)
                  }}
                  onFocus={() => setLenderOpen(true)}
                  onBlur={() => setTimeout(() => setLenderOpen(false), 200)}
                  placeholder='Search Lender...'
                />
                {lenderOpen && filteredLenders.length > 0 && (
                  <div className='absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto'>
                    {filteredLenders.map((name: string) => (
                      <div
                        key={name}
                        className='p-2 hover:bg-muted cursor-pointer text-sm'
                        onMouseDown={() => {
                          setValue('lenderName', name, { shouldValidate: true })
                          setLenderSearch(name)
                          setLenderOpen(false)
                        }}
                      >
                        {name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FieldRow>

            <FieldRow
              label='Reference Number'
              error={errors.referenceNumber?.message}
            >
              <Input
                {...register('referenceNumber')}
                placeholder='Reference Number'
                className='h-8'
              />
            </FieldRow>
          </div>

          <div>
            <FieldRow
              label='Income Booking Date'
              error={errors.incomeBookingDate?.message}
            >
              <DateField
                isEdit={true}
                showTime={false}
                value={
                  formValues.incomeBookingDate
                    ? new Date(formValues.incomeBookingDate)
                    : undefined
                }
                onChange={(date) => {
                  if (date) {
                    setValue(
                      'incomeBookingDate',
                      format(date, 'yyyy-MM-dd'),
                      { shouldValidate: true, shouldDirty: true }
                    )
                  } else {
                    setValue(
                      'incomeBookingDate',
                      '',
                      { shouldValidate: true, shouldDirty: true }
                    )
                  }
                }}
              />
            </FieldRow>

            <FieldRow
              label='Type of Revenue'
              error={errors.typeOfRevenue?.message}
            >
              <Input
                {...register('typeOfRevenue')}
                placeholder='Type of Revenue'
                className='h-8'
              />
            </FieldRow>

            <FieldRow label='Amount' error={errors.amount?.message}>
              <Input
                {...register('amount')}
                placeholder='Amount'
                type='number'
                step='0.01'
                className='h-8'
              />
            </FieldRow>

            <FieldRow label='GST Amount' error={errors.gstAmount?.message}>
              <Input
                {...register('gstAmount')}
                placeholder='GST Amount'
                type='number'
                step='0.01'
                className='h-8'
              />
            </FieldRow>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
