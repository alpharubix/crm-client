import { useCallback, useEffect, useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useBeforeUnload, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import SectionHeader from '@/components/shared/section-header'
import FieldRow from '@/components/shared/field-row'
import SelectField from '@/components/shared/select-field'
import DateField from '@/components/shared/date-field'
import NoteDialog from '@/components/shared/note-dialog'
import { Spinner } from '@/components/ui/spinner'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ENV } from '@/conf'
import users from '@/utils/users.json'
import LENDER_NAMES from '@/utils/lenders.json'

import { formatExactDate } from '@/utils/date-formatter'
import { formatAmount } from '@/utils/number-formatter'
import { format } from 'date-fns'
import { useAuth } from '@/context/auth-context'
import {
  updateTicketSchema,
  type UpdateTicketFormValues,
} from '@/validators/updateTicket.schema'
import { NestedComments } from '../nested-notes'

// Safely extract lender_rejection_reason regardless of whether DB returns
// a string or a JSON object (e.g. { reason: "OGL" })
function parseLenderRejectionReason(value: any): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object' && value.reason) return String(value.reason)
  return ''
}

function mapTicketToForm(apiData: any): UpdateTicketFormValues {
  return {
    lenderName: apiData.lender_name || '',
    loanType: apiData.type_of_loan || '',
    ticketStatus: apiData.ticket_status || '',
    ticketStage: apiData.ticket_stage || '',
    lenderLoginType: apiData.lender_login_type || '',
    lenderLoginDate: apiData.lender_login_date || '',
    ticketLogin: apiData.ticket_login || '',
    potential: apiData.potential ? String(apiData.potential) : '',

    approvedAmount: apiData.approved_amount
      ? String(apiData.approved_amount)
      : '',
    sanctionAmount: apiData.sanction_amount
      ? String(apiData.sanction_amount)
      : '',
    disbursedAmount: apiData.disbursed_amount
      ? String(apiData.disbursed_amount)
      : '',
    processingFees: apiData.processing_fees
      ? String(apiData.processing_fees)
      : '',
    pfPercentage: apiData.pf_percentage ? String(apiData.pf_percentage) : '',
    insuranceAmount: apiData.insurance_amount
      ? String(apiData.insurance_amount)
      : '',
    rateOfInterest: apiData.rate_of_interest
      ? String(apiData.rate_of_interest)
      : '',
    interestType: apiData.interest_type || '',
    tenure: apiData.tenure ? String(apiData.tenure) : '',
    loanStartDate: apiData.loan_start_date || '',
    loanEndDate: apiData.loan_end_date || '',
    targetedDisbursementDate: apiData.targeted_disbursement_date || '',
    disbursementDate: apiData.disbursement_date || '',
    loanAccountStatus: apiData.loan_account_status || '',
    lenderRejectionReason: parseLenderRejectionReason(
      apiData.lender_rejection_reason,
    ),
    lenderRejectionStatusExplanation:
      apiData.lender_rejection_status_explanation || '',
    partnerCode: apiData.partner_code || '',
    partnerName: apiData.partner_name || '',
    customerRejectionReason: apiData.customer_rejection_reason || '',
    customerRejectionStatusExplanation:
      apiData.customer_rejection_status_explanation || '',
  }
}

