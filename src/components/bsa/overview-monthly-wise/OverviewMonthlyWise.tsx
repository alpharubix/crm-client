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
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { toast } from 'sonner'

interface MonthlyBreakdown {
  Month: string
  AverageCreditTranx: number
  TotalCreditNo: number
  AverageDebitTranx: number
  TotalDebitNo: number
  TotalCredit: number
  OutwardChequeReturn: number
  ReversalOfInwardChequeReturn: number
  ReversalOfOnlineReturn: number
  GrossCredits: number
  Contra: number
  LoanReceived: number
  NetCredits: number
  InhouseCredit: number
  NetCashInflow: number
  TotalDebit: number
  InwardChequeReturn: number
  ReversalOfOutwardChequeReturn: number
  OnlineReturn: number
  GrossDebit: number
  ContraDebit: number
  NetDebit: number
  InhouseDebit: number
  NetCashOutFlow: number
  InwardChequeReturnNos: number
  InwardChequeReturnToTotalChequeReceivedInPercent: number
  OutwardChequeReturnNo: number
  OutwardChequeReturnToTotalChequePaidInPercent: number
  InwardOnlineReturnNo: number
  InwardOnlineReturnTototalOnlineCreditInPercent: number
  OutwardOnlineReturnNo: number
  OutwardOnlineReturnToTotalOnlineDebitInPercent: number
  EcsReturnNo: number
  EcsReturnToTotalEcsPaymentInPercent: number
  InhouseCreditNos: number
  InhouseCreditToTotalCreditInPercent: number
  InhouseDebitNos: number
  InhouseDebitToTotalDebitInPercent: number
  AverageEod: number
  odccLimit: number
  odccDrawingLimit: number
  AverageOdAndCCLimitUtilizationInPercent: number
  NoOfdaysLimitOverDrawn: number
  NoOfTimesLimitOverDrawn: number
  OverDrawnAnountInRsMn: number
  OverDrawnAverageinRsMn: number
  OverDrawnAverageAsPercentOfOdCCLimit: number
  PeakOverDrawingAmount: number
  PeakOverDrawingDate: string
  LoanRepaid: number
  EcsPayment: number
  NoOfUniqueEcs: number
  InterestPaid: number
}

interface OverviewData {
  consolidated_overall_report: {
    overview: {
      average_credit_tranx: number
      total_credit_nos: number
      average_debit_tranx: number
      total_debit_nos: number
    }
    cash_inflow: {
      total_credits_a: number
      outward_cheque_return_b: number
      reversal_inward_cheque_return_c: number
      reversal_online_return_d: number
      gross_credits_e: number
      contra_f: number
      loan_received_g: number
      net_credits_h: number
      inhouse_credit_i: number
      net_cash_inflow_j: number
    }
    cash_outflow: {
      total_debits_a: number
      inward_cheque_return_b: number
      reversal_outward_cheque_return_c: number
      online_return_d: number
      gross_debits_e: number
      contra_f: number
      net_debits_g: number
      inhouse_debit_h: number
      net_cash_outflow: number
    }
    returns: {
      inward_cheque_return_nos: number
      inward_cheque_return_percent: number
      outward_cheque_return_nos: number
      outward_cheque_return_percent: number
      inward_online_return_nos: number
      inward_online_return_percent: number
      outward_online_return_nos: number
      outward_online_return_percent: number
      ecs_return_nos: number
      ecs_return_percent: number
    }
    other_calculations: {
      inhouse_credit_nos: number
      'inhouse_credit/total_percent': number
      inhouse_debit_nos: number
      'inhouse_debit/total_percent': number
      average_eod: number
      od_cc_sanction_limit: number
      'od/cc_drawing_power_limit': number
      'average_od_&_cc_utilization_percent': number
      no_of_days_limit_overdrawn: number
      no_of_times_limit_overdrawn: number
      overdrawn_amount_in_rs_mn_for_all_days: number
      overdrawn_average_amount_in_rs_mn: number
      'overdrawn_average_as_percent_of_od/cc_limit': number
      peak_overdrawing_amount: number
      peak_overdrawing_date: string
      loan_repaid: number
      ecs_payment: number
      'no_of_unique_ecs/emis': number
      interest_paid: number
    }
  }
  monthly_breakdown: MonthlyBreakdown[]
}

type RowConfig = {
  label: string
  extraLabel?: string
  isSeparator?: boolean
  overallKey?: string[] | null
  monthKey?: keyof MonthlyBreakdown
  isCurrency?: boolean
  isPercent?: boolean
  isRed?: boolean
  isItalic?: boolean
  isBold?: boolean
  isGreyBg?: boolean
}

