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
// import { useNavigate } from "react-router-dom";

interface MonthlyBreakdown {
  month: string
  inflows_value: any
  inflows_no: any
  outflows_value: any
  outflows_no: any
}

interface SummaryData {
  _id: string
  monthly_breakdown: MonthlyBreakdown[]
  total: any
}

export default function SummeryOfDebitAndCredit({
  acc_id,
}: {
  acc_id: string | number
}) {
  // const navigate = useNavigate();
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
    queryKey: [
      'summary-of-debit-and-credit',
      appliedFromDate,
      appliedToDate,
      acc_id,
    ],
    queryFn: async () => {
      const response = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/accounts/r1xcrm-summary-of-debit-and-credit_monthwise/${acc_id}?from_date=${appliedFromDate}&to_date=${appliedToDate}`,
        { credentials: 'include' }
      )
      if (!response.ok) throw new Error('Failed to load summary')
      const data = await response.json()
      return data.data as SummaryData
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

  const formatCurrency = (value: number | undefined) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(value ?? 0)
  }

  const dataMap = new Map<string, MonthlyBreakdown>()
  if (data?.monthly_breakdown) {
    data.monthly_breakdown.forEach((item) => {
      dataMap.set(item.month.toLowerCase(), item)
    })
  }

  const getColorClass = (value: number | undefined, isCurrency: boolean) => {
    if (!isCurrency || value === undefined || value === null) return ''
    return value < 0 ? 'text-red-600' : ''
  }

  const renderRow = (
    label: string,
    totalValue: number | undefined,
    getValueForMonth: (monthData: MonthlyBreakdown) => number | undefined,
    isCurrency: boolean = false,
    isBold: boolean = false,
  ) => {
    return (
      <tr className='hover:bg-blue-50/30 transition-colors'>
        <td
          className={cn(
            'px-4 py-2 border border-gray-300 whitespace-nowrap sticky left-0 z-10',
            isBold ? 'font-bold bg-gray-100' : 'bg-white',
          )}
        >
          {label}
        </td>
        <td
          className={cn(
            'px-4 py-2 text-right border border-gray-300',
            isBold && 'font-bold bg-gray-50',
            getColorClass(totalValue, isCurrency),
          )}
        >
          {isCurrency ? formatCurrency(totalValue) : totalValue}
        </td>
        {expectedMonths.map((month) => {
          const monthData = dataMap.get(month)
          const val = monthData ? getValueForMonth(monthData) : undefined
          return (
            <td
              key={month}
              className={cn(
                'px-4 py-2 text-right border border-gray-300',
                isBold && 'font-bold bg-gray-50',
                getColorClass(val, isCurrency),
              )}
            >
              {isCurrency ? formatCurrency(val) : val}
            </td>
          )
        })}
      </tr>
    )
  }

  return (
    <div className='p-8 animate-fade-in relative min-h-[calc(100vh-4rem)]'>
      <div className='flex items-center gap-4 mb-8'>
        <div>
          <h1 className='text-3xl font-bold text-[#000080] mb-2'>
            Summary of Debit and Credit
          </h1>
          <p className='text-gray-600'>
            Monthwise breakdown of inflows and outflows
          </p>
        </div>
      </div>

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

      <Card className='shadow-lg border-[#000080]/10 bg-white'>
        <CardHeader className='flex flex-row items-center justify-between bg-gray-50/50 border-b pb-4'>
          <div>
            <CardTitle className='text-xl text-[#000080]'>
              Monthly Overview
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
              <p>Loading summary data...</p>
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
            <div className='overflow-x-auto pb-4'>
              <table className='w-full text-sm text-left border-collapse border border-gray-300'>
                <thead className='text-xs text-white bg-[#1f4e78]'>
                  <tr>
                    <th className='px-4 py-3 font-semibold border border-gray-400 w-48 sticky left-0 bg-[#1f4e78] z-20'>
                      Months
                    </th>
                    <th className='px-4 py-3 font-semibold text-right border border-gray-400 min-w-[120px]'>
                      Total
                    </th>
                    {expectedMonths.map((month) => (
                      <th
                        key={month}
                        className='px-4 py-3 font-semibold text-right border border-gray-400 capitalize min-w-[120px]'
                      >
                        {month}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className='bg-white'>
                  {/* Inflows (Value) */}
                  <tr className='bg-gray-400 text-white'>
                    <td
                      colSpan={expectedMonths.length + 2}
                      className='px-4 py-1.5 font-semibold text-center border border-gray-400'
                    >
                      Inflows (Value)
                    </td>
                  </tr>
                  {renderRow(
                    'Cash Deposit',
                    data?.total?.inflows_value_breakdown?.cash_deposit,
                    (m) =>
                      m?.inflows_value?.inflows_value_breakdown?.cash_deposit,
                    true,
                  )}
                  {renderRow(
                    'Cheque Receipt',
                    data?.total?.inflows_value_breakdown?.cheque_receipt,
                    (m) =>
                      m?.inflows_value?.inflows_value_breakdown?.cheque_receipt,
                    true,
                  )}
                  {renderRow(
                    'Online Receipt',
                    data?.total?.inflows_value_breakdown?.online_receipt,
                    (m) =>
                      m?.inflows_value?.inflows_value_breakdown?.online_receipt,
                    true,
                  )}
                  {renderRow(
                    'Other Receipt',
                    data?.total?.inflows_value_breakdown?.other_receipt,
                    (m) =>
                      m?.inflows_value?.inflows_value_breakdown?.other_receipt,
                    true,
                  )}
                  {renderRow(
                    'Inhouse Receipt',
                    data?.total?.inflows_value_breakdown?.inhouse_receipt,
                    (m) =>
                      m?.inflows_value?.inflows_value_breakdown
                        ?.inhouse_receipt,
                    true,
                  )}
                  {renderRow(
                    'Total Receipt (Inflows)',
                    data?.total?.total_receipt_inflows_value,
                    (m) => m?.inflows_value?.total_receipt_inflows_value,
                    true,
                    true,
                  )}

                  {/* Inflows (No.) */}
                  <tr className='bg-gray-400 text-white'>
                    <td
                      colSpan={expectedMonths.length + 2}
                      className='px-4 py-1.5 font-semibold text-center border border-gray-400'
                    >
                      Inflows (No.)
                    </td>
                  </tr>
                  {renderRow(
                    'Cash Deposit',
                    data?.total?.inflows_no_breakdown?.cash_deposit ??
                      data?.total?.inflows_no_breakdown?.cash_deposit_no,
                    (m) =>
                      m?.inflows_no?.inflows_no_breakdown?.cash_deposit ??
                      m?.inflows_no?.inflows_no_breakdown?.cash_deposit_no,
                    false,
                  )}
                  {renderRow(
                    'Cheque Receipt',
                    data?.total?.inflows_no_breakdown?.cheque_receipt ??
                      data?.total?.inflows_no_breakdown?.cheque_receipt_no,
                    (m) =>
                      m?.inflows_no?.inflows_no_breakdown?.cheque_receipt ??
                      m?.inflows_no?.inflows_no_breakdown?.cheque_receipt_no,
                    false,
                  )}
                  {renderRow(
                    'Online Receipt',
                    data?.total?.inflows_no_breakdown?.online_receipt ??
                      data?.total?.inflows_no_breakdown?.online_receipt_no,
                    (m) =>
                      m?.inflows_no?.inflows_no_breakdown?.online_receipt ??
                      m?.inflows_no?.inflows_no_breakdown?.online_receipt_no,
                    false,
                  )}
                  {renderRow(
                    'Other Receipt',
                    data?.total?.inflows_no_breakdown?.other_receipt ??
                      data?.total?.inflows_no_breakdown?.other_receipt_no,
                    (m) =>
                      m?.inflows_no?.inflows_no_breakdown?.other_receipt ??
                      m?.inflows_no?.inflows_no_breakdown?.other_receipt_no,
                    false,
                  )}
                  {renderRow(
                    'Inhouse Receipt',
                    data?.total?.inflows_no_breakdown?.inhouse_receipt ??
                      data?.total?.inflows_no_breakdown?.inhouse_receipt_no,
                    (m) =>
                      m?.inflows_no?.inflows_no_breakdown?.inhouse_receipt ??
                      m?.inflows_no?.inflows_no_breakdown?.inhouse_receipt_no,
                    false,
                  )}
                  {renderRow(
                    'Total Receipt (Inflows)',
                    data?.total?.total_receipt_inflows_no,
                    (m) => m?.inflows_no?.total_receipt_inflows_no,
                    false,
                    true,
                  )}

                  {/* Outflows (Value) */}
                  <tr className='bg-gray-400 text-white'>
                    <td
                      colSpan={expectedMonths.length + 2}
                      className='px-4 py-1.5 font-semibold text-center border border-gray-400'
                    >
                      Outflows (Value)
                    </td>
                  </tr>
                  {renderRow(
                    'Cash Withdrawal',
                    data?.total?.outflows_value_breakdown?.cash_withdrawal,
                    (m) =>
                      m?.outflows_value?.outflows_value_breakdown
                        ?.cash_withdrawal,
                    true,
                  )}
                  {renderRow(
                    'Cheque Payment',
                    data?.total?.outflows_value_breakdown?.cheque_payment,
                    (m) =>
                      m?.outflows_value?.outflows_value_breakdown
                        ?.cheque_payment,
                    true,
                  )}
                  {renderRow(
                    'Online Payment',
                    data?.total?.outflows_value_breakdown?.online_payment,
                    (m) =>
                      m?.outflows_value?.outflows_value_breakdown
                        ?.online_payment,
                    true,
                  )}
                  {renderRow(
                    'Other Payment',
                    data?.total?.outflows_value_breakdown?.other_payment,
                    (m) =>
                      m?.outflows_value?.outflows_value_breakdown
                        ?.other_payment,
                    true,
                  )}
                  {renderRow(
                    'Inhouse Payment',
                    data?.total?.outflows_value_breakdown?.inhouse_payment,
                    (m) =>
                      m?.outflows_value?.outflows_value_breakdown
                        ?.inhouse_payment,
                    true,
                  )}
                  {renderRow(
                    'Total Payments (Outflows)',
                    data?.total?.total_payments_outflows_value,
                    (m) => m?.outflows_value?.total_payments_outflows_value,
                    true,
                    true,
                  )}

                  {/* Outflows (No.) */}
                  <tr className='bg-gray-400 text-white'>
                    <td
                      colSpan={expectedMonths.length + 2}
                      className='px-4 py-1.5 font-semibold text-center border border-gray-400'
                    >
                      Outflows (No.)
                    </td>
                  </tr>
                  {renderRow(
                    'Cash Withdrawal',
                    data?.total?.outflows_no_breakdown?.cash_withdrawal ??
                      data?.total?.outflows_no_breakdown?.cash_withdrawal_no,
                    (m) =>
                      m?.outflows_no?.outflows_no_breakdown?.cash_withdrawal ??
                      m?.outflows_no?.outflows_no_breakdown?.cash_withdrawal_no,
                    false,
                  )}
                  {renderRow(
                    'Cheque Payment',
                    data?.total?.outflows_no_breakdown?.cheque_payment ??
                      data?.total?.outflows_no_breakdown?.cheque_payment_no,
                    (m) =>
                      m?.outflows_no?.outflows_no_breakdown?.cheque_payment ??
                      m?.outflows_no?.outflows_no_breakdown?.cheque_payment_no,
                    false,
                  )}
                  {renderRow(
                    'Online Payment',
                    data?.total?.outflows_no_breakdown?.online_payment ??
                      data?.total?.outflows_no_breakdown?.online_payment_no,
                    (m) =>
                      m?.outflows_no?.outflows_no_breakdown?.online_payment ??
                      m?.outflows_no?.outflows_no_breakdown?.online_payment_no,
                    false,
                  )}
                  {renderRow(
                    'Other Payment',
                    data?.total?.outflows_no_breakdown?.other_payment ??
                      data?.total?.outflows_no_breakdown?.other_payment_no,
                    (m) =>
                      m?.outflows_no?.outflows_no_breakdown?.other_payment ??
                      m?.outflows_no?.outflows_no_breakdown?.other_payment_no,
                    false,
                  )}
                  {renderRow(
                    'Inhouse Payment',
                    data?.total?.outflows_no_breakdown?.inhouse_payment ??
                      data?.total?.outflows_no_breakdown?.inhouse_payment_no,
                    (m) =>
                      m?.outflows_no?.outflows_no_breakdown?.inhouse_payment ??
                      m?.outflows_no?.outflows_no_breakdown?.inhouse_payment_no,
                    false,
                  )}
                  {renderRow(
                    'Total Payments (Outflows)',
                    data?.total?.total_payments_outflows_no,
                    (m) => m?.outflows_no?.total_payments_outflows_no,
                    false,
                    true,
                  )}
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