function mapFormToApi(
  formData: UpdateTicketFormValues,
  dirtyFields: Partial<Record<keyof UpdateTicketFormValues, boolean>>,
): any {
  const numOrNull = (v?: string) => (v && v !== '' ? parseFloat(v) : null)

  const allFields: Record<
    string,
    { value: any; key: keyof UpdateTicketFormValues }
  > = {
    lender_name: { value: formData.lenderName, key: 'lenderName' },
    type_of_loan: { value: formData.loanType, key: 'loanType' },
    ticket_status: { value: formData.ticketStatus, key: 'ticketStatus' },
    ticket_stage: { value: formData.ticketStage, key: 'ticketStage' },
    lender_login_type: {
      value: formData.lenderLoginType,
      key: 'lenderLoginType',
    },
    lender_login_date: {
      value: formData.lenderLoginDate || null,
      key: 'lenderLoginDate',
    },
    ticket_login: { value: formData.ticketLogin, key: 'ticketLogin' },
    potential: { value: numOrNull(formData.potential), key: 'potential' },
    approved_amount: {
      value: numOrNull(formData.approvedAmount),
      key: 'approvedAmount',
    },
    sanction_amount: {
      value: numOrNull(formData.sanctionAmount),
      key: 'sanctionAmount',
    },
    disbursed_amount: {
      value: numOrNull(formData.disbursedAmount),
      key: 'disbursedAmount',
    },
    processing_fees: {
      value: numOrNull(formData.processingFees),
      key: 'processingFees',
    },
    pf_percentage: {
      value: numOrNull(formData.pfPercentage),
      key: 'pfPercentage',
    },
    insurance_amount: {
      value: numOrNull(formData.insuranceAmount),
      key: 'insuranceAmount',
    },
    rate_of_interest: {
      value: numOrNull(formData.rateOfInterest),
      key: 'rateOfInterest',
    },
    interest_type: {
      value: formData.interestType || null,
      key: 'interestType',
    },
    tenure: {
      value:
        formData.tenure && formData.tenure !== ''
          ? parseInt(formData.tenure, 10)
          : null,
      key: 'tenure',
    },
    loan_start_date: {
      value: formData.loanStartDate || null,
      key: 'loanStartDate',
    },
    loan_end_date: { value: formData.loanEndDate || null, key: 'loanEndDate' },
    targeted_disbursement_date: {
      value: formData.targetedDisbursementDate || null,
      key: 'targetedDisbursementDate',
    },
    disbursement_date: {
      value: formData.disbursementDate || null,
      key: 'disbursementDate',
    },
    loan_account_status: {
      value: formData.loanAccountStatus || null,
      key: 'loanAccountStatus',
    },
    // lender_rejection_reason is jsonb in DB — send as string value directly
    lender_rejection_reason: {
      value: formData.lenderRejectionReason || null,
      key: 'lenderRejectionReason',
    },
    lender_rejection_status_explanation: {
      value: formData.lenderRejectionStatusExplanation || null,
      key: 'lenderRejectionStatusExplanation',
    },
    partner_code: { value: formData.partnerCode || null, key: 'partnerCode' },
    partner_name: { value: formData.partnerName || null, key: 'partnerName' },
    customer_rejection_reason: {
      value: formData.customerRejectionReason || null,
      key: 'customerRejectionReason',
    },
    customer_rejection_status_explanation: {
      value: formData.customerRejectionStatusExplanation || null,
      key: 'customerRejectionStatusExplanation',
    },
  }

  const payload: any = {}

  Object.entries(allFields).forEach(([apiKey, { value, key }]) => {
    if (dirtyFields[key]) {
      payload[apiKey] = value
    }
  })

  return payload
}

// Shared setValue options for all select/date fields
const DIRTY_OPTS = {
  shouldValidate: true,
  shouldDirty: true,
  shouldTouch: true,
} as const

