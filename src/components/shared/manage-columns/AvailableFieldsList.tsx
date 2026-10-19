import React from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TableColumn } from '@/hooks/use-manage-columns'

interface AvailableFieldsListProps {
  columns: TableColumn[]
  searchQuery: string
  onAdd: (id: string) => void
  canAdd?: boolean
}

export function AvailableFieldsList({
  columns,
  searchQuery,
  onAdd,
  canAdd = true,
}: AvailableFieldsListProps) {
  const availableColumns = columns.filter(
    (col) =>
      !col.selected &&
      col.label.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (availableColumns.length === 0) {
    return (
      <div className='flex items-center justify-center h-32 text-sm text-muted-foreground border border-dashed rounded-md'>
        No available fields found
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-2'>
      {!canAdd && (
        <div className='text-[11px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1.5 rounded border border-amber-200 dark:border-amber-800'>
          Maximum 10 columns reached. Remove a column to add another.
        </div>
      )}
      <div className='flex flex-col gap-2 pr-2 overflow-y-auto max-h-[300px]'>
        {availableColumns.map((col) => (
          <div
            key={col.id}
            className={`flex items-center justify-between p-2 border rounded-md transition-colors ${
              canAdd
                ? 'hover:bg-accent hover:text-accent-foreground'
                : 'opacity-60 bg-muted/20'
            }`}
          >
            <span className='text-sm font-medium'>{col.label}</span>
            <Button
              variant='ghost'
              size='icon'
              className='h-6 w-6'
              disabled={!canAdd}
              onClick={() => onAdd(col.id)}
              title={canAdd ? 'Add column' : 'Maximum 10 columns reached'}
            >
              <Plus size={14} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
