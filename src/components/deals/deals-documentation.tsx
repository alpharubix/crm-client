import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { CardContent } from '@/components/ui/card'
import SectionHeader from '@/components/shared/section-header'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import SelectField from '../shared/select-field'
import { Input } from '../ui/input'
import { ENV } from '@/conf'
import users from '@/utils/users.json'
import { formatExactDate } from '@/utils/date-formatter'
import { toast } from 'sonner'
import DateField from '../shared/date-field'
import { Plus, Loader2, ExternalLink } from 'lucide-react'

const STATUS_OPTIONS = ['Completed', 'Pending', 'In Progress', 'On Hold']
const MODULE_OPTIONS = [
  'Banking',
  'GST',
  'KYC',
  'ITR',
  'Ledger',
  'Credit Bureau',
  'Others',
]

const MODULE_DOCUMENT_MAP: Record<string, string[]> = {
  Banking: ['Bank Statement', 'Sanction Letter', 'Loan SOA'],
  GST: ['GST Certificate', 'GST 3B'],
  ITR: ['ITR ACK', 'ITR', '3CB & 3CD', 'Prov ITR'],
  Ledger: ['Anchor Ledger'],
  'Credit Bureau': ['Credit Report'],
}

type DocRow = {
  id?: string
  module: string
  description: string
  from_date: string
  to_date: string
  status: string
  link: string
  created_by?: string
  modified_by?: string
  created_at?: string
  updated_at?: string
  _tempId?: string
  _isNew?: boolean
  _isCustomDesc?: boolean
}

