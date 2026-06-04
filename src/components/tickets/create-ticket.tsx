import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ENV } from '@/conf'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import SectionHeader from '@/components/shared/section-header'
import FieldRow from '@/components/shared/field-row'
import SelectField from '@/components/shared/select-field'
import DateField from '@/components/shared/date-field'
import LENDER_NAMES from '@/utils/lenders.json'

import {
  createTicketSchema,
  type CreateTicketFormValues,
} from '@/validators/createTicket.schema'
import { useEffect, useState } from 'react'

const LOAN_TYPES = [
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
]

const TICKET_STATUSES = [
  'Yet to Lender Login',
  'Lender Review',
  'In Credit',
  'Approved',
  'Disbursed',
  'Rejected',
  'Not Interested',
]

const TICKET_STAGES = [
  'RM - Doc QC',
  'CPI Analysis',
  'Pendency Raised by Lender',
  'Pendency Resolved',
  'GST Finfort - Initiated',
  'GST Finfort - Completed',
  'Jr Credit Manager Review',
  'PD Pending',
  'PD Completed',
  'Sr Credit Manager Review',
  'NCM Review',
  'Approval Pending',
  'Commercial Shared with Cust',
  'Cust Accepted Loan Offer',
  'PF Paid',
  'Sanctioned',
  'SL Sign and PSD Initiated',
  'SL Sign and PSD Completed',
  'Disbursed',
  'Rejected',
  'Not Interested',
]

const LENDER_LOGIN_TYPES = ['Fresh', 'Renewal', 'Enhancement', 'Spillover']

const TICKET_LOGIN = [
  'Approved',
  'Disapproved',
  'L1 Pendency',
  'L2 Pendency',
  'L3 Pendency',
  'Rejected',
]

