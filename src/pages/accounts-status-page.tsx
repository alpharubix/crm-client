import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  ArrowRight,
  Table as TableIcon,
  Building2,
  Info,
} from 'lucide-react'

export interface StatusStep {
  code: string
  name: string
  duration: string
  color: string 
  updatedBy?: string
  startDate?: string
  endDate?: string
}

export interface AccountStatusJourney {
  id: string
  code: string
  name: string
  owner: string
  currentStatus: string
  journey: StatusStep[]
}

function parseDurationToMinutes(durationStr: string): number {
  let minutes = 0
  const dayMatch = durationStr.match(/(\d+)\s*d/i)
  const hourMatch = durationStr.match(/(\d+)\s*h/i)
  const minMatch = durationStr.match(/(\d+)\s*m/i)
  if (dayMatch) minutes += parseInt(dayMatch[1], 10) * 24 * 60
  if (hourMatch) minutes += parseInt(hourMatch[1], 10) * 60
  if (minMatch) minutes += parseInt(minMatch[1], 10)
  return minutes > 0 ? minutes : 60
}

function formatMinutes(totalMinutes: number): string {
  if (totalMinutes >= 1440) {
    const days = Math.floor(totalMinutes / 1440)
    const remainingHours = Math.floor((totalMinutes % 1440) / 60)
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`
  } else if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60)
    const mins = totalMinutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }
  return `${totalMinutes}m`
}

export function computeStageSummary(journey: StatusStep[]): string {
  const map = new Map<string, { totalMinutes: number; count: number }>()

  journey.forEach((step) => {
    const minutes = parseDurationToMinutes(step.duration)
    const existing = map.get(step.code)
    if (existing) {
      existing.totalMinutes += minutes
      existing.count += 1
    } else {
      map.set(step.code, { totalMinutes: minutes, count: 1 })
    }
  })

  const sortedCodes = Array.from(map.keys()).sort()

  const parts: string[] = []
  sortedCodes.forEach((code) => {
    const val = map.get(code)!
    const durationText = formatMinutes(val.totalMinutes)
    parts.push(`${code} ${durationText} (${val.count})`)
  })

  return parts.join(' · ')
}

const STATUS_COLOR_MAP: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
    border: 'border-blue-200 dark:border-blue-800',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
    border: 'border-amber-200 dark:border-amber-800',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-700 dark:text-purple-300',
    dot: 'bg-purple-500',
    border: 'border-purple-200 dark:border-purple-800',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-700 dark:text-rose-300',
    dot: 'bg-rose-500',
    border: 'border-rose-200 dark:border-rose-800',
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-700 dark:text-indigo-300',
    dot: 'bg-indigo-500',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
}


const STATUS_LEGEND = [
  { code: 'A', label: 'Yet to be dialed', color: 'blue' },
  { code: 'B', label: 'Wrong Number', color: 'emerald' },
  { code: 'C', label: 'Contact Established', color: 'amber' },
  { code: 'E', label: 'Contact Not Established', color: 'rose' },
  { code: 'F', label: 'Awareness', color: 'purple' },
  { code: 'G', label: 'Attention', color: 'blue' },
  { code: 'H', label: 'Assessment', color: 'emerald' },
  { code: 'I', label: 'Lender Review', color: 'amber' },
  { code: 'J', label: 'Not Interested', color: 'rose' },
  { code: 'K', label: 'Location Unserviceable', color: 'purple' },
]


const DUMMY_ACCOUNTS: AccountStatusJourney[] = [
  {
    id: '1',
    code: 'ACC-001',
    name: 'Himalaya Wellness Corp',
    owner: 'Rahul Sharma',
    currentStatus: 'Awareness',
    journey: [
      { code: 'A', name: 'Awareness', duration: '10d', color: 'blue', startDate: '2026-07-01', endDate: '2026-07-11', updatedBy: 'Rahul S' },
      { code: 'C', name: 'Attention', duration: '2h', color: 'amber', startDate: '2026-07-11', endDate: '2026-07-11', updatedBy: 'Anita M' },
      { code: 'B', name: 'Contact Established', duration: '1d', color: 'emerald', startDate: '2026-07-11', endDate: '2026-07-12', updatedBy: 'Rahul S' },
      { code: 'A', name: 'Awareness', duration: '3d', color: 'blue', startDate: '2026-07-12', endDate: 'Present', updatedBy: 'System' },
    ],
  },
  {
    id: '2',
    code: 'ACC-002',
    name: 'CavinKare Pvt Ltd',
    owner: 'Priya Verma',
    currentStatus: 'Assessment',
    journey: [
      { code: 'A', name: 'Awareness', duration: '4h', color: 'blue', startDate: '2026-07-15', endDate: '2026-07-15', updatedBy: 'Priya V' },
      { code: 'F', name: 'Interested', duration: '3d', color: 'purple', startDate: '2026-07-15', endDate: '2026-07-18', updatedBy: 'Priya V' },
      { code: 'E', name: 'Assessment', duration: '8h', color: 'rose', startDate: '2026-07-18', endDate: 'Present', updatedBy: 'Manager' },
    ],
  },
  {
    id: '3',
    code: 'ACC-003',
    name: 'Marico Consumer Care',
    owner: 'Vikram Singh',
    currentStatus: 'Assessment',
    journey: [
      { code: 'A', name: 'Awareness', duration: '2d', color: 'blue', startDate: '2026-07-02', endDate: '2026-07-04', updatedBy: 'Vikram S' },
      { code: 'B', name: 'Contact Established', duration: '5h', color: 'emerald', startDate: '2026-07-04', endDate: '2026-07-04', updatedBy: 'Vikram S' },
      { code: 'C', name: 'Attention', duration: '8d', color: 'amber', startDate: '2026-07-04', endDate: '2026-07-12', updatedBy: 'System' },
      { code: 'F', name: 'Interested', duration: '1d', color: 'purple', startDate: '2026-07-12', endDate: '2026-07-13', updatedBy: 'Vikram S' },
      { code: 'E', name: 'Assessment', duration: '4h', color: 'rose', startDate: '2026-07-13', endDate: 'Present', updatedBy: 'Lender Team' },
    ],
  },
  {
    id: '4',
    code: 'ACC-004',
    name: 'Havells India Ltd',
    owner: 'Ananya Roy',
    currentStatus: 'Contact Established',
    journey: [
      { code: 'A', name: 'Awareness', duration: '6h', color: 'blue', startDate: '2026-07-20', endDate: '2026-07-20', updatedBy: 'Ananya R' },
      { code: 'C', name: 'Attention', duration: '2d', color: 'amber', startDate: '2026-07-20', endDate: '2026-07-22', updatedBy: 'Ananya R' },
      { code: 'B', name: 'Contact Established', duration: '4d', color: 'emerald', startDate: '2026-07-22', endDate: 'Present', updatedBy: 'Ananya R' },
    ],
  },
  {
    id: '5',
    code: 'ACC-005',
    name: 'Liberty Shoes Ltd',
    owner: 'Kiran Patel',
    currentStatus: 'Awareness',
    journey: [
      { code: 'A', name: 'Awareness', duration: '1d', color: 'blue', startDate: '2026-07-25', endDate: '2026-07-26', updatedBy: 'Kiran P' },
      { code: 'C', name: 'Attention', duration: '6h', color: 'amber', startDate: '2026-07-26', endDate: '2026-07-26', updatedBy: 'Kiran P' },
      { code: 'B', name: 'Contact Established', duration: '2d', color: 'emerald', startDate: '2026-07-26', endDate: '2026-07-28', updatedBy: 'Kiran P' },
      { code: 'A', name: 'Awareness', duration: '5h', color: 'blue', startDate: '2026-07-28', endDate: 'Present', updatedBy: 'System' },
    ],
  },
  {
    id: '6',
    code: 'ACC-006',
    name: 'Swastik Enterprises',
    owner: 'Rahul Sharma',
    currentStatus: 'Interested',
    journey: [
      { code: 'A', name: 'Awareness', duration: '12d', color: 'blue', startDate: '2026-06-15', endDate: '2026-06-27', updatedBy: 'Rahul S' },
      { code: 'B', name: 'Contact Established', duration: '1d', color: 'emerald', startDate: '2026-06-27', endDate: '2026-06-28', updatedBy: 'Rahul S' },
      { code: 'C', name: 'Attention', duration: '3d', color: 'amber', startDate: '2026-06-28', endDate: '2026-07-01', updatedBy: 'Rahul S' },
      { code: 'F', name: 'Interested', duration: '4d', color: 'purple', startDate: '2026-07-01', endDate: 'Present', updatedBy: 'Rahul S' },
    ],
  },
  {
    id: '7',
    code: 'ACC-007',
    name: 'Condor Footwear Ltd',
    owner: 'Priya Verma',
    currentStatus: 'Assessment',
    journey: [
      { code: 'B', name: 'Contact Established', duration: '2d', color: 'emerald', startDate: '2026-07-10', endDate: '2026-07-12', updatedBy: 'Priya V' },
      { code: 'C', name: 'Attention', duration: '5d', color: 'amber', startDate: '2026-07-12', endDate: '2026-07-17', updatedBy: 'Priya V' },
      { code: 'E', name: 'Assessment', duration: '1d', color: 'rose', startDate: '2026-07-17', endDate: 'Present', updatedBy: 'Underwriting' },
    ],
  },
  {
    id: '8',
    code: 'ACC-008',
    name: 'Vibhava Marketing',
    owner: 'Ananya Roy',
    currentStatus: 'Awareness',
    journey: [
      { code: 'A', name: 'Awareness', duration: '8h', color: 'blue', startDate: '2026-07-05', endDate: '2026-07-05', updatedBy: 'Ananya R' },
      { code: 'B', name: 'Contact Established', duration: '3d', color: 'emerald', startDate: '2026-07-05', endDate: '2026-07-08', updatedBy: 'Ananya R' },
      { code: 'F', name: 'Interested', duration: '2d', color: 'purple', startDate: '2026-07-08', endDate: '2026-07-10', updatedBy: 'Ananya R' },
      { code: 'E', name: 'Assessment', duration: '6d', color: 'rose', startDate: '2026-07-10', endDate: '2026-07-16', updatedBy: 'Manager' },
      { code: 'A', name: 'Awareness', duration: '1d', color: 'blue', startDate: '2026-07-16', endDate: 'Present', updatedBy: 'System' },
    ],
  },
  {
    id: '9',
    code: 'ACC-009',
    name: 'Unicharm India',
    owner: 'Vikram Singh',
    currentStatus: 'Assessment',
    journey: [
      { code: 'C', name: 'Attention', duration: '4d', color: 'amber', startDate: '2026-07-01', endDate: '2026-07-05', updatedBy: 'Vikram S' },
      { code: 'B', name: 'Contact Established', duration: '1d', color: 'emerald', startDate: '2026-07-05', endDate: '2026-07-06', updatedBy: 'Vikram S' },
      { code: 'E', name: 'Assessment', duration: '2d', color: 'rose', startDate: '2026-07-06', endDate: 'Present', updatedBy: 'Lender' },
    ],
  },
  {
    id: '10',
    code: 'ACC-010',
    name: 'R1X Distribution Services',
    owner: 'Kiran Patel',
    currentStatus: 'Contact Established',
    journey: [
      { code: 'A', name: 'Awareness', duration: '15d', color: 'blue', startDate: '2026-06-01', endDate: '2026-06-16', updatedBy: 'Kiran P' },
      { code: 'C', name: 'Attention', duration: '4h', color: 'amber', startDate: '2026-06-16', endDate: '2026-06-16', updatedBy: 'Kiran P' },
      { code: 'B', name: 'Contact Established', duration: '2d', color: 'emerald', startDate: '2026-06-16', endDate: 'Present', updatedBy: 'Kiran P' },
    ],
  },
]

export default function AccountsStatusPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all')

  const filteredAccounts = DUMMY_ACCOUNTS.filter((acc) => {
    const matchesSearch =
      acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.owner.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      selectedStatusFilter === 'all' ||
      acc.journey.some((step) => step.code === selectedStatusFilter)

    return matchesSearch && matchesStatus
  })

  return (
    <TooltipProvider>
      <div className='p-4 space-y-5'>
        {/* Header Bar */}
        <div className='flex flex-wrap items-center justify-between gap-4 pb-2 border-b'>
          <div>
            <div className='flex items-center gap-2'>
              <h1 className='text-2xl font-bold tracking-tight'>Accounts Status Journey</h1>
            </div>
            <p className='text-sm text-muted-foreground mt-0.5'>
              Timeline view of status transitions and time spent in each stage per account.
            </p>
          </div>

          <div className='flex items-center gap-3'>
            <Button
              variant='outline'
              size='sm'
              className='gap-2 text-xs font-medium'
              onClick={() => navigate('/accounts')}
            >
              <TableIcon className='w-4 h-4' />
              View Accounts
            </Button>
          </div>
        </div>

        {/* Legend & Stats Section */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <Card className='md:col-span-3 border bg-card shadow-xs'>
            <CardContent className='p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs'>
              <div className='flex items-center gap-2 font-semibold text-muted-foreground'>
                <Info className='w-4 h-4 text-primary' />
                <span>Status Key:</span>
              </div>
              <div className='flex flex-wrap items-center gap-2.5'>
                {STATUS_LEGEND.map((item) => {
                  const style = STATUS_COLOR_MAP[item.color]
                  return (
                    <div
                      key={item.code}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${style.bg} ${style.border}`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                      <span className={`font-bold ${style.text}`}>{item.code}</span>
                      <span className='text-muted-foreground text-[11px]'>({item.label})</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card className='border bg-card shadow-xs'>
            <CardContent className='p-3.5 flex items-center justify-between gap-3 text-xs'>
              <div className='space-y-0.5'>
                <p className='text-muted-foreground font-medium'>Total Accounts</p>
                <p className='text-xl font-bold text-foreground'>{filteredAccounts.length}</p>
              </div>
              <div className='p-2 rounded-lg bg-primary/10 text-primary'>
                <Building2 className='w-5 h-5' />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Controls */}
        {/* <div className='flex flex-wrap items-center justify-between gap-3 bg-muted/30 p-3 rounded-lg border'>
          <div className='flex flex-wrap items-center gap-3 flex-1 max-w-xl'>
            <div className='relative flex-1 min-w-[200px]'>
              <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search account name or code...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-9 bg-background h-9 text-xs'
              />
            </div>

            <div className='w-48'>
              <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
                <SelectTrigger className='h-9 text-xs bg-background'>
                  <div className='flex items-center gap-2 truncate'>
                    <Filter className='w-3.5 h-3.5 text-muted-foreground' />
                    <SelectValue placeholder='Filter by stage' />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Status Stages</SelectItem>
                  {STATUS_LEGEND.map((l) => (
                    <SelectItem key={l.code} value={l.code}>
                      Stage {l.code} - {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='sm'
              className='h-9 text-xs gap-1.5 text-muted-foreground hover:text-foreground'
              onClick={() => {
                setSearchTerm('')
                setSelectedStatusFilter('all')
              }}
            >
              <RefreshCw className='w-3.5 h-3.5' />
              Reset Filters
            </Button>
          </div>
        </div> */}

        {/* 2-Column Table matching reference screenshot */}
        <div className='border rounded-lg bg-background overflow-hidden shadow-xs'>
          <Table>
            <TableHeader className='bg-muted/50'>
              <TableRow className='hover:bg-transparent'>
                <TableHead className='w-[240px] font-bold text-xs uppercase tracking-wider text-foreground border-r py-3.5 pl-4'>
                  Account
                </TableHead>
                <TableHead className='font-bold text-xs uppercase tracking-wider text-foreground py-3.5 pl-4'>
                  Status Journey
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className='h-32 text-center text-muted-foreground text-sm'>
                    No accounts found matching search criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredAccounts.map((account) => (
                  <TableRow key={account.id} className='hover:bg-muted/30 transition-colors border-b'>
                    {/* Column 1: Account */}
                    <TableCell className='border-r align-middle py-3.5 pl-4 pr-3'>
                      <div className='flex flex-col gap-1'>
                        <div className='flex items-center gap-2'>
                          <span className='font-mono text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20'>
                            {account.code}
                          </span>
                        </div>
                        <span className='font-semibold text-sm text-foreground leading-snug'>
                          {account.name}
                        </span>
                        <span className='text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5'>
                          Owner: <span className='font-medium text-foreground/80'>{account.owner}</span>
                        </span>
                      </div>
                    </TableCell>

                    {/* Column 2: Status Journey */}
                    <TableCell className='align-middle py-3.5 pl-4 pr-4 overflow-x-auto'>
                      <div className='flex items-center gap-2 flex-wrap py-1 min-h-[40px]'>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type='button'
                              className='inline-flex items-center justify-center p-1 rounded-full bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 transition-colors mr-1 cursor-pointer'
                              aria-label='Calculated stage grouping'
                            >
                              <Info className='w-3.5 h-3.5' />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side='top' className='p-3 max-w-md bg-popover text-popover-foreground border shadow-md space-y-1.5'>
                            <div className='flex items-center gap-1.5 font-bold text-xs text-foreground border-b pb-1'>
                              <Info className='w-3.5 h-3.5 text-amber-500' />
                              Calculated Stage Grouping
                            </div>
                            <div className='px-2.5 py-1.5 rounded bg-yellow-100 dark:bg-yellow-950/70 border border-yellow-300 dark:border-yellow-700 text-yellow-900 dark:text-yellow-200 font-mono text-xs font-semibold tracking-wide'>
                              {computeStageSummary(account.journey)}
                            </div>
                            <p className='text-[11px] text-muted-foreground leading-tight'>
                              Calculated grouping on which stage has taken how many days and how many times it got changed to same stage.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                        {account.journey.map((step, idx) => {
                          const style = STATUS_COLOR_MAP[step.color] || STATUS_COLOR_MAP.blue

                          return (
                            <div key={idx} className='flex items-center gap-2'>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${style.bg} ${style.border} ${style.text} shadow-2xs font-medium text-xs cursor-pointer hover:scale-105 transition-transform`}
                                  >
                                    <span className={`w-2.5 h-2.5 rounded-full ${style.dot} flex-shrink-0`} />
                                    <span className='font-bold text-xs'>{step.code}</span>
                                    <span className='text-[11px] opacity-90 font-mono'>· {step.duration}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side='top' className='text-xs space-y-1 p-2.5'>
                                  <p className='font-bold text-foreground'>
                                    Stage: {step.name} ({step.code})
                                  </p>
                                  <div className='text-muted-foreground text-[11px] space-y-0.5'>
                                    <p>Duration spent: <span className='font-semibold text-foreground'>{step.duration}</span></p>
                                    {step.startDate && <p>Started: {step.startDate}</p>}
                                    {step.endDate && <p>Ended: {step.endDate}</p>}
                                    {step.updatedBy && <p>Updated by: {step.updatedBy}</p>}
                                  </div>
                                </TooltipContent>
                              </Tooltip>

                              {idx < account.journey.length - 1 && (
                                <ArrowRight className='w-4 h-4 text-muted-foreground/60 flex-shrink-0' />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  )
}