export default function DocumentationSection({ dealId }: { dealId: string }) {
  const queryClient = useQueryClient()
  const [isEdit, setIsEdit] = useState(false)
  const [localRows, setLocalRows] = useState<DocRow[]>([])
  const [editedRows, setEditedRows] = useState<Record<string, DocRow>>({})

  const { data, isLoading } = useQuery({
    queryKey: ['deal-documents', dealId],
    queryFn: async () => {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/deals/${dealId}/documents`,
        {
          credentials: 'include',
        },
      )
      if (!res.ok) throw new Error('Failed to fetch documents')
      return res.json()
    },
    enabled: !!dealId,
  })

  const docs: DocRow[] = data?.data ?? []

  const createMutation = useMutation({
    mutationFn: async (row: DocRow) => {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/deals/${dealId}/documents`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            module: row.module,
            description: row.description,
            from_date: row.from_date,
            to_date: row.to_date,
            status: row.status,
            link: row.link,
          }),
        },
      )
      if (!res.ok) throw new Error('Failed to create')
      return res.json()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, row }: { id: string; row: DocRow }) => {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/deals/${dealId}/documents/${id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            module: row.module,
            description: row.description,
            from_date: row.from_date,
            to_date: row.to_date,
            status: row.status,
            link: row.link,
          }),
        },
      )
      if (!res.ok) throw new Error('Failed to update')
      return res.json()
    },
  })

  function updateExistingCell(
    id: string,
    key: keyof DocRow,
    value: string | boolean,
  ) {
    setEditedRows((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || docs.find((d) => d.id === id)!), [key]: value },
    }))
  }

  function updateNewCell(
    tempId: string,
    key: keyof DocRow,
    value: string | boolean,
  ) {
    setLocalRows((prev) =>
      prev.map((r) => (r._tempId === tempId ? { ...r, [key]: value } : r)),
    )
  }

  function addRow() {
    const newRow: DocRow = {
      _tempId: `new-${Date.now()}-${Math.random()}`,
      module: 'Banking',
      description: '',
      from_date: '',
      to_date: '',
      status: 'Pending',
      link: '',
      _isNew: true,
    }
    setLocalRows((prev) => [...prev, newRow])
    if (!isEdit) setIsEdit(true)
  }

  async function handleSave() {
    const newRows = localRows.filter((r) => r._isNew)
    const allRows = [...docs.map((d) => editedRows[d.id!] || d), ...newRows]

    const invalidModule = allRows.some((r) => !r.module)
    if (invalidModule) {
      toast.error('Module is required for all rows')
      return
    }

    const invalidDescription = allRows.some(
      (r) => !r.description || !r.description.trim(),
    )
    if (invalidDescription) {
      toast.error('Description is required for all rows')
      return
    }

    try {
      // save new rows
      for (const row of newRows) {
        await createMutation.mutateAsync(row)
      }
      // save edited existing rows
      for (const [id, row] of Object.entries(editedRows)) {
        await updateMutation.mutateAsync({ id, row })
      }
      queryClient.invalidateQueries({ queryKey: ['deal-documents', dealId] })
      setLocalRows([])
      setEditedRows({})
      setIsEdit(false)
      toast.success('Documents saved successfully')
    } catch {
      toast.error('Failed to save documents')
    }
  }

  function handleCancel() {
    setLocalRows([])
    setEditedRows({})
    setIsEdit(false)
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <>
      <SectionHeader title='Documentation' />
      <CardContent className='p-0'>
        <div className='flex items-center justify-between p-3 border-b bg-muted/20'>
          <div className='text-xs text-muted-foreground font-medium flex items-center gap-2'>
            <span>
              {docs.length} document{docs.length === 1 ? '' : 's'} recorded
            </span>
            {localRows.length > 0 && (
              <span className='text-amber-600 font-semibold bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded text-[11px]'>
                {localRows.length} unsaved new
              </span>
            )}
          </div>
          <div className='flex items-center gap-2'>
            {!isEdit ? (
              <Button
                size='sm'
                variant='outline'
                className='cursor-pointer h-8'
                onClick={() => setIsEdit(true)}
              >
                Update
              </Button>
            ) : (
              <>
                <Button
                  size='sm'
                  className='cursor-pointer h-8'
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving && (
                    <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin' />
                  )}
                  Save
                </Button>
                <Button
                  size='sm'
                  variant='outline'
                  className='cursor-pointer h-8'
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
              </>
            )}
            <Button
              size='sm'
              variant={isEdit ? 'secondary' : 'default'}
              className='cursor-pointer h-8'
              onClick={addRow}
              disabled={isSaving}
            >
              <Plus className='h-3.5 w-3.5 mr-1' /> Add Row
            </Button>
          </div>
        </div>

        <div className='overflow-x-auto'>
          <Table>
            <TableHeader className='bg-muted/50 text-xs text-muted-foreground uppercase tracking-wide'>
              <TableRow>
                <TableHead className='px-3 py-2 border-b min-w-[140px]'>
                  Module *
                </TableHead>
                <TableHead className='px-3 py-2 border-b min-w-[200px]'>
                  Description *
                </TableHead>
                <TableHead className='px-3 py-2 border-b min-w-[170px] whitespace-nowrap'>
                  From
                </TableHead>
                <TableHead className='px-3 py-2 border-b min-w-[170px] whitespace-nowrap'>
                  To
                </TableHead>
                <TableHead className='px-3 py-2 border-b min-w-[140px]'>
                  Status
                </TableHead>
                <TableHead className='px-3 py-2 border-b min-w-[160px]'>
                  Link
                </TableHead>
                <TableHead className='px-3 py-2 border-b min-w-[150px] whitespace-nowrap'>
                  Created At
                </TableHead>
                <TableHead className='px-3 py-2 border-b min-w-[150px] whitespace-nowrap'>
                  Updated At
                </TableHead>
                <TableHead className='px-3 py-2 border-b min-w-[130px] whitespace-nowrap'>
                  Created By
                </TableHead>
                <TableHead className='px-3 py-2 border-b min-w-[130px] whitespace-nowrap'>
                  Modified By
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className='text-center text-xs text-muted-foreground py-8'
                  >
                    <Loader2 className='h-5 w-5 animate-spin mx-auto mb-2 text-muted-foreground' />
                    Loading documents...
                  </TableCell>
                </TableRow>
              ) : docs.length === 0 && localRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className='text-center text-xs text-muted-foreground py-8'
                  >
                    No documents uploaded yet. Click "+ Add Row" to add one.
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {/* Existing rows from API */}
                  {docs.map((doc) => {
                    const row = editedRows[doc.id!] || doc
                    const descOptions = MODULE_DOCUMENT_MAP[row.module] || []
                    const hasPresets = descOptions.length > 0
                    const isCustomDesc =
                      row._isCustomDesc ??
                      (row.description
                        ? !descOptions.includes(row.description)
                        : false)

                    return (
                      <TableRow
                        key={doc.id}
                        className='border-b hover:bg-muted/30 group'
                      >
                        <TableCell className='px-3 py-2 align-top'>
                          <SelectField
                            isEdit={isEdit}
                            options={MODULE_OPTIONS}
                            value={row.module}
                            onChange={(v) => {
                              updateExistingCell(doc.id!, 'module', v)
                              updateExistingCell(doc.id!, 'description', '')
                              updateExistingCell(
                                doc.id!,
                                '_isCustomDesc',
                                false,
                              )
                            }}
                          />
                        </TableCell>
                        <TableCell className='px-3 py-2 align-top'>
                          {isEdit ? (
                            hasPresets ? (
                              <div className='flex flex-col gap-1.5'>
                                <SelectField
                                  isEdit={true}
                                  options={[...descOptions, 'Others']}
                                  value={
                                    isCustomDesc ? 'Others' : row.description
                                  }
                                  onChange={(v) => {
                                    if (v === 'Others') {
                                      updateExistingCell(
                                        doc.id!,
                                        '_isCustomDesc',
                                        true,
                                      )
                                      updateExistingCell(
                                        doc.id!,
                                        'description',
                                        '',
                                      )
                                    } else {
                                      updateExistingCell(
                                        doc.id!,
                                        '_isCustomDesc',
                                        false,
                                      )
                                      updateExistingCell(
                                        doc.id!,
                                        'description',
                                        v,
                                      )
                                    }
                                  }}
                                />
                                {isCustomDesc && (
                                  <Input
                                    value={row.description}
                                    onChange={(e) =>
                                      updateExistingCell(
                                        doc.id!,
                                        'description',
                                        e.target.value,
                                      )
                                    }
                                    className='h-8 text-sm'
                                    placeholder='Enter description'
                                  />
                                )}
                              </div>
                            ) : (
                              <Input
                                value={row.description}
                                onChange={(e) =>
                                  updateExistingCell(
                                    doc.id!,
                                    'description',
                                    e.target.value,
                                  )
                                }
                                className='h-8 text-sm'
                                placeholder='Enter description'
                              />
                            )
                          ) : (
                            <span className='text-sm'>
                              {row.description || '—'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className='px-3 py-2 align-top'>
                          {isEdit ? (
                            <DateField
                              isEdit={isEdit}
                              showTime={true}
                              value={
                                row.from_date
                                  ? new Date(row.from_date)
                                  : undefined
                              }
                              onChange={(date) =>
                                updateExistingCell(
                                  doc.id!,
                                  'from_date',
                                  date ? date.toISOString() : '',
                                )
                              }
                            />
                          ) : (
                            <span className='text-xs text-muted-foreground whitespace-nowrap'>
                              {row.from_date
                                ? formatExactDate(
                                    row.from_date,
                                    'dd MMM yyyy, hh:mm a',
                                  )
                                : '—'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className='px-3 py-2 align-top'>
                          {isEdit ? (
                            <DateField
                              isEdit={isEdit}
                              showTime={true}
                              value={
                                row.to_date ? new Date(row.to_date) : undefined
                              }
                              onChange={(date) =>
                                updateExistingCell(
                                  doc.id!,
                                  'to_date',
                                  date ? date.toISOString() : '',
                                )
                              }
                            />
                          ) : (
                            <span className='text-xs text-muted-foreground whitespace-nowrap'>
                              {row.to_date
                                ? formatExactDate(
                                    row.to_date,
                                    'dd MMM yyyy, hh:mm a',
                                  )
                                : '—'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className='px-3 py-2 align-top'>
                          <SelectField
                            isEdit={isEdit}
                            options={STATUS_OPTIONS}
                            value={row.status}
                            onChange={(v) =>
                              updateExistingCell(doc.id!, 'status', v)
                            }
                          />
                        </TableCell>
                        <TableCell className='px-3 py-2 align-top max-w-[180px]'>
                          {isEdit ? (
                            <Input
                              value={row.link}
                              onChange={(e) =>
                                updateExistingCell(
                                  doc.id!,
                                  'link',
                                  e.target.value,
                                )
                              }
                              className='h-8 text-sm'
                              placeholder='https://...'
                            />
                          ) : row.link ? (
                            <a
                              href={row.link}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-primary text-xs truncate inline-flex items-center hover:underline max-w-[160px]'
                            >
                              <span className='truncate'>
                                {row.link.replace(/^https?:\/\//, '')}
                              </span>
                              <ExternalLink className='h-3 w-3 ml-1 flex-shrink-0' />
                            </a>
                          ) : (
                            <span className='text-sm text-muted-foreground'>
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className='px-3 py-2 align-top text-xs text-muted-foreground whitespace-nowrap'>
                          {doc.created_at
                            ? formatExactDate(
                                doc.created_at,
                                'dd MMM yyyy, hh:mm a',
                              )
                            : '—'}
                        </TableCell>
                        <TableCell className='px-3 py-2 align-top text-xs text-muted-foreground whitespace-nowrap'>
                          {doc.updated_at
                            ? formatExactDate(
                                doc.updated_at,
                                'dd MMM yyyy, hh:mm a',
                              )
                            : '—'}
                        </TableCell>
                        <TableCell className='px-3 py-2 align-top text-xs text-muted-foreground'>
                          {(users as Record<string, string>)[
                            doc.created_by ?? ''
                          ] || '—'}
                        </TableCell>
                        <TableCell className='px-3 py-2 align-top text-xs text-muted-foreground'>
                          {(users as Record<string, string>)[
                            doc.modified_by ?? ''
                          ] || '—'}
                        </TableCell>
                      </TableRow>
                    )
                  })}

                  {/* New unsaved rows */}
                  {localRows.map((row) => {
                    const tempId = row._tempId!
                    const descOptions = MODULE_DOCUMENT_MAP[row.module] || []
                    const hasPresets = descOptions.length > 0
                    const isCustomDesc =
                      row._isCustomDesc ??
                      (row.description
                        ? !descOptions.includes(row.description)
                        : false)

                    return (
                      <TableRow
                        key={tempId}
                        className='border-b hover:bg-muted/30 bg-amber-500/5 dark:bg-amber-500/10'
                      >
                        <TableCell className='px-3 py-2 align-top'>
                          <SelectField
                            isEdit={true}
                            options={MODULE_OPTIONS}
                            value={row.module}
                            onChange={(v) => {
                              updateNewCell(tempId, 'module', v)
                              updateNewCell(tempId, 'description', '')
                              updateNewCell(tempId, '_isCustomDesc', false)
                            }}
                          />
                        </TableCell>
                        <TableCell className='px-3 py-2 align-top'>
                          {hasPresets ? (
                            <div className='flex flex-col gap-1.5'>
                              <SelectField
                                isEdit={true}
                                options={[...descOptions, 'Others']}
                                value={
                                  isCustomDesc ? 'Others' : row.description
                                }
                                onChange={(v) => {
                                  if (v === 'Others') {
                                    updateNewCell(tempId, '_isCustomDesc', true)
                                    updateNewCell(tempId, 'description', '')
                                  } else {
                                    updateNewCell(
                                      tempId,
                                      '_isCustomDesc',
                                      false,
                                    )
                                    updateNewCell(tempId, 'description', v)
                                  }
                                }}
                              />
                              {isCustomDesc && (
                                <Input
                                  value={row.description}
                                  onChange={(e) =>
                                    updateNewCell(
                                      tempId,
                                      'description',
                                      e.target.value,
                                    )
                                  }
                                  className='h-8 text-sm'
                                  placeholder='Enter description'
                                />
                              )}
                            </div>
                          ) : (
                            <Input
                              value={row.description}
                              onChange={(e) =>
                                updateNewCell(
                                  tempId,
                                  'description',
                                  e.target.value,
                                )
                              }
                              className='h-8 text-sm'
                              placeholder='Enter description'
                            />
                          )}
                        </TableCell>
                        <TableCell className='px-3 py-2 align-top'>
                          <DateField
                            isEdit={true}
                            showTime={true}
                            value={
                              row.from_date
                                ? new Date(row.from_date)
                                : undefined
                            }
                            onChange={(date) =>
                              updateNewCell(
                                tempId,
                                'from_date',
                                date ? date.toISOString() : '',
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className='px-3 py-2 align-top'>
                          <DateField
                            isEdit={true}
                            showTime={true}
                            value={
                              row.to_date ? new Date(row.to_date) : undefined
                            }
                            onChange={(date) =>
                              updateNewCell(
                                tempId,
                                'to_date',
                                date ? date.toISOString() : '',
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className='px-3 py-2 align-top'>
                          <SelectField
                            isEdit={true}
                            options={STATUS_OPTIONS}
                            value={row.status}
                            onChange={(v) =>
                              updateNewCell(tempId, 'status', v)
                            }
                          />
                        </TableCell>
                        <TableCell className='px-3 py-2 align-top'>
                          <Input
                            value={row.link}
                            onChange={(e) =>
                              updateNewCell(tempId, 'link', e.target.value)
                            }
                            className='h-8 text-sm'
                            placeholder='https://...'
                          />
                        </TableCell>
                        <TableCell className='px-3 py-2 align-top text-xs text-muted-foreground italic'>
                          Unsaved
                        </TableCell>
                        <TableCell className='px-3 py-2 align-top text-xs text-muted-foreground italic'>
                          Unsaved
                        </TableCell>
                        <TableCell className='px-3 py-2 align-top text-xs text-muted-foreground italic'>
                          —
                        </TableCell>
                        <TableCell className='px-3 py-2 align-top text-xs text-muted-foreground italic'>
                          —
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </>
  )
}