const ROWS: RowConfig[] = [
  {
    label: 'Average Credit Tranx',
    overallKey: ['overview', 'average_credit_tranx'],
    monthKey: 'AverageCreditTranx',
    isCurrency: false,
    isBold: true,
  },
  {
    label: 'Total Credit (Nos.)',
    overallKey: ['overview', 'total_credit_nos'],
    monthKey: 'TotalCreditNo',
    isCurrency: false,
    isRed: false,
    isItalic: true,
  },
  {
    label: 'Average Debit Tranx',
    overallKey: ['overview', 'average_debit_tranx'],
    monthKey: 'AverageDebitTranx',
    isCurrency: false,
    isBold: true,
  },
  {
    label: 'Total Debit (Nos.)',
    overallKey: ['overview', 'total_debit_nos'],
    monthKey: 'TotalDebitNo',
    isCurrency: false,
    isRed: false,
    isItalic: true,
  },
  { label: '', isSeparator: true },

  {
    label: 'Total Credits (A)',
    overallKey: ['cash_inflow', 'total_credits_a'],
    monthKey: 'TotalCredit',
    isCurrency: true,
  },
  {
    label: 'Outward Cheque Return (B)',
    overallKey: ['cash_inflow', 'outward_cheque_return_b'],
    monthKey: 'OutwardChequeReturn',
    isCurrency: true,
    isRed: false,
  },
  {
    label: 'Reversal of Inward Cheque Return (C)',
    overallKey: ['cash_inflow', 'reversal_inward_cheque_return_c'],
    monthKey: 'ReversalOfInwardChequeReturn',
    isCurrency: true,
    isRed: false,
  },
  {
    label: 'Reversal of Online Return (D)',
    overallKey: ['cash_inflow', 'reversal_online_return_d'],
    monthKey: 'ReversalOfOnlineReturn',
    isCurrency: true,
    isRed: false,
  },
  {
    label: 'Gross Credits (E = A-B-C-D)',
    overallKey: ['cash_inflow', 'gross_credits_e'],
    monthKey: 'GrossCredits',
    isCurrency: true,
    isGreyBg: true,
    isBold: true,
  },
  {
    label: 'Contra (F)',
    overallKey: ['cash_inflow', 'contra_f'],
    monthKey: 'Contra',
    isCurrency: true,
    isRed: false,
  },
  {
    label: 'Loan Received (G)',
    overallKey: ['cash_inflow', 'loan_received_g'],
    monthKey: 'LoanReceived',
    isCurrency: true,
    isRed: false,
  },
  {
    label: 'Net Credits (H = E-F-G)',
    overallKey: ['cash_inflow', 'net_credits_h'],
    monthKey: 'NetCredits',
    isCurrency: true,
    isGreyBg: true,
    isBold: true,
  },
  {
    label: 'Inhouse Credit (I)',
    overallKey: ['cash_inflow', 'inhouse_credit_i'],
    monthKey: 'InhouseCredit',
    isCurrency: true,
    isRed: false,
  },
  {
    label: 'Net Cash Inflow (H-I)',
    overallKey: ['cash_inflow', 'net_cash_inflow_j'],
    monthKey: 'NetCashInflow',
    isCurrency: true,
    isGreyBg: true,
    isBold: true,
  },
  { label: '', isSeparator: true },

  {
    label: 'Total Debits (A)',
    overallKey: ['cash_outflow', 'total_debits_a'],
    monthKey: 'TotalDebit',
    isCurrency: true,
  },
  {
    label: 'Inward Cheque Return (B)',
    overallKey: ['cash_outflow', 'inward_cheque_return_b'],
    monthKey: 'InwardChequeReturn',
    isCurrency: true,
    isRed: false,
  },
  {
    label: 'Reversal of Outward Cheque Return (C)',
    overallKey: ['cash_outflow', 'reversal_outward_cheque_return_c'],
    monthKey: 'ReversalOfOutwardChequeReturn',
    isCurrency: true,
    isRed: false,
  },
  {
    label: 'Online Return (D)',
    overallKey: ['cash_outflow', 'online_return_d'],
    monthKey: 'OnlineReturn',
    isCurrency: true,
    isRed: false,
  },
  {
    label: 'Gross Debits (E = A-B-C-D)',
    overallKey: ['cash_outflow', 'gross_debits_e'],
    monthKey: 'GrossDebit',
    isCurrency: true,
    isGreyBg: true,
    isBold: true,
  },
  {
    label: 'Contra (F)',
    overallKey: ['cash_outflow', 'contra_f'],
    monthKey: 'ContraDebit',
    isCurrency: true,
    isRed: false,
  },
  {
    label: 'Net Debits (G=E-F)',
    overallKey: ['cash_outflow', 'net_debits_g'],
    monthKey: 'NetDebit',
    isCurrency: true,
    isGreyBg: true,
    isBold: true,
  },
  {
    label: 'Inhouse Debit (H)',
    overallKey: ['cash_outflow', 'inhouse_debit_h'],
    monthKey: 'InhouseDebit',
    isCurrency: true,
    isRed: false,
  },
  {
    label: 'Net Cash Outflow (G-H)',
    overallKey: ['cash_outflow', 'net_cash_outflow'],
    monthKey: 'NetCashOutFlow',
    isCurrency: true,
    isGreyBg: true,
    isBold: true,
  },
  { label: '', isSeparator: true },

  {
    label: 'Inward Cheque Return (Nos.)',
    overallKey: ['returns', 'inward_cheque_return_nos'],
    monthKey: 'InwardChequeReturnNos',
    isCurrency: false,
    isRed: false,
    isItalic: true,
  },
  {
    label: 'Inward Cheque Return/Total Cheques Received (%)',
    overallKey: ['returns', 'inward_cheque_return_percent'],
    monthKey: 'InwardChequeReturnToTotalChequeReceivedInPercent',
    isCurrency: false,
    isPercent: true,
    isBold: true,
  },
  {
    label: 'Outward Cheque Return (Nos.)',
    overallKey: ['returns', 'outward_cheque_return_nos'],
    monthKey: 'OutwardChequeReturnNo',
    isCurrency: false,
    isRed: false,
    isItalic: true,
  },
  {
    label: 'Outward Cheque Return/Total Cheques Paid (%)',
    overallKey: ['returns', 'outward_cheque_return_percent'],
    monthKey: 'OutwardChequeReturnToTotalChequePaidInPercent',
    isCurrency: false,
    isPercent: true,
    isBold: true,
  },
  {
    label: 'Inward Online Return (Nos.)',
    overallKey: ['returns', 'inward_online_return_nos'],
    monthKey: 'InwardOnlineReturnNo',
    isCurrency: false,
    isRed: false,
    isItalic: true,
  },
  {
    label: 'Inward Online Return/Total Online Credits (%)',
    overallKey: ['returns', 'inward_online_return_percent'],
    monthKey: 'InwardOnlineReturnTototalOnlineCreditInPercent',
    isCurrency: false,
    isPercent: true,
    isBold: true,
  },
  {
    label: 'Outward Online Return (Nos.)',
    overallKey: ['returns', 'outward_online_return_nos'],
    monthKey: 'OutwardOnlineReturnNo',
    isCurrency: false,
    isRed: false,
    isItalic: true,
  },
  {
    label: 'Outward Online Return/Total Online Debits (%)',
    overallKey: ['returns', 'outward_online_return_percent'],
    monthKey: 'OutwardOnlineReturnToTotalOnlineDebitInPercent',
    isCurrency: false,
    isPercent: true,
    isBold: true,
  },
  {
    label: 'ECS Return (Credit Nos.)',
    overallKey: ['returns', 'ecs_return_nos'],
    monthKey: 'EcsReturnNo',
    isCurrency: false,
    isRed: false,
    isItalic: true,
  },
  {
    label: 'ECS Return/Total ECS Payments (%)',
    overallKey: ['returns', 'ecs_return_percent'],
    monthKey: 'EcsReturnToTotalEcsPaymentInPercent',
    isCurrency: false,
    isPercent: true,
    isBold: true,
  },
  { label: '', isSeparator: true },

  {
    label: 'Inhouse Credit (Nos.)',
    overallKey: ['other_calculations', 'inhouse_credit_nos'],
    monthKey: 'InhouseCreditNos',
    isCurrency: false,
    isRed: false,
    isItalic: true,
  },
  {
    label: 'Inhouse Credit/Total Credits (%)',
    overallKey: ['other_calculations', 'inhouse_credit/total_percent'],
    monthKey: 'InhouseCreditToTotalCreditInPercent',
    isCurrency: false,
    isPercent: true,
    isBold: true,
  },
  {
    label: 'Inhouse Debit (Nos.)',
    overallKey: ['other_calculations', 'inhouse_debit_nos'],
    monthKey: 'InhouseDebitNos',
    isCurrency: false,
    isRed: false,
    isItalic: true,
  },
  {
    label: 'Inhouse Debit/Total Debits (%)',
    overallKey: ['other_calculations', 'inhouse_debit/total_percent'],
    monthKey: 'InhouseDebitToTotalDebitInPercent',
    isCurrency: false,
    isPercent: true,
    isBold: true,
  },
  { label: '', isSeparator: true },

  {
    label: 'Average EOD',
    overallKey: ['other_calculations', 'average_eod'],
    monthKey: 'AverageEod',
    isCurrency: true,
    isBold: true,
  },
  {
    label: 'OD/CC Sanction Limit',
    overallKey: ['other_calculations', 'od_cc_sanction_limit'],
    monthKey: 'odccLimit',
    isCurrency: true,
    isBold: true,
  },
  {
    label: 'OD/CC Drawing Power Limit',
    overallKey: ['other_calculations', 'od/cc_drawing_power_limit'],
    monthKey: 'odccDrawingLimit',
    isCurrency: true,
    isBold: true,
  },
  {
    label: 'No. of days limit over-drawn',
    overallKey: ['other_calculations', 'no_of_days_limit_overdrawn'],
    monthKey: 'NoOfdaysLimitOverDrawn',
    isCurrency: false,
    isBold: true,
  },
  {
    label: 'No. of times limit over-drawn',
    overallKey: ['other_calculations', 'no_of_times_limit_overdrawn'],
    monthKey: 'NoOfTimesLimitOverDrawn',
    isCurrency: false,
    isBold: true,
  },
  {
    label: 'Overdrawn Amount in Rs. Mn. (for all days)',
    overallKey: [
      'other_calculations',
      'overdrawn_amount_in_rs_mn_for_all_days',
    ],
    monthKey: 'OverDrawnAnountInRsMn',
    isCurrency: true,
    isBold: true,
  },
  {
    label: 'Overdrawn Average Amount in Rs. Mn.',
    overallKey: ['other_calculations', 'overdrawn_average_amount_in_rs_mn'],
    monthKey: 'OverDrawnAverageinRsMn',
    isCurrency: true,
    isBold: true,
  },
  {
    label: 'Overdrawn Average as a %age of OD/CC Limit',
    overallKey: [
      'other_calculations',
      'overdrawn_average_as_percent_of_od/cc_limit',
    ],
    monthKey: 'OverDrawnAverageAsPercentOfOdCCLimit',
    isCurrency: false,
    isPercent: true,
    isBold: true,
  },
  {
    label: 'Peak overdrawing amount',
    overallKey: ['other_calculations', 'peak_overdrawing_amount'],
    monthKey: 'PeakOverDrawingAmount',
    isCurrency: true,
    isBold: true,
  },
  {
    label: 'Peak overdrawing date',
    overallKey: ['other_calculations', 'peak_overdrawing_date'],
    monthKey: 'PeakOverDrawingDate',
    isCurrency: false,
    isBold: true,
  },
  { label: '', isSeparator: true },

  {
    label: 'Loan Repaid',
    overallKey: ['other_calculations', 'loan_repaid'],
    monthKey: 'LoanRepaid',
    isCurrency: true,
    isRed: false,
    isItalic: true,
  },
  {
    label: 'ECS Payment',
    overallKey: ['other_calculations', 'ecs_payment'],
    monthKey: 'EcsPayment',
    isCurrency: true,
    isRed: false,
    isItalic: true,
  },
  {
    label: "No. of Unique ECS/EMI's",
    overallKey: ['other_calculations', 'no_of_unique_ecs/emis'],
    monthKey: 'NoOfUniqueEcs',
    isCurrency: false,
    isRed: false,
    isItalic: true,
  },
  {
    label: 'Interest Paid',
    overallKey: ['other_calculations', 'interest_paid'],
    monthKey: 'InterestPaid',
    isCurrency: true,
    isBold: true,
  },
]

