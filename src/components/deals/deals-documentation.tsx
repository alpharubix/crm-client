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

// function toDateInputValue(val: string | undefined): string {
//   if (!val) return ''
//   // already YYYY-MM-DD
//   if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val
//   // ISO string like 2026-04-10T00:00:00+00:00
//   if (val.includes('T')) return val.split('T')[0]
//   // dd-MM-yy format like "21-03-26"
//   const parts = val.split('-')
//   if (parts.length === 3 && parts[2].length === 2) {
//     return `20${parts[2]}-${parts[1]}-${parts[0]}`
//   }
//   return val
// }

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
  'Banking': ['Bank Statement', 'Sanction Letter', 'Loan SOA'],
  'GST': ['GST Certificate', 'GST 3B'],
  'ITR': ['ITR ACK', 'ITR', '3CB & 3CD', 'Prov ITR'],
  'Ledger': ['Anchor Ledger'],
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
  _isNew?: boolean // local flag for unsaved rows
  _isCustomDesc?: boolean
}

export default function DocumentationSection({ dealId }: { dealId: string }) {
  const queryClient = useQueryClient()
  const [isEdit, setIsEdit] = useState(false)
  const [localRows, setLocalRows] = useState<DocRow[]>([])

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

  // merge API rows with local new rows
  const rows = isEdit
    ? [...docs.map((d) => ({ ...d })), ...localRows.filter((r) => r._isNew)]
    : docs

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

  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/deals/${dealId}/documents/${docId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      )
      if (!res.ok) throw new Error('Failed to delete')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal-documents', dealId] })
    },
  })

  // track edits to existing rows locally during edit mode
  const [editedRows, setEditedRows] = useState<Record<string, DocRow>>({})

  function updateExistingCell(id: string, key: keyof DocRow, value: string | boolean) {
    setEditedRows((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || docs.find((d) => d.id === id)!), [key]: value },
    }))
  }

  function updateNewCell(index: number, key: keyof DocRow, value: string | boolean) {
    setLocalRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [key]: value } : r)),
    )
  }

  function addRow() {
    setLocalRows((prev) => [
      ...prev,
      {
        module: 'Banking',
        description: '',
        from_date: '',
        to_date: '',
        status: 'Pending',
        link: '',
        _isNew: true,
      },
    ])
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
      for (const row of localRows.filter((r) => r._isNew)) {
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
      toast.success('Documents saved')
    } catch {
      toast.error('Failed to save documents')
    }
  }

  function handleCancel() {
    setLocalRows([])
    setEditedRows({})
    setIsEdit(false)
  }

  async function handleDelete(docId?: string, localIndex?: number) {
    if (docId) {
      await deleteMutation.mutateAsync(docId)
    } else if (localIndex !== undefined) {
      setLocalRows((prev) => prev.filter((_, i) => i !== localIndex))
    }
  }

  return (
    <>
      <SectionHeader title='Documentation' />
      <CardContent className='p-0'>
        <div className='flex justify-end p-3 border-b gap-2'>
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
              <Button size='sm' className='cursor-pointer' onClick={handleSave}>
                Save
              </Button>
              <Button
                size='sm'
                variant='outline'
                className='cursor-pointer'
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </div>
          )}
          <Button size='sm' onClick={addRow}>
            + Add Row
          </Button>
        </div>

        <div className='overflow-x-auto'>
          <Table>
            <TableHeader className='bg-muted/50 text-xs text-muted-foreground uppercase tracking-wide'>
              <TableRow>
                <TableHead className='px-3 py-2 border-b'>Module *</TableHead>
                <TableHead className='px-3 py-2 border-b'>
                  Description *
                </TableHead>
                <TableHead className='px-3 py-2 border-b whitespace-nowrap'>
                  From
                </TableHead>
                <TableHead className='px-3 py-2 border-b whitespace-nowrap'>
                  To
                </TableHead>
                <TableHead className='px-3 py-2 border-b'>Status</TableHead>
                <TableHead className='px-3 py-2 border-b'>Link</TableHead>
                <TableHead className='px-3 py-2 border-b whitespace-nowrap'>
                  Created At
                </TableHead>
                <TableHead className='px-3 py-2 border-b whitespace-nowrap'>
                  Updated At
                </TableHead>
                <TableHead className='px-3 py-2 border-b whitespace-nowrap'>
                  Created By
                </TableHead>
                <TableHead className='px-3 py-2 border-b whitespace-nowrap'>
                  Modified By
                </TableHead>
                <TableHead className='px-3 py-2 border-b w-16' />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className='text-center text-xs text-muted-foreground py-4'
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className='text-center text-xs text-muted-foreground py-4'
                  >
                    No documents yet
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {/* existing rows from API */}
                  {docs.map((doc) => {
                    const row = editedRows[doc.id!] || doc
                    return (
                      <TableRow
                        key={doc.id}
                        className='border-b hover:bg-muted/30 group'
                      >
                        <TableCell className='px-3 py-2'>
                          <SelectField
                            isEdit={isEdit}
                            options={MODULE_OPTIONS}
                            value={row.module}
                            onChange={(v) => {
                              updateExistingCell(doc.id!, 'module', v)
                              updateExistingCell(doc.id!, 'description', '')
                              updateExistingCell(doc.id!, '_isCustomDesc', false)
                            }}
                          />
                        </TableCell>
                        <TableCell className='px-3 py-2'>
                          {isEdit ? (() => {
                            const descOptions = MODULE_DOCUMENT_MAP[row.module] || []
                            const isCustomDesc = row._isCustomDesc ?? (row.description ? !descOptions.includes(row.description) : false)
                            return (
                              <div className="flex flex-col gap-1">
                                <SelectField
                                  isEdit={isEdit}
                                  options={[...descOptions, 'Others']}
                                  value={isCustomDesc ? 'Others' : row.description}
                                  onChange={(v) => {
                                    if (v === 'Others') {
                                      updateExistingCell(doc.id!, '_isCustomDesc', true)
                                      updateExistingCell(doc.id!, 'description', '')
                                    } else {
                                      updateExistingCell(doc.id!, '_isCustomDesc', false)
                                      updateExistingCell(doc.id!, 'description', v)
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
                                    className='h-7 text-sm'
                                    placeholder='Enter description'
                                  />
                                )}
                              </div>
                            )
                          })() : (
                            <span>{row.description || '—'}</span>
                          )}
                        </TableCell>
                        <TableCell className='px-3 py-2'>
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
                            <span>
                              {row.from_date
                                ? formatExactDate(
                                    row.from_date,
                                    'dd MMM yyyy, hh:mm a',
                                  )
                                : '—'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className='px-3 py-2'>
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
                            <span>
                              {row.to_date
                                ? formatExactDate(
                                    row.to_date,
                                    'dd MMM yyyy, hh:mm a',
                                  )
                                : '—'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className='px-3 py-2'>
                          <SelectField
                            isEdit={isEdit}
                            options={STATUS_OPTIONS}
                            value={row.status}
                            onChange={(v) =>
                              updateExistingCell(doc.id!, 'status', v)
                            }
                          />
                        </TableCell>
                        <TableCell className='px-3 py-2 max-w-[140px]'>
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
                              className='h-7 text-sm'
                              placeholder='—'
                            />
                          ) : row.link ? (
                            <a
                              href={row.link}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-primary text-xs truncate block hover:underline'
                            >
                              {row.link.replace('https://', '')}
                            </a>
                          ) : (
                            <span>—</span>
                          )}
                        </TableCell>
                        <TableCell className='px-3 py-2 text-xs text-muted-foreground whitespace-nowrap'>
                          {doc.created_at
                            ? formatExactDate(doc.created_at, 'dd MMM yyyy, hh:mm a')
                            : '—'}
                        </TableCell>
                        <TableCell className='px-3 py-2 text-xs text-muted-foreground whitespace-nowrap'>
                          {doc.updated_at
                            ? formatExactDate(doc.updated_at, 'dd MMM yyyy, hh:mm a')
                            : '—'}
                        </TableCell>
                        <TableCell className='px-3 py-2 text-xs text-muted-foreground'>
                          {(users as Record<string, string>)[
                            doc.created_by ?? ''
                          ] || '—'}
                        </TableCell>
                        <TableCell className='px-3 py-2 text-xs text-muted-foreground'>
                          {(users as Record<string, string>)[
                            doc.modified_by ?? ''
                          ] || '—'}
                        </TableCell>
                        <TableCell className='px-3 py-2'>
                          {isEdit && (
                            <Button
                              size='sm'
                              variant='ghost'
                              className='text-destructive hover:text-destructive text-xs h-6 px-2'
                              onClick={() => handleDelete(doc.id)}
                            >
                              Remove
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}

                  {/* new unsaved rows */}
                  {localRows
                    .filter((r) => r._isNew)
                    .map((row, i) => (
                      <TableRow
                        key={`new-${i}`}
                        className='border-b hover:bg-muted/30 group bg-muted/10'
                      >
                        <TableCell className='px-3 py-2'>
                          <SelectField
                            isEdit={true}
                            options={MODULE_OPTIONS}
                            value={row.module}
                            onChange={(v) => {
                              updateNewCell(i, 'module', v)
                              updateNewCell(i, 'description', '')
                              updateNewCell(i, '_isCustomDesc', false)
                            }}
                          />
                        </TableCell>
                        <TableCell className='px-3 py-2'>
                          {(() => {
                            const descOptions = MODULE_DOCUMENT_MAP[row.module] || []
                            const isCustomDesc = row._isCustomDesc ?? (row.description ? !descOptions.includes(row.description) : false)
                            return (
                              <div className="flex flex-col gap-1">
                                <SelectField
                                  isEdit={true}
                                  options={[...descOptions, 'Others']}
                                  value={isCustomDesc ? 'Others' : row.description}
                                  onChange={(v) => {
                                    if (v === 'Others') {
                                      updateNewCell(i, '_isCustomDesc', true)
                                      updateNewCell(i, 'description', '')
                                    } else {
                                      updateNewCell(i, '_isCustomDesc', false)
                                      updateNewCell(i, 'description', v)
                                    }
                                  }}
                                />
                                {isCustomDesc && (
                                  <Input
                                    value={row.description}
                                    onChange={(e) =>
                                      updateNewCell(i, 'description', e.target.value)
                                    }
                                    className='h-7 text-sm'
                                    placeholder='Enter description'
                                  />
                                )}
                              </div>
                            )
                          })()}
                        </TableCell>
                        <TableCell className='px-3 py-2'>
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
                                i,
                                'from_date',
                                date ? date.toISOString() : '',
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className='px-3 py-2'>
                          <DateField
                            isEdit={true}
                            showTime={true}
                            value={
                              row.to_date ? new Date(row.to_date) : undefined
                            }
                            onChange={(date) =>
                              updateNewCell(
                                i,
                                'to_date',
                                date ? date.toISOString() : '',
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className='px-3 py-2'>
                          <SelectField
                            isEdit={true}
                            options={STATUS_OPTIONS}
                            value={row.status}
                            onChange={(v) => updateNewCell(i, 'status', v)}
                          />
                        </TableCell>
                        <TableCell className='px-3 py-2'>
                          <Input
                            value={row.link}
                            onChange={(e) =>
                              updateNewCell(i, 'link', e.target.value)
                            }
                            className='h-7 text-sm'
                            placeholder='—'
                          />
                        </TableCell>
                        <TableCell className='px-3 py-2 text-xs text-muted-foreground'>
                          —
                        </TableCell>
                        <TableCell className='px-3 py-2 text-xs text-muted-foreground'>
                          —
                        </TableCell>
                        <TableCell className='px-3 py-2 text-xs text-muted-foreground'>
                          —
                        </TableCell>
                        <TableCell className='px-3 py-2 text-xs text-muted-foreground'>
                          —
                        </TableCell>
                        <TableCell className='px-3 py-2'>
                          <Button
                            size='sm'
                            variant='ghost'
                            className='text-destructive hover:text-destructive text-xs h-6 px-2'
                            onClick={() => handleDelete(undefined, i)}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </>
  )
}
