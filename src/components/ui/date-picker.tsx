import * as React from 'react'
import { format, parse } from 'date-fns'
import { Calendar as CalendarIcon, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface DatePickerProps {
  value?: string // Expects yyyy-MM-dd
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function DatePicker({
  value = '',
  onChange,
  placeholder = 'Pick date (dd-mm-yyyy)',
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Parse yyyy-MM-dd to Date object safely
  const selectedDate = React.useMemo(() => {
    if (!value || typeof value !== 'string') return undefined
    try {
      const parsed = parse(value.slice(0, 10), 'yyyy-MM-dd', new Date())
      return isNaN(parsed.getTime()) ? undefined : parsed
    } catch {
      return undefined
    }
  }, [value])

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const formattedValue = format(date, 'yyyy-MM-dd')
      onChange(formattedValue)
    } else {
      onChange('')
    }
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onChange('')
  }

  return (
    <div className={cn('relative inline-flex w-full items-center', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            className={cn(
              'h-9 w-full justify-start text-left font-normal text-xs rounded-lg border-border/60 bg-background px-3 hover:bg-muted/40 cursor-pointer pr-7',
              !selectedDate && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className='h-3 w-3 text-muted-foreground shrink-0' />
            <span className='truncate flex-1'>
              {selectedDate ? format(selectedDate, 'dd-MM-yyyy') : placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0 shadow-xl border-border/60 rounded-xl z-50' align='start'>
          <Calendar
            mode='single'
            selected={selectedDate}
            onSelect={handleSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {selectedDate && (
        <button
          type='button'
          onClick={handleClear}
          title='Clear date'
          className='absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer z-[1] transition-colors'
        >
          <X className='h-3.5 w-3.5' />
        </button>
      )}
    </div>
  )
}