export default function UpdateKanbanTicket({
  ticketIdProp,
  onBack,
}: {
  ticketIdProp?: string | number
  onBack?: () => void
} = {}) {
  const params = useParams()
  const id = ticketIdProp !== undefined ? String(ticketIdProp) : params.id
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [isEdit, setIsEdit] = useState(false)
  const [openAllNotes, setOpenAllNotes] = useState(false)
  const { user } = useAuth()

  const allowedEmails = [
    'prathap@r1xchange.com',
    'pranay.kumar@r1xchange.com',
    'sutapa.roy@r1xchange.com',
    'namrata.srivastava@r1xchange.com',
    'subhasini.ts@r1xchange.com',
    'raj.nandini@r1xchange.com',
  ]

  const isEmailAuthorized = allowedEmails.includes(user?.email ?? '')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty, dirtyFields },
  } = useForm<UpdateTicketFormValues>({
    resolver: zodResolver(updateTicketSchema),
  })

  const [lenderSearch, setLenderSearch] = useState('')
  const [lenderOpen, setLenderOpen] = useState(false)

  // Account lookup state
  const [accountSearch, setAccountSearch] = useState('')
  const [debouncedAccountSearch, setDebouncedAccountSearch] = useState('')
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')

  const filteredLenders =
    lenderSearch.length > 1
      ? LENDER_NAMES.filter((l: string) =>
          l.toLowerCase().includes(lenderSearch.toLowerCase()),
        ).slice(0, 50)
      : []

  // Debounce account search
  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedAccountSearch(accountSearch),
      500,
    )
    return () => clearTimeout(timer)
  }, [accountSearch])

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

  // Ticket query
  const {
    data: dealData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['ticket', id],
    queryFn: async () => {
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/tickets/${id}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed to fetch ticket')
      return res.json()
    },
    enabled: !!id,
  })
  console.log({ dealData })
  // Deal details query — to get account_name / account_id linked to this ticket's deal
  const { data: dealDetailsResponse } = useQuery({
    queryKey: ['deal', dealData?.deal_id],
    queryFn: async () => {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/deals?deal_id=${dealData.deal_id}`,
        { credentials: 'include' },
      )
      if (!res.ok) throw new Error('Failed to fetch deal details')
      return res.json()
    },
    enabled: !!dealData?.deal_id,
  })
  const dealDetails = dealDetailsResponse?.data?.[0]
  console.log({ dealDetails })
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

  const notes = (dealData as any)?.notes || []

  const sortedNotes = [...notes].sort(
    (a: any, b: any) =>
      new Date(b.Created_Time).getTime() - new Date(a.Created_Time).getTime(),
  )

  useEffect(() => {
    if (dealData) {
      reset(mapTicketToForm(dealData))
      setLenderSearch(dealData.lender_name || '')
    }
  }, [dealData, reset])

  // Sync initial account name from ticket details (fallback to deal details)
  useEffect(() => {
    const initialName = dealData?.account_name || dealDetails?.account_name
    const initialId = dealData?.account_id || dealDetails?.account_id
    if (initialName && !accountSearch) {
      setAccountSearch(initialName)
      setSelectedAccountId(String(initialId || ''))
    }
  }, [dealData, dealDetails])

  const updateMutation = useMutation({
    mutationFn: async (values: UpdateTicketFormValues) => {
      const originalAccountId = String(
        dealData?.account_id || dealDetails?.account_id || '',
      )
      const payload = {
        ...mapFormToApi(values, dirtyFields),
        ...(selectedAccountId && selectedAccountId !== originalAccountId
          ? { account_id: selectedAccountId }
          : {}),
      }
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(
          errData.detail || errData.message || 'Failed to update ticket',
        )
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Ticket updated successfully')
      setIsEdit(false)
      // Re-fetch from server so form resets to the latest saved state
      queryClient.invalidateQueries({ queryKey: ['ticket', id] })
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update ticket')
    },
  })

  const formValues = watch()

  const onSave: SubmitHandler<UpdateTicketFormValues> = (values) => {
    updateMutation.mutate(values)
  }

  const handleAddNote = async (note: { description: string }) => {
    try {
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, note: note.description, module: 'Tickets' }),
      })
      if (res.ok) {
        toast.success('Note added successfully')
        queryClient.invalidateQueries({ queryKey: ['ticket', id] })
      } else {
        toast.error('Failed to add note')
      }
    } catch {
      toast.error('Network error')
    }
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Spinner className='h-8 w-8 text-primary' />
      </div>
    )
  }

  if (error || !dealData) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <p className='text-muted-foreground'>Ticket not found</p>
      </div>
    )
  }

  const MAX_NOTES_VISIBLE = 3
  const showViewMore = sortedNotes.length > MAX_NOTES_VISIBLE
  const visibleNotes = showViewMore
    ? sortedNotes.slice(0, MAX_NOTES_VISIBLE)
    : sortedNotes

  // Guard: only show formatted amount if value is non-empty
  const displayAmount = (val?: string) =>
    val && val !== '' ? formatAmount(Number(val)) : '—'

  // Check if account has been explicitly modified via our custom state
  const originalAccountId = String(
    dealData?.account_id || dealDetails?.account_id || '',
  )
  const isAccountDirty =
    selectedAccountId &&
    originalAccountId &&
    selectedAccountId !== originalAccountId

  return (
    <div className='space-y-6 mx-2 bg-background min-h-screen mb-10'>
      {/* HEADER */}
      <div className='flex justify-between items-center border p-4 rounded-xl bg-card'>
        <div>
          <h1 className='text-lg font-semibold'>
            Deal Owner Name:{' '}
            <span className='text-primary font-bold'>
              {/* {(users as Record<string, string>)[dealDetails.owner.full_name] ||
                'NA'} */}
              {dealDetails?.owner?.full_name}
            </span>
          </h1>
          <h1 className='text-lg font-semibold'>
            Deal Id:{' '}
            <span className='text-primary font-bold'>#{dealData.deal_id}</span>
          </h1>
          <h1 className='text-lg font-semibold'>
            Deal Name:{' '}
            <span className='text-primary font-bold'>
              {dealDetails?.account_name}
            </span>
          </h1>
          <h1 className='text-lg font-semibold'>
            Ticket Id:{' '}
            <span className='text-primary font-bold'>#{dealData.id}</span>
          </h1>
        </div>
        <div className='flex items-center gap-2'>
          {onBack && (
            <Button size='sm' variant='outline' onClick={onBack}>
              ← Back
            </Button>
          )}
          {!isEdit && isEmailAuthorized && (
            <Button
              size='sm'
              className='cursor-pointer'
              onClick={() => setIsEdit(true)}
            >
              Update
            </Button>
          )}

          {isEdit && (
            <div className='flex gap-2'>
              <Button
                size='sm'
                className='cursor-pointer'
                disabled={
                  (!isDirty && !isAccountDirty) || updateMutation.isPending
                }
                onClick={handleSubmit(onSave, (errs) =>
                  console.log('VALIDATION ERRORS:', errs),
                )}
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
                  setLenderSearch(dealData?.lender_name || '')
                  setAccountSearch(
                    dealData?.account_name || dealDetails?.account_name || '',
                  )
                  setSelectedAccountId(
                    String(
                      dealData?.account_id || dealDetails?.account_id || '',
                    ),
                  )
                  setIsEdit(false)
                }}
              >
                Cancel
              </Button>
            </div>
          )}

          <Button
            variant='default'
            onClick={() => navigate(`/deals/${dealData.deal_id}`)}
            className='ml-2'
          >
            Go to Deal
          </Button>
        </div>
      </div>

      <Card className='overflow-hidden space-y-1'>
        {/* ================= Loan Account Status ================= */}
        <SectionHeader title='Loan Account Status' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2 border-b'>
          <div className='md:border-r'>
            <FieldRow label='Account Name'>
              {isEdit ? (
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
              ) : (
                <span>{accountSearch || '—'}</span>
              )}
            </FieldRow>

            <FieldRow
              label='Ticket Login *'
              error={errors.ticketLogin?.message}
            >
              <SelectField
                isEdit={isEdit}
                options={['Approved', 'Disapproved']}
                value={formValues.ticketLogin as string}
                onChange={(value) => setValue('ticketLogin', value, DIRTY_OPTS)}
              />
            </FieldRow>

            <FieldRow label='Potential' error={errors.potential?.message}>
              {isEdit ? (
                <Input
                  {...register('potential')}
                  placeholder='Potential'
                  className='h-8'
                  type='number'
                  step='0.01'
                />
              ) : (
                <span>{formValues.potential || '—'}</span>
              )}
            </FieldRow>

            <FieldRow
              label='Lender Login Date *'
              error={errors.lenderLoginDate?.message}
            >
              {isEdit ? (
                <DateField
                  isEdit={isEdit}
                  value={
                    formValues.lenderLoginDate
                      ? new Date(formValues.lenderLoginDate)
                      : undefined
                  }
                  onChange={(date) =>
                    setValue(
                      'lenderLoginDate',
                      date ? format(date, 'yyyy-MM-dd') : '',
                      DIRTY_OPTS,
                    )
                  }
                />
              ) : (
                <span>
                  {formValues.lenderLoginDate
                    ? formatExactDate(formValues.lenderLoginDate, 'dd MMM yyyy')
                    : '—'}
                </span>
              )}
            </FieldRow>

            <FieldRow
              label='Targeted Disbursement Date'
              error={errors.targetedDisbursementDate?.message}
            >
              {isEdit ? (
                <DateField
                  isEdit={isEdit}
                  value={
                    formValues.targetedDisbursementDate
                      ? new Date(formValues.targetedDisbursementDate)
                      : undefined
                  }
                  onChange={(date) =>
                    setValue(
                      'targetedDisbursementDate',
                      date ? format(date, 'yyyy-MM-dd') : '',
                      DIRTY_OPTS,
                    )
                  }
                />
              ) : (
                <span>
                  {formValues.targetedDisbursementDate
                    ? formatExactDate(
                        formValues.targetedDisbursementDate,
                        'dd MMM yyyy',
                      )
                    : '—'}
                </span>
              )}
            </FieldRow>

            <FieldRow
              label='Disbursement Date'
              error={errors.disbursementDate?.message}
            >
              {isEdit ? (
                <DateField
                  isEdit={isEdit}
                  value={
                    formValues.disbursementDate
                      ? new Date(formValues.disbursementDate)
                      : undefined
                  }
                  onChange={(date) =>
                    setValue(
                      'disbursementDate',
                      date ? format(date, 'yyyy-MM-dd') : '',
                      DIRTY_OPTS,
                    )
                  }
                />
              ) : (
                <span>
                  {formValues.disbursementDate
                    ? formatExactDate(
                        formValues.disbursementDate,
                        'dd MMM yyyy',
                      )
                    : '—'}
                </span>
              )}
            </FieldRow>

            <FieldRow label='Created By'>
              <span className='text-sm font-medium text-muted-foreground'>
                {(users as Record<string, string>)[dealData.created_by] ||
                  dealData.created_by ||
                  '—'}
              </span>
            </FieldRow>

            <FieldRow label='Modified By'>
              <span className='text-sm font-medium text-muted-foreground'>
                {(users as Record<string, string>)[dealData.modified_by] ||
                  dealData.modified_by ||
                  '—'}
              </span>
            </FieldRow>
          </div>

          <div>
            <FieldRow label='Ticket Name'>
              <span className='font-medium'>
                {(dealData as any).ticket_name || dealData.deal_name || '—'}
              </span>
            </FieldRow>
            <FieldRow label='Lender Name *' error={errors.lenderName?.message}>
              <div className='relative'>
                <Input
                  disabled={!isEdit}
                  value={lenderSearch}
                  onChange={(e) => {
                    setLenderSearch(e.target.value)
                    setLenderOpen(true)
                  }}
                  onFocus={() => setLenderOpen(true)}
                  onBlur={() => setTimeout(() => setLenderOpen(false), 200)}
                  placeholder='Search Lender...'
                />
                {isEdit && lenderOpen && filteredLenders.length > 0 && (
                  <div className='absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto'>
                    {filteredLenders.map((name: string) => (
                      <div
                        key={name}
                        className='p-2 hover:bg-muted cursor-pointer text-sm'
                        onMouseDown={() => {
                          setValue('lenderName', name, DIRTY_OPTS)
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
                isEdit={isEdit}
                options={[
                  'Rupifi Private Ltd',
                  'FlexiLoans Technologies Private Ltd',
                  'Recur Club Technologies Private Ltd',
                  'Rupeeboss Financial Services Pvt Ltd',
                  'Others',
                ]}
                value={formValues.partnerName as string}
                onChange={(value) =>
                  setValue('partnerName', value, DIRTY_OPTS)
                }
              />
            </FieldRow>

            <FieldRow
              label='Lender Login Type *'
              error={errors.lenderLoginType?.message}
            >
              <SelectField
                isEdit={isEdit}
                options={['Direct', 'Partner']}
                value={formValues.lenderLoginType as string}
                onChange={(value) =>
                  setValue('lenderLoginType', value, DIRTY_OPTS)
                }
              />
            </FieldRow>



            <FieldRow label='Type of Loan *' error={errors.loanType?.message}>
              <SelectField
                isEdit={isEdit}
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
                onChange={(value) => setValue('loanType', value, DIRTY_OPTS)}
              />
            </FieldRow>

            <FieldRow
              label='Ticket Status *'
              error={errors.ticketStatus?.message}
            >
              <SelectField
                isEdit={isEdit}
                options={[
                  'Yet to Lender Login',
                  'Lender Review',
                  'In Credit',
                  'Approved',
                  'Disbursed',
                  'Rejected',
                  'Not Interested',
                ]}
                value={formValues.ticketStatus as string}
                onChange={(value) =>
                  setValue('ticketStatus', value, DIRTY_OPTS)
                }
              />
            </FieldRow>

            <FieldRow
              label='Ticket Stage *'
              error={errors.ticketStage?.message}
            >
              <SelectField
                isEdit={isEdit}
                options={[
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
                ]}
                value={formValues.ticketStage as string}
                onChange={(value) => setValue('ticketStage', value, DIRTY_OPTS)}
              />
            </FieldRow>

            <FieldRow label='Created At'>
              <span className='text-sm font-medium text-muted-foreground'>
                {dealData.created_at
                  ? formatExactDate(dealData.created_at, 'dd MMM yyyy, hh:mm a')
                  : '—'}
              </span>
            </FieldRow>

            <FieldRow label='Modified At'>
              <span className='text-sm font-medium text-muted-foreground'>
                {dealData.updated_at
                  ? formatExactDate(dealData.updated_at, 'dd MMM yyyy, hh:mm a')
                  : '—'}
              </span>
            </FieldRow>
          </div>
        </CardContent>

        {/* ================= Funding & Commercials ================= */}
        <SectionHeader title='Funding & Commercials' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2 border-b'>
          <div className='md:border-r'>
            <FieldRow
              label='Approved Amount'
              error={errors.approvedAmount?.message}
            >
              {isEdit ? (
                <Input
                  {...register('approvedAmount')}
                  placeholder='Approved Amount'
                  type='number'
                  step='0.01'
                  className='h-8'
                />
              ) : (
                <span>{displayAmount(formValues.approvedAmount)}</span>
              )}
            </FieldRow>

            <FieldRow
              label='Processing Fees'
              error={errors.processingFees?.message}
            >
              {isEdit ? (
                <Input
                  {...register('processingFees')}
                  placeholder='Processing Fees'
                  type='number'
                  step='0.01'
                  className='h-8'
                />
              ) : (
                <span>{displayAmount(formValues.processingFees)}</span>
              )}
            </FieldRow>

            <FieldRow
              label='PF Percentage'
              error={errors.pfPercentage?.message}
            >
              {isEdit ? (
                <Input
                  {...register('pfPercentage')}
                  placeholder='PF Percentage'
                  type='number'
                  step='0.01'
                  className='h-8'
                />
              ) : (
                <span>{formValues.pfPercentage || '—'}</span>
              )}
            </FieldRow>

            <FieldRow
              label='Insurance Amount'
              error={errors.insuranceAmount?.message}
            >
              {isEdit ? (
                <Input
                  {...register('insuranceAmount')}
                  placeholder='Insurance Amount'
                  type='number'
                  step='0.01'
                  className='h-8'
                />
              ) : (
                <span>{displayAmount(formValues.insuranceAmount)}</span>
              )}
            </FieldRow>

            <FieldRow
              label='Rate of Interest'
              error={errors.rateOfInterest?.message}
            >
              {isEdit ? (
                <Input
                  {...register('rateOfInterest')}
                  placeholder='Rate of Interest'
                  type='number'
                  step='0.01'
                  className='h-8'
                />
              ) : (
                <span>{formValues.rateOfInterest || '—'}</span>
              )}
            </FieldRow>

            <FieldRow
              label='Interest Type'
              error={errors.interestType?.message}
            >
              <SelectField
                isEdit={isEdit}
                options={['Reducing', 'Fixed', 'Floating']}
                value={formValues.interestType as string}
                onChange={(value) =>
                  setValue('interestType', value, DIRTY_OPTS)
                }
              />
            </FieldRow>
          </div>

          <div>
            <FieldRow
              label='Sanction Amount'
              error={errors.sanctionAmount?.message}
            >
              {isEdit ? (
                <Input
                  {...register('sanctionAmount')}
                  placeholder='Sanction Amount'
                  type='number'
                  step='0.01'
                  className='h-8'
                />
              ) : (
                <span>{displayAmount(formValues.sanctionAmount)}</span>
              )}
            </FieldRow>

            <FieldRow
              label='Disbursed Amount'
              error={errors.disbursedAmount?.message}
            >
              {isEdit ? (
                <Input
                  {...register('disbursedAmount')}
                  placeholder='Disbursed Amount'
                  type='number'
                  step='0.01'
                  className='h-8'
                />
              ) : (
                <span>{displayAmount(formValues.disbursedAmount)}</span>
              )}
            </FieldRow>

            <FieldRow label='Tenure' error={errors.tenure?.message}>
              {isEdit ? (
                <Input
                  {...register('tenure')}
                  placeholder='Tenure (months)'
                  type='number'
                  className='h-8'
                />
              ) : (
                <span>{formValues.tenure || '—'}</span>
              )}
            </FieldRow>

            <FieldRow
              label='Loan Start Date'
              error={errors.loanStartDate?.message}
            >
              {isEdit ? (
                <DateField
                  isEdit={isEdit}
                  value={
                    formValues.loanStartDate
                      ? new Date(formValues.loanStartDate)
                      : undefined
                  }
                  onChange={(date) =>
                    setValue(
                      'loanStartDate',
                      date ? format(date, 'yyyy-MM-dd') : '',
                      DIRTY_OPTS,
                    )
                  }
                />
              ) : (
                <span>
                  {formValues.loanStartDate
                    ? formatExactDate(formValues.loanStartDate, 'dd MMM yyyy')
                    : '—'}
                </span>
              )}
            </FieldRow>

            <FieldRow label='Loan End Date' error={errors.loanEndDate?.message}>
              {isEdit ? (
                <DateField
                  isEdit={isEdit}
                  value={
                    formValues.loanEndDate
                      ? new Date(formValues.loanEndDate)
                      : undefined
                  }
                  onChange={(date) =>
                    setValue(
                      'loanEndDate',
                      date ? format(date, 'yyyy-MM-dd') : '',
                      DIRTY_OPTS,
                    )
                  }
                />
              ) : (
                <span>
                  {formValues.loanEndDate
                    ? formatExactDate(formValues.loanEndDate, 'dd MMM yyyy')
                    : '—'}
                </span>
              )}
            </FieldRow>
          </div>
        </CardContent>

        {/* ================= Rejection Status ================= */}
        <SectionHeader title='Rejection Status' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2'>
          <div className='md:border-r'>
            <FieldRow
              label='Lender Rejection Reason'
              error={errors.lenderRejectionReason?.message}
            >
              <SelectField
                isEdit={isEdit}
                options={[
                  '-None-',
                  'Low Eligibility',
                  'Credit Issues',
                  'OGL',
                  'Vintage',
                ]}
                value={formValues.lenderRejectionReason as string}
                onChange={(value) =>
                  setValue('lenderRejectionReason', value, DIRTY_OPTS)
                }
              />
            </FieldRow>
            <FieldRow
              label='Customer Rejection Reason'
              error={errors.customerRejectionReason?.message}
            >
              <SelectField
                isEdit={isEdit}
                options={['-None-', 'ROI', 'Limit', 'Charges', 'Other Terms']}
                value={formValues.customerRejectionReason as string}
                onChange={(value) =>
                  setValue('customerRejectionReason', value, DIRTY_OPTS)
                }
              />
            </FieldRow>
          </div>
          <div>
            <FieldRow
              label='Lender Rejection Status Explanation'
              error={errors.lenderRejectionStatusExplanation?.message}
            >
              {isEdit ? (
                <Input
                  {...register('lenderRejectionStatusExplanation')}
                  placeholder='Lender Rejection Explanation'
                  className='h-8'
                />
              ) : (
                <span>
                  {formValues.lenderRejectionStatusExplanation || '—'}
                </span>
              )}
            </FieldRow>
            <FieldRow
              label='Customer Rejection Status Explanation'
              error={errors.customerRejectionStatusExplanation?.message}
            >
              {isEdit ? (
                <Input
                  {...register('customerRejectionStatusExplanation')}
                  placeholder='Customer Rejection Explanation'
                  className='h-8'
                />
              ) : (
                <span>
                  {formValues.customerRejectionStatusExplanation || '—'}
                </span>
              )}
            </FieldRow>
          </div>
        </CardContent>

        {/* ================= Notes ================= */}
        <SectionHeader title='Notes' />
        {/* <CardContent className='p-4 space-y-3'>
          <div className='flex items-center justify-between'>
            <p className='text-sm text-muted-foreground'>
              Total Notes:{' '}
              <span className='font-semibold'>{sortedNotes.length}</span>
            </p>

            <div className='flex gap-2 items-center'>
              {showViewMore && (
                <Dialog open={openAllNotes} onOpenChange={setOpenAllNotes}>
                  <DialogTrigger asChild>
                    <Button
                      size='sm'
                      className='cursor-pointer'
                      variant='outline'
                    >
                      View More
                    </Button>
                  </DialogTrigger>

                  <DialogContent className='min-w-4xl'>
                    <DialogHeader>
                      <DialogTitle>
                        All Notes ({sortedNotes.length})
                      </DialogTitle>
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
                            <span className='font-bold'>
                              Module: {note.module}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
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
                  <span className='font-bold'>Module: {note.module}</span>
                </div>
              </div>
            ))
          )}

          <NoteDialog onAddNote={handleAddNote} />
        </CardContent> */}
        <NestedComments />
      </Card>
    </div>
  )
}
