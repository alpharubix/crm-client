import React, { useEffect, useState } from 'react'
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

import {
  updateDealSchema,
  type UpdateDealFormValues,
} from '@/validators/updateDeal.schema'
import { formatExactDate } from '@/utils/date-formatter'
import { formatAmount } from '@/utils/number-formatter'
import { format } from 'date-fns'
import DocumentationSection from './deals-documentation'
import { Plus } from 'lucide-react'
import LENDER_NAMES from '@/utils/lenders.json'
import { useAuth } from '@/context/auth-context'

function mapDealToForm(apiData: any): UpdateDealFormValues {
  return {
    accountId: apiData.account_id ? String(apiData.account_id) : '',
    accountName: apiData.account_name || '',
    ticketId: apiData.ticket_id ? String(apiData.ticket_id) : '',
    ticketNumber: apiData.ticket_number ? String(apiData.ticket_number) : '',
    dealType: apiData.deal_type || '',
    loanType: apiData.loan_type || '',
    typeOfLogin: apiData.type_of_login || '',
    typeOfCaseLogin: apiData.type_of_case_login || '',
    ticketLogin: apiData.ticket_login || '',
    dealStage: apiData.deal_stage || '',
    dealStatus: apiData.deal_status || '',
    dealExpectedClosing: apiData.deal_expected_closing || '',
    dealStatusClosing: apiData.deal_status_closing || '',
    lenderLoginType: apiData.lender_login_type || '',
    partnerCode: apiData.partner_code || '',
    disbursedAmount:
      apiData.disbursed_amount !== null &&
      apiData.disbursed_amount !== undefined
        ? String(apiData.disbursed_amount)
        : '',
    sanctionAmount:
      apiData.sanction_amount !== null && apiData.sanction_amount !== undefined
        ? String(apiData.sanction_amount)
        : '',
    approvedAmount:
      apiData.approved_amount !== null && apiData.approved_amount !== undefined
        ? String(apiData.approved_amount)
        : '',
    amountRequired:
      apiData.amount_required !== null && apiData.amount_required !== undefined
        ? String(apiData.amount_required)
        : '',
    processingFees:
      apiData.processing_fees !== null && apiData.processing_fees !== undefined
        ? String(apiData.processing_fees)
        : '',
    mmCharges:
      apiData.mm_charges !== null && apiData.mm_charges !== undefined
        ? String(apiData.mm_charges)
        : '',
    insuranceAmount:
      apiData.insurance_amount !== null &&
      apiData.insurance_amount !== undefined
        ? String(apiData.insurance_amount)
        : '',
    pfPercentage:
      apiData.pf_percentage !== null && apiData.pf_percentage !== undefined
        ? String(apiData.pf_percentage)
        : '',
    rateOfInterest:
      apiData.rate_of_interest !== null &&
      apiData.rate_of_interest !== undefined
        ? String(apiData.rate_of_interest)
        : '',
    interestType: apiData.interest_type || '',
    dealCallBackDatetime: apiData.deal_call_back_datetime || '',
    disbursementDate: apiData.disbursement_date || '',
    lenderLoginDate: apiData.lender_login_date || '',
    loanStartDate: apiData.loan_start_date || '',
    loanEndDate: apiData.loan_end_date || '',
    targetedDisbursementDate: apiData.targeted_disbursement_date || '',
    tenure:
      apiData.tenure !== null && apiData.tenure !== undefined
        ? String(apiData.tenure)
        : '',
    lenderCode: apiData.lender_code || '',
    lenderName: apiData.lender_name || '',
    customerRejectionReason: apiData.customer_rejection_reason || '',
    customerRejectionStatusExplanation:
      apiData.customer_rejection_status_explanation || '',
    lenderRejectionReason: apiData.lender_rejection_reason || '',
    lenderRejectionStatusExplanation:
      apiData.lender_rejection_status_explanation || '',
    paymentReceipt: apiData.payment_receipt || '',
    potential: apiData.potential || '',
    product: apiData.product || '',
    createdBy: apiData.created_by || 'System Driven Field',
    createdAt: apiData.created_at || 'System Driven Field',
    modifiedBy: apiData.modified_by || 'System Driven Field',
  }
}

