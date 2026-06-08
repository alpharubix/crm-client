import { useState } from 'react'
import { FilterX, Search } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import TicketsKanbanView, { type KanbanFilters } from './tickets-kanban-view'
import { Label } from '../ui/label'
import { useQuery } from '@tanstack/react-query'
import { ENV } from '@/conf'
import { MultiSelect, type Option } from '../ui/multi-select'

const LOAN_TYPE_OPTIONS: Option[] = [
  { value: 'SCF', label: 'SCF' },
  { value: 'SCF Renewal', label: 'SCF Renewal' },
  { value: 'SCF Enhancement', label: 'SCF Enhancement' },
  {
    value: 'SCF (Renewal & Enhancement)',
    label: 'SCF (Renewal & Enhancement)',
  },
  { value: 'Open SCF', label: 'Open SCF' },
  { value: 'BT-SCF', label: 'BT-SCF' },
  { value: 'Unsecured OD', label: 'Unsecured OD' },
  { value: 'Unsecured Term Loan', label: 'Unsecured Term Loan' },
  { value: 'Secured Loan', label: 'Secured Loan' },
  { value: 'Vehicle Loan', label: 'Vehicle Loan' },
]

interface LocalFilters {
  search: string
  type_of_loan: Option[]
  assignee_id: string
  created_from: string
  created_to: string
  lender_login_from: string
  lender_login_to: string
  deal_owner_id: Option[]
  targeted_disbursement_from: string
  targeted_disbursement_to: string
  disbursement_from: string
  disbursement_to: string
}

const defaultFilters: LocalFilters = {
  search: '',
  type_of_loan: [],
  assignee_id: 'all',
  created_from: '',
  created_to: '',
  lender_login_from: '',
  lender_login_to: '',
  deal_owner_id: [],
  targeted_disbursement_from: '',
  targeted_disbursement_to: '',
  disbursement_from: '',
  disbursement_to: '',
}

function getDefaultDates() {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)
  return {
    created_from: from.toISOString().split('T')[0],
    created_to: to.toISOString().split('T')[0],
  }
}

