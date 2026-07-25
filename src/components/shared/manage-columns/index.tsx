import React, { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  sortableKeyboardCoordinates,
  arrayMove,
} from '@dnd-kit/sortable'
import { Search, Settings2 } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { TableColumn } from '@/hooks/use-manage-columns'

import { AvailableFieldsList } from './AvailableFieldsList'
import { SelectedFieldsList } from './SelectedFieldsList'

interface ManageColumnsDialogProps {
  columns: TableColumn[]
  onSave: (columns: TableColumn[]) => void
  onReset: () => void
  triggerButton?: React.ReactNode
}

export function ManageColumnsDialog({
  columns: initialColumns,
  onSave,
  onReset,
  triggerButton,
}: ManageColumnsDialogProps) {
  const [open, setOpen] = useState(false)
  const [columns, setColumns] = useState<TableColumn[]>(initialColumns)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (open) {
      setColumns(initialColumns)
      setSearchQuery('')
    }
  }, [open, initialColumns])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setColumns((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleAdd = (id: string) => {
    setColumns((items) => {
      const itemToAdd = items.find((col) => col.id === id)
      if (!itemToAdd) return items
      // Move to the end of the selected list
      const filtered = items.filter((col) => col.id !== id)
      return [...filtered, { ...itemToAdd, selected: true }]
    })
  }

  const handleRemove = (id: string) => {
    setColumns((items) =>
      items.map((col) => (col.id === id ? { ...col, selected: false } : col)),
    )
  }

  const handleSave = () => {
    onSave(columns)
    setOpen(false)
  }

  const handleReset = () => {
    onReset()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant='outline' size='sm' className='h-8'>
            <Settings2 className='mr-2 h-4 w-4' />
            Manage Columns
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Manage Columns</DialogTitle>
        </DialogHeader>

        <div className='relative mb-4'>
          <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search fields...'
            className='pl-8'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className='grid grid-cols-2 gap-6'>
          {/* Available Fields */}
          <div className='flex flex-col gap-2'>
            <div className='font-semibold text-sm'>Available Fields</div>
            <AvailableFieldsList
              columns={columns}
              searchQuery={searchQuery}
              onAdd={handleAdd}
            />
          </div>

          {/* Selected Fields */}
          <div className='flex flex-col gap-2'>
            <div className='font-semibold text-sm'>Selected Fields</div>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SelectedFieldsList columns={columns} onRemove={handleRemove} />
            </DndContext>
          </div>
        </div>

        <DialogFooter className='flex items-center justify-between sm:justify-between pt-4 mt-4 border-t'>
          <Button variant='ghost' onClick={handleReset}>
            Reset to Default
          </Button>
          <div className='flex items-center gap-2'>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
