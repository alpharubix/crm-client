import { useState } from 'react'
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

export default function AccountsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const [filters, setFilters] = useState({
    accountName: searchParams.get('accountName') || '',
    accountStatus: searchParams.get('accountStatus') || '',
    source: searchParams.get('source') || '',
    industry: searchParams.get('industry') || '',
    phone: searchParams.get('phone') || '',
    city: searchParams.get('city') || '',
    state: searchParams.get('state') || '',
    accountOwnerId: searchParams.get('accountOwnerId') || '',
    // businessType: searchParams.get('businessType') || '',
    // pincode: searchParams.get('pincode') || '',
    // businessStatus: searchParams.get('businessStatus') || '',
    // callBackDate: undefined as Date | undefined,
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

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['accounts', currentPage, appliedFilters],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('page', currentPage.toString())

      if (appliedFilters.accountName)
        params.set('account_name', appliedFilters.accountName)
      if (appliedFilters.accountStatus)
        params.set('account_status', appliedFilters.accountStatus)
      if (appliedFilters.source) params.set('source', appliedFilters.source)
      if (appliedFilters.industry)
        params.set('industry', appliedFilters.industry)
      if (appliedFilters.phone) params.set('phone', appliedFilters.phone)
      if (appliedFilters.city) params.set('city', appliedFilters.city)
      if (appliedFilters.state) params.set('state', appliedFilters.state)
      if (appliedFilters.accountOwnerId)
        params.set('account_owner_id', appliedFilters.accountOwnerId)

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
      if (value) params.set(key, String(value))
    })

    setSearchParams(params)
    setAppliedFilters(filters)
    setCurrentPage(1)
  }

  const exportParams = new URLSearchParams()
  if (appliedFilters.accountName)
    exportParams.set('account_name', appliedFilters.accountName)
  if (appliedFilters.accountStatus)
    exportParams.set('account_status', appliedFilters.accountStatus)
  if (appliedFilters.source) exportParams.set('source', appliedFilters.source)
  if (appliedFilters.industry)
    exportParams.set('industry', appliedFilters.industry)
  if (appliedFilters.phone) exportParams.set('phone', appliedFilters.phone)
  if (appliedFilters.city) exportParams.set('city', appliedFilters.city)
  if (appliedFilters.state) exportParams.set('state', appliedFilters.state)
  if (appliedFilters.accountOwnerId)
    exportParams.set('account_owner_id', appliedFilters.accountOwnerId)

  const handleClear = () => {
    const emptyFilters = {
      accountName: '',
      accountStatus: '',
      source: '',
      industry: '',
      phone: '',
      city: '',
      state: '',
      accountOwnerId: '',
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
      navigate(`/accounts/${id}`)
    } catch (error) {
      // If fetch fails, navigate anyway so the user sees the error on the page
      navigate(`/accounts/${id}`)
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
              <Select
                value={filters.accountOwnerId}
                onValueChange={(val) =>
                  handleFilterChange('accountOwnerId', val)
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Account Owner' />
                </SelectTrigger>
                <SelectContent>
                  {owners.map((owner: any) => (
                    <SelectItem key={owner.id} value={owner.id}>
                      {owner.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <Select
              value={filters.accountStatus}
              onValueChange={(val) => handleFilterChange('accountStatus', val)}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Account Status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='Yet to be dialed'>
                  Yet to be dialed
                </SelectItem>
                <SelectItem value='Wrong Number'>Wrong Number</SelectItem>
                <SelectItem value='Contact Established'>
                  Contact Established
                </SelectItem>
                <SelectItem value='Contact Not Established'>
                  Contact Not Established
                </SelectItem>
                <SelectItem value='Awareness'>Awareness</SelectItem>
                <SelectItem value='Attention'>Attention</SelectItem>
                <SelectItem value='Assessment'>Assessment</SelectItem>
                <SelectItem value='Lender Review'>Lender Review</SelectItem>
                <SelectItem value='Not Interested'>Not Interested</SelectItem>
                <SelectItem value='Location Unserviceable'>
                  Location Unserviceable
                </SelectItem>
              </SelectContent>
            </Select>
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
            <Select
              value={filters.source}
              onValueChange={(val) => handleFilterChange('source', val)}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Source' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='Himalaya'>Himalaya</SelectItem>
                <SelectItem value='CavinKare'>CavinKare</SelectItem>
                <SelectItem value='ALL INDIA CHEMISTS AND DRUGGISTS ASSOCIATION OF INDIA'>
                  ALL INDIA CHEMISTS AND DRUGGISTS ASSOCIATION OF INDIA
                </SelectItem>
                <SelectItem value='All India Hardware Association (Based in Mumbai Charni Road)'>
                  All India Hardware Association (Based in Mumbai Charni Road)
                </SelectItem>
                <SelectItem value='Alpharubix'>Alpharubix</SelectItem>
                <SelectItem value='Condor Footwear'>Condor Footwear</SelectItem>
                <SelectItem value='DVG Dist Petroleum'>
                  DVG Dist Petroleum
                </SelectItem>
                <SelectItem value='Federation of Hotel and Restaurant Association of India (Based in New Delhi)'>
                  Federation of Hotel and Restaurant Association of India (Based
                  in New Delhi)
                </SelectItem>
                <SelectItem value='Havells'>Havells</SelectItem>
                <SelectItem value='Liberty'>Liberty</SelectItem>
                <SelectItem value='Marico'>Marico</SelectItem>
                <SelectItem value='Reference'>Reference</SelectItem>
                <SelectItem value='Retail Association of India'>
                  Retail Association of India
                </SelectItem>
                <SelectItem value='SME CHAMBER'>SME CHAMBER</SelectItem>
                <SelectItem value='Swastik'>Swastik</SelectItem>
                <SelectItem value='Unicharm'>Unicharm</SelectItem>
                <SelectItem value='Vibhava Marketing'>
                  Vibhava Marketing
                </SelectItem>
                <SelectItem value='R1X Website'>R1X Website</SelectItem>
                <SelectItem value='5pointcredit'>5pointcredit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label>Industry</Label>
            <Select
              value={filters.industry}
              onValueChange={(val) => handleFilterChange('industry', val)}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Industry' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='Pharma'>Pharma</SelectItem>
                <SelectItem value='AHP'>AHP</SelectItem>
                <SelectItem value='CPD'>CPD</SelectItem>
                <SelectItem value='FMCG'>FMCG</SelectItem>
                <SelectItem value='OTX'>OTX</SelectItem>
                <SelectItem value='Footwear'>Footwear</SelectItem>
                <SelectItem value='OTC'>OTC</SelectItem>
                <SelectItem value='RAAGA'>RAAGA</SelectItem>
                <SelectItem value='Hardware'>Hardware</SelectItem>
                <SelectItem value='Electronics'>Electronics</SelectItem>
                <SelectItem value='DVG Dist Petroleum'>
                  DVG Dist Petroleum
                </SelectItem>
              </SelectContent>
            </Select>
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
