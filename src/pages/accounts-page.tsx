import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Label } from '@/components/ui/label'
import Pagination from '@/components/shared/pagination'
import { ENV } from '@/conf'

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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

import { Spinner } from '@/components/ui/spinner'
import { formatExactDate } from '@/utils/date-formatter'
import UploadCsv from '@/components/accounts/csv-upload'

import users from '@/utils/users.json'
import { useAuth } from '@/context/auth-context'
import type { Option } from '@/components/ui/multi-select'
import { useManageColumns } from '@/hooks/use-manage-columns'
import { ManageColumnsDialog } from '@/components/shared/manage-columns'
import { MultiSelect } from '@/components/ui/multi-select'
import { Checkbox } from '@/components/ui/checkbox'

const ACCOUNT_STATUS_OPTIONS: Option[] = [
  { value: 'Yet to be dialed', label: 'Yet to be dialed' },
  { value: 'Wrong Number', label: 'Wrong Number' },
  { value: 'Contact Established', label: 'Contact Established' },
  { value: 'Contact Not Established', label: 'Contact Not Established' },
  { value: 'Awareness', label: 'Awareness' },
  { value: 'Attention', label: 'Attention' },
  { value: 'Assessment', label: 'Assessment' },
  { value: 'Lender Review', label: 'Lender Review' },
  { value: 'Not Interested', label: 'Not Interested' },
  { value: 'Location Unserviceable', label: 'Location Unserviceable' },
]

const SOURCE_OPTIONS: Option[] = [
  { value: 'Himalaya', label: 'Himalaya' },
  { value: 'CavinKare', label: 'CavinKare' },
  {
    value: 'ALL INDIA CHEMISTS AND DRUGGISTS ASSOCIATION OF INDIA',
    label: 'ALL INDIA CHEMISTS AND DRUGGISTS ASSOCIATION OF INDIA',
  },
  {
    value: 'All India Hardware Association (Based in Mumbai Charni Road)',
    label: 'All India Hardware Association (Based in Mumbai Charni Road)',
  },
  { value: 'Alpharubix', label: 'Alpharubix' },
  { value: 'Condor Footwear', label: 'Condor Footwear' },
  { value: 'DVG Dist Petroleum', label: 'DVG Dist Petroleum' },
  {
    value:
      'Federation of Hotel and Restaurant Association of India (Based in New Delhi)',
    label:
      'Federation of Hotel and Restaurant Association of India (Based in New Delhi)',
  },
  { value: 'Havells', label: 'Havells' },
  { value: 'Liberty', label: 'Liberty' },
  { value: 'Marico', label: 'Marico' },
  { value: 'Reference', label: 'Reference' },
  {
    value: 'Retail Association of India',
    label: 'Retail Association of India',
  },
  { value: 'SME CHAMBER', label: 'SME CHAMBER' },
  { value: 'Swastik', label: 'Swastik' },
  { value: 'Unicharm', label: 'Unicharm' },
  { value: 'Vibhava Marketing', label: 'Vibhava Marketing' },
  { value: 'R1X Website', label: 'R1X Website' },
  { value: '5pointcredit', label: '5pointcredit' },
]

const INDUSTRY_OPTIONS: Option[] = [
  { value: 'Pharma', label: 'Pharma' },
  { value: 'AHP', label: 'AHP' },
  { value: 'CPD', label: 'CPD' },
  { value: 'FMCG', label: 'FMCG' },
  { value: 'OTX', label: 'OTX' },
  { value: 'Footwear', label: 'Footwear' },
  { value: 'OTC', label: 'OTC' },
  { value: 'RAAGA', label: 'RAAGA' },
  { value: 'Hardware', label: 'Hardware' },
  { value: 'Electronics', label: 'Electronics' },
  { value: 'DVG Dist Petroleum', label: 'DVG Dist Petroleum' },
]

const SOURCE_TYPE_OPTIONS: Option[] = [
  { value: 'Direct', label: 'Direct' },
  { value: 'Referral', label: 'Referral' },
  { value: 'Partner', label: 'Partner' },
  { value: 'Website', label: 'Website' },
  { value: 'Other', label: 'Other' },
]

const ACCOUNT_STAGE_OPTIONS: Option[] = [
  { value: 'Initial Pitch', label: 'Initial Pitch' },
  { value: 'Product Offering', label: 'Product Offering' },
  { value: 'Doc List Shared to Cust', label: 'Doc List Shared to Cust' },
  { value: 'Partial Docs Rec', label: 'Partial Docs Rec' },
  { value: 'Yet To Review', label: 'Yet To Review' },
  { value: 'Under Internal Review', label: 'Under Internal Review' },
  { value: 'In Review with Lender', label: 'In Review with Lender' },
  { value: 'Interested', label: 'Interested' },
  { value: 'Commercial NI', label: 'Commercial NI' },
  { value: 'Location not doable', label: 'Location not doable' },
  { value: 'No Requirement', label: 'No Requirement' },
]

