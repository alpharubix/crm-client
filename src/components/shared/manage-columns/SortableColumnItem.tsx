import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TableColumn } from '@/hooks/use-manage-columns'

interface SortableColumnItemProps {
  column: TableColumn
  onRemove: (id: string) => void
}

export function SortableColumnItem({ column, onRemove }: SortableColumnItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: column.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-2 border rounded-md bg-background ${isDragging ? 'shadow-lg border-primary' : 'border-border'}`}
    >
      <div className='flex items-center gap-2 flex-1'>
        <button
          type='button'
          className='cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground outline-none'
          {...attributes}
          {...listeners}
        >
          <GripVertical size={16} />
        </button>
        <span className='text-sm font-medium'>{column.label}</span>
      </div>
      <Button
        variant='ghost'
        size='icon'
        className='h-6 w-6 text-destructive hover:bg-destructive/10'
        onClick={() => onRemove(column.id)}
      >
        <Minus size={14} />
      </Button>
    </div>
  )
}
