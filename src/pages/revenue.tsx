import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DatePicker } from '@/components/ui/date-picker'
import { Label } from '@/components/ui/label'
import Pagination from '@/components/shared/pagination'
import { ENV } from '@/conf'
import { format, parse } from 'date-fns'

import { Button } from '@/components/ui/button'
import HighlightedText from '@/components/shared/highlighted-text'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import {
  useQuery,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, SlidersHorizontal, RotateCw, IndianRupee, MoreVertical, ExternalLink } from 'lucide-react'
import { useManageColumns } from '@/hooks/use-manage-columns'
import { ManageColumnsDialog } from '@/components/shared/manage-columns'
import { formatAmount } from '@/utils/number-formatter'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const DEFAULT_COLUMNS = [
  { id: 'account_name', label: 'Account Name', selected: true },
  { id: 'lender_name', label: 'Lender Name', selected: true },
  { id: 'reference_number', label: 'Reference Number', selected: true },
  { id: 'income_booking_date', label: 'Income Booking Date', selected: true },
  { id: 'type_of_revenue', label: 'Type of Revenue', selected: true },
  { id: 'amount', label: 'Amount', selected: true },
  { id: 'gst_amount', label: 'GST Amount', selected: true },
]

const getInitialAvatarColor = (name: string) => {
  if (!name) return 'bg-purple-100 text-purple-700 border-purple-200'
  const char = name.trim().charAt(0).toUpperCase()
  if (['A', 'B', 'C', 'D'].includes(char)) return 'bg-blue-100 text-blue-700 border-blue-200'
  if (['E', 'F', 'G', 'H'].includes(char)) return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  if (['I', 'J', 'K', 'L'].includes(char)) return 'bg-purple-100 text-purple-700 border-purple-200'
  if (['M', 'N', 'O', 'P'].includes(char)) return 'bg-rose-100 text-rose-700 border-rose-200'
  if (['Q', 'R', 'S', 'T'].includes(char)) return 'bg-indigo-100 text-indigo-700 border-indigo-200'
  return 'bg-amber-100 text-amber-700 border-amber-200'
}

