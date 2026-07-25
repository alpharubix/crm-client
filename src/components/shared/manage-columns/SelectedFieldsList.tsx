import React from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { TableColumn } from '@/hooks/use-manage-columns'
import { SortableColumnItem } from './SortableColumnItem'

interface SelectedFieldsListProps {
  columns: TableColumn[]
  onRemove: (id: string) => void
}

export function SelectedFieldsList({ columns, onRemove }: SelectedFieldsListProps) {
  const selectedColumns = columns.filter((col) => col.selected)

  if (selectedColumns.length === 0) {
    return (
      <div className='flex items-center justify-center h-32 text-sm text-muted-foreground border border-dashed rounded-md'>
        No fields selected
      </div>
    )
  }

  return (
    <SortableContext
      items={selectedColumns.map((c) => c.id)}
      strategy={verticalListSortingStrategy}
    >
      <div className='flex flex-col gap-2 pr-2 overflow-y-auto max-h-[300px]'>
        {selectedColumns.map((col) => (
          <SortableColumnItem key={col.id} column={col} onRemove={onRemove} />
        ))}
      </div>
    </SortableContext>
  )
}
