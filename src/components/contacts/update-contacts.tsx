import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useBeforeUnload, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

import SectionHeader from '@/components/shared/section-header'
import FieldRow from '@/components/shared/field-row'
import SelectField from '@/components/shared/select-field'
import NoteDialog from '@/components/shared/note-dialog'
import { Spinner } from '@/components/ui/spinner'
import { useNavigate } from 'react-router-dom'

import {
  updateContactSchema,
  type UpdateContactFormValues,
} from '@/validators/updateContact.schema'
import { ENV } from '@/conf'
import { formatExactDate } from '@/utils/date-formatter'
import users from '@/utils/users.json'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { NestedComments } from '../nested-notes'

function resolveUserName(userObj: any, userId: any): string {
  if (userObj && typeof userObj === 'object' && userObj.full_name) {
    return userObj.full_name
  }
  const id = userId || (userObj && typeof userObj !== 'object' ? userObj : '')
  if (id) {
    const matched = (users as Record<string, string>)[String(id)]
    if (matched) return matched
    return String(id)
  }
  return ''
}

function mapContactToForm(apiData: any): UpdateContactFormValues {
  return {
    firstName: apiData.first_name || '',
    lastName: apiData.last_name || '',
    leadSource: apiData.lead_source || '',
    designation: apiData.designation || '',
    mobile: apiData.mobile || '',
    phone: apiData.phone || '',
    accountName: apiData.parent_account?.account_name || '',
    email: apiData.email || '',
    secondaryEmail: apiData.secondary_email || '',
    createdBy: resolveUserName(apiData.created_by, apiData.created_by_id),
    modifiedBy: resolveUserName(apiData.modified_by, apiData.modified_by_id),
    street: apiData.street || '',
    state: apiData.state || '',
    pincode: apiData.pincode || '',
    city: apiData.city || '',
    country: apiData.country || 'India',
  }
}

