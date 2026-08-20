import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
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
    Search,
    Filter,
    RefreshCw,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { ENV } from '@/conf'
import Pagination from '@/components/shared/pagination'
import { Skeleton } from '@/components/ui/skeleton'

export interface StatusStep {
    name: string
    duration: string
    color: string
    updatedBy?: string
    startDate?: string
    endDate?: string
}

export interface AccountStatusJourney {
    id: string
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
        const existing = map.get(step.name)
        if (existing) {
            existing.totalMinutes += minutes
            existing.count += 1
        } else {
            map.set(step.name, { totalMinutes: minutes, count: 1 })
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
    { label: 'Yet to be dialed', color: 'blue' },
    { label: 'Wrong Number', color: 'emerald' },
    { label: 'Contact Established', color: 'amber' },
    { label: 'Contact Not Established', color: 'rose' },
    { label: 'Awareness', color: 'purple' },
    { label: 'Attention', color: 'blue' },
    { label: 'Assessment', color: 'emerald' },
    { label: 'Lender Review', color: 'amber' },
    { label: 'Not Interested', color: 'rose' },
    { label: 'Location Unserviceable', color: 'purple' },
]

export default function AccountsStatusPage() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize] = useState(20)
    const [searchInput, setSearchInput] = useState('')
    const [activeSearchTerm, setActiveSearchTerm] = useState('')
    const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all')

    const rawRole = String(user?.role || '').toLowerCase().trim().replace(/\s+/g, '_')
    const isAdminOrSuperAdmin = ['super_admin', 'superadmin', 'admin'].includes(rawRole) || rawRole.includes('admin')

    const { data: accountsData = [], isLoading, isError, refetch } = useQuery<AccountStatusJourney[]>({
        queryKey: ['accountStatusJourneys', currentPage, pageSize],
        queryFn: async () => {
            const res = await fetch(
                `${ENV.VITE_BACKEND_BASE_URL}/accounts/status-journey?company_id=1&page=${currentPage}&limit=${pageSize}`,
                {
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
                    },
                }
            )
            if (!res.ok) throw new Error('Failed to fetch account status journeys')
            return res.json()
        },
    })

    // If activeSearchTerm is a numeric account ID, fetch single account directly
    const isAccountIdSearch = /^\d+$/.test(activeSearchTerm.trim())
    const { data: singleAccountResult } = useQuery<AccountStatusJourney | null>({
        queryKey: ['singleAccountJourney', activeSearchTerm],
        queryFn: async () => {
            if (!isAccountIdSearch) return null
            try {
                const res = await fetch(
                    `${ENV.VITE_BACKEND_BASE_URL}/accounts/status-journey/${activeSearchTerm.trim()}`,
                    {
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
                        },
                    }
                )
                if (!res.ok) return null
                return await res.json()
            } catch {
                return null
            }
        },
        enabled: isAccountIdSearch && !!activeSearchTerm.trim(),
    })

    // Combine list data and single account search result
    let combinedAccounts = [...accountsData]
    if (singleAccountResult && !combinedAccounts.some((a) => a.id === singleAccountResult.id)) {
        combinedAccounts = [singleAccountResult, ...combinedAccounts]
    }

    const filteredAccounts = combinedAccounts.filter((acc) => {
        const term = activeSearchTerm.toLowerCase().trim()
        const matchesSearch =
            !term ||
            acc.id.toLowerCase().includes(term) ||
            acc.name.toLowerCase().includes(term) ||
            acc.owner.toLowerCase().includes(term)

        const matchesStatus =
            selectedStatusFilter === 'all' ||
            acc.journey.some((step) => step.name === selectedStatusFilter)

        return matchesSearch && matchesStatus
    })

    const handleSearchSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        setActiveSearchTerm(searchInput)
    }

    const handleResetFilters = () => {
        setSearchInput('')
        setActiveSearchTerm('')
        setSelectedStatusFilter('all')
    }

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
                            Timeline view of status transitions and time spent in each Status per account.
                        </p>
                    </div>

                    <div className='flex items-center gap-3'>
                        <Button
                            variant='outline'
                            size='sm'
                            className='gap-2 text-xs font-medium'
                            onClick={() => refetch()}
                        >
                            <RefreshCw className='w-3.5 h-3.5' />
                            Refresh
                        </Button>
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
                        <CardContent className=' flex flex-wrap items-center justify-between gap-3 text-xs p-3.5'>
                            <div className='flex items-center gap-2 font-semibold text-muted-foreground'>
                                <Info className='w-4 h-4 text-primary' />
                                <span>Status Key:</span>
                            </div>
                            <div className='flex flex-wrap items-center gap-2.5'>
                                {STATUS_LEGEND.map((item, idx) => {
                                    const style = STATUS_COLOR_MAP[item.color] || STATUS_COLOR_MAP.blue
                                    return (
                                        <div
                                            key={idx}
                                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${style.bg} ${style.border}`}
                                        >
                                            <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                                            <span className='text-muted-foreground text-[11px]'>{item.label}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* <Card className='border bg-card shadow-xs'>
                        <CardContent className='p-3.5 flex items-center justify-between gap-3 text-xs'>
                            <div className='space-y-0.5'>
                                <p className='text-muted-foreground font-medium'>Loaded Accounts</p>
                                <p className='text-xl font-bold text-foreground'>{filteredAccounts.length}</p>
                            </div>
                            <div className='p-2 rounded-lg bg-primary/10 text-primary'>
                                <Building2 className='w-5 h-5' />
                            </div>
                        </CardContent>
                    </Card> */}
                </div>

                {/* Search & Filter Bar */}
                <form onSubmit={handleSearchSubmit} className='flex flex-wrap items-center justify-between gap-3 bg-muted/30 p-3 rounded-lg border'>
                    <div className='flex flex-wrap items-center gap-3 flex-1 max-w-2xl'>
                        <div className='relative flex-1 min-w-[240px] flex items-center gap-2'>
                            <div className='relative flex-1'>
                                <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                                <Input
                                    placeholder='Search Account ID, Name, or Owner...'
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    className='pl-9 bg-background h-9 text-xs'
                                />
                            </div>
                            <Button type='submit' size='sm' className='h-9 text-xs gap-1.5 px-4'>
                                <Search className='w-3.5 h-3.5' />
                                Search
                            </Button>
                        </div>

                        <div className='w-48'>
                            <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
                                <SelectTrigger className='h-9 text-xs bg-background'>
                                    <div className='flex items-center gap-2 truncate'>
                                        <Filter className='w-3.5 h-3.5 text-muted-foreground' />
                                        <SelectValue placeholder='Filter by status' />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value='all'>All Statuses</SelectItem>
                                    {STATUS_LEGEND.map((l, idx) => (
                                        <SelectItem key={idx} value={l.label}>
                                            {l.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className='flex items-center gap-2'>
                        <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            className='h-9 text-xs gap-1.5 text-muted-foreground hover:text-foreground'
                            onClick={handleResetFilters}
                        >
                            <RefreshCw className='w-3.5 h-3.5' />
                            Reset Filters
                        </Button>
                    </div>
                </form>

                {/* 2-Column Table matching reference design */}
                <div className='border rounded-lg bg-background overflow-hidden shadow-xs'>
                    <Table>
                        <TableHeader className='bg-muted/50'>
                            <TableRow className='hover:bg-transparent'>
                                <TableHead className='w-[260px] font-bold text-xs uppercase tracking-wider text-foreground border-r py-3.5 pl-4'>
                                    Account
                                </TableHead>
                                <TableHead className='font-bold text-xs uppercase tracking-wider text-foreground py-3.5 pl-4'>
                                    Status Journey
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell className='border-r py-4 pl-4'>
                                            <Skeleton className='h-5 w-40 mb-1' />
                                            <Skeleton className='h-3 w-24' />
                                        </TableCell>
                                        <TableCell className='py-4 pl-4'>
                                            <Skeleton className='h-8 w-full max-w-lg' />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : isError ? (
                                <TableRow>
                                    <TableCell colSpan={2} className='h-32 text-center text-destructive text-sm'>
                                        Failed to load status journeys. Please try again.
                                    </TableCell>
                                </TableRow>
                            ) : filteredAccounts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={2} className='h-32 text-center text-muted-foreground text-sm'>
                                        No accounts found matching criteria.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredAccounts.map((account) => (
                                    <TableRow key={account.id} className='hover:bg-muted/30 transition-colors border-b'>
                                        {/* Column 1: Account */}
                                        <TableCell className='border-r align-middle py-3.5 pl-4 pr-3'>
                                            <div className='flex flex-col gap-1'>
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
                                                {account.journey.length > 0 && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                type='button'
                                                                className='inline-flex items-center justify-center p-1 rounded-full bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 transition-colors mr-1 cursor-pointer'
                                                                aria-label='Calculated Status grouping'
                                                            >
                                                                <Info className='w-3.5 h-3.5' />
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side='top' className='p-3 max-w-md bg-popover text-popover-foreground border shadow-md space-y-1.5'>
                                                            <div className='flex items-center gap-1.5 font-bold text-xs text-foreground border-b pb-1'>
                                                                <Info className='w-3.5 h-3.5 text-amber-500' />
                                                                Calculated Status Grouping
                                                            </div>
                                                            <div className='px-2.5 py-1.5 rounded bg-yellow-100 dark:bg-yellow-950/70 border border-yellow-300 dark:border-yellow-700 text-yellow-900 dark:text-yellow-200 font-mono text-xs font-semibold tracking-wide'>
                                                                {computeStageSummary(account.journey)}
                                                            </div>
                                                            <p className='text-[11px] text-muted-foreground leading-tight'>
                                                                Calculated grouping on which Status has taken how many days and how many times it got changed to same Status.
                                                            </p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                )}
                                                {account.journey.length === 0 ? (
                                                    <span className='text-xs text-muted-foreground italic'>No status history recorded yet</span>
                                                ) : (
                                                    account.journey.map((step, idx) => {
                                                        const style = STATUS_COLOR_MAP[step.color] || STATUS_COLOR_MAP.blue

                                                        return (
                                                            <div key={idx} className='flex items-center gap-2'>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <div
                                                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${style.bg} ${style.border} ${style.text} shadow-2xs font-medium text-xs cursor-pointer hover:scale-105 transition-transform`}
                                                                        >
                                                                            <span className={`w-2.5 h-2.5 rounded-full ${style.dot} flex-shrink-0`} />
                                                                            <span className='font-bold text-xs'>{step.name}</span>
                                                                            <span className='text-[11px] opacity-90 font-mono'>· {step.duration}</span>
                                                                        </div>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side='top' className='text-xs space-y-1 p-2.5'>
                                                                        <p className='font-bold'>
                                                                            Status: {step.name}
                                                                        </p>
                                                                        <div className='text-[11px] space-y-0.5'>
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
                                                    })
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination Footer */}
                    <div className='p-3 border-t bg-muted/20'>
                        <Pagination
                            currentPage={currentPage}
                            totalPages={Math.max(1, Math.ceil(27154 / pageSize))}
                            onPageChange={(page) => setCurrentPage(page)}
                        />
                    </div>
                </div>
            </div>
        </TooltipProvider>
    )
}