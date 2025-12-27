import { CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@radix-ui/react-label'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover'
import { type DateRange } from 'react-day-picker'

type Props = {
  dateRange: DateRange | undefined
  onDateChange: (range: DateRange | undefined) => void
}

export default function LeadsFilters({
  dateRange,
  onDateChange,
}: Props) {
  return (
    <div className="grid grid-cols-5 gap-4 mb-3 border p-2 rounded-md">
      {['Customer Name', 'Company Name', 'Phone', 'Email'].map(
        (label) => (
          <div key={label} className="grid gap-2">
            <Label>{label}</Label>
            <Input placeholder={`Enter ${label}`} />
          </div>
        )
      )}

      <div className="grid gap-2">
        <Label>Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 justify-start">
              <CalendarDays className="h-4 w-4" />
              Choose Date
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-auto" align="end">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={onDateChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}
