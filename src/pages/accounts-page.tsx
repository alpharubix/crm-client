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
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'

import { Spinner } from '@/components/ui/spinner'
import { formatExactDate } from '@/utils/date-formatter'
import UploadCsv from '@/components/accounts/csv-upload'

import users from '@/utils/users.json'
import { useAuth } from '@/context/auth-context'
import { MultiSelect, type Option } from '@/components/ui/multi-select'

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
  { value: 'ALL INDIA CHEMISTS AND DRUGGISTS ASSOCIATION OF INDIA', label: 'ALL INDIA CHEMISTS AND DRUGGISTS ASSOCIATION OF INDIA' },
  { value: 'All India Hardware Association (Based in Mumbai Charni Road)', label: 'All India Hardware Association (Based in Mumbai Charni Road)' },
  { value: 'Alpharubix', label: 'Alpharubix' },
  { value: 'Condor Footwear', label: 'Condor Footwear' },
  { value: 'DVG Dist Petroleum', label: 'DVG Dist Petroleum' },
  { value: 'Federation of Hotel and Restaurant Association of India (Based in New Delhi)', label: 'Federation of Hotel and Restaurant Association of India (Based in New Delhi)' },
  { value: 'Havells', label: 'Havells' },
  { value: 'Liberty', label: 'Liberty' },
  { value: 'Marico', label: 'Marico' },
  { value: 'Reference', label: 'Reference' },
  { value: 'Retail Association of India', label: 'Retail Association of India' },
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
  })

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
      if (appliedFilters.accountStatus && appliedFilters.accountStatus.length > 0) {
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
      if (appliedFilters.accountOwnerId && appliedFilters.accountOwnerId.length > 0) {
        appliedFilters.accountOwnerId.forEach((o: Option) =>
          params.append('account_owner_id', o.value),
        )
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

  const exportParams = new URLSearchParams()
  if (appliedFilters.accountName)
    exportParams.set('account_name', appliedFilters.accountName)
  if (appliedFilters.accountStatus && appliedFilters.accountStatus.length > 0) {
    appliedFilters.accountStatus.forEach((o: Option) =>
      exportParams.append('account_status', o.value),
    )
  }
  if (appliedFilters.source && appliedFilters.source.length > 0) {
    appliedFilters.source.forEach((o: Option) =>
      exportParams.append('source', o.value),
    )
  }
  if (appliedFilters.industry && appliedFilters.industry.length > 0) {
    appliedFilters.industry.forEach((o: Option) =>
      exportParams.append('industry', o.value),
    )
  }
  if (appliedFilters.phone) exportParams.set('phone', appliedFilters.phone)
  if (appliedFilters.city) exportParams.set('city', appliedFilters.city)
  if (appliedFilters.state) exportParams.set('state', appliedFilters.state)
  if (appliedFilters.accountOwnerId && appliedFilters.accountOwnerId.length > 0) {
    appliedFilters.accountOwnerId.forEach((o: Option) =>
      exportParams.append('account_owner_id', o.value),
    )
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
      // Prefetch data before navigating
      // This will trigger the global progress bar (via useIsFetching)
      // and ensure the next page has data ready immediately.
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
      // If fetch fails, navigate anyway so the user sees the error on the page
      window.open(`${window.location.origin}/accounts/${id}`, '_blank')
    }
  }
  const { user } = useAuth()

  const isAllowToCreate =
    user?.role?.toLowerCase().includes('admin') ||
    user?.role?.toLowerCase().includes('super_admin')

  return (
    <div className='p-4 space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Accounts Database</h1>
          <p className='text-muted-foreground'>Manage your accounts here.</p>
        </div>

        {isLoading ? (
          <Skeleton className='w-24 h-4' />
        ) : (
          <div className='flex gap-2 items-center'>
            <h3 className='font-semibold text-muted-foreground'>
              Total Accounts :
            </h3>
            <p className='text-muted-foreground'>{pageInfo.data_size}</p>
          </div>
        )}

        {/* <div className='flex gap-2 items-center'>
          <UploadCsv isLoading={isLoading} refetch={refetch} />
        </div> */}
        <div className='flex gap-2 items-center'>
          {isAllowToCreate && (
            <Button onClick={() => navigate('/accounts/create')}>
              + Create Account
            </Button>
          )}
          <UploadCsv isLoading={isLoading} refetch={refetch} />
        </div>
      </div>

      <div className='grid grid-cols-[260px_1fr] gap-4'>
        <div className='border rounded-md p-3 space-y-4 bg-background overflow-y-auto h-[calc(100vh-140px)]'>
          <h3 className='font-semibold text-sm'>Filter Accounts by</h3>

          {showOwnerFilter && (
            <div className='space-y-2'>
              <Label>Account Owner</Label>
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

          <div className='space-y-2'>
            <Label>Account Name</Label>
            <Input
              placeholder='Account Name'
              value={filters.accountName}
              onChange={(e) =>
                handleFilterChange('accountName', e.target.value)
              }
            />
          </div>

          <div className='space-y-2'>
            <Label>Account Status</Label>
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

          <div className='flex gap-2 pt-2'>
            <Button className='flex-1 cursor-pointer' onClick={handleSearch}>
              Search
            </Button>
            <Button
              variant='outline'
              className='cursor-pointer'
              onClick={handleClear}
            >
              Clear
            </Button>
          </div>
        </div>

        <div className='flex flex-col gap-4 min-w-0 h-[calc(100vh-140px)]'>
          {isLoading ? (
            <div className='flex items-center justify-center h-64 border rounded-md'>
              <Spinner className='h-8 w-8 text-muted-foreground' />
            </div>
          ) : (
            <>
              <div className='border rounded-md flex-1 overflow-auto relative'>
                <table className='w-full caption-bottom text-sm'>
                  <TableHeader>
                    <TableRow className='sticky top-0 z-10 bg-background hover:bg-accent'>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Account Owner</TableHead>
                      <TableHead>Account Status</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Type of Business</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Call Back Date / Time</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {accounts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className='text-center h-24'>
                          No accounts found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      accounts.map((acc: any) => (
                        <TableRow
                          key={acc.id}
                          className='cursor-pointer hover:bg-accent'
                          onClick={() => handleRowClick(acc.id)}
                        >
                          <TableCell className='font-medium text-primary'>
                            <HighlightedText
                              text={acc.account_name}
                              highlight={appliedFilters.accountName}
                            />
                          </TableCell>
                          <TableCell className='text-primary'>
                            {(users as Record<string, string>)[
                              acc.account_owner_id
                            ] || '—'}
                          </TableCell>
                          <TableCell className='text-primary'>
                            {acc.account_status || '—'}
                          </TableCell>
                          <TableCell className='text-primary'>
                            {acc.source || '—'}
                          </TableCell>
                          <TableCell className='text-primary'>
                            {acc.type_of_business || '—'}
                          </TableCell>
                          <TableCell className='text-primary'>
                            {acc.industry || '—'}
                          </TableCell>
                          <TableCell className='text-primary'>
                            <HighlightedText
                              text={acc.phone}
                              highlight={appliedFilters.phone}
                            />
                          </TableCell>
                          <TableCell className='text-primary'>
                            <HighlightedText
                              text={acc.city}
                              highlight={appliedFilters.city}
                            />
                          </TableCell>
                          <TableCell className='text-primary'>
                            <HighlightedText
                              text={acc.state}
                              highlight={appliedFilters.state}
                            />
                          </TableCell>
                          <TableCell className='text-primary'>
                            {acc.call_back_date_time
                              ? formatExactDate(
                                  acc.call_back_date_time,
                                  'dd MMM yyyy, hh:mm a',
                                )
                              : '—'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </table>
              </div>

              <Pagination
                currentPage={pageInfo.page}
                totalPages={pageInfo.total_pages}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
