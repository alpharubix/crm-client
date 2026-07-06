import { useState, useEffect } from 'react'
import { ENV } from '@/conf'
import { useQuery } from '@tanstack/react-query'
import { useDateRange } from '@/hooks/useDateRange'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCcw, Filter, X, CalendarIcon } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import type { CashFlowData } from './cashFlowType'
import rows from './cashflowtablerow'

export default function CashFlow({ acc_id }: { acc_id: string | number }) {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [appliedFromDate, setAppliedFromDate] = useState('')
  const [appliedToDate, setAppliedToDate] = useState('')

  const { data: dateRangeData } = useDateRange(acc_id)

  useEffect(() => {
    if (dateRangeData && !appliedFromDate && !appliedToDate) {
      const from = new Date(dateRangeData.from_date)
      const to = new Date(dateRangeData.to_date)

      const defaultTo = new Date(from)
      defaultTo.setMonth(defaultTo.getMonth() + 12)
      defaultTo.setDate(defaultTo.getDate() - 1)

      const finalTo = to < defaultTo ? to : defaultTo

      const startStr = from.toISOString().split('T')[0]
      const endStr = finalTo.toISOString().split('T')[0]

      setFromDate(startStr)
      setToDate(endStr)
      setAppliedFromDate(startStr)
      setAppliedToDate(endStr)
    }
  }, [dateRangeData, appliedFromDate, appliedToDate])

  const handleApply = () => {
    if (!fromDate || !toDate) {
      toast.error('Please select both From and To dates')
      return
    }

    const d1 = new Date(fromDate)
    const d2 = new Date(toDate)

    if (d1 > d2) {
      toast.error('From Date cannot be later than To Date')
      return
    }

    const maxDateAllowed = new Date(d1)
    maxDateAllowed.setMonth(maxDateAllowed.getMonth() + 12)

    if (d2 > maxDateAllowed) {
      toast.error(
        'You can only select a maximum of 12 months at a time. Please adjust the range.',
      )
      return
    }

    setAppliedFromDate(fromDate)
    setAppliedToDate(toDate)
  }

  const handleClear = () => {
    if (dateRangeData) {
      const from = new Date(dateRangeData.from_date)
      const to = new Date(dateRangeData.to_date)

      const defaultTo = new Date(from)
      defaultTo.setMonth(defaultTo.getMonth() + 12)
      defaultTo.setDate(defaultTo.getDate() - 1)

      const finalTo = to < defaultTo ? to : defaultTo

      const startStr = from.toISOString().split('T')[0]
      const endStr = finalTo.toISOString().split('T')[0]

      setFromDate(startStr)
      setToDate(endStr)
      setAppliedFromDate(startStr)
      setAppliedToDate(endStr)
    }
  }

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['cashflow', appliedFromDate, appliedToDate, acc_id],
    queryFn: async () => {
      // For cashflow, format dates as YYYY-MM if needed, or pass directly
      const response = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/accounts/r1xcrm-cashflow/${acc_id}?from_month=${appliedFromDate.slice(0, 7)}&to_month=${appliedToDate.slice(0, 7)}`,
        { credentials: 'include' }
      )
      if (!response.ok) throw new Error('Failed to load cashflow')
      const data = await response.json()
      return data.data as CashFlowData
    },
    enabled: !!appliedFromDate && !!appliedToDate,
  })

  const generateMonthsRange = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return []
    const months = []
    const current = new Date(startStr)
    current.setDate(1) // Set to 1st of the month
    const end = new Date(endStr)

    let count = 0
    while (current <= end && count < 12) {
      const month = current
        .toLocaleString('en-US', { month: 'short' })
        .toLowerCase()
      const year = current.getFullYear()
      months.push(`${month} ${year}`)
      current.setMonth(current.getMonth() + 1)
      count++
    }
    return months
  }

  const expectedMonths = generateMonthsRange(appliedFromDate, appliedToDate)

  const formatCurrency = (value: number | string | undefined | null) => {
    if (value === undefined || value === null || value === '') return '-'
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num)) return '-'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(num)
  }

  const getValueColorClass = (value: number | string | undefined | null) => {
    if (value === undefined || value === null || value === '') return ''
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num)) return ''
    return num < 0 ? 'text-red-600' : ''
  }

  return (
    <div className='p-8 animate-fade-in relative min-h-[calc(100vh-4rem)]'>
      <div className='flex items-center gap-4 mb-8'>
        <div>
          <h1 className='text-3xl font-bold text-[#000080] mb-2'>Cash Flow</h1>
          <p className='text-gray-600'>
            Monthwise cash flow statement analysis
          </p>
        </div>
      </div>

      {/* Date Filter Card */}
      {dateRangeData && (
        <Card className='mb-8 shadow-sm border-[#000080]/10 bg-white'>
          <CardContent className='p-4'>
            <div className='flex flex-col md:flex-row gap-4 items-end'>
              <div className='flex-1 space-y-1'>
                <label className='text-sm font-medium text-gray-700'>
                  From Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full justify-start text-left font-normal bg-background border-input',
                        !fromDate && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className='mr-2 h-4 w-4' />
                      {fromDate ? (
                        format(new Date(fromDate + 'T00:00:00'), 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0' align='start'>
                    <Calendar
                      mode='single'
                      captionLayout='dropdown'
                      startMonth={
                        dateRangeData?.from_date
                          ? new Date(dateRangeData.from_date + 'T00:00:00')
                          : new Date(1990, 0)
                      }
                      endMonth={
                        dateRangeData?.to_date
                          ? new Date(dateRangeData.to_date + 'T00:00:00')
                          : new Date(2100, 11)
                      }
                      selected={
                        fromDate ? new Date(fromDate + 'T00:00:00') : undefined
                      }
                      defaultMonth={
                        fromDate ? new Date(fromDate + 'T00:00:00') : undefined
                      }
                      onSelect={(date) =>
                        setFromDate(date ? format(date, 'yyyy-MM-dd') : '')
                      }
                      disabled={(date) => {
                        if (
                          !dateRangeData?.from_date ||
                          !dateRangeData?.to_date
                        )
                          return false
                        const from = new Date(
                          dateRangeData.from_date + 'T00:00:00',
                        )
                        from.setHours(0, 0, 0, 0)
                        const to = new Date(dateRangeData.to_date + 'T00:00:00')
                        to.setHours(23, 59, 59, 999)
                        return date < from || date > to
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className='flex-1 space-y-1'>
                <label className='text-sm font-medium text-gray-700'>
                  To Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full justify-start text-left font-normal bg-background border-input',
                        !toDate && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className='mr-2 h-4 w-4' />
                      {toDate ? (
                        format(new Date(toDate + 'T00:00:00'), 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0' align='start'>
                    <Calendar
                      mode='single'
                      captionLayout='dropdown'
                      startMonth={
                        dateRangeData?.from_date
                          ? new Date(dateRangeData.from_date + 'T00:00:00')
                          : new Date(1990, 0)
                      }
                      endMonth={
                        dateRangeData?.to_date
                          ? new Date(dateRangeData.to_date + 'T00:00:00')
                          : new Date(2100, 11)
                      }
                      selected={
                        toDate ? new Date(toDate + 'T00:00:00') : undefined
                      }
                      onSelect={(date) =>
                        setToDate(date ? format(date, 'yyyy-MM-dd') : '')
                      }
                      disabled={(date) => {
                        if (
                          !dateRangeData?.from_date ||
                          !dateRangeData?.to_date
                        )
                          return false
                        const from = new Date(
                          dateRangeData.from_date + 'T00:00:00',
                        )
                        from.setHours(0, 0, 0, 0)
                        const to = new Date(dateRangeData.to_date + 'T00:00:00')
                        to.setHours(23, 59, 59, 999)
                        return date < from || date > to
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className='flex gap-2'>
                <Button
                  onClick={handleApply}
                  className='bg-[#000080] hover:bg-[#000080]/90 text-white gap-2'
                >
                  <Filter className='w-4 h-4' /> Apply Filter
                </Button>
                <Button
                  onClick={handleClear}
                  variant='outline'
                  className='gap-2'
                >
                  <X className='w-4 h-4' /> Clear
                </Button>
              </div>
            </div>
            <div className='mt-2 text-xs text-gray-500'>
              * You can select a maximum date range of 12 months.
              {dateRangeData && (
                <span className='ml-1'>
                  Available data range:{' '}
                  {format(
                    new Date(dateRangeData.from_date + 'T00:00:00'),
                    'PPP',
                  )}{' '}
                  to{' '}
                  {format(new Date(dateRangeData.to_date + 'T00:00:00'), 'PPP')}
                  .
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className='shadow-lg border-[#000080]/10 bg-white overflow-hidden'>
        <CardHeader className='flex flex-row items-center justify-between bg-gray-50/50 border-b pb-4'>
          <div>
            <CardTitle className='text-xl text-[#000080]'>
              Cash Flow Statement
            </CardTitle>
            <CardDescription>
              {dateRangeData?.from_date && dateRangeData?.to_date && (
                <>
                  From{' '}
                  {format(
                    new Date(dateRangeData.from_date + 'T00:00:00'),
                    'PPP',
                  )}{' '}
                  To{' '}
                  {format(new Date(dateRangeData.to_date + 'T00:00:00'), 'PPP')}
                </>
              )}
            </CardDescription>
          </div>
          {dateRangeData && (
            <Button
              variant='outline'
              onClick={() => refetch()}
              disabled={isLoading}
              className='gap-2'
            >
              <RefreshCcw
                className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          )}
        </CardHeader>
        <CardContent className='p-0'>
          {isLoading ? (
            <div className='flex flex-col items-center justify-center p-12 text-gray-500'>
              <Loader2 className='h-8 w-8 animate-spin text-[#000080] mb-4' />
              <p>Loading cash flow data...</p>
            </div>
          ) : isError ? (
            <div className='p-8 text-center text-red-500'>
              <p>
                Error loading data: {(error as any)?.message || 'Unknown error'}
              </p>
              <Button
                onClick={() => refetch()}
                variant='outline'
                className='mt-4'
              >
                Try Again
              </Button>
            </div>
          ) : data ? (
            <div className='overflow-x-auto w-full'>
              <table className='w-full text-sm text-left border-collapse min-w-[1000px]'>
                <thead>
                  <tr className='bg-[#1f4e78] text-white text-xs'>
                    <th className='px-4 py-3 border border-black/20 font-medium whitespace-nowrap min-w-[200px] sticky left-0 bg-[#1f4e78] z-20'>
                      Particulars
                    </th>
                    <th className='px-4 py-3 border border-black/20 font-medium whitespace-nowrap text-right'>
                      Overall/Total
                    </th>
                    {expectedMonths.map((month) => (
                      <th
                        key={month}
                        className='px-4 py-3 border border-black/20 font-medium whitespace-nowrap text-right capitalize'
                      >
                        {month}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr
                      key={index}
                      className={cn(
                        'border-b border-black/10 bg-white hover:bg-gray-50 transition-colors',
                        row.rowClass,
                      )}
                    >
                      <td
                        className={cn(
                          'px-4 py-2.5 border border-black/20 whitespace-nowrap sticky left-0 z-10 bg-white',
                          row.labelClass,
                        )}
                      >
                        {row.label}
                      </td>
                      <td
                        className={cn(
                          'px-4 py-2.5 border border-black/20 text-right',
                          row.valueClass,
                          row.summaryKey
                            ? getValueColorClass(
                                data.summary[row.summaryKey] as number,
                              )
                            : '',
                        )}
                      >
                        {row.summaryKey
                          ? formatCurrency(
                              data.summary[row.summaryKey] as number,
                            )
                          : ''}
                      </td>
                      {expectedMonths.map((month, monthIndex) => {
                        const monthData = data.monthly_breakdown[monthIndex]
                        let cellContent = '-'
                        if (monthData && row.monthKey) {
                          const rawVal = monthData[row.monthKey]
                          if (row.isPercent) {
                            cellContent =
                              rawVal !== undefined && rawVal !== null
                                ? `${rawVal}%`
                                : '-'
                          } else {
                            cellContent = formatCurrency(rawVal as number)
                          }
                        }
                        return (
                          <td
                            key={month}
                            className={cn(
                              'px-4 py-2.5 border border-black/20 text-right',
                              row.valueClass,
                              !row.isPercent && monthData
                                ? getValueColorClass(monthData[row.monthKey!])
                                : '',
                            )}
                          >
                            {cellContent}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : dateRangeData ? (
            <div className='p-8 text-center text-gray-500'>
              Select date range and apply filter
            </div>
          ) : (
            <div className='p-8 text-center text-gray-500'>
              <Loader2 className='item-center m-auto h-8 w-8 animate-spin text-[#000080] mb-4' />
              <p className='text-gray-500'>
                No data available yet. Please upload a bank statement, or wait
                while your uploaded statement is being processed.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