export default function OverviewMonthlyWise({
  acc_id,
}: {
  acc_id: string | number
}) {
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
    queryKey: ['month-wise-overview', appliedFromDate, appliedToDate, acc_id],
    queryFn: async () => {
      const response = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/accounts/r1xcrm-month-wise-overview/${acc_id}?from_date=${appliedFromDate}&to_date=${appliedToDate}`,
        { credentials: 'include' }
      )
      if (!response.ok) throw new Error('Failed to load overview')
      const data = await response.json()
      return data.data as OverviewData
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

  const formatValue = (
    value: number | string | undefined | null,
    isCurrency: boolean,
    isPercent: boolean = false,
  ) => {
    if (value === undefined || value === null || value === '-' || value === '')
      return '-'
    if (typeof value === 'string' && !isCurrency && !isPercent) return value
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(numValue)) return value

    if (isCurrency) {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
      }).format(numValue)
    }

    if (isPercent) {
      return `${numValue.toFixed(2)}%`
    }

    return numValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })
  }

  const getNumericColorClass = (
    value: any,
    isCurrency: boolean,
    isPercent: boolean,
  ): string => {
    if (!isCurrency && !isPercent) return ''
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num) || num === undefined || num === null) return ''
    return num < 0 ? 'text-red-600' : ''
  }

  const getOverallValue = (
    dataObj: OverviewData | undefined,
    path: string[] | null,
  ): any => {
    if (!dataObj || !path) return '-'
    let current: any = dataObj.consolidated_overall_report
    for (const key of path) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key]
      } else {
        return '-'
      }
    }
    return current
  }

  const dataMap = new Map<string, MonthlyBreakdown>()
  if (data?.monthly_breakdown) {
    data.monthly_breakdown.forEach((item) => {
      dataMap.set(item.Month.toLowerCase(), item)
    })
  }

  return (
    <div className='p-8 animate-fade-in relative min-h-[calc(100vh-4rem)]'>
      <div className='flex items-center gap-4 mb-8'>
        <div>
          <h1 className='text-3xl font-bold text-[#000080] mb-2'>
            Month-Wise Overview
          </h1>
          <p className='text-gray-600'>
            Detailed month-wise analysis of transactions
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

      <Card className='shadow-lg border-[#000080]/10 bg-white overflow-hidden'>
        <CardHeader className='flex flex-row items-center justify-between bg-gray-50/50 border-b pb-4'>
          <div>
            <CardTitle className='text-xl text-[#000080]'>
              Overview Details
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
              <p>Loading overview data...</p>
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
              <table className='w-full text-sm text-left border-collapse min-w-[1200px]'>
                <thead>
                  <tr className='bg-[#1f4e78] text-white text-xs'>
                    <th className='px-4 py-3 border border-black/20 font-medium whitespace-nowrap min-w-[300px] sticky left-0 bg-[#1f4e78] z-20'>
                      Particulars (In Lakhs)
                    </th>
                    <th className='px-4 py-3 border border-black/20 font-bold whitespace-nowrap text-right'>
                      Overall/Total
                    </th>
                    {expectedMonths.map((month) => (
                      <th
                        key={month}
                        className='px-4 py-3 border border-black/20 font-bold whitespace-nowrap text-center capitalize'
                      >
                        {month}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row, index) => {
                    if (row.isSeparator) {
                      return (
                        <tr key={index} className='h-1.5 bg-[#1f4e78]'>
                          <td colSpan={expectedMonths.length + 2}></td>
                        </tr>
                      )
                    }

                    const labelContent = (
                      <div
                        className={`flex justify-between items-center w-full ${row.isRed ? 'text-red-600' : 'text-gray-800'}`}
                      >
                        <span>{row.label}</span>
                        {row.extraLabel && (
                          <span className='text-xs font-normal text-gray-600 ml-2'>
                            {row.extraLabel}
                          </span>
                        )}
                      </div>
                    )

                    const cellClass = `px-4 py-2.5 border border-black/20 ${row.isRed ? 'text-red-600' : 'text-gray-800'} ${row.isItalic ? 'italic' : ''} ${row.isBold ? 'font-bold' : ''}`
                    const bgClass = row.isGreyBg ? 'bg-gray-200/60' : 'bg-white'

                    return (
                      <tr
                        key={index}
                        className={`hover:bg-blue-50/30 transition-colors ${bgClass}`}
                      >
                        <td
                          className={`px-4 py-2.5 border border-black/20 sticky left-0 z-10 ${row.isBold ? 'font-bold' : 'font-medium'} ${row.isGreyBg ? 'bg-gray-200' : 'bg-white'}`}
                        >
                          {labelContent}
                        </td>
                        <td
                          className={`text-right ${cellClass} font-bold ${getNumericColorClass(getOverallValue(data, row.overallKey || null), !!row.isCurrency, !!row.isPercent)}`}
                        >
                          {formatValue(
                            getOverallValue(data, row.overallKey || null),
                            !!row.isCurrency,
                            !!row.isPercent,
                          )}
                        </td>
                        {expectedMonths.map((month) => {
                          const monthData = dataMap.get(month)
                          const val =
                            monthData && row.monthKey
                              ? monthData[row.monthKey]
                              : undefined
                          return (
                            <td
                              key={month}
                              className={`text-right ${cellClass} ${getNumericColorClass(val, !!row.isCurrency, !!row.isPercent)}`}
                            >
                              {formatValue(
                                val,
                                !!row.isCurrency,
                                !!row.isPercent,
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
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
