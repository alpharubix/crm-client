import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
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
import type { Deal } from '@/types'
import users from '@/utils/users.json'
import LENDER_NAMES from '@/utils/lenders.json'

import {
  updateDealSchema,
  type UpdateDealFormValues,
} from '@/validators/updateDeal.schema'
import { formatExactDate } from '@/utils/date-formatter'
import { formatAmount } from '@/utils/number-formatter'
import { format } from 'date-fns'
import { useAuth } from '@/context/auth-context'
import {
  updateTicketSchema,
  type UpdateTicketFormValues,
} from '@/validators/updateTicket.schema'

function mapTicketToForm(apiData: any): UpdateTicketFormValues {
  return {
    lenderName: apiData.lender_name || '',
    typeOfLoan: apiData.type_of_loan || '',
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
    lenderRejectionReason: apiData.lender_rejection_reason || '',
    lenderRejectionStatusExplanation:
      apiData.lender_rejection_status_explanation || '',
    partnerCode: apiData.partner_code || '',
  }
}

function mapFormToApi(
  formData: UpdateTicketFormValues,
  dirtyFields: Partial<Record<keyof UpdateDealFormValues, boolean>>,
): any {
  const allFields = {
    account_id: {
      value: formData.accountId ? String(formData.accountId) : null,
      key: 'accountId',
    },
    account_name: { value: formData.accountName, key: 'accountName' },
    ticket_id: {
      value: formData.ticketId ? String(formData.ticketId) : null,
      key: 'ticketId',
    },
    ticket_number: {
      value: formData.ticketNumber ? String(formData.ticketNumber) : null,
      key: 'ticketNumber',
    },
    ticket_stage: { value: formData.caseStage, key: 'caseStage' },
    ticket_status: { value: formData.caseStatus, key: 'caseStatus' },
    deal_type: { value: formData.dealType, key: 'dealType' },
    loan_type: { value: formData.loanType, key: 'loanType' },
    type_of_login: { value: formData.typeOfLogin, key: 'typeOfLogin' },
    type_of_case_login: {
      value: formData.typeOfCaseLogin,
      key: 'typeOfCaseLogin',
    },
    ticket_login: { value: formData.ticketLogin, key: 'ticketLogin' },
    type_of_loan: { value: formData.loanType, key: 'loanType' },
    disbursed_amount: {
      value: formData.disbursedAmount,
      key: 'disbursedAmount',
    },
    partner_code: { value: formData.partnerCode, key: 'partnerCode' }, // Remove parseInt
    sanction_amount: { value: formData.sanctionAmount, key: 'sanctionAmount' },
    lender_login_type: {
      value: formData.lenderLoginType,
      key: 'lenderLoginType',
    },
    approved_amount: { value: formData.approvedAmount, key: 'approvedAmount' },
    amount_required: { value: formData.amountRequired, key: 'amountRequired' },
    processing_fees: { value: formData.processingFees, key: 'processingFees' },
    mm_charges: { value: formData.mmCharges, key: 'mmCharges' },
    insurance_amount: {
      value: formData.insuranceAmount,
      key: 'insuranceAmount',
    },
    pf_percentage: {
      value: formData.pfPercentage ? parseFloat(formData.pfPercentage) : null,
      key: 'pfPercentage',
    },
    rate_of_interest: {
      value: formData.rateOfInterest
        ? parseFloat(formData.rateOfInterest)
        : null,
      key: 'rateOfInterest',
    },
    interest_type: { value: formData.interestType, key: 'interestType' },
    deal_call_back_datetime: {
      value: formData.dealCallBackDatetime,
      key: 'dealCallBackDatetime',
    },
    disbursement_date: {
      value: formData.disbursementDate,
      key: 'disbursementDate',
    },
    lender_login_date: {
      value: formData.lenderLoginDate,
      key: 'lenderLoginDate',
    },
    loan_start_date: { value: formData.loanStartDate, key: 'loanStartDate' },
    loan_end_date: { value: formData.loanEndDate, key: 'loanEndDate' },
    targeted_disbursement_date: {
      value: formData.targetedDisbursementDate,
      key: 'targetedDisbursementDate',
    },
    tenure: {
      value: formData.tenure ? String(formData.tenure) : null,
      key: 'tenure',
    },
    lender_code: { value: formData.lenderCode, key: 'lenderCode' },
    lender_name: { value: formData.lenderName, key: 'lenderName' },
    customer_rejection_reason: {
      value: formData.customerRejectionReason,
      key: 'customerRejectionReason',
    },
    customer_rejection_status_explanation: {
      value: formData.customerRejectionStatusExplanation,
      key: 'customerRejectionStatusExplanation',
    },
    lender_rejection_reason: {
      value: formData.lenderRejectionReason,
      key: 'lenderRejectionReason',
    },
    lender_rejection_status_explanation: {
      value: formData.lenderRejectionStatusExplanation,
      key: 'lenderRejectionStatusExplanation',
    },
    payment_receipt: { value: formData.paymentReceipt, key: 'paymentReceipt' },
    potential: {
      value:
        formData.potential && formData.potential !== ''
          ? parseFloat(String(formData.potential))
          : null,
      key: 'potential',
    },
    product: { value: formData.product, key: 'product' },
  }

  const payload: any = {}

  Object.entries(allFields).forEach(([apiKey, { value, key }]) => {
    // @ts-ignore
    if (dirtyFields[key]) {
      payload[apiKey] = value
    }
  })

  return payload
}

