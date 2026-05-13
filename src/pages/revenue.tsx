import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
import { Plus } from 'lucide-react'

export default function RevenuePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const [filters, setFilters] = useState({
    accountName: searchParams.get('accountName') || '',
    lenderName: searchParams.get('lenderName') || '',
    referenceNumber: searchParams.get('referenceNumber') || '',
    incomeBookingDate: searchParams.get('incomeBookingDate') || '',
    typeOfRevenue: searchParams.get('typeOfRevenue') || '',
    amount: searchParams.get('amount') || '',
    gstAmount: searchParams.get('gstAmount') || '',
  })

  // console.log(filters.incomeBookingDate);


  const [appliedFilters, setAppliedFilters] = useState(filters)

  const [currentPage, setCurrentPage] = useState(() => {
    const page = searchParams.get('page')
    return page ? Number(page) : 1
  })

  const { data, isLoading } = useQuery({
    queryKey: ['revenues', currentPage, appliedFilters],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('page', currentPage.toString())

      if (appliedFilters.accountName) params.set('account_name', appliedFilters.accountName)
      if (appliedFilters.lenderName) params.set('lender_name', appliedFilters.lenderName)
      if (appliedFilters.referenceNumber) params.set('reference_number', appliedFilters.referenceNumber)
      if (appliedFilters.incomeBookingDate) params.set('income_booking_date', appliedFilters.incomeBookingDate)
      if (appliedFilters.typeOfRevenue) params.set('type_of_revenue', appliedFilters.typeOfRevenue)
      if (appliedFilters.amount) params.set('amount', appliedFilters.amount)
      if (appliedFilters.gstAmount) params.set('gst_amount', appliedFilters.gstAmount)

      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/revenue?${params.toString()}`,
        { credentials: 'include' }
      )

      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    placeholderData: keepPreviousData,
  })

  const revenues = data?.data || []
  const pageInfo = data?.page_info || { page: 1, total_pages: 1, data_size: 0 }

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

  const handleRowClick = async (id: string) => {
    try {
      await queryClient.ensureQueryData({
        queryKey: ['revenue', id],
        queryFn: async () => {
          const res = await fetch(
            `${ENV.VITE_BACKEND_BASE_URL}/revenue?revenue_id=${id}`,
            { credentials: 'include' }
          )
          if (!res.ok) throw new Error('Failed to fetch revenue')
          return res.json()
        },
      })
      navigate(`/revenue/${id}`, {
        state: {
          lenderName: revenues.lender_name || '',
        },
      })
    } catch (error) {
      navigate(`/revenue/${id}`)
    }
  }

  return (
    <div className='p-4 space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Revenue Database</h1>
          <p className='text-muted-foreground'>Manage your revenue entries here.</p>
        </div>

        {isLoading ? (
          <Skeleton className='w-24 h-4' />
        ) : (
          <div className='flex gap-2 items-center'>
            <h3 className='font-semibold text-muted-foreground'>
              Total Revenue Entries :
            </h3>
            <p className='text-muted-foreground'>{pageInfo.data_size}</p>
          </div>
        )}

        <div className='flex gap-2 items-center'>
          <Button variant='outline' onClick={() => navigate('/revenue-create')}>
            <Plus /> Add Revenue
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-[260px_1fr] gap-4'>
        <div className='border rounded-md p-3 space-y-4 bg-background overflow-y-auto h-[calc(100vh-140px)]'>
          <h3 className='font-semibold text-sm'>Filter Revenue by</h3>

          <div className='space-y-2'>
            <Label>Account Name</Label>
            <Input
              placeholder='Account Name'
              value={filters.accountName}
              onChange={(e) => handleFilterChange('accountName', e.target.value)}
            />
          </div>

          <div className='space-y-2'>
            <Label>Lender Name</Label>
            <Input
              placeholder='Lender Name'
              value={filters.lenderName}
              onChange={(e) => handleFilterChange('lenderName', e.target.value)}
            />
          </div>

          <div className='space-y-2'>
            <Label>Reference Number</Label>
            <Input
              placeholder='Reference Number'
              value={filters.referenceNumber}
              onChange={(e) => handleFilterChange('referenceNumber', e.target.value)}
            />
          </div>

          <div className='space-y-2'>
            <Label>Income Booking Date</Label>
            <Input
              type='date'
              placeholder='Income Booking Date'
              value={filters.incomeBookingDate}
              onChange={(e) => {
                const parsedDate = parse(
                  e.target.value,
                  'yyyy-dd-MM',
                  new Date()
                )

                handleFilterChange(
                  'incomeBookingDate',
                  format(parsedDate, 'yyyy-MM-dd')
                )
              }}

            />
          </div>

          <div className='space-y-2'>
            <Label>Type of Revenue</Label>
            <Input
              placeholder='Type of Revenue'
              value={filters.typeOfRevenue}
              onChange={(e) => handleFilterChange('typeOfRevenue', e.target.value)}
            />
          </div>

          <div className='space-y-2'>
            <Label>Amount</Label>
            <Input
              type='number'
              placeholder='Amount'
              value={filters.amount}
              onChange={(e) => handleFilterChange('amount', e.target.value)}
            />
          </div>

          <div className='space-y-2'>
            <Label>GST Amount</Label>
            <Input
              type='number'
              placeholder='GST Amount'
              value={filters.gstAmount}
              onChange={(e) => handleFilterChange('gstAmount', e.target.value)}
            />
          </div>

          <div className='flex gap-2 pt-2'>
            <Button className='flex-1 cursor-pointer' onClick={handleSearch}>
              Search
            </Button>
            <Button variant='outline' className='cursor-pointer' onClick={handleClear}>
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
                      <TableHead>Lender Name</TableHead>
                      <TableHead>Reference Number</TableHead>
                      <TableHead>Income Booking Date</TableHead>
                      <TableHead>Type of Revenue</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>GST Amount</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {revenues.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className='text-center h-24'>
                          No revenue entries found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      revenues.map((rev: any) => (
                        <TableRow
                          key={rev.id}
                          className='cursor-pointer hover:bg-accent'
                          onClick={() => handleRowClick(rev.id)}
                        >
                          <TableCell className='font-medium text-primary'>
                            <HighlightedText
                              text={rev.account_name}
                              highlight={appliedFilters.accountName}
                            />
                          </TableCell>
                          <TableCell className='text-primary'>
                            <HighlightedText
                              text={rev.lender_name}
                              highlight={appliedFilters.lenderName}
                            />
                          </TableCell>
                          <TableCell className='text-primary'>
                            <HighlightedText
                              text={rev.reference_number}
                              highlight={appliedFilters.referenceNumber}
                            />
                          </TableCell>
                          <TableCell className='text-primary'>
                            {rev.income_booking_date || '—'}
                          </TableCell>
                          <TableCell className='text-primary'>
                            <HighlightedText
                              text={rev.type_of_revenue}
                              highlight={appliedFilters.typeOfRevenue}
                            />
                          </TableCell>
                          <TableCell className='text-primary'>
                            {rev.amount}
                          </TableCell>
                          <TableCell className='text-primary'>
                            {rev.gst_amount}
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