function mapFormToApi(
  formData: UpdateDealFormValues,
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
    deal_type: { value: formData.dealType, key: 'dealType' },
    loan_type: { value: formData.loanType, key: 'loanType' },
    lender_login_type: {
      value: formData.lenderLoginType,
      key: 'lenderLoginType',
    },
    partner_code: { value: formData.partnerCode, key: 'partnerCode' },
    deal_expected_closing: {
      value: formData.dealExpectedClosing,
      key: 'dealExpectedClosing',
    },
    deal_status_closing: {
      value: formData.dealStatusClosing,
      key: 'dealStatusClosing',
    },
    type_of_login: { value: formData.typeOfLogin, key: 'typeOfLogin' },
    type_of_case_login: {
      value: formData.typeOfCaseLogin,
      key: 'typeOfCaseLogin',
    },
    ticket_login: { value: formData.ticketLogin, key: 'ticketLogin' },
    deal_stage: { value: formData.dealStage, key: 'dealStage' },
    deal_status: { value: formData.dealStatus, key: 'dealStatus' },
    disbursed_amount: {
      value: formData.disbursedAmount,
      key: 'disbursedAmount',
    },
    sanction_amount: { value: formData.sanctionAmount, key: 'sanctionAmount' },
    approved_amount: { value: formData.approvedAmount, key: 'approvedAmount' },
    amount_required: { value: formData.amountRequired, key: 'amountRequired' },
    processing_fees: { value: formData.processingFees, key: 'processingFees' },
    mm_charges: { value: formData.mmCharges, key: 'mmCharges' },
    insurance_amount: {
      value: formData.insuranceAmount,
      key: 'insuranceAmount',
    },
    pf_percentage: { value: formData.pfPercentage, key: 'pfPercentage' },
    rate_of_interest: { value: formData.rateOfInterest, key: 'rateOfInterest' },
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
    potential: { value: formData.potential, key: 'potential' },
    product: { value: formData.product, key: 'product' },
    created_at: { value: formData.createdAt, key: 'createdAt' },
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
  } = useForm<UpdateDealFormValues>({
    resolver: zodResolver(updateDealSchema),
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
    React.useCallback(
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
    data: dealResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['deal', id],
    queryFn: async () => {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/deals?deal_id=${id}`,
        { credentials: 'include' },
      )
      if (!res.ok) throw new Error('Failed to fetch deal')
      return res.json()
    },
    enabled: !!id,
  })

  const dealData: Deal = dealResponse?.data?.[0] || dealResponse?.data
  const notes = (dealData as any)?.notes || []

  const revenues = (dealData as any)?.revenue || []

  const sortedNotes = [...notes].sort((a: any, b: any) => {
    return (
      new Date(b.Created_Time).getTime() - new Date(a.Created_Time).getTime()
    )
  })

  useEffect(() => {
    if (dealData) {
      reset(mapDealToForm(dealData))
      setLenderSearch(dealData.lender_name || '')
    }
  }, [dealData, reset])

  const updateMutation = useMutation({
    mutationFn: async (values: UpdateDealFormValues) => {
      const payload = mapFormToApi(values, dirtyFields)
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/deals/${id}`, {
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
      queryClient.invalidateQueries({ queryKey: ['deal', id] })
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to update deal')
    },
  })

  const formValues = watch()

  const onSave = (values: UpdateDealFormValues) => {
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
          module: 'Deals',
        }),
      })

      if (res.ok) {
        toast.success('Note added successfully')
        queryClient.invalidateQueries({ queryKey: ['deal', id] })
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
            Deal Name:{' '}
            <span className='text-primary font-bold '>
              {dealData.account_name || `#${dealData.id}`}
            </span>{' '}
            <span className='text-primary font-bold '>{`#${dealData.id}`}</span>
          </h1>
          <h1 className='text-lg font-semibold'>
            Deal Owner Name:{' '}
            <span className='text-primary font-bold '>
              {(users as Record<string, string>)[dealData.deal_owner_id] ||
                `#${dealData.id}`}
            </span>
          </h1>
        </div>
        <div className='flex items-center gap-2'>
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
                  setLenderSearch(dealData?.lender_name || '')
                  setIsEdit(false)
                }}
              >
                Cancel
              </Button>
            </div>
          )}
          <Button
            variant='default'
            onClick={() => navigate(`/accounts/${dealData.account_id}`)}
            className='ml-2'
          >
            Go to Accounts
          </Button>
        </div>
      </div>

      <Card className='overflow-hidden space-y-1'>
        {/* ================= Lender Login Information ================= */}
        <SectionHeader title='Lender Login Information' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2 border-b'>
          <div className='md:border-r'>
            <FieldRow label='Deal Type' error={errors.dealType?.message}>
              <SelectField
                isEdit={isEdit}
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
              {isEdit ? (
                <DateField
                  isEdit={isEdit}
                  showTime={true}
                  value={
                    formValues.dealCallBackDatetime
                      ? new Date(formValues.dealCallBackDatetime)
                      : undefined
                  }
                  onChange={(date) => {
                    setValue(
                      'dealCallBackDatetime',
                      date ? date.toISOString() : '',
                      {
                        shouldValidate: true,
                        shouldDirty: true,
                      },
                    )
                  }}
                  disablePast={true}
                />
              ) : (
                <span>
                  {formValues.dealCallBackDatetime
                    ? formatExactDate(
                        formValues.dealCallBackDatetime,
                        'dd MMM yyyy, hh:mm a',
                      )
                    : '—'}
                </span>
              )}
            </FieldRow>
            <FieldRow
              label='Amount Required'
              error={errors.amountRequired?.message}
            >
              {isEdit ? (
                <Input
                  {...register('amountRequired')}
                  placeholder='Amount Required'
                  type='number'
                  step='0.01'
                  className='h-8'
                />
              ) : (
                <span>
                  {formatAmount(Number(formValues.amountRequired)) || '—'}
                </span>
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
            <FieldRow label='Created By'>
              <span>
                {(users as Record<string, string>)[
                  formValues.createdBy as string
                ] ||
                  formValues.createdBy ||
                  '—'}
              </span>
            </FieldRow>
            <FieldRow label='Modified By'>
              <span>
                {(users as Record<string, string>)[
                  formValues.modifiedBy as string
                ] ||
                  formValues.modifiedBy ||
                  '—'}
              </span>
            </FieldRow>
            <FieldRow label='Created At'>
              <span>
                {formValues.createdAt
                  ? formatExactDate(
                      formValues.createdAt,
                      'dd MMM yyyy, hh:mm a',
                    )
                  : '—'}
              </span>
            </FieldRow>
          </div>
          <div>
            <FieldRow label='Account Name'>
              <span>{dealData.account_name || '—'}</span>
            </FieldRow>
            <FieldRow label='Deal Name'>
              <span>{dealData.account_name || '—'}</span>
            </FieldRow>
            <FieldRow label='Deal Status' error={errors.dealStatus?.message}>
              <SelectField
                isEdit={isEdit}
                options={[
                  'Deal Created',
                  'Lender Review',
                  'Lender Rejected',
                  'Achievement',
                  'Not Interested',
                ]}
                value={formValues.dealStatus as string}
                onChange={(value) => {
                  setValue('dealStatus', value, {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                  // AUTO CAPTURE CURRENT DATE
                  setValue(
                    'dealStatusClosing',
                    new Date().toISOString().split('T')[0],
                    { shouldDirty: true },
                  )
                }}
              />
            </FieldRow>
            <FieldRow label='Deal Stage' error={errors.dealStage?.message}>
              <SelectField
                isEdit={isEdit}
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
            <FieldRow label='Lender Name' error={errors.lenderName?.message}>
              <div className='relative'>
                {isEdit ? (
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
                ) : (
                  <span>{formValues.lenderName || '—'}</span>
                )}
                {lenderOpen && filteredLenders.length > 0 && (
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
                value={(formValues.lenderLoginType as string) || '—'}
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
                  placeholder='Partner Code'
                  className='h-8'
                  // Field is editable ONLY if lenderLoginType is Partner
                  disabled={formValues.lenderLoginType !== 'Partner'}
                />
              ) : (
                /* This span displays the value in Read-Only mode */
                <span>{formValues.partnerCode || '—'}</span>
              )}
            </FieldRow>
            <FieldRow label='Deal Status Closing'>
              <span className='text-sm font-medium text-muted-foreground'>
                {formValues.dealStatusClosing
                  ? formatExactDate(formValues.dealStatusClosing, 'dd MMM yyyy')
                  : 'No change recorded'}
              </span>
            </FieldRow>
            <FieldRow
              label='Expected Closing Date *'
              error={errors.dealExpectedClosing?.message}
            >
              <DateField
                isEdit={isEdit}
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
        </CardContent>

        <SectionHeader title='Funding & Commercials' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2 border-b'>
          <div className='md:border-r'>
            <FieldRow label='MM Charges' error={errors.mmCharges?.message}>
              {isEdit ? (
                <Input
                  {...register('mmCharges')}
                  placeholder='MM Charges'
                  type='number'
                  step='0.01'
                  className='h-8'
                />
              ) : (
                <span>{formatAmount(Number(formValues.mmCharges)) || '—'}</span>
              )}
            </FieldRow>
          </div>
          <div>
            <FieldRow label='Sanction Letter'>
              <a
                href={dealData.sanction_letter}
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary text-xs truncate block hover:underline'
              >
                <span className='text-sm text-blue-600'>
                  {dealData.sanction_letter || '—'}
                </span>
              </a>
            </FieldRow>
            <FieldRow
              label='Payment Receipt'
              error={errors.paymentReceipt?.message}
            >
              <span>—</span>
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

        {/* ================= Linked Tickets ================= */}
        <SectionHeader title='Linked Tickets' />
        <CardContent className='p-4 space-y-3 border-b'>
          <div className='flex items-center justify-between mb-2'>
            <p className='text-sm text-muted-foreground'>
              Total Tickets:{' '}
              <span className='font-semibold'>
                {(dealData as any)?.tickets?.length || 0}
              </span>
            </p>
            {isEmailAuthorized && (
              <Button
                size='sm'
                variant='outline'
                className='cursor-pointer'
                onClick={() =>
                  navigate(`/deals/${id}/tickets/create`, {
                    state: {
                      accountId: dealData?.account_id,
                      accountName: dealData?.account_name,
                    },
                  })
                }
              >
                <Plus className='h-4 w-4 mr-1' /> Add Ticket
              </Button>
            )}
          </div>

          {!(dealData as any)?.tickets ||
          (dealData as any).tickets.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              No tickets associated with this deal.
            </p>
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
              {(dealData as any).tickets.map((ticket: any) => (
                <div
                  key={ticket.id}
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                  className='bg-muted/30 p-3 rounded-lg border hover:border-primary hover:bg-muted/50 transition-all cursor-pointer group'
                >
                  <div className='flex justify-between items-start mb-2'>
                    <span className='text-xs font-bold text-primary'>
                      #{ticket.id}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${
                        ticket.ticket_status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-zinc-200 text-zinc-700'
                      }`}
                    >
                      {ticket.ticket_status || 'N/A'}
                    </span>
                  </div>
                  <p className='text-sm font-semibold truncate'>
                    {ticket.lender_name || 'No Lender'}
                  </p>
                  <div className='flex flex-col mt-2 gap-1 text-[11px] text-muted-foreground uppercase'>
                    <span>Type: {ticket.type_of_loan || '—'}</span>
                    <span>Stage: {ticket.ticket_stage || '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        <SectionHeader title='Revenue' />
        <CardContent className='p-4 space-y-3 border-b'>
          <div className='flex items-center justify-between mb-2'>
            <p className='text-sm text-muted-foreground'>
              Total Revenue:{' '}
              <span className='font-semibold'>{revenues.length || 0}</span>
            </p>
            <Button
              variant='outline'
              size='sm'
              onClick={() =>
                navigate(`/revenue-create`, {
                  state: {
                    dealId: id,
                    accountName: dealData.account_name,
                    lenderName: dealData.lender_name,
                  },
                })
              }
            >
              <Plus className='h-4 w-4 mr-2' />
              Add Revenue
            </Button>
          </div>

          {revenues.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              No revenues associated with this deal.
            </p>
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'>
              {revenues.map((revenue: any) => (
                <div
                  key={revenue.id}
                  onClick={() => navigate(`/revenue/${revenue.id}`)}
                  className='bg-muted/30 p-3 rounded-lg border hover:border-primary hover:bg-muted/50 transition-all cursor-pointer group'
                >
                  <div className='flex justify-between items-start mb-2'>
                    <span className='text-[13px] py-0.5 rounded-full uppercase font-bold '>
                      {revenue.account_name || 'N/A'}
                    </span>
                  </div>
                  <div className='flex flex-col mt-2 gap-1 text-[11px] text-muted-foreground uppercase'>
                    <span>
                      Owner:{' '}
                      {(users as Record<string, string>)[revenue.owner_id] ||
                        '—'}
                    </span>
                    <span>Lender Name: {revenue.lender_name || '—'}</span>
                    <span>
                      Type of revenue: {revenue.type_of_revenue || '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
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

          <DocumentationSection dealId={id!} />
        </CardContent>
      </Card>
    </div>
  )
}