export default function RevenuePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [pageSize, setPageSize] = useState<number>(25)

  const [filters, setFilters] = useState({
    accountName: searchParams.get('accountName') || '',
    lenderName: searchParams.get('lenderName') || '',
    referenceNumber: searchParams.get('referenceNumber') || '',
    incomeBookingDate: searchParams.get('incomeBookingDate') || '',
    typeOfRevenue: searchParams.get('typeOfRevenue') || '',
    amount: searchParams.get('amount') || '',
    gstAmount: searchParams.get('gstAmount') || '',
  })

  const { columns, savePreferences, resetToDefault } = useManageColumns(
    'revenue',
    DEFAULT_COLUMNS,
  )

  const visibleColumns = columns.filter((c) => c.selected)

  const [appliedFilters, setAppliedFilters] = useState(filters)

  const [currentPage, setCurrentPage] = useState(() => {
    const page = searchParams.get('page')
    return page ? Number(page) : 1
  })

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['revenues', currentPage, appliedFilters, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('page', currentPage.toString())
      params.set('page_size', pageSize.toString())

      if (appliedFilters.accountName)
        params.set('account_name', appliedFilters.accountName)
      if (appliedFilters.lenderName)
        params.set('lender_name', appliedFilters.lenderName)
      if (appliedFilters.referenceNumber)
        params.set('reference_number', appliedFilters.referenceNumber)
      if (appliedFilters.incomeBookingDate)
        params.set('income_booking_date', appliedFilters.incomeBookingDate)
      if (appliedFilters.typeOfRevenue)
        params.set('type_of_revenue', appliedFilters.typeOfRevenue)
      if (appliedFilters.amount) params.set('amount', appliedFilters.amount)
      if (appliedFilters.gstAmount)
        params.set('gst_amount', appliedFilters.gstAmount)

      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/revenue?${params.toString()}`,
        { credentials: 'include' },
      )

      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    placeholderData: keepPreviousData,
  })

  const revenues = data?.data || []
  const pageInfo = data?.page_info || { page: 1, total_pages: 1, data_size: 0 }
  const totalCount = pageInfo.data_size || (pageInfo.total_pages ? pageInfo.total_pages * pageSize : revenues.length)

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleSearch = () => {
    const params = new URLSearchParams()
    params.set('page', '1')

    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, String(value))
    })

    setSearchParams(params)
    setAppliedFilters(filters)
    setCurrentPage(1)
  }

  const handleClear = () => {
    const emptyFilters = {
      accountName: '',
      lenderName: '',
      referenceNumber: '',
      incomeBookingDate: '',
      typeOfRevenue: '',
      amount: '',
      gstAmount: '',
    }

    setFilters(emptyFilters)
    setAppliedFilters(emptyFilters)
    setSearchParams(new URLSearchParams())
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    const params = new URLSearchParams(searchParams)
    params.set('page', page.toString())
    setSearchParams(params)
  }

  const handleRowClick = async (id: string, lenderName?: string) => {
    try {
      await queryClient.ensureQueryData({
        queryKey: ['revenue', id],
        queryFn: async () => {
          const res = await fetch(
            `${ENV.VITE_BACKEND_BASE_URL}/revenue?revenue_id=${id}`,
            { credentials: 'include' },
          )
          if (!res.ok) throw new Error('Failed to fetch revenue')
          return res.json()
        },
      })
      navigate(`/revenue/${id}`, {
        state: {
          lenderName: lenderName || '',
        },
      })
    } catch {
      navigate(`/revenue/${id}`)
    }
  }

  return (
    <div className='flex flex-col h-screen overflow-hidden bg-slate-50/50 dark:bg-background'>
      {/* ── Top Header Bar ── */}
      <div className='bg-background border-b border-border/60 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-2xs'>
        <div>
          <h1 className='text-2xl font-bold text-foreground tracking-tight'>Revenue</h1>
          <p className='text-xs text-muted-foreground mt-0.5'>
            Track revenue bookings, fee income, and payouts across all accounts.
          </p>
        </div>

        <div className='flex items-center gap-4'>
          {/* Stat Card */}
          <div className='flex items-center gap-3 bg-muted/40 border border-border/50 rounded-xl px-4 py-2 shadow-2xs'>
            <div className='h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0'>
              <IndianRupee className='h-5 w-5' />
            </div>
            <div className='flex flex-col'>
              <span className='text-[11px] font-medium text-muted-foreground uppercase tracking-wider'>
                Total Revenue Entries
              </span>
              <span className='text-lg font-bold text-foreground leading-none mt-0.5'>
                {isLoading ? (
                  <Skeleton className='h-5 w-16 rounded' />
                ) : (
                  totalCount.toLocaleString()
                )}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex items-center gap-2.5'>
            <Button
              onClick={() => navigate('/revenue-create')}
              className='bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium text-xs rounded-lg px-4 h-9 gap-1.5 cursor-pointer'
            >
              <Plus className='h-4 w-4' /> Add Revenue
            </Button>
            <Button
              variant='outline'
              size='icon'
              onClick={() => refetch()}
              title='Refresh revenue'
              className='h-9 w-9 rounded-lg border-border/60 text-muted-foreground hover:text-foreground cursor-pointer'
            >
              <RotateCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Toolbar & Content Container ── */}
      <div className='flex-1 flex flex-col overflow-hidden p-6 gap-4'>
        {/* Quick Filter Control Toolbar */}
        <div className='bg-background rounded-xl border border-border/60 p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs shrink-0'>
          <div className='flex flex-wrap items-center gap-2.5 flex-1'>
            <div className='flex items-center gap-1.5'>
              <div className='relative w-full max-w-[240px]'>
                <Search className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search account name...'
                  value={filters.accountName}
                  onChange={(e) => handleFilterChange('accountName', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className='pl-9 h-9 text-xs rounded-lg bg-background'
                />
              </div>
              <Button
                size='sm'
                onClick={handleSearch}
                className='h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3.5 gap-1.5 cursor-pointer font-medium shadow-2xs'
              >
                <Search className='h-3.5 w-3.5' /> Search
              </Button>
            </div>

            <Button
              variant='outline'
              onClick={() => setIsFilterSheetOpen(true)}
              className='h-9 text-xs gap-1.5 rounded-lg border-border font-medium cursor-pointer hover:bg-muted/50'
            >
              <SlidersHorizontal className='h-3.5 w-3.5 text-muted-foreground' />
              Filters
            </Button>

            <Button
              variant='ghost'
              onClick={handleClear}
              className='h-9 text-xs text-blue-600 font-medium hover:bg-blue-50 hover:text-blue-700 cursor-pointer'
            >
              Clear
            </Button>
          </div>

          <div className='flex items-center gap-3'>
            {/* <div className='flex items-center gap-2 text-xs text-muted-foreground'>
              <span>Show</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(val) => setPageSize(Number(val))}
              >
                <SelectTrigger className='h-8 w-16 text-xs rounded-md bg-background px-2'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='10'>10</SelectItem>
                  <SelectItem value='25'>25</SelectItem>
                  <SelectItem value='50'>50</SelectItem>
                  <SelectItem value='100'>100</SelectItem>
                </SelectContent>
              </Select>
              <span>entries</span>
            </div> */}

            <ManageColumnsDialog
              columns={columns}
              onSave={savePreferences}
              onReset={resetToDefault}
            />
          </div>
        </div>

        {/* Table Container */}
        <div className='flex-1 bg-background rounded-xl border border-border/60 shadow-2xs overflow-hidden flex flex-col'>
          <div className='flex-1 overflow-auto'>
            {isLoading ? (
              <div className='flex flex-col items-center justify-center h-64 gap-2 text-muted-foreground'>
                <Spinner className='h-7 w-7 text-blue-600' />
                <span className='text-xs font-medium'>Loading revenue records...</span>
              </div>
            ) : (
              <Table>
                <TableHeader className='bg-slate-50/80 dark:bg-muted/30 sticky top-0 z-10 border-b border-border/60'>
                  <TableRow className='hover:bg-transparent'>
                    {visibleColumns.map((col: any) => (
                      <TableHead
                        key={col.id}
                        className='text-xs font-semibold text-muted-foreground tracking-wide py-3'
                      >
                        {col.label}
                      </TableHead>
                    ))}
                    <TableHead className='w-[48px] px-3' />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {revenues.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={visibleColumns.length + 1}
                        className='text-center h-36 text-muted-foreground text-sm'
                      >
                        No revenue entries found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    revenues.map((rev: any) => {
                      const accName = rev.account_name || 'Account'
                      const initialColorClass = getInitialAvatarColor(accName)

                      return (
                        <TableRow
                          key={rev.id}
                          className='cursor-pointer transition-colors border-b border-border/40 hover:bg-slate-50/80 dark:hover:bg-muted/30'
                          onClick={() => handleRowClick(rev.id, rev.lender_name)}
                        >
                          {visibleColumns.map((col: any) => {
                            switch (col.id) {
                              case 'account_name':
                                return (
                                  <TableCell key={col.id} className='py-3.5'>
                                    <div className='flex items-center gap-3'>
                                      <div
                                        className={`h-8 w-8 rounded-full border ${initialColorClass} font-semibold text-xs flex items-center justify-center shrink-0 shadow-2xs`}
                                      >
                                        {accName.charAt(0).toUpperCase()}
                                      </div>
                                      <span className='font-semibold text-foreground text-xs hover:text-blue-600 transition-colors'>
                                        <HighlightedText
                                          text={accName}
                                          highlight={appliedFilters.accountName}
                                        />
                                      </span>
                                    </div>
                                  </TableCell>
                                )

                              case 'lender_name':
                                return (
                                  <TableCell key={col.id} className='text-xs text-muted-foreground py-3.5'>
                                    <HighlightedText
                                      text={rev.lender_name}
                                      highlight={appliedFilters.lenderName}
                                    />
                                  </TableCell>
                                )

                              case 'reference_number':
                                return (
                                  <TableCell key={col.id} className='text-xs font-mono text-muted-foreground py-3.5'>
                                    <HighlightedText
                                      text={rev.reference_number}
                                      highlight={appliedFilters.referenceNumber}
                                    />
                                  </TableCell>
                                )

                              case 'income_booking_date':
                                return (
                                  <TableCell key={col.id} className='text-xs text-muted-foreground py-3.5'>
                                    {rev.income_booking_date
                                      ? format(
                                          parse(rev.income_booking_date, 'yyyy-MM-dd', new Date()),
                                          'dd-MM-yyyy',
                                        )
                                      : '—'}
                                  </TableCell>
                                )

                              case 'type_of_revenue':
                                return (
                                  <TableCell key={col.id} className='py-3.5'>
                                    <Badge variant='outline' className='bg-blue-50 text-blue-700 border-blue-200 rounded-full px-2.5 py-0.5 text-[11px] font-medium'>
                                      {rev.type_of_revenue || 'Standard'}
                                    </Badge>
                                  </TableCell>
                                )

                              case 'amount':
                                return (
                                  <TableCell key={col.id} className='text-xs font-bold text-emerald-600 dark:text-emerald-400 py-3.5'>
                                    {formatAmount(rev.amount)}
                                  </TableCell>
                                )

                              case 'gst_amount':
                                return (
                                  <TableCell key={col.id} className='text-xs font-medium text-slate-700 dark:text-slate-300 py-3.5'>
                                    {formatAmount(rev.gst_amount)}
                                  </TableCell>
                                )

                              default:
                                return <TableCell key={col.id} />
                            }
                          })}

                          <TableCell
                            className='w-[48px] px-3 py-3.5 text-center'
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  className='h-7 w-7 rounded-md text-muted-foreground hover:text-foreground cursor-pointer'
                                >
                                  <MoreVertical className='h-4 w-4' />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align='end' className='w-40'>
                                <DropdownMenuItem
                                  onClick={() => handleRowClick(rev.id, rev.lender_name)}
                                  className='text-xs cursor-pointer gap-2'
                                >
                                  <ExternalLink className='h-3.5 w-3.5' /> View Details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          <div className='px-5 py-3 border-t border-border/60 shrink-0 bg-background flex flex-col md:flex-row md:items-center justify-between gap-3'>
            <span className='text-xs text-muted-foreground font-medium'>
              Showing{' '}
              <span className='text-foreground font-semibold'>
                {revenues.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
              </span>{' '}
              to{' '}
              <span className='text-foreground font-semibold'>
                {Math.min(currentPage * pageSize, totalCount)}
              </span>{' '}
              of <span className='text-foreground font-semibold'>{totalCount.toLocaleString()}</span> entries
            </span>

            <Pagination
              currentPage={pageInfo.page || currentPage}
              totalPages={pageInfo.total_pages || 1}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>

      {/* ── Advanced Filters Side Sheet ── */}
      <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
        <SheetContent side='right' className='w-full sm:w-[500px] sm:max-w-none p-0 flex flex-col gap-0 border-l shadow-2xl bg-background'>
          <SheetHeader className='px-6 py-4 border-b border-border/60 flex flex-row items-center justify-between shrink-0 space-y-0'>
            <SheetTitle className='text-base font-bold text-foreground'>Filter Revenue</SheetTitle>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleClear}
              className='h-7 text-xs text-blue-600 font-medium hover:bg-blue-50 hover:text-blue-700 px-2'
            >
              Clear all
            </Button>
          </SheetHeader>

          <div className='flex-1 overflow-y-auto px-6 py-5 space-y-4'>
            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold text-foreground'>Account Name</Label>
              <Input
                placeholder='Search Account Name...'
                value={filters.accountName}
                onChange={(e) => handleFilterChange('accountName', e.target.value)}
                className='h-9 text-xs rounded-lg'
              />
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold text-foreground'>Lender Name</Label>
              <Input
                placeholder='Search Lender Name...'
                value={filters.lenderName}
                onChange={(e) => handleFilterChange('lenderName', e.target.value)}
                className='h-9 text-xs rounded-lg'
              />
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold text-foreground'>Reference Number</Label>
              <Input
                placeholder='Reference Number...'
                value={filters.referenceNumber}
                onChange={(e) => handleFilterChange('referenceNumber', e.target.value)}
                className='h-9 text-xs rounded-lg'
              />
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold text-foreground'>Income Booking Date</Label>
              <DatePicker
                value={filters.incomeBookingDate}
                onChange={(val) => handleFilterChange('incomeBookingDate', val)}
              />
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold text-foreground'>Type of Revenue</Label>
              <Input
                placeholder='Type of Revenue...'
                value={filters.typeOfRevenue}
                onChange={(e) => handleFilterChange('typeOfRevenue', e.target.value)}
                className='h-9 text-xs rounded-lg'
              />
            </div>
          </div>

          <SheetFooter className='p-4 border-t border-border/60 flex flex-row items-center justify-end gap-2 bg-slate-50/50 dark:bg-muted/20 shrink-0'>
            <Button
              variant='outline'
              onClick={() => setIsFilterSheetOpen(false)}
              className='h-9 text-xs rounded-lg px-4 cursor-pointer'
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                handleSearch()
                setIsFilterSheetOpen(false)
              }}
              className='h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 font-semibold cursor-pointer shadow-sm'
            >
              Apply Filters
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
