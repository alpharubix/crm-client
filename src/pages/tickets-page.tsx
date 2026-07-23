import { Plus } from 'lucide-react'
import UploadCsv from '@/components/tickets/csv-upload'
import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'

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
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useQuery,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query'
import { ENV } from '@/conf'
import users from '@/utils/users.json'
import Pagination from '@/components/shared/pagination'
import { formatExactDate } from '@/utils/date-formatter'
import HighlightedText from '@/components/shared/highlighted-text'
import { MultiSelect, type Option } from '@/components/ui/multi-select'

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

const TICKET_STATUSES = [
  'Yet to Lender Login',
  'Lender Review',
  'In Credit',
  'Approved',
  'Disbursed',
  'Rejected',
  'Not Interested',
]

const DEFAULT_COLUMNS = [
  { id: 'deal_name', label: 'Deal Name' },
  { id: 'deal_owner', label: 'Deal Owner' },
  { id: 'ticket_login', label: 'Ticket Login' },
  { id: 'lender_name', label: 'Lender Name' },
  { id: 'lender_login_type', label: 'Lender Login Type' },
  { id: 'lender_login_date', label: 'Lender login date' },
  { id: 'ticket_status', label: 'Ticket Status' },
  { id: 'ticket_stage', label: 'Ticket Stage' },
]

const LOAN_TYPE_OPTIONS: Option[] = LOAN_TYPES.map((val) => ({ value: val, label: val }))
const TICKET_STATUS_OPTIONS: Option[] = TICKET_STATUSES.map((val) => ({ value: val, label: val }))

function getDefaultDates() {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)
  return {
    // createdFrom: from.toISOString().split('T')[0],
    // createdTo: to.toISOString().split('T')[0],
  }
}

const TicketsPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const [filters, setFilters] = useState(() => {
    const defaultDates = getDefaultDates()
    return {
      accountName: searchParams.get('accountName') || '',
      typeOfLoan: [] as Option[],
      ticketStatus: [] as Option[],
      dealOwnerId: [] as Option[],
      // createdFrom: searchParams.get('createdFrom') || defaultDates.createdFrom,
      // createdTo: searchParams.get('createdTo') || defaultDates.createdTo,
      lenderLoginFrom: searchParams.get('lenderLoginFrom') || '',
      lenderLoginTo: searchParams.get('lenderLoginTo') || '',
      targetedDisbursementFrom:
        searchParams.get('targetedDisbursementFrom') || '',
      targetedDisbursementTo: searchParams.get('targetedDisbursementTo') || '',
      disbursementFrom: searchParams.get('disbursementFrom') || '',
      disbursementTo: searchParams.get('disbursementTo') || '',
      statusClosingTo: '',
      dealOwnerId: [],
    }
  })

  const [columns, setColumns] = useState(() => {
    const saved = localStorage.getItem('tickets_table_columns')
    return saved ? JSON.parse(saved) : DEFAULT_COLUMNS
  })

  useEffect(() => {
    localStorage.setItem('tickets_table_columns', JSON.stringify(columns))
  }, [columns])

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('colIndex', index.toString())
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    const dragIndex = parseInt(e.dataTransfer.getData('colIndex'))
    if (dragIndex === dropIndex) return
    const newCols = [...columns]
    const [draggedCol] = newCols.splice(dragIndex, 1)
    newCols.splice(dropIndex, 0, draggedCol)
    setColumns(newCols)
  }

  const [appliedFilters, setAppliedFilters] = useState(filters)

  const [currentPage, setCurrentPage] = useState(() => {
    const page = searchParams.get('page')
    return page ? parseInt(page) : 1
  })

  // Modal State for Create Ticket
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [dealSearch, setDealSearch] = useState('')
  const [debouncedDealSearch, setDebouncedDealSearch] = useState('')
  const [isDealOpen, setIsDealOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedDealSearch(dealSearch), 500)
    return () => clearTimeout(timer)
  }, [dealSearch])

  const { data: dealsData, isLoading: isLoadingDeals } = useQuery({
    queryKey: ['deal-lookup', debouncedDealSearch],
    queryFn: async () => {
      if (!debouncedDealSearch) return { data: [] }
      const res = await fetch(
        `${
          ENV.VITE_BACKEND_BASE_URL
        }/deals/hot-lookup?deal_name=${encodeURIComponent(debouncedDealSearch)}`,
        { credentials: 'include' },
      )
      if (!res.ok) return { data: [] }
      return res.json()
    },
    enabled: debouncedDealSearch.length > 0,
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

    const loans = searchParams.getAll('typeOfLoan')
    if (loans.length > 0) {
      loadedFilters.typeOfLoan = loans.map((val) => {
        const matched = LOAN_TYPE_OPTIONS.find((o) => o.value === val)
        return { value: val, label: matched ? matched.label : val }
      })
    }

    const statuses = searchParams.getAll('ticketStatus')
    if (statuses.length > 0) {
      loadedFilters.ticketStatus = statuses.map((val) => {
        const matched = TICKET_STATUS_OPTIONS.find((o) => o.value === val)
        return { value: val, label: matched ? matched.label : val }
      })
    }

    if (Object.keys(loadedFilters).length > 0) {
      setFilters((prev) => ({ ...prev, ...loadedFilters }))
      setAppliedFilters((prev) => ({ ...prev, ...loadedFilters }))
    }
  }, [isSuccess, owners, searchParams])

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tickets-list', currentPage, appliedFilters],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('page', currentPage.toString())

      if (appliedFilters.accountName)
        params.set('account_name', appliedFilters.accountName)
      if (appliedFilters.typeOfLoan && appliedFilters.typeOfLoan.length > 0) {
        appliedFilters.typeOfLoan.forEach((o: Option) =>
          params.append('type_of_loan', o.value),
        )
      }
      if (appliedFilters.ticketStatus && appliedFilters.ticketStatus.length > 0) {
        appliedFilters.ticketStatus.forEach((o: Option) =>
          params.append('ticket_status', o.value),
        )
      }
      if (appliedFilters.dealOwnerId && appliedFilters.dealOwnerId.length > 0) {
        appliedFilters.dealOwnerId.forEach((o: Option) =>
          params.append('deal_owner_id', o.value),
        )
      }

      // if (appliedFilters.createdFrom)
      //   params.set('created_from', appliedFilters.createdFrom)
      // if (appliedFilters.createdTo)
      //   params.set('created_to', appliedFilters.createdTo)
      if (appliedFilters.lenderLoginFrom)
        params.set('lender_login_from', appliedFilters.lenderLoginFrom)
      if (appliedFilters.lenderLoginTo)
        params.set('lender_login_to', appliedFilters.lenderLoginTo)
      if (appliedFilters.targetedDisbursementFrom)
        params.set(
          'targeted_disbursement_from',
          appliedFilters.targetedDisbursementFrom,
        )
      if (appliedFilters.targetedDisbursementTo)
        params.set(
          'targeted_disbursement_to',
          appliedFilters.targetedDisbursementTo,
        )
      if (appliedFilters.disbursementFrom)
        params.set('disbursement_from', appliedFilters.disbursementFrom)
      if (appliedFilters.disbursementTo)
        params.set('disbursement_to', appliedFilters.disbursementTo)

      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/tickets?${params.toString()}`,
        { credentials: 'include' },
      )
      if (!res.ok) throw new Error('Failed to fetch tickets')
      return res.json()
    },
    placeholderData: keepPreviousData,
  })

  const TicketsData: any[] = data?.data || []
  const pageInfo = data?.page_info || { page: 1, total_pages: 1, data_size: 0 }

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
      } else if (value && value !== 'all') {
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
      typeOfLoan: [] as Option[],
      ticketStatus: [] as Option[],
      dealOwnerId: [] as Option[],
      lenderLoginFrom: '',
      lenderLoginTo: '',
      targetedDisbursementFrom: '',
      targetedDisbursementTo: '',
      disbursementFrom: '',
      disbursementTo: '',
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
        queryKey: ['ticket', id],
        queryFn: async () => {
          const res = await fetch(
            `${ENV.VITE_BACKEND_BASE_URL}/tickets/${id}`,
            { credentials: 'include' },
          )
          if (!res.ok) throw new Error('Failed to fetch ticket')
          return res.json()
        },
      })
      window.open(`${window.location.origin}/tickets/${id}`, '_blank')
    } catch (error) {
      window.open(`${window.location.origin}/tickets/${id}`, '_blank')
    }
  }

  return (
    <div className='p-4 space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>
            Tickets Database
          </h1>
          <p className='text-muted-foreground'>
            Manage your individual tickets here.
          </p>
        </div>

        {isLoading ? (
          <Skeleton className='w-24 h-4' />
        ) : (
          <div className='flex gap-2 items-center justify-start'>
            <h3 className='font-semibold text-muted-foreground'>
              Total Tickets :
            </h3>
            <p className='text-muted-foreground'>{pageInfo.data_size || 0}</p>
          </div>
        )}

        <div className='flex gap-2'>
          <Button
            variant='outline'
            className='cursor-pointer'
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className='h-4 w-4 mr-2' />
            Create Ticket
          </Button>
          <UploadCsv isLoading={isLoading} refetch={refetch} />
        </div>
      </div>

      <div className='grid grid-cols-[280px_1fr] gap-4'>
        {/* Filter sidebar */}
        <div className='border rounded-md p-3 space-y-4 bg-background overflow-y-auto h-[calc(100vh-140px)] pr-2'>
          <h3 className='font-semibold text-sm'>Filter Tickets by</h3>

          <div className='space-y-2'>
            <Label>Deal Name</Label>
            <Input
              placeholder='Deal Name'
              value={filters.accountName}
              onChange={(e) =>
                handleFilterChange('accountName', e.target.value)
              }
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          <div className='space-y-2'>
            <Label>Type of Loan</Label>
            <MultiSelect
              options={LOAN_TYPE_OPTIONS}
              value={filters.typeOfLoan}
              onChange={(val) => handleFilterChange('typeOfLoan', val)}
              placeholder='Select Types...'
            />
          </div>

          <div className='space-y-2'>
            <Label>Ticket Status</Label>
            <MultiSelect
              options={TICKET_STATUS_OPTIONS}
              value={filters.ticketStatus}
              onChange={(val) => handleFilterChange('ticketStatus', val)}
              placeholder='Select Statuses...'
            />
          </div>

          {showOwnerFilter && (
            <div className='space-y-2'>
              <Label>Deal Owner</Label>
              <MultiSelect
                options={owners.map((owner: any) => ({
                  label: owner.full_name,
                  value: owner.id.toString(),
                }))}
                value={filters.dealOwnerId}
                onChange={(val) => handleFilterChange('dealOwnerId', val)}
                placeholder='Select Owners...'
              />
            </div>
          )}

          <div className='border-t border-dashed border-zinc-400 pt-3 space-y-3'>
            {/* <div className='space-y-1.5'> */}
              {/* <Label className=''>Created From</Label>
              <Input
                type='date'
                className='h-9 text-xs'
                value={filters.createdFrom || ''}
                onChange={(e) =>
                  handleFilterChange('createdFrom', e.target.value)
                }
              />
            </div>
            <div className='space-y-1.5'>
              <Label className=''>Created To</Label>
              <Input
                type='date'
                className='h-9 text-xs'
                value={filters.createdTo || ''}
                onChange={(e) =>
                  handleFilterChange('createdTo', e.target.value)
                }
              />
            </div> */}

            <div className=' border-dashed border-zinc-400 space-y-1.5 pt-1'>
              <Label className=''>Lender Login From</Label>
              <Input
                type='date'
                className='h-9 text-xs'
                value={filters.lenderLoginFrom || ''}
                onChange={(e) =>
                  handleFilterChange('lenderLoginFrom', e.target.value)
                }
              />
            </div>
            <div className='space-y-1.5'>
              <Label className=''>Lender Login To</Label>
              <Input
                type='date'
                className='h-9 text-xs'
                value={filters.lenderLoginTo || ''}
                onChange={(e) =>
                  handleFilterChange('lenderLoginTo', e.target.value)
                }
              />
            </div>

            <div className='border-t border-dashed border-zinc-400 space-y-1.5 pt-1'>
              <Label className=''>Targeted Disb. From</Label>
              <Input
                type='date'
                className='h-9 text-xs'
                value={filters.targetedDisbursementFrom || ''}
                onChange={(e) =>
                  handleFilterChange('targetedDisbursementFrom', e.target.value)
                }
              />
            </div>
            <div className='space-y-1.5'>
              <Label className=''>Targeted Disb. To</Label>
              <Input
                type='date'
                className='h-9 text-xs'
                value={filters.targetedDisbursementTo || ''}
                onChange={(e) =>
                  handleFilterChange('targetedDisbursementTo', e.target.value)
                }
              />
            </div>

            <div className='border-t border-dashed border-zinc-400 space-y-1.5 pt-1'>
              <Label className=''>Disbursement From</Label>
              <Input
                type='date'
                className='h-9 text-xs'
                value={filters.disbursementFrom || ''}
                onChange={(e) =>
                  handleFilterChange('disbursementFrom', e.target.value)
                }
              />
            </div>
            <div className='space-y-1.5'>
              <Label className=''>Disbursement To</Label>
              <Input
                type='date'
                className='h-9 text-xs'
                value={filters.disbursementTo || ''}
                onChange={(e) =>
                  handleFilterChange('disbursementTo', e.target.value)
                }
              />
            </div>
          </div>

          <div className='flex gap-2 pt-2 sticky bottom-0 bg-background pb-1'>
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

        {/* Table Content window */}
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
                      {columns.map((col: any, index: number) => (
                        <TableHead
                          key={col.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, index)}
                          className='cursor-move'
                        >
                          {col.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {TicketsData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className='text-center h-24'>
                          No tickets found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      TicketsData.map((ticket) => (
                        <TableRow
                          key={ticket.id}
                          className='cursor-pointer hover:bg-accent'
                          onClick={() => handleRowClick(ticket.id)}
                        >
                          {columns.map((col: any) => {
                            switch (col.id) {
                              case 'deal_name':
                                return (
                                  <TableCell key={col.id} className='font-medium'>
                                    <HighlightedText
                                      text={ticket.account_name || '-'}
                                      highlight={appliedFilters.accountName}
                                    />
                                  </TableCell>
                                )
                              case 'deal_owner':
                                return (
                                  <TableCell key={col.id}>
                                    {ticket.deal_owner_id
                                      ? (users as Record<string, string>)[ticket.deal_owner_id] || '-'
                                      : '-'}
                                  </TableCell>
                                )
                              case 'ticket_login':
                                return <TableCell key={col.id}>{ticket.ticket_login || '-'}</TableCell>
                              case 'lender_name':
                                return <TableCell key={col.id}>{ticket.lender_name || '-'}</TableCell>
                              case 'lender_login_type':
                                return <TableCell key={col.id}>{ticket.lender_login_type || '-'}</TableCell>
                              case 'lender_login_date':
                                return (
                                  <TableCell key={col.id}>
                                    {ticket.lender_login_date
                                      ? formatExactDate(ticket.lender_login_date, 'dd MMM yyyy')
                                      : '—'}
                                  </TableCell>
                                )
                              case 'ticket_status':
                                return <TableCell key={col.id}>{ticket.ticket_status || '-'}</TableCell>
                              case 'ticket_stage':
                                return <TableCell key={col.id}>{ticket.ticket_stage || '-'}</TableCell>
                              default:
                                return <TableCell key={col.id} />
                            }
                          })}
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

      {/* Select Deal Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Select Deal</DialogTitle>
          </DialogHeader>
          <div className='flex flex-col gap-4 py-4'>
            <div className='space-y-2 relative'>
              <Label>Search Deal Name</Label>
              <Input
                placeholder='Search by Deal Name...'
                value={dealSearch}
                onChange={(e) => {
                  setDealSearch(e.target.value)
                  setIsDealOpen(true)
                }}
                onFocus={() => setIsDealOpen(true)}
                onBlur={() => {
                  setTimeout(() => setIsDealOpen(false), 200)
                }}
              />
              {isDealOpen && dealSearch.length > 0 && (
                <div className='absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto'>
                  {isLoadingDeals ? (
                    <div className='p-2 flex justify-center'>
                      <Spinner className='h-4 w-4' />
                    </div>
                  ) : dealsData?.data?.length > 0 ? (
                    dealsData.data.map((deal: any) => (
                      <div
                        key={deal.id}
                        className='p-2 hover:bg-muted cursor-pointer text-sm'
                        onMouseDown={() => {
                          navigate(`/deals/${deal.id}/tickets/create`)
                          setIsModalOpen(false)
                        }}
                      >
                        {deal.account_name}
                      </div>
                    ))
                  ) : (
                    <div className='p-2 text-sm text-muted-foreground'>
                      No deals found.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TicketsPage