export default function CreateTicket() {
  const { dealId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [lenderSearch, setLenderSearch] = useState('')
  const [lenderOpen, setLenderOpen] = useState(false)

  const filteredLenders =
    lenderSearch.length > 1
      ? LENDER_NAMES.filter((l: string) =>
          l.toLowerCase().includes(lenderSearch.toLowerCase()),
        ).slice(0, 50) // cap at 50 results
      : []

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTicketFormValues>({
    resolver: zodResolver(createTicketSchema),
  })

  const formValues = watch()

  // Account lookup state
  const [accountSearch, setAccountSearch] = useState('')
  const [debouncedAccountSearch, setDebouncedAccountSearch] = useState('')
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')

  // Debounce account search
  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedAccountSearch(accountSearch),
      500,
    )
    return () => clearTimeout(timer)
  }, [accountSearch])

  // Fetch accounts for lookup dropdown
  const { data: accountsData, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['account-lookup', debouncedAccountSearch],
    queryFn: async () => {
      if (debouncedAccountSearch.trim()) {
        const res = await fetch(
          `${ENV.VITE_BACKEND_BASE_URL}/accounts/lookup?account_name=${debouncedAccountSearch}`,
          { credentials: 'include' },
        )
        if (!res.ok) throw new Error('Failed to fetch accounts')
        return res.json()
      }
      return { data: [] }
    },
  })
  const accounts = Array.isArray(accountsData?.data) ? accountsData.data : []

  // Inside CreateTicket component
  const { data: dealResponse, isLoading: isLoadingDeal } = useQuery({
    queryKey: ['deal', dealId],
    queryFn: async () => {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/deals?deal_id=${dealId}`,
        { credentials: 'include' },
      )
      if (!res.ok) throw new Error('Failed to fetch deal details')
      return res.json()
    },
    enabled: !!dealId,
  })

  // Extract data from the response
  const dealData = dealResponse?.data?.[0]
  const accountName = dealData?.account_name || '—'
  const dealName = dealData?.deal_name || dealData?.account_name || '—'

  // Sync initial account name from deal details when they load
  useEffect(() => {
    if (dealData?.account_name && !accountSearch) {
      setAccountSearch(dealData.account_name)
      setSelectedAccountId(String(dealData.account_id || ''))
    }
  }, [dealData])

  const createMutation = useMutation({
    mutationFn: async (values: CreateTicketFormValues) => {
      const payload: any = {
        deal_id: dealId,
        lender_name: values.lenderName,
        type_of_loan: values.typeOfLoan,
        ticket_status: values.ticketStatus,
        ticket_stage: values.ticketStage,
        lender_login_type: values.lenderLoginType,
        lender_login_date: values.lenderLoginDate,
      }

      // Add selected account_id to payload
      if (selectedAccountId) {
        payload.account_id = selectedAccountId
      }

      // optional fields
      if (values.potential) payload.potential = values.potential
      if (values.approvedAmount) payload.approved_amount = values.approvedAmount
      if (values.sanctionAmount) payload.sanction_amount = values.sanctionAmount
      if (values.disbursedAmount)
        payload.disbursed_amount = values.disbursedAmount
      if (values.processingFees) payload.processing_fees = values.processingFees
      if (values.pfPercentage) payload.pf_percentage = values.pfPercentage
      if (values.insuranceAmount)
        payload.insurance_amount = values.insuranceAmount
      if (values.rateOfInterest)
        payload.rate_of_interest = values.rateOfInterest
      if (values.interestType) payload.interest_type = values.interestType
      if (values.tenure) payload.tenure = values.tenure
      if (values.loanStartDate) payload.loan_start_date = values.loanStartDate
      if (values.loanEndDate) payload.loan_end_date = values.loanEndDate
      if (values.targetedDisbursementDate)
        payload.targeted_disbursement_date = values.targetedDisbursementDate
      if (values.disbursementDate)
        payload.disbursement_date = values.disbursementDate
      if (values.ticketLogin) payload.ticket_login = values.ticketLogin
      if (values.loanAccountStatus)
        payload.loan_account_status = values.loanAccountStatus
      if (values.lenderRejectionReason)
        payload.lender_rejection_reason = values.lenderRejectionReason
      if (values.lenderRejectionStatusExplanation)
        payload.lender_rejection_status_explanation =
          values.lenderRejectionStatusExplanation
      if (values.customerRejectionReason)
        payload.customer_rejection_reason = values.customerRejectionReason
      if (values.customerRejectionStatusExplanation)
        payload.customer_rejection_status_explanation =
          values.customerRejectionStatusExplanation
      if (values.partnerCode) payload.partner_code = values.partnerCode

      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || 'Failed to create ticket')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Ticket created successfully')
      queryClient.invalidateQueries({ queryKey: ['deal', dealId] })
      navigate(`/deals/${dealId}`)
    },
    onError: (err) => {
      toast.error(err.message)
    },
  })

  const onSubmit = (values: CreateTicketFormValues) => {
    createMutation.mutate(values)
  }

  return (
    <div className='space-y-6 mb-10'>
      <div className='flex justify-between items-center border p-4 rounded-xl bg-card'>
        <div>
          <h1 className='text-2xl font-bold'>Create Ticket</h1>
          {/* Display Account Name here */}
          {isLoadingDeal ? (
            <Spinner className='h-4 w-4' />
          ) : (
            <>
              <div className='flex flex-col'>
                <span className='text-sm font-semibold text-primary uppercase'>
                  Account: {accountName}
                </span>
                <span className='text-sm font-medium text-muted-foreground'>
                  Deal Name: {dealName} #{dealId}
                </span>
              </div>
            </>
          )}
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            className='cursor-pointer'
            onClick={() => navigate(`/deals/${dealId}`)}
          >
            Cancel
          </Button>
          <Button
            className='cursor-pointer'
            onClick={handleSubmit(onSubmit)}
            disabled={createMutation.isPending}
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
        <SectionHeader title='Loan Account Status' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2 border-b'>
          <div className='md:border-r'>
            <FieldRow label='Account Name'>
              <div className='relative'>
                <Input
                  placeholder='Search Account...'
                  className='h-8'
                  value={accountSearch}
                  onChange={(e) => {
                    setAccountSearch(e.target.value)
                    setIsAccountOpen(true)
                    if (selectedAccountId) setSelectedAccountId('')
                  }}
                  onFocus={() => setIsAccountOpen(true)}
                  onBlur={() => {
                    // Delay hiding to allow click event on list items to process
                    setTimeout(() => setIsAccountOpen(false), 200)
                  }}
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
                            // Using onMouseDown because it fires before onBlur
                            setSelectedAccountId(String(acc.id))
                            setAccountSearch(acc.account_name)
                            setIsAccountOpen(false)
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

            <FieldRow
              label='Ticket Login *'
              error={errors.ticketLogin?.message}
            >
              <SelectField
                isEdit={true}
                options={['Approved', 'Disapproved']}
                value={formValues.ticketLogin ?? ''}
                onChange={(value) =>
                  setValue('ticketLogin', value, { shouldValidate: true })
                }
              />
            </FieldRow>

            <FieldRow label='Potential' error={errors.potential?.message}>
              <Input
                {...register('potential')}
                placeholder='Potential'
                type='number'
                step='0.01'
                className='h-8'
              />
            </FieldRow>

            <FieldRow
              label='Lender Login Date *'
              error={errors.lenderLoginDate?.message}
            >
              <DateField
                isEdit={true}
                value={
                  formValues.lenderLoginDate
                    ? new Date(formValues.lenderLoginDate)
                    : undefined
                }
                onChange={(date) =>
                  setValue(
                    'lenderLoginDate',
                    date ? format(date, 'yyyy-MM-dd') : '',
                    { shouldValidate: true },
                  )
                }
              />
            </FieldRow>

            <FieldRow
              label='Targeted Disbursement Date'
              error={errors.targetedDisbursementDate?.message}
            >
              <DateField
                isEdit={true}
                value={
                  formValues.targetedDisbursementDate
                    ? new Date(formValues.targetedDisbursementDate)
                    : undefined
                }
                onChange={(date) =>
                  setValue(
                    'targetedDisbursementDate',
                    date ? format(date, 'yyyy-MM-dd') : '',
                  )
                }
              />
            </FieldRow>

            <FieldRow
              label='Disbursement Date'
              error={errors.disbursementDate?.message}
            >
              <DateField
                isEdit={true}
                value={
                  formValues.disbursementDate
                    ? new Date(formValues.disbursementDate)
                    : undefined
                }
                onChange={(date) =>
                  setValue(
                    'disbursementDate',
                    date ? format(date, 'yyyy-MM-dd') : '',
                  )
                }
              />
            </FieldRow>
          </div>

          <div>
            <FieldRow label='Lender Name *' error={errors.lenderName?.message}>
              <div className='relative'>
                <Input
                  placeholder='Search lender...'
                  className='h-8'
                  value={lenderSearch}
                  onChange={(e) => {
                    setLenderSearch(e.target.value)
                    setLenderOpen(true)
                    setValue('lenderName', '', { shouldValidate: true })
                  }}
                  onFocus={() => setLenderOpen(true)}
                  onBlur={() => setTimeout(() => setLenderOpen(false), 200)}
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
              label='Lender Login Type *'
              error={errors.lenderLoginType?.message}
            >
              <SelectField
                isEdit={true}
                options={['Direct', 'Partner']}
                value={formValues.lenderLoginType ?? ''}
                onChange={(value) =>
                  setValue('lenderLoginType', value, { shouldValidate: true })
                }
              />
            </FieldRow>

            <FieldRow label='Partner Code' error={errors.partnerCode?.message}>
              <Input
                {...register('partnerCode')}
                placeholder='Enter Partner Code'
                className='h-8'
                disabled={formValues.lenderLoginType !== 'Partner'}
              />
            </FieldRow>

            <FieldRow label='Type of Loan *' error={errors.typeOfLoan?.message}>
              <SelectField
                isEdit={true}
                options={LOAN_TYPES}
                value={formValues.typeOfLoan ?? ''}
                onChange={(value) =>
                  setValue('typeOfLoan', value, { shouldValidate: true })
                }
              />
            </FieldRow>

            <FieldRow
              label='Ticket Status *'
              error={errors.ticketStatus?.message}
            >
              <SelectField
                isEdit={true}
                options={TICKET_STATUSES}
                value={formValues.ticketStatus ?? ''}
                onChange={(value) =>
                  setValue('ticketStatus', value, { shouldValidate: true })
                }
              />
            </FieldRow>

            <FieldRow
              label='Ticket Stage *'
              error={errors.ticketStage?.message}
            >
              <SelectField
                isEdit={true}
                options={TICKET_STAGES}
                value={formValues.ticketStage ?? ''}
                onChange={(value) =>
                  setValue('ticketStage', value, { shouldValidate: true })
                }
              />
            </FieldRow>
          </div>
        </CardContent>

        <SectionHeader title='Funding & Commercials' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2 border-b'>
          <div className='md:border-r'>
            <FieldRow
              label='Approved Amount'
              error={errors.approvedAmount?.message}
            >
              <Input
                {...register('approvedAmount')}
                placeholder='Approved Amount'
                type='number'
                step='0.01'
                className='h-8'
              />
            </FieldRow>

            <FieldRow
              label='Processing Fees'
              error={errors.processingFees?.message}
            >
              <Input
                {...register('processingFees')}
                placeholder='Processing Fees'
                type='number'
                step='0.01'
                className='h-8'
              />
            </FieldRow>

            <FieldRow
              label='PF Percentage'
              error={errors.pfPercentage?.message}
            >
              <Input
                {...register('pfPercentage')}
                placeholder='PF Percentage'
                type='number'
                step='0.01'
                className='h-8'
              />
            </FieldRow>

            <FieldRow
              label='Insurance Amount'
              error={errors.insuranceAmount?.message}
            >
              <Input
                {...register('insuranceAmount')}
                placeholder='Insurance Amount'
                type='number'
                step='0.01'
                className='h-8'
              />
            </FieldRow>

            <FieldRow
              label='Rate of Interest'
              error={errors.rateOfInterest?.message}
            >
              <Input
                {...register('rateOfInterest')}
                placeholder='Rate of Interest'
                type='number'
                step='0.01'
                className='h-8'
              />
            </FieldRow>

            <FieldRow
              label='Interest Type'
              error={errors.interestType?.message}
            >
              <SelectField
                isEdit={true}
                options={['Reducing', 'Fixed', 'Floating']}
                value={formValues.interestType ?? ''}
                onChange={(value) => setValue('interestType', value)}
              />
            </FieldRow>
          </div>

          <div>
            <FieldRow
              label='Sanction Amount'
              error={errors.sanctionAmount?.message}
            >
              <Input
                {...register('sanctionAmount')}
                placeholder='Sanction Amount'
                type='number'
                step='0.01'
                className='h-8'
              />
            </FieldRow>

            <FieldRow
              label='Disbursed Amount'
              error={errors.disbursedAmount?.message}
            >
              <Input
                {...register('disbursedAmount')}
                placeholder='Disbursed Amount'
                type='number'
                step='0.01'
                className='h-8'
              />
            </FieldRow>

            <FieldRow label='Tenure' error={errors.tenure?.message}>
              <Input
                {...register('tenure')}
                placeholder='Tenure (months)'
                type='number'
                className='h-8'
              />
            </FieldRow>

            <FieldRow
              label='Loan Start Date'
              error={errors.loanStartDate?.message}
            >
              <DateField
                isEdit={true}
                value={
                  formValues.loanStartDate
                    ? new Date(formValues.loanStartDate)
                    : undefined
                }
                onChange={(date) =>
                  setValue(
                    'loanStartDate',
                    date ? format(date, 'yyyy-MM-dd') : '',
                  )
                }
              />
            </FieldRow>

            <FieldRow label='Loan End Date' error={errors.loanEndDate?.message}>
              <DateField
                isEdit={true}
                value={
                  formValues.loanEndDate
                    ? new Date(formValues.loanEndDate)
                    : undefined
                }
                onChange={(date) =>
                  setValue(
                    'loanEndDate',
                    date ? format(date, 'yyyy-MM-dd') : '',
                  )
                }
              />
            </FieldRow>
          </div>
        </CardContent>

        <SectionHeader title='Rejection Details' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2'>
          <div className='md:border-r'>
            <FieldRow
              label='Lender Rejection Reason'
              error={errors.lenderRejectionReason?.message}
            >
              <SelectField
                isEdit={true}
                options={[
                  '-None-',
                  'Low Eligibility',
                  'Credit Issues',
                  'OGL',
                  'Vintage',
                ]}
                value={formValues.lenderRejectionReason ?? ''}
                onChange={(value) => setValue('lenderRejectionReason', value)}
              />
            </FieldRow>
            <FieldRow
              label='Customer Rejection Reason'
              error={errors.customerRejectionReason?.message}
            >
              <SelectField
                isEdit={true}
                options={['-None-', 'ROI', 'Limit', 'Charges', 'Other Terms']}
                value={formValues.customerRejectionReason ?? ''}
                onChange={(value) => setValue('customerRejectionReason', value)}
              />
            </FieldRow>
          </div>
          <div>
            <FieldRow
              label='Lender Rejection Explanation'
              error={errors.lenderRejectionStatusExplanation?.message}
            >
              <Input
                {...register('lenderRejectionStatusExplanation')}
                placeholder='Explanation'
                className='h-8'
              />
            </FieldRow>
            <FieldRow
              label='Customer Rejection Explanation'
              error={errors.customerRejectionStatusExplanation?.message}
            >
              <Input
                {...register('customerRejectionStatusExplanation')}
                placeholder='Customer Rejection Explanation'
                className='h-8'
              />
            </FieldRow>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
