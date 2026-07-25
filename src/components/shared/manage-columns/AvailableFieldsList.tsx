import React from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TableColumn } from '@/hooks/use-manage-columns'

interface AvailableFieldsListProps {
  columns: TableColumn[]
  searchQuery: string
  onAdd: (id: string) => void
}

export function AvailableFieldsList({ columns, searchQuery, onAdd }: AvailableFieldsListProps) {
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
    <div className='flex flex-col gap-2 pr-2 overflow-y-auto max-h-[300px]'>
      {availableColumns.map((col) => (
        <div
          key={col.id}
          className='flex items-center justify-between p-2 border rounded-md hover:bg-accent hover:text-accent-foreground'
        >
          <span className='text-sm font-medium'>{col.label}</span>
          <Button
            variant='ghost'
            size='icon'
            className='h-6 w-6'
            onClick={() => onAdd(col.id)}
          >
            <Plus size={14} />
          </Button>
        </div>
      ))}
    </div>
  )
}
