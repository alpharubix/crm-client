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
import { Spinner } from '@/components/ui/spinner'

import SectionHeader from '@/components/shared/section-header'
import FieldRow from '@/components/shared/field-row'
import DateField from '../shared/date-field'
import SelectField from '../shared/select-field'
import LENDER_NAMES from '@/utils/lenders.json'

import {
  createDealSchema,
  type CreateDealFormValues,
} from '@/validators/createDeal.schema'

export default function CreateDeal() {
  const navigate = useNavigate()
  const location = useLocation()
  const prefilledData = location.state || {}

  const form = useForm<CreateDealFormValues>({
    resolver: zodResolver(createDealSchema),
    mode: 'onChange',
    defaultValues: {
      accountId: prefilledData.accountId || '',
      accountName: prefilledData.accountName || '',
      dealName: prefilledData.accountName || '',
      dealType: '',
      dealCallBackDatetime: '',
      amountRequired: '',
      loanType: '',
      dealStatus: '',
      dealStage: '',
      lenderName: '',
      partnerName: '',
      lenderLoginType: '',
      partnerCode: '',
      mmCharges: '',
      customerRejectionReason: '',
      customerRejectionStatusExplanation: '',
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
  const [lenderSearch, setLenderSearch] = useState('')
  const [lenderOpen, setLenderOpen] = useState(false)

  const filteredLenders =
    lenderSearch.length > 1
      ? LENDER_NAMES.filter((l: string) =>
          l.toLowerCase().includes(lenderSearch.toLowerCase()),
        ).slice(0, 50)
      : []

  const [searchTerm, setSearchTerm] = useState(prefilledData.accountName || '')
  const [debouncedSearch, setDebouncedSearch] = useState(
    prefilledData.accountName || '',
  )
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 1000)
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    if (prefilledData.accountName) {
      setValue('dealName', `${prefilledData.accountName}`)
    }
  }, [prefilledData.accountName, setValue])

  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: [debouncedSearch],
    queryFn: async () => {
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

  const accounts = Array.isArray(accountsData?.data) ? accountsData.data : []

  const createMutation = useMutation({
    mutationFn: async (values: CreateDealFormValues) => {
      const payload: any = {
        account_id: values.accountId ? String(values.accountId) : undefined,
        account_name: values.accountName || undefined,
        deal_name: values.dealName,
        deal_type: values.dealType || undefined,
        deal_call_back_datetime: values.dealCallBackDatetime || undefined,
        amount_required: values.amountRequired || undefined,
        loan_type: values.loanType || undefined,
        deal_status: values.dealStatus || undefined,
        deal_stage: values.dealStage || undefined,
        lender_name: values.lenderName || undefined,
        partner_name: values.partnerName || undefined,
        lender_login_type: values.lenderLoginType || undefined,
        partner_code: values.partnerCode || undefined,
        mm_charges: values.mmCharges || undefined,
        customer_rejection_reason: values.customerRejectionReason || undefined,
        customer_rejection_status_explanation:
          values.customerRejectionStatusExplanation || undefined,
        deal_expected_closing: values.dealExpectedClosing || undefined,
      }

      Object.keys(payload).forEach(
        (key) => payload[key] === undefined && delete payload[key],
      )

      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/deals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(
          errorData.detail || errorData.message || 'Failed to create deal',
        )
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Deal created successfully')
      navigate('/deals')
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const onSubmit = (values: CreateDealFormValues) => {
    createMutation.mutate(values)
  }

  return (
    <div className='space-y-6 mb-10'>
      <div className='flex justify-between items-center border p-4 rounded-xl bg-card'>
        <h1 className='text-2xl font-bold'>Create Deal</h1>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={() => navigate('/deals')}>
            Cancel
          </Button>
          <Button
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
        {/* ================= Deal Details ================= */}
        <SectionHeader title='Deal Details' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2 border-b'>
          <div className='md:border-r'>
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
                    if (formValues.accountId) {
                      setValue('accountId', '', { shouldValidate: true })
                      setValue('accountName', '')
                    }
                  }}
                  onFocus={() => setIsOpen(true)}
                  onBlur={() => setTimeout(() => setIsOpen(false), 200)}
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
                            setValue('accountId', String(acc.id), {
                              shouldValidate: true,
                            })
                            setValue('accountName', acc.account_name)
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

            <FieldRow label='Deal Type *' error={errors.dealType?.message}>
              <SelectField
                isEdit={true}
                options={[
                  'NTB',
                  'NTC',
                  'NTL',
                  'Adhoc',
                  'Renewal',
                  'Renewal & Enhancement',
                  'Existing',
                ]}
                value={formValues.dealType as string}
                onChange={(value) =>
                  setValue('dealType', value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
              />
            </FieldRow>

            <FieldRow
              label='Deal Call Back Date/Time'
              error={errors.dealCallBackDatetime?.message}
            >
              <DateField
                isEdit={true}
                showTime={true}
                value={
                  formValues.dealCallBackDatetime
                    ? new Date(formValues.dealCallBackDatetime)
                    : undefined
                }
                onChange={(date) =>
                  setValue(
                    'dealCallBackDatetime',
                    date ? date.toISOString() : '',
                    { shouldValidate: true, shouldDirty: true },
                  )
                }
                disablePast={true}
              />
            </FieldRow>

            <FieldRow
              label='Amount Required *'
              error={errors.amountRequired?.message}
            >
              <Input
                {...register('amountRequired')}
                placeholder='Amount Required'
                type='number'
                step='0.01'
                className='h-8'
              />
            </FieldRow>

            <FieldRow label='Type of Loan *' error={errors.loanType?.message}>
              <SelectField
                isEdit={true}
                options={[
                  'SCF',
                  'SCF Renewal',
                  'SCF Enhancement',
                  'SCF (Renewal and Enhancement)',
                  'Open SCF',
                  'Open SCF Renewal',
                  'Open SCF Enhancement',
                  'Open SCF (Renewal and Enhancement)',
                  'BT-SCF',
                  'BT-Open SCF',
                  'Unsecured OD',
                  'Unsecured Term Loan',
                  'Secured Loan',
                  'Secured BT',
                  'Vehicle Loan',
                ]}
                value={formValues.loanType as string}
                onChange={(value) =>
                  setValue('loanType', value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
              />
            </FieldRow>
            <FieldRow
              label='Expected Closing Date *'
              error={errors.dealExpectedClosing?.message}
            >
              <DateField
                isEdit={true}
                showTime={false}
                value={
                  formValues.dealExpectedClosing
                    ? new Date(formValues.dealExpectedClosing)
                    : undefined
                }
                onChange={(date) => {
                  if (!date) {
                    setValue('dealExpectedClosing', '')
                    return
                  }

                  const year = date.getFullYear()
                  const month = String(date.getMonth() + 1).padStart(2, '0')
                  const day = String(date.getDate()).padStart(2, '0')

                  setValue('dealExpectedClosing', `${year}-${month}-${day}`, {
                    shouldDirty: true,
                  })
                }}
              />
            </FieldRow>
          </div>

          <div>
            <FieldRow label='Deal Name'>
              <span className='text-sm text-muted-foreground italic'>
                Auto-generated on save (e.g. AccountName/ID/D01)
              </span>
            </FieldRow>

            <FieldRow label='Deal Status *' error={errors.dealStatus?.message}>
              <SelectField
                isEdit={true}
                options={[
                  'Deal Created',
                  'Lender Review',
                  'Lender Rejected',
                  'Achievement',
                  'Not Interested',
                ]}
                value={formValues.dealStatus as string}
                onChange={(value) =>
                  setValue('dealStatus', value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
              />
            </FieldRow>

            <FieldRow label='Deal Stage *' error={errors.dealStage?.message}>
              <SelectField
                isEdit={true}
                options={[
                  'Yet to Lender Login',
                  'Ticket to be raised',
                  'Docs Incomplete',
                  'Lender Review',
                  'Pendency Raised by Lender',
                  'Pendency Resolved',
                  'In Credit',
                  'Approved',
                  'Commerical Shared with Cust',
                  'Cust Accpt Loan Offer',
                  'Commercial Closed',
                  'Commercials NI',
                  'Disbursement Pending',
                  'Disbursed',
                  'Rejected',
                  'Not Interested',
                ]}
                value={formValues.dealStage as string}
                onChange={(value) =>
                  setValue('dealStage', value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
              />
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

            <FieldRow label='Partner Name *' error={errors.partnerName?.message}>
              <SelectField
                isEdit={true}
                options={[
                  'Rupifi Private Ltd',
                  'FlexiLoans Technologies Private Ltd',
                  'Recur Club Technologies Private Ltd',
                  'Rupeeboss Financial Services Pvt Ltd',
                  'Others',
                ]}
                value={formValues.partnerName as string}
                onChange={(value) =>
                  setValue('partnerName', value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
              />
            </FieldRow>

            <FieldRow
              label='Lender Login Type *'
              error={errors.lenderLoginType?.message}
            >
              <SelectField
                isEdit={true}
                options={['Direct', 'Partner']}
                value={formValues.lenderLoginType as string}
                onChange={(value) =>
                  setValue('lenderLoginType', value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
              />
            </FieldRow>

          </div>
        </CardContent>

      </Card>
    </div>
  )
}
