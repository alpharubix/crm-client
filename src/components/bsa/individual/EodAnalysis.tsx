import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDateRange } from '@/hooks/useDateRange';
import { ENV } from '@/conf';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCcw, Filter, X, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import BankAccountDetails from '../BankAccountDetails';
import { useLocation, useParams } from 'react-router-dom';
// import BsaDownloadButton from '@/components/bsa/BsaDownloadButton';

interface MonthlyBreakdown {
  Month: string;
  parsedMonthDate?: string;
  AverageCreditTranx: number;
  TotalCreditNo: number;
  AverageDebitTranx: number;
  TotalDebitNo: number;
  TotalCredit: number;
  OutwardChequeReturn: number;
  ReversalOfInwardChequeReturn: number;
  ReversalOfOnlineReturn: number;
  GrossCredits: number;
  Contra: number;
  LoanReceived: number;
  NetCredits: number;
  InhouseCredit: number;
  NetCashInflow: number;
  TotalDebit: number;
  InwardChequeReturn: number;
  ReversalOfOutwardChequeReturn: number;
  OnlineReturn: number;
  GrossDebit: number;
  ContraDebit: number;
  NetDebit: number;
  InhouseDebit: number;
  NetCashOutFlow: number;
  InwardChequeReturnNos: number;
  InwardChequeReturnToTotalChequeReceivedInPercent: number;
  OutwardChequeReturnNo: number;
  OutwardChequeReturnToTotalChequePaidInPercent: number;
  InwardOnlineReturnNo: number;
  InwardOnlineReturnTototalOnlineCreditInPercent: number;
  OutwardOnlineReturnNo: number;
  OutwardOnlineReturnToTotalOnlineDebitInPercent: number;
  EcsReturnNo: number;
  EcsReturnToTotalEcsPaymentInPercent: number;
  InhouseCreditNos: number;
  InhouseCreditToTotalCreditInPercent: number;
  InhouseDebitNos: number;
  InhouseDebitToTotalDebitInPercent: number;
  AverageEod: number;
  odccLimit: number;
  odccDrawingLimit: number;
  AverageOdAndCCLimitUtilizationInPercent: number;
  NoOfdaysLimitOverDrawn: number;
  NoOfTimesLimitOverDrawn: number;
  OverDrawnAnountInRsMn: number;
  OverDrawnAverageinRsMn: number;
  OverDrawnAverageAsPercentOfOdCCLimit: number;
  PeakOverDrawingAmount: number;
  PeakOverDrawingDate: string;
  LoanRepaid: number;
  EcsPayment: number;
  NoOfUniqueEcs: number;
  InterestPaid: number;
}

interface OverviewData {
  consolidated_eod: {
    overview: {
      average_credit_tranx: number;
      total_credit_nos: number;
      average_debit_tranx: number;
      total_debit_nos: number;
    };
    cash_inflow: {
      total_credits_a: number;
      outward_cheque_return_b: number;
      reversal_inward_cheque_return_c: number;
      reversal_online_return_d: number;
      gross_credits_e: number;
      contra_f: number;
      loan_received_g: number;
      net_credits_h: number;
      inhouse_credit_i: number;
      net_cash_inflow_j: number;
    };
    cash_outflow: {
      total_debits_a: number;
      inward_cheque_return_b: number;
      reversal_outward_cheque_return_c: number;
      online_return_d: number;
      gross_debits_e: number;
      contra_f: number;
      net_debits_g: number;
      inhouse_debit_h: number;
      net_cash_outflow: number;
    };
    returns: {
      inward_cheque_return_nos: number;
      inward_cheque_return_percent: number;
      outward_cheque_return_nos: number;
      outward_cheque_return_percent: number;
      inward_online_return_nos: number;
      inward_online_return_percent: number;
      outward_online_return_nos: number;
      outward_online_return_percent: number;
      ecs_return_nos: number;
      ecs_return_percent: number;
    };
    other_calculations: {
      inhouse_credit_nos: number;
      'inhouse_credit/total_percent': number;
      inhouse_debit_nos: number;
      'inhouse_debit/total_percent': number;
      average_eod: number;
      od_cc_sanction_limit: number;
      'od/cc_drawing_power_limit': number;
      'average_od_&_cc_utilization_percent': number;
      no_of_days_limit_overdrawn: number;
      no_of_times_limit_overdrawn: number;
      overdrawn_amount_in_rs_mn_for_all_days: number;
      overdrawn_average_amount_in_rs_mn: number;
      'overdrawn_average_as_percent_of_od/cc_limit': number;
      peak_overdrawing_amount: number;
      peak_overdrawing_date: string;
      loan_repaid: number;
      ecs_payment: number;
      'no_of_unique_ecs/emis': number;
      interest_paid: number;
    };
  };
  monthly_breakdown: MonthlyBreakdown[];
}

