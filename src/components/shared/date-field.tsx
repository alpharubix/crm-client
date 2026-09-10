import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format } from 'date-fns'
import { CalendarDays, Clock } from 'lucide-react'

type Props = {
  value?: Date | string | null
  isEdit: boolean
  onChange: (d?: Date) => void
  showTime?: boolean
  disablePast?: boolean
  maxDate?: Date | string | null
}

export default function DateField({
  value,
  isEdit,
  onChange,
  showTime = false,
  disablePast = false,
  maxDate,
}: Props) {
  const dateValue = useMemo(() => {
    if (!value) return undefined
    const d = value instanceof Date ? value : new Date(value)
    return !isNaN(d.getTime()) ? d : undefined
  }, [value])

  const maxDay = useMemo(() => {
    if (!maxDate) return undefined
    const m = maxDate instanceof Date ? new Date(maxDate.getTime()) : new Date(maxDate)
    if (isNaN(m.getTime())) return undefined
    m.setHours(23, 59, 59, 999)
    return m
  }, [maxDate])

  const minDay = useMemo(() => {
    if (!disablePast) return undefined
    const m = new Date()
    m.setHours(0, 0, 0, 0)
    return m
  }, [disablePast])

  if (!isEdit) {
    const displayFormat = showTime
      ? 'dd-MM-yyyy hh:mm a'
      : 'dd-MM-yyyy'
    return <span>{dateValue ? format(dateValue, displayFormat) : '—'}</span>
  }

  const handleDateSelect = (date?: Date) => {
    if (!date) {
      onChange(undefined)
      return
    }
    // Preserve time if dateValue exists, else set to default (e.g., 12:00 PM)
    const newDate = new Date(date)
    if (dateValue && showTime) {
      newDate.setHours(dateValue.getHours())
      newDate.setMinutes(dateValue.getMinutes())
    } else if (showTime) {
      // Default to 12:00 PM if no previous time
      newDate.setHours(12)
      newDate.setMinutes(0)
    }
    onChange(newDate)
  }

  const handleTimeChange = (type: 'hour' | 'minute' | 'ampm', val: string) => {
    if (!dateValue) return

    const newDate = new Date(dateValue)
    let currentHours = newDate.getHours()

    if (type === 'hour') {
      const hour12 = parseInt(val, 10)
      const wasPm = currentHours >= 12
      if (hour12 === 12) {
        currentHours = wasPm ? 12 : 0
      } else {
        currentHours = wasPm ? hour12 + 12 : hour12
      }
      newDate.setHours(currentHours)
    } else if (type === 'minute') {
      newDate.setMinutes(parseInt(val, 10))
    } else if (type === 'ampm') {
      if (val === 'PM' && currentHours < 12) {
        newDate.setHours(currentHours + 12)
      } else if (val === 'AM' && currentHours >= 12) {
        newDate.setHours(currentHours - 12)
      }
    }
    onChange(newDate)
  }

  const getHour12 = (date: Date) => {
    const h = date.getHours()
    if (h === 0) return '12'
    if (h > 12) return (h - 12).toString()
    return h.toString()
  }

  const getAmpm = (date: Date) => {
    return date.getHours() >= 12 ? 'PM' : 'AM'
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size='sm'
          variant='outline'
          className={!dateValue ? 'text-muted-foreground' : ''}
        >
          <CalendarDays className='w-4 h-4 mr-2' />
          {dateValue
            ? format(
                dateValue,
                showTime ? 'dd-MM-yyyy hh:mm a' : 'dd-MM-yyyy',
              )
            : showTime
              ? 'Pick Date & Time'
              : 'Pick Date'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        <Calendar
          mode='single'
          selected={dateValue}
          defaultMonth={dateValue}
          onSelect={handleDateSelect}
          disabled={(date) => {
            if (minDay && date < minDay) return true
            if (maxDay && date > maxDay) return true
            return false
          }}
        />
        {showTime && (
          <div className='p-3 border-t bg-muted/20 space-y-2'>
            <div className='flex items-center gap-2'>
              <Clock className='w-4 h-4 text-muted-foreground' />
              <span className='text-xs font-semibold text-muted-foreground'>
                Time
              </span>
            </div>
            <div className='flex items-center gap-2'>
              {/* Hour */}
              <Select
                value={dateValue ? getHour12(dateValue) : '12'}
                onValueChange={(v) => handleTimeChange('hour', v)}
                disabled={!dateValue}
              >
                <SelectTrigger className='h-8 w-[70px]'>
                  <SelectValue placeholder='HH' />
                </SelectTrigger>
                <SelectContent
                  position='popper'
                  side='top'
                  className='h-[200px]'
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                    <SelectItem key={h} value={h.toString()}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className='text-muted-foreground'>:</span>
              {/* Minute */}
              <Select
                value={dateValue ? dateValue.getMinutes().toString() : '0'}
                onValueChange={(v) => handleTimeChange('minute', v)}
                disabled={!dateValue}
              >
                <SelectTrigger className='h-8 w-[70px]'>
                  <SelectValue placeholder='MM' />
                </SelectTrigger>
                <SelectContent
                  position='popper'
                  side='top'
                  className='h-[200px]'
                >
                  {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                    <SelectItem key={m} value={m.toString()}>
                      {m.toString().padStart(2, '0')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* AM/PM */}
              <Select
                value={dateValue ? getAmpm(dateValue) : 'AM'}
                onValueChange={(v) => handleTimeChange('ampm', v)}
                disabled={!dateValue}
              >
                <SelectTrigger className='h-8 w-[70px]'>
                  <SelectValue placeholder='AM/PM' />
                </SelectTrigger>
                <SelectContent position='popper' side='top'>
                  <SelectItem value='AM'>AM</SelectItem>
                  <SelectItem value='PM'>PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