const BUSINESS_STATUS_OPTIONS: Option[] = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'Not sure', label: 'Not sure' },
]

const DEFAULT_COLUMNS = [
  { id: 'account_name', label: 'Account Name', selected: true },
  { id: 'account_owner', label: 'Account Owner', selected: true },
  { id: 'account_status', label: 'Account Status', selected: true },
  { id: 'source', label: 'Source', selected: true },
  { id: 'type_of_business', label: 'Type of Business', selected: true },
  { id: 'industry', label: 'Industry', selected: true },
  { id: 'phone', label: 'Phone', selected: true },
  { id: 'city', label: 'City', selected: true },
  { id: 'state', label: 'State', selected: true },
  { id: 'business_status', label: 'Business Status', selected: true },
  { id: 'priority_account', label: 'Priority Account', selected: true },
  { id: 'source_date', label: 'Source Date', selected: true },
  { id: 'assignment_date', label: 'Assignment Date', selected: true },
  { id: 'modified_time', label: 'Modified At', selected: true },
]

export default function AccountsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const [filters, setFilters] = useState({
    accountName: searchParams.get('accountName') || '',
    accountStatus: [] as Option[],
    source: [] as Option[],
    industry: [] as Option[],
    phone: searchParams.get('phone') || '',
    city: searchParams.get('city') || '',
    state: searchParams.get('state') || '',
    accountOwnerId: [] as Option[],
    sourceType: [] as Option[],
    accountStage: [] as Option[],
    businessStatus: [] as Option[],
    wabaInterested: 'all',
    isPriorityAccount: 'all',
    cbCondition: 'Is',
    cbUsers: [] as Option[],
    cbDateCondition: 'all',
    cbFromDate: '',
    cbToDate: '',
    bsaFromDate: searchParams.get('bsaFromDate') || (searchParams.get('module') === 'bsa' ? searchParams.get('from_date') || '' : ''),
    bsaToDate: searchParams.get('bsaToDate') || (searchParams.get('module') === 'bsa' ? searchParams.get('to_date') || '' : ''),
    gstFromDate: searchParams.get('gstFromDate') || (searchParams.get('module') === 'gst' ? searchParams.get('from_date') || '' : ''),
    gstToDate: searchParams.get('gstToDate') || (searchParams.get('module') === 'gst' ? searchParams.get('to_date') || '' : ''),
    cibilFromDate: searchParams.get('cibilFromDate') || (searchParams.get('module') === 'cibil' ? searchParams.get('from_date') || '' : ''),
    cibilToDate: searchParams.get('cibilToDate') || (searchParams.get('module') === 'cibil' ? searchParams.get('to_date') || '' : ''),
    itrFromDate: searchParams.get('itrFromDate') || (searchParams.get('module') === 'itr' ? searchParams.get('from_date') || '' : ''),
    itrToDate: searchParams.get('itrToDate') || (searchParams.get('module') === 'itr' ? searchParams.get('to_date') || '' : ''),
  })

  const { columns, savePreferences, resetToDefault } = useManageColumns(
    'accounts',
    DEFAULT_COLUMNS,
  )

  const visibleColumns = columns.filter((c) => c.selected)

  const [appliedFilters, setAppliedFilters] = useState(filters)

  const [currentPage, setCurrentPage] = useState(() => {
    const page = searchParams.get('page')
    return page ? Number(page) : 1
  })

  const {
    data: ownerResponse,
    isSuccess,
    error,
  } = useQuery({
    queryKey: ['account-owners'],
    queryFn: async () => {
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/user/filter`, {
        credentials: 'include',
      })

      if (res.status === 403) {
        return { forbidden: true }
      }

      if (!res.ok) throw new Error('Failed')

      return res.json()
    },
    retry: false,
  })

  const showOwnerFilter = isSuccess && !ownerResponse?.forbidden

  const owners = ownerResponse?.data ?? []

  useEffect(() => {
    const loadedFilters: Partial<typeof filters> = {}

    const ownerIds = searchParams.getAll('accountOwnerId')
    if (ownerIds.length > 0 && isSuccess && owners.length > 0) {
      loadedFilters.accountOwnerId = ownerIds.map((id) => {
        const o = owners.find((owner: any) => owner.id.toString() === id)
        return { value: id, label: o ? o.full_name : id }
      })
    }

    const statuses = searchParams.getAll('accountStatus')
    if (statuses.length > 0) {
      loadedFilters.accountStatus = statuses.map((val) => {
        const matched = ACCOUNT_STATUS_OPTIONS.find((o) => o.value === val)
        return { value: val, label: matched ? matched.label : val }
      })
    }

    const srcs = searchParams.getAll('source')
    if (srcs.length > 0) {
      loadedFilters.source = srcs.map((val) => {
        const matched = SOURCE_OPTIONS.find((o) => o.value === val)
        return { value: val, label: matched ? matched.label : val }
      })
    }

    const inds = searchParams.getAll('industry')
    if (inds.length > 0) {
      loadedFilters.industry = inds.map((val) => {
        const matched = INDUSTRY_OPTIONS.find((o) => o.value === val)
        return { value: val, label: matched ? matched.label : val }
      })
    }

    if (Object.keys(loadedFilters).length > 0) {
      setFilters((prev) => ({ ...prev, ...loadedFilters }))
      setAppliedFilters((prev) => ({ ...prev, ...loadedFilters }))
    }
  }, [isSuccess, owners, searchParams])

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['accounts', currentPage, appliedFilters],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('page', currentPage.toString())

      if (appliedFilters.accountName)
        params.set('account_name', appliedFilters.accountName)
      if (
        appliedFilters.accountStatus &&
        appliedFilters.accountStatus.length > 0
      ) {
        appliedFilters.accountStatus.forEach((o: Option) =>
          params.append('account_status', o.value),
        )
      }
      if (appliedFilters.source && appliedFilters.source.length > 0) {
        appliedFilters.source.forEach((o: Option) =>
          params.append('source', o.value),
        )
      }
      if (appliedFilters.industry && appliedFilters.industry.length > 0) {
        appliedFilters.industry.forEach((o: Option) =>
          params.append('industry', o.value),
        )
      }
      if (appliedFilters.phone) params.set('phone', appliedFilters.phone)
      if (appliedFilters.city) params.set('city', appliedFilters.city)
      if (appliedFilters.state) params.set('state', appliedFilters.state)
      if (
        appliedFilters.accountOwnerId &&
        appliedFilters.accountOwnerId.length > 0
      ) {
        appliedFilters.accountOwnerId.forEach((o: Option) =>
          params.append('account_owner_id', o.value),
        )
      }
      if (appliedFilters.sourceType && appliedFilters.sourceType.length > 0) {
        appliedFilters.sourceType.forEach((o: Option) =>
          params.append('source_type', o.value),
        )
      }
      if (appliedFilters.accountStage && appliedFilters.accountStage.length > 0) {
        appliedFilters.accountStage.forEach((o: Option) =>
          params.append('account_stage', o.value),
        )
      }
      if (appliedFilters.businessStatus && appliedFilters.businessStatus.length > 0) {
        appliedFilters.businessStatus.forEach((o: Option) =>
          params.append('business_status', o.value),
        )
      }
      if (appliedFilters.wabaInterested && appliedFilters.wabaInterested !== 'all') {
        params.set('waba_interested', appliedFilters.wabaInterested)
      }
      if (appliedFilters.isPriorityAccount && appliedFilters.isPriorityAccount !== 'all') {
        params.set('is_priority_account', appliedFilters.isPriorityAccount)
      }
      if (appliedFilters.cbCondition) {
        params.set('cb_condition', appliedFilters.cbCondition)
      }
      if (appliedFilters.cbUsers && appliedFilters.cbUsers.length > 0) {
        appliedFilters.cbUsers.forEach((o: Option) =>
          params.append('cb_users', o.value),
        )
      }
      if (appliedFilters.cbDateCondition && appliedFilters.cbDateCondition !== 'all') {
        params.set('cb_date_condition', appliedFilters.cbDateCondition)
      }
      if (appliedFilters.cbDateCondition === 'Due Dates') {
        if (appliedFilters.cbFromDate) params.set('cb_from_date', appliedFilters.cbFromDate)
        if (appliedFilters.cbToDate) params.set('cb_to_date', appliedFilters.cbToDate)
      }
      // --- Underwriting Tool Backend Module Filters (BSA, GST, CIBIL, ITR) ---
      if (appliedFilters.bsaFromDate || appliedFilters.bsaToDate) {
        params.set('module', 'bsa')
        if (appliedFilters.bsaFromDate) params.set('from_date', appliedFilters.bsaFromDate)
        if (appliedFilters.bsaToDate) params.set('to_date', appliedFilters.bsaToDate)
      } else if (appliedFilters.gstFromDate || appliedFilters.gstToDate) {
        params.set('module', 'gst')
        if (appliedFilters.gstFromDate) params.set('from_date', appliedFilters.gstFromDate)
        if (appliedFilters.gstToDate) params.set('to_date', appliedFilters.gstToDate)
      } else if (appliedFilters.cibilFromDate || appliedFilters.cibilToDate) {
        params.set('module', 'cibil')
        if (appliedFilters.cibilFromDate) params.set('from_date', appliedFilters.cibilFromDate)
        if (appliedFilters.cibilToDate) params.set('to_date', appliedFilters.cibilToDate)
      } else if (appliedFilters.itrFromDate || appliedFilters.itrToDate) {
        params.set('module', 'itr')
        if (appliedFilters.itrFromDate) params.set('from_date', appliedFilters.itrFromDate)
        if (appliedFilters.itrToDate) params.set('to_date', appliedFilters.itrToDate)
      }

      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/accounts?${params.toString()}`,
        { credentials: 'include' },
      )

      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    placeholderData: keepPreviousData,
  })

  const accounts = data?.data || []
  const pageInfo = data?.page_info || { page: 1, total_pages: 1 }

  // Page-level checkbox selection state
  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([])

  // Clear selection whenever page or applied filters change
  useEffect(() => {
    setSelectedAccountIds([])
  }, [currentPage, appliedFilters])

  const isAllOnPageSelected =
    accounts.length > 0 &&
    accounts.every((acc: any) => selectedAccountIds.includes(acc.id))

  const isSomeOnPageSelected =
    accounts.some((acc: any) => selectedAccountIds.includes(acc.id)) &&
    !isAllOnPageSelected

  const handleToggleSelectAll = () => {
    if (isAllOnPageSelected) {
      setSelectedAccountIds([])
    } else {
      setSelectedAccountIds(accounts.map((acc: any) => acc.id))
    }
  }

  const handleToggleSelectRow = (accId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setSelectedAccountIds((prev) =>
      prev.includes(accId)
        ? prev.filter((id) => id !== accId)
        : [...prev, accId],
    )
  }

  const bulkCreateTasksMutation = useMutation({
    mutationFn: async (accountIds: number[]) => {
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/account-tasks/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ account_ids: accountIds }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || 'Failed to bulk create tasks')
      }
      return res.json()
    },
    onSuccess: (data) => {
      toast.success(
        data.message || `Created ${data.tasks_created} tasks for ${data.accounts_count} account(s)!`,
      )
      setSelectedAccountIds([])
      queryClient.invalidateQueries({ queryKey: ['account-tasks-list'] })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error creating tasks for selected accounts')
    },
  })

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleSearch = () => {
    const params = new URLSearchParams()
    params.set('page', '1')

    const moduleDateKeys = [
      'bsaFromDate',
      'bsaToDate',
      'gstFromDate',
      'gstToDate',
      'cibilFromDate',
      'cibilToDate',
      'itrFromDate',
      'itrToDate',
    ]

    Object.entries(filters).forEach(([key, value]) => {
      if (moduleDateKeys.includes(key)) return

      if (Array.isArray(value)) {
        value.forEach((item: Option) => {
          params.append(key, item.value)
        })
      } else if (value) {
        params.set(key, String(value))
      }
    })

    if (filters.bsaFromDate || filters.bsaToDate) {
      params.set('module', 'bsa')
      if (filters.bsaFromDate) params.set('from_date', filters.bsaFromDate)
      if (filters.bsaToDate) params.set('to_date', filters.bsaToDate)
    } else if (filters.gstFromDate || filters.gstToDate) {
      params.set('module', 'gst')
      if (filters.gstFromDate) params.set('from_date', filters.gstFromDate)
      if (filters.gstToDate) params.set('to_date', filters.gstToDate)
    } else if (filters.cibilFromDate || filters.cibilToDate) {
      params.set('module', 'cibil')
      if (filters.cibilFromDate) params.set('from_date', filters.cibilFromDate)
      if (filters.cibilToDate) params.set('to_date', filters.cibilToDate)
    } else if (filters.itrFromDate || filters.itrToDate) {
      params.set('module', 'itr')
      if (filters.itrFromDate) params.set('from_date', filters.itrFromDate)
      if (filters.itrToDate) params.set('to_date', filters.itrToDate)
    }

    setSearchParams(params)
    setAppliedFilters(filters)
    setCurrentPage(1)
  }

  const handleClear = () => {
    const emptyFilters = {
      accountName: '',
      accountStatus: [] as Option[],
      source: [] as Option[],
      industry: [] as Option[],
      phone: '',
      city: '',
      state: '',
      accountOwnerId: [] as Option[],
      sourceType: [] as Option[],
      accountStage: [] as Option[],
      businessStatus: [] as Option[],
      wabaInterested: 'all',
      isPriorityAccount: 'all',
      cbCondition: 'Is',
      cbUsers: [] as Option[],
      cbDateCondition: 'all',
      cbFromDate: '',
      cbToDate: '',
      bsaFromDate: '',
      bsaToDate: '',
      gstFromDate: '',
      gstToDate: '',
      cibilFromDate: '',
      cibilToDate: '',
      itrFromDate: '',
      itrToDate: '',
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
        queryKey: ['account', id],
        queryFn: async () => {
          const res = await fetch(
            `${ENV.VITE_BACKEND_BASE_URL}/accounts?account_id=${id}`,
            { credentials: 'include' },
          )
          if (!res.ok) throw new Error('Failed to fetch account')
          return res.json()
        },
      })
      window.open(`${window.location.origin}/accounts/${id}`, '_blank')
    } catch (error) {
      window.open(`${window.location.origin}/accounts/${id}`, '_blank')
    }
  }
  const { user } = useAuth()

  const isAllowToCreate =
    user?.role?.toLowerCase().includes('admin') ||
    user?.role?.toLowerCase().includes('super_admin') ||
    user?.role?.toLowerCase().includes('manager')

  return (
    <div className='flex flex-col h-screen overflow-hidden'>
      {/* Page Header */}
      <div className='flex items-center justify-between px-5 py-3.5 border-b border-border/60 bg-background shrink-0'>
        <div>
          <h1 className='text-xl font-semibold text-foreground tracking-tight'>Accounts Database</h1>
          <p className='text-xs text-muted-foreground mt-0.5'>Manage and track all your accounts</p>
        </div>

        <div className='flex items-center gap-2.5'>
          {isLoading ? (
            <Skeleton className='w-28 h-5 rounded-md' />
          ) : (
            <span className='text-xs font-medium text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md border border-border/50'>
              {pageInfo.data_size} accounts
            </span>
          )}
          <div className='flex gap-1.5 items-center'>
            {isAllowToCreate && (
              <Button size='sm' onClick={() => navigate('/accounts/create')} className='h-8 text-xs gap-1.5'>
                <span className='text-base leading-none'>+</span> Create Account
              </Button>
            )}
            <UploadCsv isLoading={isLoading} refetch={refetch} />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className='flex flex-1 overflow-hidden'>
        {/* Filter Sidebar */}
        <div className='w-[240px] shrink-0 border-r border-border/60 bg-background overflow-y-auto flex flex-col'>
          <div className='p-3 border-b border-border/50 flex items-center justify-between'>
            <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>Filters</h3>
          </div>
          <div className='p-3 space-y-3 flex-1'>
            {showOwnerFilter && (
              <div className='space-y-1.5'>
                <Label className='text-xs'>Account Owner</Label>
                <MultiSelect
                  options={owners.map((owner: any) => ({
                    label: owner.full_name,
                    value: owner.id.toString(),
                  }))}
                  value={filters.accountOwnerId}
                  onChange={(val) => handleFilterChange('accountOwnerId', val)}
                  placeholder='Select Owners...'
                />
              </div>
            )}

            <div className='space-y-1.5'>
              <Label className='text-xs'>Account Name</Label>
              <Input
                placeholder='Account Name'
                value={filters.accountName}
                onChange={(e) => handleFilterChange('accountName', e.target.value)}
              />
            </div>

            <div className='space-y-1.5'>
              <Label className='text-xs'>Account Status</Label>
              <MultiSelect
                options={ACCOUNT_STATUS_OPTIONS}
                value={filters.accountStatus}
                onChange={(val) => handleFilterChange('accountStatus', val)}
                placeholder='Select Status...'
              />
            </div>

          <div className='space-y-2'>
            <Label>Phone</Label>
            <Input
              placeholder='Phone'
              value={filters.phone}
              onChange={(e) => handleFilterChange('phone', e.target.value)}
            />
          </div>

          <div className='space-y-2'>
            <Label>Source</Label>
            <MultiSelect
              options={SOURCE_OPTIONS}
              value={filters.source}
              onChange={(val) => handleFilterChange('source', val)}
              placeholder='Select Source...'
            />
          </div>

          <div className='space-y-2'>
            <Label>Industry</Label>
            <MultiSelect
              options={INDUSTRY_OPTIONS}
              value={filters.industry}
              onChange={(val) => handleFilterChange('industry', val)}
              placeholder='Select Industry...'
            />
          </div>

          <div className='space-y-2'>
            <Label>City</Label>
            <Input
              placeholder='City'
              value={filters.city}
              onChange={(e) => handleFilterChange('city', e.target.value)}
            />
          </div>

          <div className='space-y-2'>
            <Label>State</Label>
            <Input
              placeholder='State'
              value={filters.state}
              onChange={(e) => handleFilterChange('state', e.target.value)}
            />
          </div>

          <div className='space-y-2'>
            <Label>Source Type</Label>
            <MultiSelect
              options={SOURCE_TYPE_OPTIONS}
              value={filters.sourceType}
              onChange={(val) => handleFilterChange('sourceType', val)}
              placeholder='Select Source Type...'
            />
          </div>

          <div className='space-y-2'>
            <Label>Account Stage</Label>
            <MultiSelect
              options={ACCOUNT_STAGE_OPTIONS}
              value={filters.accountStage}
              onChange={(val) => handleFilterChange('accountStage', val)}
              placeholder='Select Stage...'
            />
          </div>

          <div className='space-y-2'>
            <Label>Business Status</Label>
            <MultiSelect
              options={BUSINESS_STATUS_OPTIONS}
              value={filters.businessStatus}
              onChange={(val) => handleFilterChange('businessStatus', val)}
              placeholder='Select Business Status...'
            />
          </div>

          <div className='space-y-2'>
            <Label>WABA Interested</Label>
            <Select
              value={filters.wabaInterested}
              onValueChange={(val) => handleFilterChange('wabaInterested', val)}
            >
              <SelectTrigger className='h-9 text-xs'>
                <SelectValue placeholder='Select WABA Interested' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All</SelectItem>
                <SelectItem value='Yes'>Yes</SelectItem>
                <SelectItem value='No'>No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label>Priority Account</Label>
            <Select
              value={filters.isPriorityAccount}
              onValueChange={(val) => handleFilterChange('isPriorityAccount', val)}
            >
              <SelectTrigger className='h-9 text-xs'>
                <SelectValue placeholder='Select Priority Account' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All</SelectItem>
                <SelectItem value='Yes'>Yes</SelectItem>
                <SelectItem value='No'>No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <hr className='my-4 border-border' />

          {/* Advanced Call Back Date & Time Filter Section */}
          <div className='space-y-3 p-3 bg-muted/30 rounded-md border'>
            <Label className='font-semibold text-xs text-foreground block border-b pb-1'>
              Call Back Date / Time Filter
            </Label>

            <div className='space-y-1.5'>
              <Label className='text-[11px] text-muted-foreground'>Logical Condition</Label>
              <Select
                value={filters.cbCondition}
                onValueChange={(val) => handleFilterChange('cbCondition', val)}
              >
                <SelectTrigger className='h-8 text-xs bg-background'>
                  <SelectValue placeholder='Condition' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Is'>Is (Matches)</SelectItem>
                  <SelectItem value='Not'>Not (Negates)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-1.5'>
              <Label className='text-[11px] text-muted-foreground'>Users (Assignee / Owner)</Label>
              <MultiSelect
                options={owners.map((owner: any) => ({
                  label: owner.full_name,
                  value: owner.id.toString(),
                }))}
                value={filters.cbUsers}
                onChange={(val) => handleFilterChange('cbUsers', val)}
                placeholder='Select Users...'
                className='bg-background text-xs'
              />
            </div>

            <div className='space-y-1.5'>
              <Label className='text-[11px] text-muted-foreground'>Field Condition</Label>
              <Select
                value={filters.cbDateCondition}
                onValueChange={(val) => handleFilterChange('cbDateCondition', val)}
              >
                <SelectTrigger className='h-8 text-xs bg-background'>
                  <SelectValue placeholder='Select Condition' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Date Conditions</SelectItem>
                  <SelectItem value='Blank'>Blank</SelectItem>
                  <SelectItem value='Overdue'>Overdue</SelectItem>
                  <SelectItem value='Due Today'>Due Today</SelectItem>
                  <SelectItem value='Due Tomorrow'>Due Tomorrow</SelectItem>
                  <SelectItem value='Due This Week'>Due This Week</SelectItem>
                  <SelectItem value='Due Next Week'>Due Next Week</SelectItem>
                  <SelectItem value='Due Dates'>Due Dates</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filters.cbDateCondition === 'Due Dates' && (
              <div className='space-y-2 pt-1'>
                <div>
                  <Label className='text-[11px] text-muted-foreground'>From Date</Label>
                  <Input
                    type='date'
                    value={filters.cbFromDate}
                    onChange={(e) => handleFilterChange('cbFromDate', e.target.value)}
                    className='h-8 text-xs bg-background'
                  />
                </div>
                <div>
                  <Label className='text-[11px] text-muted-foreground'>To Date</Label>
                  <Input
                    type='date'
                    value={filters.cbToDate}
                    onChange={(e) => handleFilterChange('cbToDate', e.target.value)}
                    className='h-8 text-xs bg-background'
                  />
                </div>
              </div>
            )}
          </div>

          <hr className='my-4 border-border' />

          {/* BSA Filter (Year, Month) */}
          <div className='space-y-2'>
            <Label className='font-semibold text-xs'>BSA Filter</Label>
            <div className='grid grid-cols-2 gap-2'>
              <div>
                <Label className='text-[11px] text-muted-foreground'>From Date</Label>
                <Input
                  type='month'
                  value={filters.bsaFromDate}
                  onChange={(e) => handleFilterChange('bsaFromDate', e.target.value)}
                  className='h-8 text-xs'
                />
              </div>
              <div>
                <Label className='text-[11px] text-muted-foreground'>To Date</Label>
                <Input
                  type='month'
                  value={filters.bsaToDate}
                  onChange={(e) => handleFilterChange('bsaToDate', e.target.value)}
                  className='h-8 text-xs'
                />
              </div>
            </div>
          </div>

          {/* GST Filter (Year, Month) */}
          <div className='space-y-2'>
            <Label className='font-semibold text-xs'>GST Filter</Label>
            <div className='grid grid-cols-2 gap-2'>
              <div>
                <Label className='text-[11px] text-muted-foreground'>From Date</Label>
                <Input
                  type='month'
                  value={filters.gstFromDate}
                  onChange={(e) => handleFilterChange('gstFromDate', e.target.value)}
                  className='h-8 text-xs'
                />
              </div>
              <div>
                <Label className='text-[11px] text-muted-foreground'>To Date</Label>
                <Input
                  type='month'
                  value={filters.gstToDate}
                  onChange={(e) => handleFilterChange('gstToDate', e.target.value)}
                  className='h-8 text-xs'
                />
              </div>
            </div>
          </div>

          {/* CIBIL Filter (Year, Month) */}
          <div className='space-y-2'>
            <Label className='font-semibold text-xs'>CIBIL Filter</Label>
            <div className='grid grid-cols-2 gap-2'>
              <div>
                <Label className='text-[11px] text-muted-foreground'>From Date</Label>
                <Input
                  type='month'
                  value={filters.cibilFromDate}
                  onChange={(e) => handleFilterChange('cibilFromDate', e.target.value)}
                  className='h-8 text-xs'
                />
              </div>
              <div>
                <Label className='text-[11px] text-muted-foreground'>To Date</Label>
                <Input
                  type='month'
                  value={filters.cibilToDate}
                  onChange={(e) => handleFilterChange('cibilToDate', e.target.value)}
                  className='h-8 text-xs'
                />
              </div>
            </div>
          </div>

          {/* ITR Filter (Year only) */}
          <div className='space-y-2'>
            <Label className='font-semibold text-xs'>ITR Filter</Label>
            <div className='grid grid-cols-2 gap-2'>
              <div>
                <Label className='text-[11px] text-muted-foreground'>From Year</Label>
                <Input
                  type='number'
                  min='2000'
                  max='2099'
                  placeholder='YYYY'
                  value={filters.itrFromDate}
                  onChange={(e) => handleFilterChange('itrFromDate', e.target.value)}
                  className='h-8 text-xs'
                />
              </div>
              <div>
                <Label className='text-[11px] text-muted-foreground'>To Year</Label>
                <Input
                  type='number'
                  min='2000'
                  max='2099'
                  placeholder='YYYY'
                  value={filters.itrToDate}
                  onChange={(e) => handleFilterChange('itrToDate', e.target.value)}
                  className='h-8 text-xs'
                />
              </div>
            </div>
          </div>
          </div>
          {/* Filter Actions */}
          <div className='p-3 border-t border-border/60 bg-background shrink-0 space-y-1.5'>
            <Button className='w-full h-8 text-xs cursor-pointer' onClick={handleSearch}>
              Apply Filters
            </Button>
            <Button variant='ghost' className='w-full h-8 text-xs cursor-pointer text-muted-foreground hover:text-foreground' onClick={handleClear}>
              Clear All
            </Button>
            <ManageColumnsDialog
              columns={columns}
              onSave={savePreferences}
              onReset={resetToDefault}
            />
          </div>
        </div>

        {/* Main Table Area */}
        <div className='flex flex-col flex-1 overflow-hidden'>
          {isLoading ? (
            <div className='flex items-center justify-center flex-1 border-l border-border/60'>
              <Spinner className='h-7 w-7 text-muted-foreground' />
            </div>
          ) : (
            <>
              {selectedAccountIds.length > 0 && (
                <div className='flex items-center justify-between bg-blue-500/10 border border-blue-500/25 text-blue-600 dark:text-blue-400 px-4 py-2.5 shrink-0 mx-0 text-xs font-medium'>
                  <div className='flex items-center gap-2.5'>
                    <div className='h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse' />
                    <span className='font-semibold'>{selectedAccountIds.length} selected</span>
                    <span className='text-muted-foreground/60'>·</span>
                    <span className='font-normal text-muted-foreground'>
                      {selectedAccountIds.length} task(s) will be created
                    </span>
                  </div>
                  <div className='flex items-center gap-1.5'>
                    <Button
                      size='sm'
                      onClick={() => bulkCreateTasksMutation.mutate(selectedAccountIds)}
                      disabled={bulkCreateTasksMutation.isPending}
                      className='h-7 text-xs px-3 cursor-pointer gap-1.5'
                    >
                      {bulkCreateTasksMutation.isPending ? (
                        <>
                          <Spinner className='h-3.5 w-3.5' />
                          Creating...
                        </>
                      ) : (
                        `Create Tasks (${selectedAccountIds.length})`
                      )}
                    </Button>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => setSelectedAccountIds([])}
                      className='h-7 text-xs px-2 cursor-pointer text-muted-foreground hover:text-foreground'
                    >
                      Deselect All
                    </Button>
                  </div>
                </div>
              )}
              <div className='flex-1 overflow-auto'>
                <table className='w-full caption-bottom text-sm'>
                  <TableHeader>
                    <TableRow className='sticky top-0 z-10 bg-muted/40 hover:bg-muted/50 border-b border-border/60'>
                      <TableHead className='w-[40px] px-3 text-center'>
                        <Checkbox
                          checked={
                            isAllOnPageSelected
                              ? true
                              : isSomeOnPageSelected
                              ? 'indeterminate'
                              : false
                          }
                          onCheckedChange={handleToggleSelectAll}
                          aria-label='Select all accounts on current page'
                        />
                      </TableHead>
                      {visibleColumns.map((col: any) => (
                        <TableHead key={col.id}>{col.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {accounts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={visibleColumns.length + 1} className='text-center h-24'>
                          No accounts found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      accounts.map((acc: any) => {
                        const isSelected = selectedAccountIds.includes(acc.id)
                        return (
                          <TableRow
                            key={acc.id}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-blue-500/8 dark:bg-blue-500/10 border-l-2 border-l-blue-500'
                                : 'hover:bg-muted/40'
                            }`}
                            onClick={() => handleRowClick(acc.id)}
                          >
                            <TableCell
                              className='w-[40px] px-3 text-center'
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => handleToggleSelectRow(acc.id)}
                                aria-label={`Select account ${acc.account_name}`}
                              />
                            </TableCell>
                          {visibleColumns.map((col: any) => {
                            switch (col.id) {
                              case 'account_name':
                                return (
                                  <TableCell
                                    key={col.id}
                                    className='font-medium text-primary'
                                  >
                                    <HighlightedText
                                      text={acc.account_name}
                                      highlight={appliedFilters.accountName}
                                    />
                                  </TableCell>
                                )
                              case 'account_owner':
                                return (
                                  <TableCell
                                    key={col.id}
                                    className='text-primary'
                                  >
                                    {(users as Record<string, string>)[
                                      acc.account_owner_id
                                    ] || '—'}
                                  </TableCell>
                                )
                              case 'account_status':
                                return (
                                  <TableCell
                                    key={col.id}
                                  >
                                    {acc.account_status ? (
                                      <Badge
                                        variant='outline'
                                        className='bg-emerald-950/60 text-emerald-400 border-emerald-800/50 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/50 bg-emerald-50 text-emerald-700 border-emerald-200 font-medium text-xs px-2.5 py-0.5 rounded-full'
                                      >
                                        {acc.account_status}
                                      </Badge>
                                    ) : (
                                      '—'
                                    )}
                                  </TableCell>
                                )
                              case 'source':
                                return (
                                  <TableCell
                                    key={col.id}
                                    className='text-primary'
                                  >
                                    {acc.source || '—'}
                                  </TableCell>
                                )
                              case 'type_of_business':
                                return (
                                  <TableCell
                                    key={col.id}
                                    className='text-primary'
                                  >
                                    {acc.type_of_business || '—'}
                                  </TableCell>
                                )
                              case 'industry':
                                return (
                                  <TableCell
                                    key={col.id}
                                    className='text-primary'
                                  >
                                    {acc.industry || '—'}
                                  </TableCell>
                                )
                              case 'phone':
                                return (
                                  <TableCell
                                    key={col.id}
                                    className='text-primary'
                                  >
                                    <HighlightedText
                                      text={acc.phone}
                                      highlight={appliedFilters.phone}
                                    />
                                  </TableCell>
                                )
                              case 'city':
                                return (
                                  <TableCell
                                    key={col.id}
                                    className='text-primary'
                                  >
                                    <HighlightedText
                                      text={acc.city}
                                      highlight={appliedFilters.city}
                                    />
                                  </TableCell>
                                )
                              case 'state':
                                return (
                                  <TableCell
                                    key={col.id}
                                    className='text-primary'
                                  >
                                    <HighlightedText
                                      text={acc.state}
                                      highlight={appliedFilters.state}
                                    />
                                  </TableCell>
                                )
                              case 'call_back_date':
                                return (
                                  <TableCell
                                    key={col.id}
                                    className='text-primary'
                                  >
                                    {acc.call_back_date_time
                                      ? formatExactDate(
                                          acc.call_back_date_time,
                                          'dd MMM yyyy, hh:mm a',
                                        )
                                      : '—'}
                                  </TableCell>
                                )
                              case 'business_status':
                                return (
                                  <TableCell
                                    key={col.id}
                                    className='text-primary'
                                  >
                                    {acc.business_status || '—'}
                                  </TableCell>
                                )
                              case 'priority_account':
                                return (
                                  <TableCell
                                    key={col.id}
                                    className='text-primary'
                                  >
                                    {acc?.is_priority_account || '—'}
                                  </TableCell>
                                )
                              case 'source_date':
                                return (
                                  <TableCell
                                    key={col.id}
                                    className='text-primary'
                                  >
                                    {acc.source_date
                                      ? formatExactDate(
                                          acc.source_date,
                                          'dd MMM yyyy',
                                        )
                                      : '—'}
                                  </TableCell>
                                )
                              case 'assignment_date':
                                return (
                                  <TableCell
                                    key={col.id}
                                    className='text-primary'
                                  >
                                    {acc.assignment_date
                                      ? formatExactDate(
                                          acc.assignment_date,
                                          'dd MMM yyyy',
                                        )
                                      : '—'}
                                  </TableCell>
                                )
                              case 'modified_time':
                                return (
                                  <TableCell
                                    key={col.id}
                                    className='text-primary'
                                  >
                                    {acc.modified_time
                                      ? formatExactDate(
                                          acc.modified_time,
                                          'dd MMM yyyy',
                                        )
                                      : '—'}
                                  </TableCell>
                                )
                              default:
                                return <TableCell key={col.id} />
                            }
                          })}
                        </TableRow>
                      )
                    })
                  )}
                  </TableBody>
                </table>
              </div>

              <div className='px-4 py-2 border-t border-border/60 shrink-0 bg-background'>
                <Pagination
                  currentPage={pageInfo.page}
                  totalPages={pageInfo.total_pages}
                  onPageChange={handlePageChange}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