type RowConfig = {
  label: string;
  extraLabel?: string;
  isSeparator?: boolean;
  overallKey?: string[] | null;
  monthKey?: keyof MonthlyBreakdown;
  isCurrency?: boolean;
  isPercent?: boolean;
  isRed?: boolean;
  isItalic?: boolean;
  isBold?: boolean;
  isGreyBg?: boolean;
};

const ROWS: RowConfig[] = [
  {
    label: 'Opening Balance',
    overallKey: ['opening_balance'],
    monthKey: 'openingBalance' as any,
    isCurrency: true,
    isBold: true,
  },
  {
    label: 'Max EOD',
    overallKey: ['max_eod'],
    monthKey: 'MaxEod' as any,
    isCurrency: true,
  },
  {
    label: 'Max EOD Date',
    overallKey: ['max_eod_date'],
    monthKey: 'maxEodDate' as any,
  },
  {
    label: 'Min EOD',
    overallKey: ['min_eod'],
    monthKey: 'minEod' as any,
    isCurrency: true,
  },
  {
    label: 'Min EOD Date',
    overallKey: ['min_eod_date'],
    monthKey: 'minEodDate' as any,
  },
  {
    label: 'Average EOD',
    overallKey: ['average_eod'],
    monthKey: 'averageEod' as any,
    isCurrency: true,
    isBold: true,
  },
  {
    label: 'Max EOD by Income',
    overallKey: ['max_eod_by_income'],
    monthKey: 'maxEodByIncome' as any,
    isCurrency: true,
  },
  {
    label: 'Min EOD by Income',
    overallKey: ['min_eod_by_income'],
    monthKey: 'minEodByIncome' as any,
    isCurrency: true,
  },
  {
    label: 'Closing Balance',
    overallKey: ['closing_balance'],
    monthKey: 'closingbalance' as any,
    isCurrency: true,
    isBold: true,
  },

  { label: 'EOD Buckets', isSeparator: true },
  {
    label: '1 EOD',
    overallKey: ['eod_buckets', 'one_eod'],
    monthKey: 'oneEod' as any,
  },
  {
    label: '5 EOD',
    overallKey: ['eod_buckets', 'five_eod'],
    monthKey: 'fiveEod' as any,
  },
  {
    label: '10 EOD',
    overallKey: ['eod_buckets', 'ten_eod'],
    monthKey: 'tenEod' as any,
  },
  {
    label: '15 EOD',
    overallKey: ['eod_buckets', 'fifteen_eod'],
    monthKey: 'fifteenEod' as any,
  },
  {
    label: '20 EOD',
    overallKey: ['eod_buckets', 'twenty_eod'],
    monthKey: 'twentyEod' as any,
  },
  {
    label: '25 EOD',
    overallKey: ['eod_buckets', 'twentyfive_eod'],
    monthKey: 'twentyfiveEod' as any,
  },
  {
    label: 'Last Day',
    overallKey: ['eod_buckets', 'last_day'],
    monthKey: 'lastDay' as any,
  },
];

