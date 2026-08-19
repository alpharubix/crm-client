import { useState } from 'react'
import { FilterX, Search } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { DatePicker } from '../ui/date-picker'
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
  { value: 'Open SCF Renewal', label: 'Open SCF Renewal' },
  { value: 'Open SCF Enhancement', label: 'Open SCF Enhancement' },
  { value: 'Open SCF (Renewal and Enhancement)', label: 'Open SCF (Renewal and Enhancement)' },
  { value: 'BT-SCF', label: 'BT-SCF' },
  { value: 'BT-Open SCF', label: 'BT-Open SCF' },
  { value: 'Unsecured OD', label: 'Unsecured OD' },
  { value: 'Unsecured Term Loan', label: 'Unsecured Term Loan' },
  { value: 'Secured Loan', label: 'Secured Loan' },
  { value: 'Vehicle Loan', label: 'Vehicle Loan' },
  { value: 'Secured BT', label: 'Secured BT' }
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

        <div className='bg-card border border-border/70 rounded-2xl shadow-2xs p-4 sm:p-5 mb-6 shrink-0 space-y-4'>
          {/* Top Row: Search & MultiSelect Dropdowns */}
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5 w-full'>
            <div className='space-y-1.5 md:col-span-1'>
              <Label className='text-[10px] font-bold tracking-wider text-muted-foreground uppercase'>
                Search Account
              </Label>
              <div className='relative'>
                <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/70 pointer-events-none' />
                <Input
                  placeholder='Account name...'
                  className='pl-8 h-9 text-xs rounded-lg bg-background border-border/60'
                  value={localFilters.search}
                  onChange={(e) => setFilter('search', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                />
              </div>
            </div>

            <div className='space-y-1.5 md:col-span-2'>
              <Label className='text-[10px] font-bold tracking-wider text-muted-foreground uppercase'>
                Loan Type
              </Label>
              <MultiSelect
                options={LOAN_TYPE_OPTIONS}
                value={localFilters.type_of_loan}
                onChange={(val) => setFilter('type_of_loan', val)}
                placeholder='Select Loan Types...'
              />
            </div>

            <div className='space-y-1.5 md:col-span-2'>
              <Label className='text-[10px] font-bold tracking-wider text-muted-foreground uppercase'>
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

          {/* Grouped Date Ranges with Subtle Background Containers */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2 border-t border-border/50'>
            {/* Group 1: Created Date */}
            <div className='bg-muted/20 border border-border/40 p-2.5 rounded-xl space-y-1.5'>
              <Label className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider block'>
                Created Date
              </Label>
              <div className='grid grid-cols-2 gap-2'>
                <DatePicker
                  value={localFilters.created_from}
                  onChange={(val) => setFilter('created_from', val)}
                  placeholder='From Date'
                />
                <DatePicker
                  value={localFilters.created_to}
                  onChange={(val) => setFilter('created_to', val)}
                  placeholder='To Date'
                />
              </div>
            </div>

            {/* Group 2: Lender Login Date */}
            <div className='bg-muted/20 border border-border/40 p-2.5 rounded-xl space-y-1.5'>
              <Label className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider block'>
                Lender Login Date
              </Label>
              <div className='grid grid-cols-2 gap-2'>
                <DatePicker
                  value={localFilters.lender_login_from}
                  onChange={(val) => setFilter('lender_login_from', val)}
                  placeholder='From Date'
                />
                <DatePicker
                  value={localFilters.lender_login_to}
                  onChange={(val) => setFilter('lender_login_to', val)}
                  placeholder='To Date'
                />
              </div>
            </div>

            {/* Group 3: Disbursement Date */}
            <div className='bg-muted/20 border border-border/40 p-2.5 rounded-xl space-y-1.5'>
              <Label className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider block'>
                Disbursement Date
              </Label>
              <div className='grid grid-cols-2 gap-2'>
                <DatePicker
                  value={localFilters.disbursement_from}
                  onChange={(val) => setFilter('disbursement_from', val)}
                  placeholder='From Date'
                />
                <DatePicker
                  value={localFilters.disbursement_to}
                  onChange={(val) => setFilter('disbursement_to', val)}
                  placeholder='To Date'
                />
              </div>
            </div>

            {/* Group 4: Target Disbursement */}
            <div className='bg-muted/20 border border-border/40 p-2.5 rounded-xl space-y-1.5'>
              <Label className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider block'>
                Target Disbursement
              </Label>
              <div className='grid grid-cols-2 gap-2'>
                <DatePicker
                  value={localFilters.targeted_disbursement_from}
                  onChange={(val) => setFilter('targeted_disbursement_from', val)}
                  placeholder='From Date'
                />
                <DatePicker
                  value={localFilters.targeted_disbursement_to}
                  onChange={(val) => setFilter('targeted_disbursement_to', val)}
                  placeholder='To Date'
                />
              </div>
            </div>
          </div>

          {/* Bottom Action Buttons Bar */}
          <div className='flex items-center justify-end gap-2.5 pt-2 border-t border-border/40'>
            <Button
              variant='outline'
              onClick={clearFilters}
              className='h-9 text-xs rounded-lg px-3.5 cursor-pointer gap-1.5 text-muted-foreground hover:text-foreground'
            >
              <FilterX size={14} /> Reset
            </Button>
            <Button
              onClick={applyFilters}
              className='h-9 text-xs px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold cursor-pointer shadow-sm gap-1.5'
            >
              <Search size={14} /> Apply Filters
            </Button>
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
