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
import DealsKanbanView, { type KanbanFilters } from './deals-kanban-view'
import { Label } from '../ui/label'

interface LocalFilters {
  search: string
  project_type: string
  status: string
  assignee_id: string
  created_from: string
  created_to: string
  expected_closing_from: string
  expected_closing_to: string
  status_closing_from: string
  status_closing_to: string
}

const defaultFilters: LocalFilters = {
  search: '',
  project_type: 'all',
  status: 'all',
  assignee_id: 'all',
  created_from: '',
  created_to: '',
  expected_closing_from: '',
  expected_closing_to: '',
  status_closing_from: '',
  status_closing_to: '',
}

function getDefaultDates() {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)
  return {
    created_from: from.toISOString().split('T')[0], // "YYYY-MM-DD"
    created_to: to.toISOString().split('T')[0],
  }
}

export default function DealsKanban() {
  const [defaultDates] = useState(getDefaultDates)
  const [localFilters, setLocalFilters] = useState<LocalFilters>({
    ...defaultFilters,
    created_from: defaultDates.created_from,
    created_to: defaultDates.created_to,
  })
  const [appliedFilters, setAppliedFilters] =
    useState<KanbanFilters>(defaultDates)
  const [hasApplied, setHasApplied] = useState(true)

  function setFilter(key: keyof LocalFilters, value: string) {
    setLocalFilters((prev) => ({ ...prev, [key]: value }))
  }

  function applyFilters() {
    const f: KanbanFilters = {}
    if (localFilters.search) f.account_name = localFilters.search
    if (localFilters.project_type !== 'all')
      f.loan_type = localFilters.project_type
    if (localFilters.status !== 'all') f.deal_status = localFilters.status
    if (localFilters.created_from) f.created_from = localFilters.created_from
    if (localFilters.created_to) f.created_to = localFilters.created_to
    if (localFilters.expected_closing_from) f.expected_closing_from = localFilters.expected_closing_from
    if (localFilters.expected_closing_to) f.expected_closing_to = localFilters.expected_closing_to
    if (localFilters.status_closing_from)
      f.status_closing_from = localFilters.status_closing_from
    if (localFilters.status_closing_to)
      f.status_closing_to = localFilters.status_closing_to
    setAppliedFilters(f)
    setHasApplied(true)
  }

  function clearFilters() {
    const cleared: LocalFilters = {
      search: '',
      project_type: 'all',
      status: 'all',
      assignee_id: 'all',
      created_from: '',
      created_to: '',
      expected_closing_from: '',
      expected_closing_to: '',
      status_closing_from: '',
      status_closing_to: '',
    }
    setLocalFilters(cleared)
    setAppliedFilters({})
  }

  const hasActiveFilters = true

  return (
    <div className='w-full h-full p-4 flex flex-col max-w-[1400px] mx-auto'>
      <div className='flex flex-col flex-1 min-h-0'>
        <div className='flex items-center justify-between mb-6 shrink-0'>
          <h1 className='text-xl font-bold tracking-tight'>Deals Kanban</h1>
          {/* <Button>Create +</Button> */}
        </div>

        <div className='bg-white dark:bg-zinc-950 border rounded-xl shadow-sm p-5 space-y-5'>
          {/* Top Row: Search & Dropdowns */}
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4'>
            <div className='space-y-1'>
              <Label
                htmlFor='search'
                className='text-[11px] font-bold tracking-wider text-zinc-400 uppercase'
              >
                Search
              </Label>
              <Input
                id='search'
                placeholder='Account name...'
                className='h-9 text-xs rounded-lg border-zinc-200'
                value={localFilters.search}
                onChange={(e) => setFilter('search', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              />
            </div>

            <div className='space-y-1'>
              <Label className='text-[11px] font-bold tracking-wider text-zinc-400 uppercase'>
                Loan Type
              </Label>
              <Select
                value={localFilters.project_type}
                onValueChange={(v) => setFilter('project_type', v)}
              >
                <SelectTrigger className='h-9 text-xs rounded-lg border-zinc-200 text-zinc-700'>
                  <SelectValue placeholder='All Types' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Types</SelectItem>
                  <SelectItem value='SCF'>SCF</SelectItem>
                  <SelectItem value='SCF Renewal'>SCF Renewal</SelectItem>
                  <SelectItem value='SCF Enhancement'>
                    SCF Enhancement
                  </SelectItem>
                  <SelectItem value='SCF (Renewal and Enhancement)'>
                    SCF (Renewal & Enhancement)
                  </SelectItem>
                  <SelectItem value='Open SCF'>Open SCF</SelectItem>
                  <SelectItem value='BT-SCF'>BT-SCF</SelectItem>
                  <SelectItem value='Unsecured OD'>Unsecured OD</SelectItem>
                  <SelectItem value='Unsecured Term Loan'>
                    Unsecured Term Loan
                  </SelectItem>
                  <SelectItem value='Secured Loan'>Secured Loan</SelectItem>
                  <SelectItem value='Vehicle Loan'>Vehicle Loan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Note: Kept status commented back in since your image shows a Status dropdown */}
            <div className='space-y-1'>
              <Label className='text-[11px] font-bold tracking-wider text-zinc-400 uppercase'>
                Status
              </Label>
              <Select
                value={localFilters.status}
                onValueChange={(v) => setFilter('status', v)}
              >
                <SelectTrigger className='h-9 text-xs rounded-lg border-zinc-200 text-zinc-700'>
                  <SelectValue placeholder='All Statuses' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Statuses</SelectItem>
                  <SelectItem value='Active'>Active</SelectItem>
                  <SelectItem value='Disbursed'>Disbursed</SelectItem>
                  <SelectItem value='Rejected'>Rejected</SelectItem>
                  <SelectItem value='Closed'>Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Thin dotted/dashed horizontal separator just like the screenshot */}
          <div className='border-t border-dashed border-zinc-200 my-1' />

          {/* Bottom Row: Grouped Date Ranges with Vertical Dividers */}
          <div className='flex flex-wrap items-center gap-y-4 text-xs'>
            {/* Group 1: Created At */}
            <div className='flex gap-3 pr-4'>
              <div className='space-y-1'>
                <Label
                  htmlFor='from_date'
                  className='text-[10px] font-semibold text-zinc-500'
                >
                  Created From
                </Label>
                <Input
                  id='from_date'
                  type='date'
                  className='h-9 text-xs w-[140px] rounded-lg border-zinc-200'
                  value={localFilters.created_from}
                  onChange={(e) => setFilter('created_from', e.target.value)}
                />
              </div>
              <div className='space-y-1'>
                <Label
                  htmlFor='to_date'
                  className='text-[10px] font-semibold text-zinc-500'
                >
                  Created To
                </Label>
                <Input
                  id='to_date'
                  type='date'
                  className='h-9 text-xs w-[140px] rounded-lg border-zinc-200'
                  value={localFilters.created_to}
                  onChange={(e) => setFilter('created_to', e.target.value)}
                />
              </div>
            </div>

            {/* Vertical Line 1 */}
            <div className='hidden md:block h-10 w-[1px] bg-zinc-200 mx-2' />

            {/* Group 2: Expected Closing Range */}
            <div className='flex gap-3 px-0 md:px-4'>
              <div className='space-y-1'>
                <Label className='text-[10px] font-semibold text-zinc-500'>
                  Expected From
                </Label>
                <Input
                  type='date'
                  className='h-9 text-xs w-[140px] rounded-lg border-zinc-200'
                  value={localFilters.expected_closing_from}
                  onChange={(e) => setFilter('expected_closing_from', e.target.value)}
                />
              </div>
              <div className='space-y-1'>
                <Label className='text-[10px] font-semibold text-zinc-500'>
                  Expected To
                </Label>
                <Input
                  type='date'
                  className='h-9 text-xs w-[140px] rounded-lg border-zinc-200'
                  value={localFilters.expected_closing_to}
                  onChange={(e) => setFilter('expected_closing_to', e.target.value)}
                />
              </div>
            </div>

            {/* Vertical Line 2 */}
            <div className='hidden md:block h-10 w-[1px] bg-zinc-200 mx-2' />

            {/* Group 3: Status Closing Range */}
            <div className='flex gap-3 pl-0 md:pl-4'>
              <div className='space-y-1'>
                <Label className='text-[10px] font-semibold text-zinc-500'>
                  Status Closing From
                </Label>
                <Input
                  type='date'
                  className='h-9 text-xs w-[140px] rounded-lg border-zinc-200'
                  value={localFilters.status_closing_from}
                  onChange={(e) =>
                    setFilter('status_closing_from', e.target.value)
                  }
                />
              </div>
              <div className='space-y-1'>
                <Label className='text-[10px] font-semibold text-zinc-500'>
                  Status Closing To
                </Label>
                <Input
                  type='date'
                  className='h-9 text-xs w-[140px] rounded-lg border-zinc-200'
                  value={localFilters.status_closing_to}
                  onChange={(e) =>
                    setFilter('status_closing_to', e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          {/* Action Buttons: Left-aligned exactly like your design */}
          <div className='flex items-center gap-4 pt-2'>
            <Button
              onClick={applyFilters}
              className='h-9 text-xs px-5 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-lg font-medium shadow-sm flex items-center gap-1.5'
            >
              <Search size={14} /> Apply Filters
            </Button>

            {hasActiveFilters && (
              <Button
                variant='ghost'
                onClick={clearFilters}
                className='h-9 text-xs text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 px-2 flex items-center gap-1.5'
              >
                <FilterX size={14} /> Reset
              </Button>
            )}
          </div>
        </div>

        <div className='flex-1 overflow-hidden'>
          <DealsKanbanView filters={appliedFilters} enabled={hasApplied} />
        </div>
      </div>
    </div>
  )
}