export default function TicketsKanban() {
  const [defaultDates] = useState(getDefaultDates)

  const [localFilters, setLocalFilters] = useState<LocalFilters>({
    ...defaultFilters,
    created_from: defaultDates.created_from,
    created_to: defaultDates.created_to,
  })

  const [appliedFilters, setAppliedFilters] = useState<KanbanFilters>({
    created_from: defaultDates.created_from,
    created_to: defaultDates.created_to,
    targeted_disbursement_from: '',
    targeted_disbursement_to: '',
    disbursement_from: '',
    disbursement_to: '',
  })

  const [hasApplied, setHasApplied] = useState(true)
  const [totalTickets, setTotalTickets] = useState(0)

  function setFilter<K extends keyof LocalFilters>(
    key: K,
    value: LocalFilters[K],
  ) {
    setLocalFilters((prev) => ({ ...prev, [key]: value }))
  }

  const { data: ownerResponse } = useQuery({
    queryKey: ['deal-owners'],
    queryFn: async () => {
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/user/filter`, {
        credentials: 'include',
      })
      return res.json()
    },
  })

  const owners = ownerResponse?.data ?? []

  function applyFilters() {
    const f: KanbanFilters = {
      targeted_disbursement_from: '',
      targeted_disbursement_to: '',
      disbursement_from: '',
      disbursement_to: '',
    }

    if (localFilters.search) f.account_name = localFilters.search
    if (localFilters.type_of_loan.length > 0)
      f.type_of_loan = localFilters.type_of_loan.map((o) => o.value)
    if (localFilters.created_from) f.created_from = localFilters.created_from
    if (localFilters.created_to) f.created_to = localFilters.created_to
    if (localFilters.deal_owner_id.length > 0)
      f.deal_owner_id = localFilters.deal_owner_id.map((o) => o.value)

    if (localFilters.lender_login_from)
      f.lender_login_from = localFilters.lender_login_from
    if (localFilters.lender_login_to)
      f.lender_login_to = localFilters.lender_login_to
    if (localFilters.targeted_disbursement_from)
      f.targeted_disbursement_from = localFilters.targeted_disbursement_from
    if (localFilters.targeted_disbursement_to)
      f.targeted_disbursement_to = localFilters.targeted_disbursement_to
    if (localFilters.disbursement_from)
      f.disbursement_from = localFilters.disbursement_from
    if (localFilters.disbursement_to)
      f.disbursement_to = localFilters.disbursement_to

    setAppliedFilters(f)
    setHasApplied(true)
  }

  // 👉 FIXED: Explicitly reset input fields and applied filters back to the true default state values
  function clearFilters() {
    setLocalFilters({
      ...defaultFilters,
      // created_from: defaultDates.created_from,
      // created_to: defaultDates.created_to,
    })

    setAppliedFilters({
      created_from: '',
      created_to: '',
      targeted_disbursement_from: '',
      targeted_disbursement_to: '',
      disbursement_from: '',
      disbursement_to: '',
    })
    setHasApplied(true)
  }

  return (
    <div className='w-full h-full p-4 flex flex-col max-w-[1400px] mx-auto'>
      <div className='flex flex-col flex-1 min-h-0'>
        <div className='flex items-center justify-between mb-4 shrink-0'>
          <h1 className='text-xl font-bold tracking-tight'>Tickets Kanban</h1>
        </div>

        <div className='border rounded-xl shadow-sm p-4 mb-6 shrink-0 space-y-4'>
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full'>
            <div className='space-y-1.5 md:col-span-1'>
              <Label className='text-[11px] uppercase tracking-wider text-muted-foreground'>
                Search
              </Label>
              <Input
                placeholder='Account name...'
                className='h-9 text-sm'
                value={localFilters.search}
                onChange={(e) => setFilter('search', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              />
            </div>

            <div className='space-y-1.5 md:col-span-2'>
              <Label className='text-[11px] uppercase tracking-wider text-muted-foreground'>
                Loan Type
              </Label>
              <MultiSelect
                options={LOAN_TYPE_OPTIONS}
                value={localFilters.type_of_loan}
                onChange={(val) => setFilter('type_of_loan', val)}
                placeholder='Select Types...'
              />
            </div>

            <div className='space-y-1.5 md:col-span-2'>
              <Label className='text-[11px] uppercase tracking-wider text-muted-foreground'>
                Deal Owner
              </Label>
              <MultiSelect
                options={owners.map((owner: any) => ({
                  label: owner.full_name,
                  value: owner.id.toString(),
                }))}
                value={localFilters.deal_owner_id || []}
                onChange={(val) => setFilter('deal_owner_id', val)}
                placeholder='Select Owners...'
              />
            </div>
          </div>

          <div className='flex flex-wrap items-end justify-between gap-4 pt-2 border-t border-dashed'>
            <div className='flex flex-wrap gap-6'>
              <div className='flex items-center gap-2'>
                <div className='space-y-1.5'>
                  <Label className='text-[11px] font-medium text-zinc-500'>
                    Created From
                  </Label>
                  <Input
                    type='date'
                    className='h-9 text-sm w-[150px]'
                    value={localFilters.created_from}
                    onChange={(e) => setFilter('created_from', e.target.value)}
                  />
                </div>
                <div className='space-y-1.5'>
                  <Label className='text-[11px] font-medium text-zinc-500'>
                    Created To
                  </Label>
                  <Input
                    type='date'
                    className='h-9 text-sm w-[150px]'
                    value={localFilters.created_to}
                    onChange={(e) => setFilter('created_to', e.target.value)}
                  />
                </div>
              </div>

              <div className='flex items-center gap-2 border-l pl-6'>
                <div className='space-y-1.5'>
                  <Label className='text-[11px] font-medium text-zinc-500'>
                    Lender Login From
                  </Label>
                  <Input
                    type='date'
                    className='h-9 text-sm w-[150px]'
                    value={localFilters.lender_login_from}
                    onChange={(e) =>
                      setFilter('lender_login_from', e.target.value)
                    }
                  />
                </div>
                <div className='space-y-1.5'>
                  <Label className='text-[11px] font-medium text-zinc-500'>
                    Lender Login To
                  </Label>
                  <Input
                    type='date'
                    className='h-9 text-sm w-[150px]'
                    value={localFilters.lender_login_to}
                    onChange={(e) =>
                      setFilter('lender_login_to', e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            <div className='flex items-center gap-1 border-l pl-6'>
              <div className='space-y-1.5'>
                <Label className='text-[11px] font-medium text-zinc-500'>
                  Disbursement Date
                </Label>
                <div className='flex gap-1'>
                  <Input
                    type='date'
                    className='h-8 text-xs w-[130px] border-indigo-100 focus:border-indigo-300'
                    value={localFilters.disbursement_from}
                    onChange={(e) =>
                      setFilter('disbursement_from', e.target.value)
                    }
                  />
                  <Input
                    type='date'
                    className='h-8 text-xs w-[130px] border-indigo-100 focus:border-indigo-300'
                    value={localFilters.disbursement_to}
                    onChange={(e) =>
                      setFilter('disbursement_to', e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            <div className='flex items-center gap-1 border-l pl-4'>
              <div className='space-y-1.5'>
                <Label className='text-[11px] font-medium text-zinc-500'>
                  Target Disbursement
                </Label>
                <div className='flex gap-1'>
                  <Input
                    type='date'
                    className='h-8 text-xs w-[130px] border-indigo-100 focus:border-indigo-300'
                    value={localFilters.targeted_disbursement_from}
                    onChange={(e) =>
                      setFilter('targeted_disbursement_from', e.target.value)
                    }
                  />
                  <Input
                    type='date'
                    className='h-8 text-xs w-[130px] border-indigo-100 focus:border-indigo-300'
                    value={localFilters.targeted_disbursement_to}
                    onChange={(e) =>
                      setFilter('targeted_disbursement_to', e.target.value)
                    }
                  />
                </div>
              </div>
            </div>

            <div className='flex items-center gap-2 pb-0.5'>
              <Button
                variant='ghost'
                size='sm'
                onClick={clearFilters}
                className='h-9 text-sm text-zinc-500 hover:text-red-600 transition-colors'
              >
                <FilterX size={16} className='mr-2' /> Reset
              </Button>
              <Button
                size='sm'
                onClick={applyFilters}
                className='h-9 text-sm px-5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
              >
                <Search size={16} className='mr-2' /> Apply Filters
              </Button>
            </div>
          </div>
        </div>

        <div className='flex-1 overflow-hidden'>
          <TicketsKanbanView
            filters={appliedFilters}
            enabled={hasApplied}
            onTotalFetched={setTotalTickets}
          />
        </div>
      </div>
    </div>
  )
}
