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
  value?: Date
  isEdit: boolean
  onChange: (d?: Date) => void
  showTime?: boolean
  disablePast?: boolean
  maxDate?: Date
}

export default function DateField({
  value,
  isEdit,
  onChange,
  showTime = false,
  disablePast = false,
  maxDate,
}: Props) {
  if (!isEdit) {
    const displayFormat = showTime
      ? 'dd-MM-yyyy hh:mm a'
      : 'dd-MM-yyyy'
    return <span>{value ? format(new Date(value), displayFormat) : '—'}</span>
  }

  const handleDateSelect = (date?: Date) => {
    if (!date) {
      onChange(undefined)
      return
    }
    // Preserve time if value exists, else set to default (e.g., current time or 12:00 PM)
    const newDate = new Date(date)
    if (value && showTime) {
      newDate.setHours(value.getHours())
      newDate.setMinutes(value.getMinutes())
    } else if (showTime) {
      // Default to 12:00 PM if no previous time
      newDate.setHours(12)
      newDate.setMinutes(0)
    }
    onChange(newDate)
  }

  const handleTimeChange = (type: 'hour' | 'minute' | 'ampm', val: string) => {
    if (!value) return

    const newDate = new Date(value)
    let currentHours = newDate.getHours()
    let currentMinutes = newDate.getMinutes()

    if (type === 'hour') {
      const hour12 = parseInt(val)
      const isPm = currentHours >= 12
      if (isPm && hour12 !== 12) {
        currentHours = hour12 + 12
      } else if (!isPm && hour12 === 12) {
        currentHours = 0
      } else {
        currentHours = isPm && hour12 === 12 ? 12 : hour12
        // Actually simpler: convert back to linear hours
        // If it was PM (>=12), and we pick 5, it becomes 17.
        // If it was AM (<12), and we pick 5, it becomes 5.
        // Special case 12.
        // If current is 13 (1 PM), pick 2. -> 14 (2 PM).
        // If current is 0 (12 AM), pick 2. -> 2 (2 AM).

        // Re-calculate based on AM/PM state
        const wasPm = currentHours >= 12
        if (hour12 === 12) {
          currentHours = wasPm ? 12 : 0
        } else {
          currentHours = wasPm ? hour12 + 12 : hour12
        }
      }
      newDate.setHours(currentHours)
    } else if (type === 'minute') {
      newDate.setMinutes(parseInt(val))
    } else if (type === 'ampm') {
      const hour12 = currentHours % 12 || 12
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
          className={!value ? 'text-muted-foreground' : ''}
        >
          <CalendarDays className='w-4 h-4 mr-2' />
          {value
            ? format(
                new Date(value),
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
          selected={value}
          onSelect={handleDateSelect}
            disabled={(date) => {
            let disabled = false
            if (disablePast) {
              disabled = disabled || date < new Date(new Date().setHours(0, 0, 0, 0))
            }
            if (maxDate) {
              // Compare at start of day so we don't disable the maxDate day itself prematurely
              const maxDay = new Date(maxDate)
              maxDay.setHours(23, 59, 59, 999)
              disabled = disabled || date > maxDay
            }
            return disabled
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
                value={value ? getHour12(value) : '12'}
                onValueChange={(v) => handleTimeChange('hour', v)}
                disabled={!value}
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
                value={value ? value.getMinutes().toString() : '0'}
                onValueChange={(v) => handleTimeChange('minute', v)}
                disabled={!value}
              >
                <SelectTrigger className='h-8 w-[70px]'>
                  <SelectValue placeholder='MM' />
                </SelectTrigger>
                <SelectContent
                  position='popper'
                  side='top'
                  className='h-[200px]'
                >
                  {/* Create 5-minute intervals or 1-minute? 5 is standard for bad UX otherwise list is long. user might want precise. 
                       Let's do 5 min steps + 0. Or just 0, 5, 10... 
                       Actually standard native picker is better but I agreed to Select.
                       Let's do 00, 05, 10... 55. And maybe allow typing? No Shadcn select is rigid. 
                       I will provide 5 minute intervals. 
                   */}
                  {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                    <SelectItem key={m} value={m.toString()}>
                      {m.toString().padStart(2, '0')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* AM/PM */}
              <Select
                value={value ? getAmpm(value) : 'AM'}
                onValueChange={(v) => handleTimeChange('ampm', v)}
                disabled={!value}
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