export default function UpdateDeals() {
  const { id } = useParams()
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
  ]

  const isEmailAuthorized = allowedEmails.includes(user?.email!)
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty, dirtyFields },
  } = useForm<UpdateTicketFormValues>({
    resolver: zodResolver(updateTicketSchema),
    defaultValues: {
      createdBy: 'System Driven Field (User)',
      modifiedBy: 'System Driven Field (User)',
    },
  })
  const [lenderSearch, setLenderSearch] = useState('')
  const [lenderOpen, setLenderOpen] = useState(false)

  const filteredLenders =
    lenderSearch.length > 1
      ? LENDER_NAMES.filter((l: string) =>
          l.toLowerCase().includes(lenderSearch.toLowerCase()),
        ).slice(0, 50) // cap at 50 results
      : []

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

  // const dealData: any = dealResponse?.data?.[0] || dealResponse?.data

  const notes = (dealData as any)?.notes || []

  const sortedNotes = [...notes].sort((a: any, b: any) => {
    return (
      new Date(b.Created_Time).getTime() - new Date(a.Created_Time).getTime()
    )
  })

  useEffect(() => {
    if (dealData) {
      reset(mapTicketToForm(dealData))
      setLenderSearch(dealData.lender_name || '')
    }
  }, [dealData, reset])

  const updateMutation = useMutation({
    mutationFn: async (values: UpdateTicketFormValues) => {
      const payload = mapFormToApi(values, dirtyFields)
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.message || 'Failed to update deal')
      }
      return res.json()
    },
    onSuccess: (data, variables) => {
      toast.success('Deal updated successfully')
      setIsEdit(false)
      reset(variables)
      queryClient.invalidateQueries({ queryKey: ['ticket', id] })
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update deal')
    },
  })

  const formValues = watch()

  const onSave = (values: UpdateTicketFormValues) => {
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
          module: 'Tickets',
        }),
      })

      if (res.ok) {
        toast.success('Note added successfully')
        queryClient.invalidateQueries({ queryKey: ['ticket', id] })
      } else {
        toast.error('Failed to add note')
      }
    } catch (err) {
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
        <p className='text-muted-foreground'>Deal not found</p>
      </div>
    )
  }

  const MAX_NOTES_VISIBLE = 3
  const showViewMore = sortedNotes.length > MAX_NOTES_VISIBLE
  const visibleNotes = showViewMore
    ? sortedNotes.slice(0, MAX_NOTES_VISIBLE)
    : sortedNotes

  return (
    <div className='space-y-6 bg-background min-h-screen mb-10'>
      {/* HEADER */}
      <div className='flex justify-between items-center border p-4 rounded-xl bg-card'>
        <div>
          <h1 className='text-lg font-semibold'>
            Deal Owner Name:{' '}
            <span className='text-primary font-bold '>
              {(users as Record<string, string>)[dealData.created_by] || `NA`}
            </span>
          </h1>
          <h1 className='text-lg font-semibold'>
            Deal Id:{' '}
            <span className='text-primary font-bold '>#{dealData.deal_id}</span>
          </h1>
          <h1 className='text-lg font-semibold'>
            Ticket Id:{' '}
            <span className='text-primary font-bold '>#{dealData.id}</span>
          </h1>
        </div>
        <div className='flex items-center gap-2'>
          {/* If not editing AND authorized, show Update */}
          {!isEdit && isEmailAuthorized && (
            <Button
              size='sm'
              className='cursor-pointer'
              onClick={() => setIsEdit(true)}
            >
              Update
            </Button>
          )}

          {/* If editing, show Save and Cancel */}
          {isEdit && (
            <div className='flex gap-2'>
              <Button
                size='sm'
                className='cursor-pointer'
                disabled={!isDirty || updateMutation.isPending}
                onClick={handleSubmit(onSave, (errors) =>
                  console.log('VALIDATION ERRORS:', errors),
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
                  setIsEdit(false)
                }}
              >
                Cancel
              </Button>
            </div>
          )}

          {/* Always show Go to Deal */}
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
            <FieldRow label='Ticket Login' error={errors.ticketLogin?.message}>
              <SelectField
                isEdit={isEdit}
                options={['Approved', 'Disapproved']}
                value={formValues.ticketLogin as string}
                onChange={(value) =>
                  setValue('ticketLogin', value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
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
              label='Lender Login Date'
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
                  onChange={(date) => {
                    setValue(
                      'lenderLoginDate',
                      date ? format(date, 'yyyy-MM-dd') : '',
                      {
                        shouldValidate: true,
                        shouldDirty: true,
                      },
                    )
                  }}
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
              label='Targeted Disbursement date'
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
                  onChange={(date) => {
                    setValue(
                      'targetedDisbursementDate',
                      date ? format(date, 'yyyy-MM-dd') : '',
                      {
                        shouldValidate: true,
                        shouldDirty: true,
                      },
                    )
                  }}
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
                  onChange={(date) => {
                    setValue(
                      'disbursementDate',
                      date ? format(date, 'yyyy-MM-dd') : '',
                      {
                        shouldValidate: true,
                        shouldDirty: true,
                      },
                    )
                  }}
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
          </div>
          <div>
            <FieldRow label='Lender Name' error={errors.lenderName?.message}>
              <div className='relative'>
                {/* Input must be present */}
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
                          setValue('lenderName', name, {
                            shouldValidate: true,
                            shouldDirty: true,
                          })
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
              label='Lender Login Type'
              error={errors.lenderLoginType?.message}
            >
              <SelectField
                isEdit={isEdit}
                options={['Direct', 'Partner']}
                value={formValues.lenderLoginType as string}
                onChange={(value) =>
                  setValue('lenderLoginType', value, {
                    // Update lenderLoginType
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
              />
            </FieldRow>
            <FieldRow label='Partner Code' error={errors.partnerCode?.message}>
              {isEdit ? (
                <Input
                  {...register('partnerCode')}
                  placeholder='Enter Partner Code'
                  className='h-8'
                  // ENABLE only if 'Partner' is selected, otherwise DISABLE
                  disabled={formValues.lenderLoginType !== 'Partner'}
                />
              ) : (
                <span>{formValues.partnerCode || '—'}</span>
              )}
            </FieldRow>
            <FieldRow label='Type of Loan' error={errors.loanType?.message}>
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
                onChange={(value) =>
                  setValue('loanType', value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
              />
            </FieldRow>
            <FieldRow label='Ticket Status' error={errors.loanType?.message}>
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
                  setValue('ticketStatus', value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
              />
            </FieldRow>
            <FieldRow label='Ticket Stage' error={errors.loanType?.message}>
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
                onChange={(value) =>
                  setValue('ticketStage', value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
              />
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
                <span>
                  {formatAmount(Number(formValues.approvedAmount)) || '—'}
                </span>
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
                <span>
                  {formatAmount(Number(formValues.processingFees)) || '—'}
                </span>
              )}
            </FieldRow>
            <FieldRow
              label='PF percentage'
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
                <span>
                  {formatAmount(Number(formValues.insuranceAmount)) || '—'}
                </span>
              )}
            </FieldRow>
            <FieldRow
              label='Rate of Interest'
              error={errors.rateOfInterest?.message}
            >
              {isEdit ? (
                <Input
                  {...register('rateOfInterest')}
                  placeholder='Rate Of Interest'
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
                  setValue('interestType', value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
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
                <span>
                  {formatAmount(Number(formValues.sanctionAmount)) || '—'}
                </span>
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
                <span>
                  {formatAmount(Number(formValues.disbursedAmount)) || '—'}
                </span>
              )}
            </FieldRow>
            <FieldRow label='Tenure' error={errors.tenure?.message}>
              {isEdit ? (
                <Input
                  {...register('tenure')}
                  placeholder='Tenure'
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
                  onChange={(date) => {
                    setValue(
                      'loanStartDate',
                      date ? format(date, 'yyyy-MM-dd') : '',
                      {
                        shouldValidate: true,
                        shouldDirty: true,
                      },
                    )
                  }}
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
                  onChange={(date) => {
                    setValue(
                      'loanEndDate',
                      date ? format(date, 'yyyy-MM-dd') : '',
                      {
                        shouldValidate: true,
                        shouldDirty: true,
                      },
                    )
                  }}
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
                  setValue('lenderRejectionReason', value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
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
                            <div className='font-bold'>
                              Module : {note.module}
                            </div>
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
                  <div className='font-bold'>Module : {note.module}</div>
                </div>
              </div>
            ))
          )}

          <NoteDialog onAddNote={handleAddNote} />
        </CardContent>
      </Card>
    </div>
  )
}
