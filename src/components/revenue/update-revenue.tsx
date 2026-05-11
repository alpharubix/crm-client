import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ENV } from '@/conf'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'

import SectionHeader from '@/components/shared/section-header'
import FieldRow from '@/components/shared/field-row'

import {
  revenueSchema,
  type RevenueFormValues,
} from '@/validators/revenue.schema'

export default function UpdateRevenue() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [isEdit, setIsEdit] = useState(false)

  const { data: revenueData, isLoading: isLoadingRevenue } = useQuery({
    queryKey: ['revenue', id],
    queryFn: async () => {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/revenue?revenue_id=${id}`,
        { credentials: 'include' }
      )
      if (!res.ok) throw new Error('Failed to fetch revenue data')
      return res.json()
    },
    enabled: !!id,
  })

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
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = form

  useEffect(() => {
    if (revenueData?.data?.[0]) {
      const rev = revenueData.data[0]
      reset({
        dealId: rev.deal_id || 0,
        accountName: rev.account_name || '',
        lenderName: rev.lender_name || '',
        referenceNumber: rev.reference_number || '',
        incomeBookingDate: rev.income_booking_date || '',
        typeOfRevenue: rev.type_of_revenue || '',
        amount: rev.amount !== null && rev.amount !== undefined ? rev.amount : '',
        gstAmount: rev.gst_amount !== null && rev.gst_amount !== undefined ? rev.gst_amount : '',
      })
    }
  }, [revenueData, reset])

  const formValues = watch()

  const updateMutation = useMutation({
    mutationFn: async (values: RevenueFormValues) => {
      const payload: any = {
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

      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/revenue/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to update revenue')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Revenue updated successfully')
      queryClient.invalidateQueries({ queryKey: ['revenues'] })
      queryClient.invalidateQueries({ queryKey: ['revenue', id] })
      setIsEdit(false)
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const onSubmit = (values: RevenueFormValues) => {
    updateMutation.mutate(values)
  }

  if (isLoadingRevenue) {
    return (
      <div className='flex items-center justify-center h-screen'>
        <Spinner className='h-8 w-8 text-muted-foreground' />
      </div>
    )
  }

  return (
    <div className='space-y-6 mb-10 p-4'>
      <div className='flex justify-between items-center border p-4 rounded-xl bg-card'>
        <h1 className='text-2xl font-bold'>Update Revenue</h1>
        <div className='flex gap-2'>
          {!isEdit ? (
            <Button onClick={() => setIsEdit(true)}>
              Update
            </Button>
          ) : (
            <>
              <Button
                variant='outline'
                onClick={() => {
                  reset()
                  setIsEdit(false)
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting || updateMutation.isPending || !isDirty}
              >
                {updateMutation.isPending ? (
                  <Spinner className='mr-2 h-4 w-4' />
                ) : (
                  'Save Changes'
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <SectionHeader title='Revenue Details' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2 border-b'>
          <div className='md:border-r'>
            <FieldRow label='Account Name' error={errors.accountName?.message}>
              {isEdit ? (
                <Input
                  {...register('accountName')}
                  placeholder='Account Name'
                  className='h-8'
                />
              ) : (
                <span>{formValues.accountName || '—'}</span>
              )}
            </FieldRow>

            <FieldRow label='Lender Name' error={errors.lenderName?.message}>
              {isEdit ? (
                <Input
                  {...register('lenderName')}
                  placeholder='Lender Name'
                  className='h-8'
                />
              ) : (
                <span>{formValues.lenderName || '—'}</span>
              )}
            </FieldRow>

            <FieldRow
              label='Reference Number'
              error={errors.referenceNumber?.message}
            >
              {isEdit ? (
                <Input
                  {...register('referenceNumber')}
                  placeholder='Reference Number'
                  className='h-8'
                />
              ) : (
                <span>{formValues.referenceNumber || '—'}</span>
              )}
            </FieldRow>
          </div>

          <div>
            <FieldRow
              label='Income Booking Date (YYYY-MM-DD)'
              error={errors.incomeBookingDate?.message}
            >
              {isEdit ? (
                <Input
                  {...register('incomeBookingDate')}
                  type='date'
                  className='h-8'
                />
              ) : (
                <span>{formValues.incomeBookingDate || '—'}</span>
              )}
            </FieldRow>

            <FieldRow
              label='Type of Revenue'
              error={errors.typeOfRevenue?.message}
            >
              {isEdit ? (
                <Input
                  {...register('typeOfRevenue')}
                  placeholder='Type of Revenue'
                  className='h-8'
                />
              ) : (
                <span>{formValues.typeOfRevenue || '—'}</span>
              )}
            </FieldRow>

            <FieldRow label='Amount' error={errors.amount?.message}>
              {isEdit ? (
                <Input
                  {...register('amount')}
                  placeholder='Amount'
                  type='number'
                  step='0.01'
                  className='h-8'
                />
              ) : (
                <span>{formValues.amount || '—'}</span>
              )}
            </FieldRow>

            <FieldRow label='GST Amount' error={errors.gstAmount?.message}>
              {isEdit ? (
                <Input
                  {...register('gstAmount')}
                  placeholder='GST Amount'
                  type='number'
                  step='0.01'
                  className='h-8'
                />
              ) : (
                <span>{formValues.gstAmount || '—'}</span>
              )}
            </FieldRow>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