export default function IndividualEodAnalysis({
  accountNumber: propAccountNumber,
  acc_id: propAccId,
}: { accountNumber?: string; acc_id?: string | number } = {}) {
  const { id } = useParams();
  const acc_id = propAccId || id;
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [appliedFromDate, setAppliedFromDate] = useState('');
  const [appliedToDate, setAppliedToDate] = useState('');

  const location = useLocation();
  
  const selectedAccountNumber =
    propAccountNumber ||
    (location.state as { accountNumber?: string } | null)?.accountNumber ||
    sessionStorage.getItem('selected_bsa_account_number') ||
    '';
  const { data: dateRangeData } = useDateRange({
    acc_id,
    accountNumber: selectedAccountNumber,
  });

  useEffect(() => {
    if (dateRangeData && !appliedFromDate && !appliedToDate) {
      const from = new Date(dateRangeData.from_date);
      const to = new Date(dateRangeData.to_date);

      const defaultTo = new Date(from);
      defaultTo.setMonth(defaultTo.getMonth() + 12);
      defaultTo.setDate(defaultTo.getDate() - 1);

      const finalTo = to < defaultTo ? to : defaultTo;
      const startStr = from.toISOString().split('T')[0];
      const endStr = finalTo.toISOString().split('T')[0];

      setFromDate(startStr);
      setToDate(endStr);
      setAppliedFromDate(startStr);
      setAppliedToDate(endStr);
    }
  }, [dateRangeData, appliedFromDate, appliedToDate]);
  const containerRef = useRef<HTMLDivElement>(null);

  const [showScrollHint, setShowScrollHint] = useState(true);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const handleScroll = () => {
      setShowScrollHint(container.scrollTop < 80);
    };
    // console.log(container.scrollTop);
    container.addEventListener('scroll', handleScroll);

    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const handleApply = () => {
    if (!fromDate || !toDate) {
      toast.error('Please select both From and To dates');
      return;
    }

    const d1 = new Date(fromDate);
    const d2 = new Date(toDate);

    if (d1 > d2) {
      toast.error('From Date cannot be later than To Date');
      return;
    }

    const maxDateAllowed = new Date(d1);
    maxDateAllowed.setMonth(maxDateAllowed.getMonth() + 12);

    if (d2 > maxDateAllowed) {
      toast.error(
        'You can only select a maximum of 12 months at a time. Please adjust the range.'
      );
      return;
    }

    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
  };

  const handleClear = () => {
    if (dateRangeData) {
      const from = new Date(dateRangeData.from_date);
      const to = new Date(dateRangeData.to_date);

      const defaultTo = new Date(from);
      defaultTo.setMonth(defaultTo.getMonth() + 12);
      defaultTo.setDate(defaultTo.getDate() - 1);

      const finalTo = to < defaultTo ? to : defaultTo;

      const startStr = from.toISOString().split('T')[0];
      const endStr = finalTo.toISOString().split('T')[0];

      setFromDate(startStr);
      setToDate(endStr);
      setAppliedFromDate(startStr);
      setAppliedToDate(endStr);
    }
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      'individual-eod-analysis',
      appliedFromDate,
      appliedToDate,
      acc_id,
      selectedAccountNumber,
    ],
    queryFn: async () => {
      const response = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/accounts/individual/r1x-eod-analysis/${acc_id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from_date: appliedFromDate,
            to_date: appliedToDate,
            account_number: selectedAccountNumber,
          }),
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load EOD analysis. Please try again.');
      }
      const json = await response.json();

      const acc_data =
        json.data?.account_details ||
        json.data?.[0]?.account_details ||
        json.account_details;
      if (acc_data) {
        sessionStorage.setItem('account_details', JSON.stringify(acc_data));
      }

      return json.data as OverviewData;
    },
    enabled: !!appliedFromDate && !!appliedToDate && !!acc_id,
  });

  const generateMonthsRange = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return [];
    const months = [];
    const current = new Date(startStr);
    current.setDate(1);
    const end = new Date(endStr);

    let count = 0;
    while (current <= end && count < 12) {
      const month = current
        .toLocaleString('en-US', { month: 'short' })
        .toLowerCase();
      const year = current.getFullYear();
      months.push(`${month} ${year}`);
      current.setMonth(current.getMonth() + 1);
      count++;
    }
    return months;
  };

  const expectedMonths = generateMonthsRange(appliedFromDate, appliedToDate);

  const formatValue = (
    value: number | string | undefined | null,
    isCurrency: boolean,
    isPercent: boolean = false
  ) => {
    if (value === undefined || value === null || value === '-' || value === '')
      return '-';
    if (typeof value === 'string' && !isCurrency && !isPercent) return value;
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return value;

    if (isCurrency) {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
      }).format(numValue);
    }

    if (isPercent) {
      return `${numValue.toFixed(2)}%`;
    }

    return numValue.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };

  const getNumericColorClass = (
    value: any,
    isCurrency: boolean,
    isPercent: boolean
  ): string => {
    if (!isCurrency && !isPercent) return '';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num) || num === undefined || num === null) return '';
    return num < 0 ? 'text-red-700' : '';
  };

  const getOverallValue = (
    dataObj: OverviewData | undefined,
    path: string[] | null
  ): any => {
    if (!dataObj || !path) return '-';
    let current: any = dataObj.consolidated_eod;
    for (const key of path) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return '-';
      }
    }
    return current;
  };

  const dataMap = new Map<string, MonthlyBreakdown>();
  if (data?.monthly_breakdown) {
    data.monthly_breakdown.forEach((item) => {
      dataMap.set(
        item.parsedMonthDate
          ? new Date(item.parsedMonthDate)
              .toLocaleString('en-US', { month: 'short' })
              .toLowerCase() +
              ' ' +
              new Date(item.parsedMonthDate).getFullYear()
          : '',
        item
      );
    });
  }

  return (
    <div className="p-8 animate-fade-in relative min-h-[calc(100vh-4rem)] bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">EOD Analysis</h1>
          <p className="text-gray-600">
            Detailed month-wise analysis of transactions
          </p>
        </div>
        {/* <BsaDownloadButton
          fromDate={appliedFromDate || fromDate}
          toDate={appliedToDate || toDate}
        /> */}
      </div>
      <BankAccountDetails />
      {showScrollHint && (
        <div
          className="mt-4 flex justify-center animate-bounce transition-opacity duration-500"
          ref={containerRef}
        >
          <p className="text-sm text-gray-500">
            Scroll up to view{' '}
            <span className="font-medium">Monthly Overview</span>
          </p>
        </div>
      )}
      {dateRangeData && (
        <Card className="mb-8 shadow-sm border-black/20 bg-white">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  From Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full justify-start text-left font-normal bg-white border-black/20',
                        !fromDate && 'text-gray-400'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fromDate ? (
                        format(new Date(fromDate + 'T00:00:00'), 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      captionLayout="dropdown"
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
                          return false;
                        const from = new Date(
                          dateRangeData.from_date + 'T00:00:00'
                        );
                        from.setHours(0, 0, 0, 0);
                        const to = new Date(
                          dateRangeData.to_date + 'T00:00:00'
                        );
                        to.setHours(23, 59, 59, 999);
                        return date < from || date > to;
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-sm font-medium text-gray-700">
                  To Date
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-full justify-start text-left font-normal bg-white border-black/20',
                        !toDate && 'text-gray-400'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {toDate ? (
                        format(new Date(toDate + 'T00:00:00'), 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      captionLayout="dropdown"
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
                          return false;
                        const from = new Date(
                          dateRangeData.from_date + 'T00:00:00'
                        );
                        from.setHours(0, 0, 0, 0);
                        const to = new Date(
                          dateRangeData.to_date + 'T00:00:00'
                        );
                        to.setHours(23, 59, 59, 999);
                        return date < from || date > to;
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleApply}
                  className="bg-[#002366] hover:bg-[#001744] text-white gap-2"
                >
                  <Filter className="w-4 h-4" /> Apply Filter
                </Button>
                <Button
                  onClick={handleClear}
                  variant="outline"
                  className="gap-2 border-black/20 text-black hover:bg-black/5"
                >
                  <X className="w-4 h-4" /> Clear
                </Button>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              * You can select a maximum date range of 12 months.
              {dateRangeData && (
                <span className="ml-1">
                  Available data range:{' '}
                  {format(
                    new Date(dateRangeData.from_date + 'T00:00:00'),
                    'PPP'
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

      <Card className="shadow-lg border-black/20 bg-white overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between bg-gray-50 border-b pb-4">
          <div>
            <CardTitle className="text-xl text-black">
              Overview Details
            </CardTitle>
            <CardDescription>
              {appliedFromDate && appliedToDate && (
                <>
                  From {format(new Date(appliedFromDate + 'T00:00:00'), 'PPP')}{' '}
                  To {format(new Date(appliedToDate + 'T00:00:00'), 'PPP')}
                </>
              )}
            </CardDescription>
          </div>
          {dateRangeData && (
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
              className="gap-2 border-black/20 text-black hover:bg-black/5"
            >
              <RefreshCcw
                className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-gray-600">
              <Loader2 className="h-8 w-8 animate-spin text-black mb-4" />
              <p>Loading overview data...</p>
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-red-700">
              <p>
                Error loading data: {(error as any)?.message || 'Unknown error'}
              </p>
              <Button
                onClick={() => refetch()}
                variant="outline"
                className="mt-4 border-black/20 text-black hover:bg-black/5"
              >
                Try Again
              </Button>
            </div>
          ) : data ? (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr className="bg-[#002366] text-white text-xs">
                    <th className="px-4 py-3 border border-black/20 font-medium whitespace-nowrap w-[300px] min-w-[300px] max-w-[300px] sticky left-0 bg-[#002366] z-20">
                      Particulars
                    </th>
                    <th className="px-4 py-3 border border-black/20 font-bold whitespace-nowrap text-right">
                      Overall/Total
                    </th>
                    {expectedMonths.map((month) => (
                      <th
                        key={month}
                        className="px-4 py-3 border border-black/20 font-bold whitespace-nowrap text-center capitalize"
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
                        <tr key={index} className="h-1.5 bg-[#002366]">
                          <td colSpan={expectedMonths.length + 2}></td>
                        </tr>
                      );
                    }

                    const labelContent = (
                      <div
                        className={`flex justify-between items-center w-full ${row.isRed ? 'text-red-700' : 'text-black'}`}
                      >
                        <span>{row.label}</span>
                        {row.extraLabel && (
                          <span className="text-xs font-normal text-gray-600 ml-2">
                            {row.extraLabel}
                          </span>
                        )}
                      </div>
                    );

                    const cellClass = `px-4 py-2.5 border border-black/20 ${row.isRed ? 'text-red-700' : 'text-black'} ${row.isItalic ? 'italic' : ''} ${row.isBold ? 'font-bold' : ''}`;
                    const bgClass = row.isGreyBg ? 'bg-gray-100' : 'bg-white';

                    return (
                      <tr
                        key={index}
                        className={`hover:bg-gray-50 transition-colors ${bgClass}`}
                      >
                        <td
                          className={`px-4 py-2.5 border border-black/20 w-[300px] min-w-[300px] max-w-[300px] sticky left-0 z-10 ${row.isBold ? 'font-bold' : 'font-medium'} ${row.isGreyBg ? 'bg-gray-100' : 'bg-white'}`}
                        >
                          {labelContent}
                        </td>
                        <td
                          className={`text-right ${cellClass} font-bold ${getNumericColorClass(getOverallValue(data, row.overallKey || null), !!row.isCurrency, !!row.isPercent)}`}
                        >
                          {formatValue(
                            getOverallValue(data, row.overallKey || null),
                            !!row.isCurrency,
                            !!row.isPercent
                          )}
                        </td>
                        {expectedMonths.map((month) => {
                          const monthData = dataMap.get(month);
                          const val =
                            monthData && row.monthKey
                              ? monthData[row.monthKey]
                              : undefined;
                          return (
                            <td
                              key={month}
                              className={`text-right ${cellClass} ${getNumericColorClass(val, !!row.isCurrency, !!row.isPercent)}`}
                            >
                              {formatValue(
                                val,
                                !!row.isCurrency,
                                !!row.isPercent
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : dateRangeData ? (
            <div className="p-8 text-center text-gray-600">
              Select date range and apply filter
            </div>
          ) : (
            <div className="p-8 text-center text-gray-600">
              <Loader2 className="item-center m-auto h-8 w-8 animate-spin text-black mb-4" />
              <p className="text-gray-600">
                No data available yet. Please upload a bank statement, or wait
                while your uploaded statement is being processed.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
