import { Plus, RefreshCw, Search, SlidersHorizontal, RotateCw, Briefcase, IndianRupee, MoreVertical, ExternalLink } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { DatePicker } from '@/components/ui/date-picker'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Badge } from '@/components/ui/badge'
import {
  useQuery,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query'
import type { Deal } from '@/types'
import { ENV } from '@/conf'
import users from '@/utils/users.json'
import Pagination from '@/components/shared/pagination'
import { formatExactDate } from '@/utils/date-formatter'
import HighlightedText from '@/components/shared/highlighted-text'
import ExportCsvButton from '@/components/shared/export-csv-button'
import UploadCsv from '@/components/deals/csv-upload'
import LENDER_NAMES from '@/utils/lenders.json'
import { MultiSelect, type Option } from '@/components/ui/multi-select'
import { useManageColumns } from '@/hooks/use-manage-columns'
import { ManageColumnsDialog } from '@/components/shared/manage-columns'
import { formatAmount } from '@/utils/number-formatter'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const DEFAULT_COLUMNS = [
  { id: 'deal_name', label: 'Deal Name', selected: true },
  { id: 'account_name', label: 'Account Name', selected: true },
  { id: 'deal_owner', label: 'Deal Owner', selected: true },
  { id: 'lender_name', label: 'Lender Name', selected: true },
  { id: 'case_status', label: 'Case Status', selected: true },
  { id: 'ticket_login', label: 'Ticket Login', selected: true },
  { id: 'type_of_loan', label: 'Type of Loan', selected: true },
  { id: 'type_of_case_login', label: 'Type of Case Login', selected: true },
  { id: 'deal_type', label: 'Deal Type', selected: true },
  { id: 'amount_required', label: 'Amount Required', selected: true },
  { id: 'partner_name', label: 'Partner Name', selected: true },
  {
    id: 'deal_expected_closing',
    label: 'Expected Closing Date',
    selected: true,
  },
  { id: 'deal_status_closing', label: 'Deal Status Closing', selected: true },
  { id: 'modified_time', label: 'Modified At', selected: true },
]

const LOAN_TYPES = [
  'SCF',
  'SCF Renewal',
  'SCF Enhancement',
  'SCF (Renewal and Enhancement)',
  'Open SCF',
  'Open SCF Renewal',
  'Open SCF Enhancement',
  'Open SCF (Renewal and Enhancement)',
  'BT-SCF',
  'BT-Open SCF',
  'Unsecured OD',
  'Unsecured Term Loan',
  'Secured Loan',
  'Secured BT',
  'Vehicle Loan',
]

const CASE_STATUSES = [
  'Yet to Lender Login',
  'Lender Review',
  'In Credit',
  'Approved',
  'Disbursed',
  'Rejected',
  'Not Interested',
]

const TYPE_OF_CASE_LOGIN = ['Fresh', 'Spillover']

const TICKET_LOGIN = [
  'Approved',
  'Disapproved',
  'L1 Pendency',
  'L2 Pendency',
  'L3 Pendency',
  'Rejected',
]

const LOAN_TYPE_OPTIONS: Option[] = LOAN_TYPES.map((val) => ({
  value: val,
  label: val,
}))
const CASE_STATUS_OPTIONS: Option[] = CASE_STATUSES.map((val) => ({
  value: val,
  label: val,
}))
const TYPE_OF_CASE_LOGIN_OPTIONS: Option[] = TYPE_OF_CASE_LOGIN.map((val) => ({
  value: val,
  label: val,
}))
const TICKET_LOGIN_OPTIONS: Option[] = TICKET_LOGIN.map((val) => ({
  value: val,
  label: val,
}))
const LENDER_OPTIONS: Option[] = LENDER_NAMES.map((val) => ({
  value: val,
  label: val,
}))

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

const getDealStatusBadgeStyle = (status?: string | null) => {
  if (!status) return 'bg-slate-100 text-slate-600 border-slate-200'
  const s = status.toLowerCase()
  if (s.includes('approved') || s.includes('disbursed')) {
    return 'bg-emerald-100 text-emerald-700 border-emerald-200 font-medium'
  }
  if (s.includes('review') || s.includes('credit')) {
    return 'bg-blue-100 text-blue-700 border-blue-200 font-medium'
  }
  if (s.includes('login') || s.includes('fresh')) {
    return 'bg-amber-100 text-amber-700 border-amber-200 font-medium'
  }
  if (s.includes('rejected') || s.includes('not interested')) {
    return 'bg-red-100 text-red-700 border-red-200 font-medium'
  }
  return 'bg-slate-100 text-slate-700 border-slate-200 font-medium'
}

export default function DealsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const [pageSize, setPageSize] = useState<number>(25)

  const { columns, savePreferences, resetToDefault } = useManageColumns(
    'deals',
    DEFAULT_COLUMNS,
  )

  const visibleColumns = columns.filter((c) => c.selected)

  const [filters, setFilters] = useState({
    accountName: searchParams.get('accountName') || '',
    lenderName: [] as Option[],
    caseStatus: [] as Option[],
    ticketLogin: [] as Option[],
    loanType: [] as Option[],
    typeOfCaseLogin: [] as Option[],
    dealOwnerId: [] as Option[],
    createdFrom: searchParams.get('createdFrom') || '',
    createdTo: searchParams.get('createdTo') || '',
    expectedClosingFrom: searchParams.get('expectedClosingFrom') || '',
    expectedClosingTo: searchParams.get('expectedClosingTo') || '',
    statusClosingFrom: searchParams.get('statusClosingFrom') || '',
    statusClosingTo: searchParams.get('statusClosingTo') || '',
  })

  const [appliedFilters, setAppliedFilters] = useState(filters)

  const [currentPage, setCurrentPage] = useState(() => {
    const page = searchParams.get('page')
    return page ? parseInt(page) : 1
  })

  const { data: ownerResponse, isSuccess } = useQuery({
    queryKey: ['deal-owners'],
    queryFn: async () => {
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/user/filter`, {
        credentials: 'include',
      })
      if (res.status === 403) return { forbidden: true }
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    retry: false,
  })

  const showOwnerFilter = isSuccess && !ownerResponse?.forbidden
  const owners = ownerResponse?.data ?? []

  useEffect(() => {
    const loadedFilters: Partial<typeof filters> = {}

    const ownerIds = searchParams.getAll('dealOwnerId')
    if (ownerIds.length > 0 && isSuccess && owners.length > 0) {
      loadedFilters.dealOwnerId = ownerIds.map((id) => {
        const o = owners.find((owner: any) => owner.id.toString() === id)
        return { value: id, label: o ? o.full_name : id }
      })
    }

    const statuses = searchParams.getAll('caseStatus')
    if (statuses.length > 0) {
      loadedFilters.caseStatus = statuses.map((val) => {
        const matched = CASE_STATUS_OPTIONS.find((o) => o.value === val)
        return { value: val, label: matched ? matched.label : val }
      })
    }

    const logins = searchParams.getAll('ticketLogin')
    if (logins.length > 0) {
      loadedFilters.ticketLogin = logins.map((val) => {
        const matched = TICKET_LOGIN_OPTIONS.find((o) => o.value === val)
        return { value: val, label: matched ? matched.label : val }
      })
    }

    const loans = searchParams.getAll('loanType')
    if (loans.length > 0) {
      loadedFilters.loanType = loans.map((val) => {
        const matched = LOAN_TYPE_OPTIONS.find((o) => o.value === val)
        return { value: val, label: matched ? matched.label : val }
      })
    }

    const cases = searchParams.getAll('typeOfCaseLogin')
    if (cases.length > 0) {
      loadedFilters.typeOfCaseLogin = cases.map((val) => {
        const matched = TYPE_OF_CASE_LOGIN_OPTIONS.find((o) => o.value === val)
        return { value: val, label: matched ? matched.label : val }
      })
    }

    const lenders = searchParams.getAll('lenderName')
    if (lenders.length > 0) {
      loadedFilters.lenderName = lenders.map((val) => {
        const matched = LENDER_OPTIONS.find((o) => o.value === val)
        return { value: val, label: matched ? matched.label : val }
      })
    }

    if (Object.keys(loadedFilters).length > 0) {
      setFilters((prev) => ({ ...prev, ...loadedFilters }))
      setAppliedFilters((prev) => ({ ...prev, ...loadedFilters }))
    }
  }, [isSuccess, owners, searchParams])

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['deals', currentPage, appliedFilters, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('page', currentPage.toString())
      params.set('page_size', pageSize.toString())

      if (appliedFilters.accountName)
        params.set('account_name', appliedFilters.accountName)
      if (appliedFilters.lenderName && appliedFilters.lenderName.length > 0) {
        appliedFilters.lenderName.forEach((o: Option) =>
          params.append('lender_name', o.value),
        )
      }
      if (appliedFilters.caseStatus && appliedFilters.caseStatus.length > 0) {
        appliedFilters.caseStatus.forEach((o: Option) =>
          params.append('case_status', o.value),
        )
      }
      if (appliedFilters.ticketLogin && appliedFilters.ticketLogin.length > 0) {
        appliedFilters.ticketLogin.forEach((o: Option) =>
          params.append('ticket_login', o.value),
        )
      }
      if (appliedFilters.loanType && appliedFilters.loanType.length > 0) {
        appliedFilters.loanType.forEach((o: Option) =>
          params.append('loan_type', o.value),
        )
      }
      if (
        appliedFilters.typeOfCaseLogin &&
        appliedFilters.typeOfCaseLogin.length > 0
      ) {
        appliedFilters.typeOfCaseLogin.forEach((o: Option) =>
          params.append('type_of_case_login', o.value),
        )
      }
      if (appliedFilters.dealOwnerId && appliedFilters.dealOwnerId.length > 0) {
        appliedFilters.dealOwnerId.forEach((o: Option) =>
          params.append('deal_owner_id', o.value),
        )
      }

      if (appliedFilters.createdFrom)
        params.set('created_from', appliedFilters.createdFrom)
      if (appliedFilters.createdTo)
        params.set('created_to', appliedFilters.createdTo)
      if (appliedFilters.expectedClosingFrom)
        params.set('expected_closing_from', appliedFilters.expectedClosingFrom)
      if (appliedFilters.expectedClosingTo)
        params.set('expected_closing_to', appliedFilters.expectedClosingTo)
      if (appliedFilters.statusClosingFrom)
        params.set('status_closing_from', appliedFilters.statusClosingFrom)
      if (appliedFilters.statusClosingTo)
        params.set('status_closing_to', appliedFilters.statusClosingTo)

      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/deals?${params.toString()}`,
        { credentials: 'include' },
      )
      if (!res.ok) throw new Error('Failed to fetch deals')
      return res.json()
    },
    placeholderData: keepPreviousData,
  })

  const DealsData: Deal[] = data?.data || []
  const pageInfo = data?.page_info || { page: 1, total_pages: 1, data_size: 0 }
  const totalCount = pageInfo.data_size || (pageInfo.total_pages ? pageInfo.total_pages * pageSize : DealsData.length)

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleSearch = () => {
    const params = new URLSearchParams()
    params.set('page', '1')
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item: Option) => {
          params.append(key, item.value)
        })
      } else if (value) {
        params.set(key, String(value))
      }
    })
    setSearchParams(params)
    setAppliedFilters(filters)
    setCurrentPage(1)
  }

  const handleClear = () => {
    const emptyFilters = {
      accountName: '',
      lenderName: [] as Option[],
      caseStatus: [] as Option[],
      ticketLogin: [] as Option[],
      loanType: [] as Option[],
      typeOfCaseLogin: [] as Option[],
      dealOwnerId: [] as Option[],
      createdFrom: '',
      createdTo: '',
      expectedClosingFrom: '',
      expectedClosingTo: '',
      statusClosingFrom: '',
      statusClosingTo: '',
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

  const handleRowClick = async (id: string) => {
    try {
      await queryClient.ensureQueryData({
        queryKey: ['deal', id],
        queryFn: async () => {
          const res = await fetch(
            `${ENV.VITE_BACKEND_BASE_URL}/deals?deal_id=${id}`,
            { credentials: 'include' },
          )
          if (!res.ok) throw new Error('Failed to fetch deal')
          return res.json()
        },
      })
      window.open(`${window.location.origin}/deals/${id}`, '_blank')
    } catch {
      window.open(`${window.location.origin}/deals/${id}`, '_blank')
    }
  }

  return (
    <div className='flex flex-col h-screen overflow-hidden bg-slate-50/50 dark:bg-background'>
      {/* ── Top Header Bar ── */}
      <div className='bg-background border-b border-border/60 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-2xs'>
        <div>
          <h1 className='text-2xl font-bold text-foreground tracking-tight'>Deals</h1>
          <p className='text-xs text-muted-foreground mt-0.5'>
            Manage and track all loan & credit deals in your pipeline.
          </p>
        </div>

        <div className='flex items-center gap-4'>
          {/* Stat Card: Total Deals */}
          <div className='flex items-center gap-3 bg-muted/40 border border-border/50 rounded-xl px-4 py-2 shadow-2xs'>
            <div className='h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0'>
              <Briefcase className='h-5 w-5' />
            </div>
            <div className='flex flex-col'>
              <span className='text-[11px] font-medium text-muted-foreground uppercase tracking-wider'>
                Total Deals
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
              onClick={() => navigate('/deals-create')}
              className='bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium text-xs rounded-lg px-4 h-9 gap-1.5 cursor-pointer'
            >
              <Plus className='h-4 w-4' /> Create Deal
            </Button>
            <UploadCsv isLoading={isLoading} refetch={refetch} />
            <ExportCsvButton
              module='deals'
              appliedFilters={appliedFilters}
              currentPage={currentPage}
            />
            <Button
              variant='outline'
              size='icon'
              onClick={() => refetch()}
              title='Refresh deals'
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

            {/* Quick Select: Case Status */}
            <div className='w-[150px]'>
              <Select
                value={
                  filters.caseStatus.length === 1
                    ? filters.caseStatus[0].value
                    : 'all'
                }
                onValueChange={(val) => {
                  const updatedStatus = val === 'all' ? [] : [{ value: val, label: val }]
                  const newFilters = { ...filters, caseStatus: updatedStatus }
                  setFilters(newFilters)
                  setAppliedFilters(newFilters)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className='h-9 text-xs rounded-lg bg-background'>
                  <SelectValue placeholder='All Case Statuses' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Case Statuses</SelectItem>
                  {CASE_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <span className='text-xs font-medium'>Loading deals...</span>
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
                  {DealsData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={visibleColumns.length + 1}
                        className='text-center h-36 text-muted-foreground text-sm'
                      >
                        No deals found matching your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    DealsData.map((deal) => {
                      const dealName = deal.deal_name || `Deal #${deal.id}`
                      const initialColorClass = getInitialAvatarColor(dealName)
                      const ownerName = (users as Record<string, string>)[deal.deal_owner_id] || deal.deal_owner || '—'
                      const statusStyle = getDealStatusBadgeStyle(deal.case_status)

                      return (
                        <TableRow
                          key={deal.id}
                          className='cursor-pointer transition-colors border-b border-border/40 hover:bg-slate-50/80 dark:hover:bg-muted/30'
                          onClick={() => handleRowClick(deal.id.toString())}
                        >
                          {visibleColumns.map((col: any) => {
                            switch (col.id) {
                              case 'deal_name':
                                return (
                                  <TableCell key={col.id} className='py-3.5'>
                                    <div className='flex items-center gap-3'>
                                      <div
                                        className={`h-8 w-8 rounded-full border ${initialColorClass} font-semibold text-xs flex items-center justify-center shrink-0 shadow-2xs`}
                                      >
                                        {dealName.charAt(0).toUpperCase()}
                                      </div>
                                      <span className='font-semibold text-foreground text-xs hover:text-blue-600 transition-colors'>
                                        {dealName}
                                      </span>
                                    </div>
                                  </TableCell>
                                )

                              case 'account_name':
                                return (
                                  <TableCell key={col.id} className='text-xs font-medium text-blue-600 dark:text-blue-400 py-3.5'>
                                    <HighlightedText
                                      text={deal.account_name}
                                      highlight={appliedFilters.accountName}
                                    />
                                  </TableCell>
                                )

                              case 'deal_owner':
                                return (
                                  <TableCell key={col.id} className='py-3.5'>
                                    <div className='flex items-center gap-2'>
                                      <Avatar className='h-6 w-6 border border-border/60'>
                                        <AvatarFallback className='text-[10px] bg-slate-200 text-slate-700 font-semibold'>
                                          {ownerName !== '—'
                                            ? ownerName
                                                .split(' ')
                                                .map((n: string) => n[0])
                                                .slice(0, 2)
                                                .join('')
                                            : 'U'}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className='text-xs font-medium text-slate-700 dark:text-slate-200'>
                                        {ownerName}
                                      </span>
                                    </div>
                                  </TableCell>
                                )

                              case 'lender_name':
                                return (
                                  <TableCell key={col.id} className='text-xs text-muted-foreground py-3.5'>
                                    {deal.lender_name || '—'}
                                  </TableCell>
                                )

                              case 'case_status':
                                return (
                                  <TableCell key={col.id} className='py-3.5'>
                                    {deal.case_status ? (
                                      <Badge
                                        variant='outline'
                                        className={`rounded-full px-3 py-0.5 text-[11px] font-medium border border-transparent shadow-2xs ${statusStyle}`}
                                      >
                                        {deal.case_status}
                                      </Badge>
                                    ) : (
                                      <span className='text-xs text-muted-foreground'>—</span>
                                    )}
                                  </TableCell>
                                )

                              case 'ticket_login':
                                return (
                                  <TableCell key={col.id} className='text-xs text-muted-foreground py-3.5'>
                                    {deal.ticket_login || '—'}
                                  </TableCell>
                                )

                              case 'type_of_loan':
                                return (
                                  <TableCell key={col.id} className='text-xs text-slate-700 dark:text-slate-300 font-medium py-3.5'>
                                    {deal.type_of_loan || '—'}
                                  </TableCell>
                                )

                              case 'type_of_case_login':
                                return (
                                  <TableCell key={col.id} className='text-xs text-muted-foreground py-3.5'>
                                    {deal.type_of_case_login || '—'}
                                  </TableCell>
                                )

                              case 'deal_type':
                                return (
                                  <TableCell key={col.id} className='text-xs text-muted-foreground py-3.5'>
                                    {deal.deal_type || '—'}
                                  </TableCell>
                                )

                              case 'amount_required':
                                return (
                                  <TableCell key={col.id} className='text-xs font-semibold text-emerald-600 dark:text-emerald-400 py-3.5'>
                                    {formatAmount(deal.amount_required)}
                                  </TableCell>
                                )

                              case 'partner_name':
                                return (
                                  <TableCell key={col.id} className='text-xs text-muted-foreground py-3.5'>
                                    {deal.partner_name || '—'}
                                  </TableCell>
                                )

                              case 'deal_expected_closing':
                                return (
                                  <TableCell key={col.id} className='text-xs text-muted-foreground py-3.5'>
                                    {deal.deal_expected_closing
                                      ? formatExactDate(deal.deal_expected_closing, 'dd MMM yyyy')
                                      : '—'}
                                  </TableCell>
                                )

                              case 'deal_status_closing':
                                return (
                                  <TableCell key={col.id} className='text-xs text-muted-foreground py-3.5'>
                                    {deal.deal_status_closing || '—'}
                                  </TableCell>
                                )

                              case 'modified_time':
                                return (
                                  <TableCell key={col.id} className='text-xs text-muted-foreground py-3.5'>
                                    {deal.modified_time
                                      ? formatExactDate(deal.modified_time, 'dd MMM yyyy')
                                      : '—'}
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
                                  onClick={() => handleRowClick(deal.id.toString())}
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
                {DealsData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
              </span>{' '}
              to{' '}
              <span className='text-foreground font-semibold'>
                {Math.min(currentPage * pageSize, totalCount)}
              </span>{' '}
              of <span className='text-foreground font-semibold'>{totalCount.toLocaleString()}</span> deals
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
            <SheetTitle className='text-base font-bold text-foreground'>Filter Deals</SheetTitle>
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
            {showOwnerFilter && (
              <div className='space-y-1.5'>
                <Label className='text-xs font-semibold text-foreground'>Deal Owner</Label>
                <MultiSelect
                  options={owners.map((owner: any) => ({
                    label: owner.full_name,
                    value: owner.id.toString(),
                  }))}
                  value={filters.dealOwnerId}
                  onChange={(val) => handleFilterChange('dealOwnerId', val)}
                  placeholder='Select Deal Owners...'
                />
              </div>
            )}

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
              <MultiSelect
                options={LENDER_OPTIONS}
                value={filters.lenderName}
                onChange={(val) => handleFilterChange('lenderName', val)}
                placeholder='Select Lenders...'
              />
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold text-foreground'>Case Status</Label>
              <MultiSelect
                options={CASE_STATUS_OPTIONS}
                value={filters.caseStatus}
                onChange={(val) => handleFilterChange('caseStatus', val)}
                placeholder='Select Case Status...'
              />
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold text-foreground'>Ticket Login</Label>
              <MultiSelect
                options={TICKET_LOGIN_OPTIONS}
                value={filters.ticketLogin}
                onChange={(val) => handleFilterChange('ticketLogin', val)}
                placeholder='Select Ticket Login...'
              />
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold text-foreground'>Type of Loan</Label>
              <MultiSelect
                options={LOAN_TYPE_OPTIONS}
                value={filters.loanType}
                onChange={(val) => handleFilterChange('loanType', val)}
                placeholder='Select Loan Type...'
              />
            </div>

            <div className='space-y-[1.5px] pt-2 border-t border-border/60'>
              <Label className='text-xs font-semibold text-foreground block mb-2'>
                Created Date Range
              </Label>
              <div className='grid grid-cols-2 gap-2'>
                <DatePicker
                  value={filters.createdFrom}
                  onChange={(val) => handleFilterChange('createdFrom', val)}
                  placeholder='From Date'
                />
                <DatePicker
                  value={filters.createdTo}
                  onChange={(val) => handleFilterChange('createdTo', val)}
                  placeholder='To Date'
                />
              </div>
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