// Map form values to API payload
function mapFormToApi(
  formData: UpdateContactFormValues,
  dirtyFields: Partial<Record<keyof UpdateContactFormValues, boolean>>,
): any {
  const allFields = {
    first_name: { value: formData.firstName, key: 'firstName' },
    last_name: { value: formData.lastName, key: 'lastName' },
    designation: { value: formData.designation, key: 'designation' },
    email: { value: formData.email, key: 'email' },
    secondary_email: { value: formData.secondaryEmail, key: 'secondaryEmail' },
    mobile: { value: formData.mobile, key: 'mobile' },
    phone: { value: formData.phone, key: 'phone' },
    lead_source: { value: formData.leadSource, key: 'leadSource' },
    street: { value: formData.street, key: 'street' },
    city: { value: formData.city, key: 'city' },
    state: { value: formData.state, key: 'state' },
    country: { value: formData.country, key: 'country' },
    pincode: { value: formData.pincode, key: 'pincode' },
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

export default function UpdateContacts({
  contactIdProp,
  onBack,
}: {
  contactIdProp?: string | number
  onBack?: () => void
} = {}) {
  const params = useParams()
  const id = contactIdProp !== undefined ? String(contactIdProp) : params.id
  const queryClient = useQueryClient()
  const [isEdit, setIsEdit] = useState(false)
  const [openAllNotes, setOpenAllNotes] = useState(false)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty, dirtyFields },
  } = useForm<UpdateContactFormValues>({
    resolver: zodResolver(updateContactSchema),
    defaultValues: {
      leadSource: '',
      createdBy: 'System Driven Field (User)',
      modifiedBy: 'System Driven Field (User)',
      country: 'India',
    },
  })

  const {
    data: apiResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['contact', id],
    queryFn: async () => {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/contacts?contact_id=${id}`,
        { credentials: 'include' },
      )
      if (!res.ok) throw new Error('Failed to fetch contact')
      return res.json()
    },
    enabled: !!id,
  })

  const contactData = apiResponse?.data?.[0]
  const userName = contactData?.contact_owner?.full_name
  const accountId = contactData?.parent_account?.id
  // console.log(accountId)

  const notes = contactData?.notes || []

  const sortedNotes = [...notes].sort((a: any, b: any) => {
    return (
      new Date(b.Created_Time).getTime() - new Date(a.Created_Time).getTime()
    )
  })

  useEffect(() => {
    if (contactData) {
      reset(mapContactToForm(contactData))
    }
  }, [contactData, reset])

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (values: UpdateContactFormValues) => {
      const payload = mapFormToApi(values, dirtyFields)
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/contacts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to update contact')
      return res.json()
    },
    onSuccess: (data, variables) => {
      toast.success('Contact updated successfully')
      setIsEdit(false)
      reset(variables) // Reset with submitted values to clear dirty state
      queryClient.invalidateQueries({ queryKey: ['contact', id] })
    },
    onError: () => {
      toast.error('Failed to update contact')
    },
  })

  // Warn on browser close/refresh if dirty
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

  const data = watch()

  const onSave = (values: UpdateContactFormValues) => {
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
          module: 'Contacts',
        }),
      })

      if (res.ok) {
        toast.success('Note added successfully')
        queryClient.invalidateQueries({ queryKey: ['contact', id] })
      } else {
        toast.error('Failed to add note')
      }
    } catch (err) {
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

  if (error || (apiResponse && !contactData)) {
    return <div className='p-4'>Contact not found</div>
  }

  const MAX_NOTES_VISIBLE = 3
  const showViewMore = sortedNotes.length > MAX_NOTES_VISIBLE
  const visibleNotes = showViewMore
    ? sortedNotes.slice(0, MAX_NOTES_VISIBLE)
    : sortedNotes

  return (
    <div className='space-y-6 mx-2 bg-background min-h-screen'>
      {/* HEADER */}
      <div className='flex justify-between items-center border p-4 rounded-xl bg-card'>
        <div>
          <h1 className='text-lg font-semibold'>
            Account Name:{' '}
            <span className='text-primary font-bold'>{data.accountName}</span>
          </h1>
          <h1 className='text-lg font-semibold'>
            Contact Owner:{' '}
            <span className='text-primary font-bold'>{userName}</span>
          </h1>
        </div>
        <div className='flex items-center gap-2'>
          {onBack && (
            <Button size='sm' variant='outline' onClick={onBack}>
              ← Back
            </Button>
          )}
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
          <Button
            className='cursor-pointer'
            onClick={() => navigate(`/accounts/${accountId}`)}
          >
            Go To Account Information
          </Button>
        </div>
      </div>

      <Card className='overflow-hidden space-y-1'>
        {/* ================= Contact Information ================= */}
        <SectionHeader title='Contact Information' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2'>
          <div className='md:border-r'>
            <FieldRow label='First Name' error={errors.firstName?.message}>
              {isEdit ? (
                <Input {...register('firstName')} className='h-8' />
              ) : (
                <span>{data.firstName || '—'}</span>
              )}
            </FieldRow>

            <FieldRow label='Lead Source' error={errors.leadSource?.message}>
              <SelectField
                value={data.leadSource}
                isEdit={isEdit}
                options={[
                  'Himalaya',
                  'CavinKare',
                  'ALL INDIA CHEMISTS AND DRUGGISTS ASSOCIATION OF INDIA',
                  'All India Hardware Association (Based in Mumbai Charni Road)',
                  'Alpharubix',
                  'Condor Footwear',
                  'DVG Dist Petroleum',
                  'Federation of Hotel and Restaurant Association of India (Based in New Delhi)',
                  'Havells',
                  'Liberty',
                  'Marico',
                  'Reference',
                  'Retail Association of India',
                  'SME CHAMBER',
                  'Swastik',
                  'Unicharm',
                  'Vibhava Marketing',
                  'R1X Website',
                ]}
                onChange={(v) =>
                  setValue('leadSource', v, { shouldDirty: true })
                }
              />
            </FieldRow>

            <FieldRow label='Mobile' error={errors.mobile?.message}>
              {isEdit ? (
                <Input {...register('mobile')} className='h-8' />
              ) : (
                <span>{data.mobile || '—'}</span>
              )}
            </FieldRow>

            <FieldRow label='Phone' error={errors.phone?.message}>
              {isEdit ? (
                <Input {...register('phone')} className='h-8' />
              ) : (
                <span>{data.phone || '—'}</span>
              )}
            </FieldRow>

            <FieldRow label='Created By'>
              <span>{data.createdBy}</span>
            </FieldRow>

            <FieldRow label='Modified By'>
              <span>{data.modifiedBy}</span>
            </FieldRow>
          </div>

          <div>
            <FieldRow label='Last Name' error={errors.lastName?.message}>
              {isEdit ? (
                <Input {...register('lastName')} className='h-8' />
              ) : (
                <span>{data.lastName || '—'}</span>
              )}
            </FieldRow>

            <FieldRow label='Designation'>
              {isEdit ? (
                <Input {...register('designation')} className='h-8' />
              ) : (
                <span>{data.designation || '—'}</span>
              )}
            </FieldRow>

            <FieldRow label='Account Name'>
              <span>{data.accountName || '—'}</span>
            </FieldRow>

            <FieldRow label='Email' error={errors.email?.message}>
              {isEdit ? (
                <Input {...register('email')} className='h-8' />
              ) : (
                <span>{data.email || '—'}</span>
              )}
            </FieldRow>

            <FieldRow
              label='Secondary Email'
              error={errors.secondaryEmail?.message}
            >
              {isEdit ? (
                <Input {...register('secondaryEmail')} className='h-8' />
              ) : (
                <span>{data.secondaryEmail || '—'}</span>
              )}
            </FieldRow>
          </div>
        </CardContent>

        {/* ================= Address Information ================= */}
        <SectionHeader title='Address Information' />
        <CardContent className='p-0 grid grid-cols-1 md:grid-cols-2 border-b'>
          <div className='md:border-r'>
            <FieldRow label='Street'>
              {isEdit ? (
                <Input {...register('street')} className='h-8' />
              ) : (
                <span>{data.street || '—'}</span>
              )}
            </FieldRow>
            <FieldRow label='State'>
              {isEdit ? (
                <Input {...register('state')} className='h-8' />
              ) : (
                <span>{data.state || '—'}</span>
              )}
            </FieldRow>
            <FieldRow label='Pincode'>
              {isEdit ? (
                <Input {...register('pincode')} className='h-8' />
              ) : (
                <span>{data.pincode || '—'}</span>
              )}
            </FieldRow>
          </div>

          <div>
            <FieldRow label='City'>
              {isEdit ? (
                <Input {...register('city')} className='h-8' />
              ) : (
                <span>{data.city || '—'}</span>
              )}
            </FieldRow>
            <FieldRow label='Country'>
              {isEdit ? (
                <Input {...register('country')} className='h-8' />
              ) : (
                <span>{data.country || '—'}</span>
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
        </CardContent> */}
        <NestedComments />
      </Card>
    </div>
  )
}
