import { Plus, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  useQuery,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import HighlightedText from '@/components/shared/highlighted-text'
import {
  Table,
  TableBody,
  TableCell,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ENV } from '@/conf'
import Pagination from '@/components/shared/pagination'
import type { Contact } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/context/auth-context'
import { useManageColumns } from '@/hooks/use-manage-columns'
import { ManageColumnsDialog } from '@/components/shared/manage-columns'

const DEFAULT_COLUMNS = [
  { id: 'contact_name', label: 'Contact Name', selected: true },
  { id: 'designation', label: 'Designation', selected: true },
  { id: 'mobile', label: 'Mobile', selected: true },
  { id: 'phone', label: 'Phone', selected: true },
  { id: 'email', label: 'Email', selected: true },
  { id: 'city', label: 'City', selected: true },
  { id: 'state', label: 'State', selected: true },
]

export default function ContactsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  /* ---------------- Filters ---------------- */
  // Initialize filters from URL
  const [filters, setFilters] = useState({
    full_name: searchParams.get('full_name') || '',
    email: searchParams.get('email') || '',
    city: searchParams.get('city') || '',
    mobile: searchParams.get('mobile') || '',
    phone: searchParams.get('phone') || '',
  })

  const { columns, savePreferences, resetToDefault } = useManageColumns(
    'contacts',
    DEFAULT_COLUMNS,
  )

  const visibleColumns = columns.filter((c) => c.selected)

  // Separate state for applied filters (what the query actually uses)
  const [appliedFilters, setAppliedFilters] = useState(filters)

  const [currentPage, setCurrentPage] = useState(() => {
    const page = searchParams.get('page')
    return page ? parseInt(page) : 1
  })

  // React Query for fetching contacts
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['contacts', currentPage, appliedFilters],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('page', currentPage.toString())

      if (appliedFilters.full_name)
        params.set('full_name', appliedFilters.full_name)
      if (appliedFilters.email) params.set('email', appliedFilters.email)
      if (appliedFilters.city) params.set('city', appliedFilters.city)
      if (appliedFilters.mobile) params.set('mobile', appliedFilters.mobile)
      if (appliedFilters.phone) params.set('phone', appliedFilters.phone)

      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/contacts?${params.toString()}`,
        {
          credentials: 'include',
        },
      )
      if (!res.ok) throw new Error('Failed to fetch contacts')
      return res.json()
    },
    placeholderData: keepPreviousData,
  })

  const contacts: Contact[] = data?.data || []
  const pageInfo = data?.page_info || { page: 1, total_pages: 1 }

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value })
  }

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (filters.full_name) params.set('full_name', filters.full_name)
    if (filters.email) params.set('email', filters.email)
    if (filters.city) params.set('city', filters.city)
    if (filters.mobile) params.set('mobile', filters.mobile)
    if (filters.phone) params.set('phone', filters.phone)
    // Reset to page 1 on search
    params.set('page', '1')
    setSearchParams(params)

    // Apply filters to trigger query
    setAppliedFilters(filters)
    setCurrentPage(1)
  }

  const exportParams = new URLSearchParams()
  if (appliedFilters.full_name)
    exportParams.set('full_name', appliedFilters.full_name)
  if (appliedFilters.email) exportParams.set('email', appliedFilters.email)
  if (appliedFilters.city) exportParams.set('city', appliedFilters.city)
  if (appliedFilters.mobile) exportParams.set('mobile', appliedFilters.mobile)
  if (appliedFilters.phone) exportParams.set('phone', appliedFilters.phone)

  const handleClear = () => {
    const emptyFilters = {
      full_name: '',
      email: '',
      city: '',
      mobile: '',
      phone: '',
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
        queryKey: ['contact', id],
        queryFn: async () => {
          const res = await fetch(
            `${ENV.VITE_BACKEND_BASE_URL}/contacts?contact_id=${id}`,
            { credentials: 'include' },
          )
          if (!res.ok) throw new Error('Failed to fetch contact')
          return res.json()
        },
      })
      window.open(`${window.location.origin}/contacts/${id}`, '_blank')
    } catch (error) {
      window.open(`${window.location.origin}/accounts/${id}`, '_blank')
    }
  }

  return (
    <div className='p-4 space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Contacts Database</h1>
          <p className='text-muted-foreground'>Manage your contacts here.</p>
        </div>

        {isLoading ? (
          <Skeleton className='w-24 h-4' />
        ) : (
          <div className='flex gap-2 items-center justify-start'>
            <h3 className='font-semibold text-muted-foreground'>
              Total Contacts :
            </h3>
            <p className='text-muted-foreground'>{pageInfo.data_size}</p>
          </div>
        )}

        <div className='flex gap-2'>
          <Button
            variant='outline'
            className='cursor-pointer'
            onClick={() => navigate('/contacts-create')}
          >
            {isLoading ? (
              <Spinner className='h-4 w-4' />
            ) : (
              <>
                <Plus className='h-4 w-4' />
                Add Contact
              </>
            )}
          </Button>
          <Button
            variant='outline'
            size='icon'
            className='cursor-pointer'
            onClick={() => refetch()}
            disabled={isLoading}
          >
            {isLoading ? (
              <Spinner className='h-4 w-4' />
            ) : (
              <RefreshCw className='h-4 w-4' />
            )}
          </Button>
        </div>
      </div>

      {/* ---------------- Layout ---------------- */}
      <div className='grid grid-cols-[260px_1fr] gap-4'>
        {/* -------- Filters -------- */}
        <div className='border rounded-md p-3 space-y-4 bg-background overflow-y-auto h-[calc(90vh-200px)]'>
          <h3 className='font-semibold text-sm'>Filter Contacts by</h3>

          <div className='space-y-2'>
            <Label>Full Name</Label>
            <Input
              name='full_name'
              placeholder='Full Name'
              value={filters.full_name}
              onChange={handleFilterChange}
            />
          </div>

          <div className='space-y-2'>
            <Label>Email</Label>
            <Input
              name='email'
              placeholder='Email'
              value={filters.email}
              onChange={handleFilterChange}
            />
          </div>

          <div className='space-y-2'>
            <Label>Mobile</Label>
            <Input
              name='mobile'
              placeholder='Mobile'
              value={filters.mobile}
              onChange={handleFilterChange}
            />
          </div>

          <div className='space-y-2'>
            <Label>Phone</Label>
            <Input
              name='phone'
              placeholder='Phone'
              value={filters.phone}
              onChange={handleFilterChange}
            />
          </div>

          <div className='space-y-2'>
            <Label>City</Label>
            <Input
              name='city'
              placeholder='City'
              value={filters.city}
              onChange={handleFilterChange}
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
          <ManageColumnsDialog
            columns={columns}
            onSave={savePreferences}
            onReset={resetToDefault}
          />
        </div>

        {/* -------- Table -------- */}
        <div className='flex flex-col gap-4 min-w-0 h-[calc(100vh-140px)]'>
          <div className='border rounded-md flex-1 overflow-auto relative'>
            {isLoading ? (
              <div className='flex items-center justify-center h-64'>
                <Spinner className='h-8 w-8 text-muted-foreground' />
              </div>
            ) : (
              <table className='w-full caption-bottom text-sm'>
                <TableCaption>Contacts list</TableCaption>
                <TableHeader>
                  <TableRow className='sticky top-0 z-10 bg-background hover:bg-accent'>
                    {visibleColumns.map((col: any) => (
                      <TableHead key={col.id}>{col.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {contacts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className='text-center h-24'>
                        No contacts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    contacts.map((contact) => (
                      <TableRow
                        key={contact.id}
                        className='cursor-pointer hover:bg-accent'
                        onClick={() => handleRowClick(contact.id)}
                      >
                        {visibleColumns.map((col: any) => {
                          switch (col.id) {
                            case 'contact_name':
                              return (
                                <TableCell key={col.id}>
                                  <div className='font-medium'>
                                    <HighlightedText
                                      text={`${contact.first_name} ${contact.last_name}`}
                                      highlight={appliedFilters.full_name}
                                    />
                                  </div>
                                </TableCell>
                              )
                            case 'designation':
                              return (
                                <TableCell key={col.id}>
                                  {contact.designation || '—'}
                                </TableCell>
                              )
                            case 'mobile':
                              return (
                                <TableCell key={col.id}>
                                  <HighlightedText
                                    text={contact.mobile}
                                    highlight={appliedFilters.mobile}
                                  />
                                </TableCell>
                              )
                            case 'phone':
                              return (
                                <TableCell key={col.id}>
                                  <HighlightedText
                                    text={contact.phone}
                                    highlight={appliedFilters.phone}
                                  />
                                </TableCell>
                              )
                            case 'email':
                              return (
                                <TableCell key={col.id}>
                                  <HighlightedText
                                    text={contact.email}
                                    highlight={appliedFilters.email}
                                  />
                                </TableCell>
                              )
                            case 'city':
                              return (
                                <TableCell key={col.id}>
                                  <HighlightedText
                                    text={contact.city}
                                    highlight={appliedFilters.city}
                                  />
                                </TableCell>
                              )
                            case 'state':
                              return (
                                <TableCell key={col.id}>
                                  {contact.state || '—'}
                                </TableCell>
                              )
                            default:
                              return <TableCell key={col.id} />
                          }
                        })}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </table>
            )}
          </div>
          <Pagination
            currentPage={pageInfo.page}
            totalPages={pageInfo.total_pages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  )
}
