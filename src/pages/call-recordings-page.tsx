import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  PhoneOutgoing,
  PhoneIncoming,
  PhoneMissed,
  Search,
  RotateCw,
  Phone,
  Copy,
  Check,
  ExternalLink,
  Building2,
  Lock,
  Headphones,
  Volume2,
  Calendar,
  User,
  X,
  Play,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Pagination from '@/components/shared/pagination';
import { ENV } from '@/conf';

export interface CallRecordingItem {
  id: string;
  account_id: number | string | null;
  account_name: string | null;
  telecrm_name: string;
  lead_id: string;
  telecrm_url: string | null;
  lead_phone: string;
  call_type: string;
  normalized_call_type: 'outgoing' | 'incoming' | 'missed';
  actor_employee_email: string;
  creation_timestamp: string;
  created_at?: string;
  relative_time?: string;
  duration?: string;
  call_recording_url?: string;
  call_note?: string;
  status?: string;
  call_back_date_time?: string;
}

export interface CallRecordingsResponse {
  status: string;
  data: CallRecordingItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

// Format duration helper
function formatDuration(secStr?: string | number): string {
  const totalSec = parseInt(String(secStr || '0'), 10);
  if (isNaN(totalSec) || totalSec <= 0) return '0s';
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

// Format phone for clean display
function formatPhone(phoneStr?: string): string {
  if (!phoneStr) return '—';
  const clean = String(phoneStr).trim();
  if (clean.length === 12 && clean.startsWith('91')) {
    return `+91 ${clean.slice(2, 7)} ${clean.slice(7)}`;
  }
  if (clean.length === 10) {
    return `${clean.slice(0, 5)} ${clean.slice(5)}`;
  }
  return clean;
}

// User avatar initials
function getInitials(nameOrEmail?: string): string {
  if (!nameOrEmail) return '?';
  const clean = nameOrEmail.split('@')[0].replace(/[._-]/g, ' ').trim();
  const parts = clean.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

export default function CallRecordingsPage() {
  const navigate = useNavigate();

  // Query & pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [searchInput, setSearchInput] = useState<string>('');
  const [appliedSearch, setAppliedSearch] = useState<string>('');
  const [callTypeFilter, setCallTypeFilter] = useState<string>('all');

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Active audio recording preview modal
  const [activeAudioItem, setActiveAudioItem] =
    useState<CallRecordingItem | null>(null);

  // Fetch call recordings with pagination & filters
  const { data, isLoading, isFetching, isError, error, refetch } =
    useQuery<CallRecordingsResponse>({
      queryKey: [
        'call-recordings',
        currentPage,
        pageSize,
        appliedSearch,
        callTypeFilter,
      ],
      queryFn: async () => {
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(pageSize),
        });
        if (appliedSearch.trim()) {
          params.append('search', appliedSearch.trim());
        }
        if (callTypeFilter && callTypeFilter !== 'all') {
          params.append('call_type', callTypeFilter);
        }

        const res = await fetch(
          `${ENV.VITE_BACKEND_BASE_URL}/tele-crm/recordings?${params.toString()}`,
          { credentials: 'include' },
        );

        if (!res.ok) {
          throw new Error(`Failed to load call recordings (${res.status})`);
        }
        return res.json();
      },
      placeholderData: keepPreviousData,
    });

  const recordings = data?.data || [];
  const pagination = data?.pagination || {
    total: 0,
    page: 1,
    limit: pageSize,
    total_pages: 1,
  };

  // Search handler
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCurrentPage(1);
    setAppliedSearch(searchInput.trim());
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchInput('');
    setAppliedSearch('');
    setCurrentPage(1);
  };

  // Copy phone handler
  const handleCopyPhone = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone.slice(-10));
    setCopiedId(id);
    toast.success(`Copied phone number ${phone}`);
    setTimeout(() => {
      setCopiedId((curr) => (curr === id ? null : curr));
    }, 2000);
  };

  // Count metrics for the current view
  const matchedAccountsCount = useMemo(() => {
    return recordings.filter((r) => Boolean(r.account_id && r.account_name))
      .length;
  }, [recordings]);

  return (
    <TooltipProvider>
      <div className='flex flex-col h-full w-full bg-muted/20 overflow-hidden'>
        {/* Top Header */}
        <div className='bg-background border-b border-border/60 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 shadow-2xs'>
          <div className='flex items-center gap-3'>
            <div className='h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs border border-blue-500/20'>
              <Headphones className='h-5 w-5' />
            </div>
            <div>
              <div className='flex items-center gap-2'>
                <h1 className='text-xl font-bold text-foreground tracking-tight'>
                  Call Recordings
                </h1>
              </div>
              <p className='text-xs text-muted-foreground mt-0.5'>
                Centralized call logs and recordings archive mapped with system
                accounts and TeleCRM
              </p>
            </div>
          </div>

          {/* Stat Cards & Actions */}
          <div className='flex items-center gap-3 self-end sm:self-auto'>
            {/* Total Count Card */}
            <div className='flex items-center gap-3 bg-muted/40 border border-border/50 rounded-xl px-3.5 py-1.5 shadow-2xs'>
              <div className='flex flex-col text-right'>
                <span className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wider'>
                  Total Calls
                </span>
                <span className='text-base font-bold text-foreground leading-none mt-0.5'>
                  {isLoading ? (
                    <Skeleton className='h-4 w-12 rounded' />
                  ) : (
                    pagination.total.toLocaleString()
                  )}
                </span>
              </div>
            </div>

            {/* Matched to Accounts Card */}
            <div className='hidden md:flex items-center gap-3 bg-muted/40 border border-border/50 rounded-xl px-3.5 py-1.5 shadow-2xs'>
              <div className='flex flex-col text-right'>
                <span className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wider'>
                  Mapped on Page
                </span>
                <span className='text-base font-bold text-emerald-600 dark:text-emerald-400 leading-none mt-0.5'>
                  {isLoading ? (
                    <Skeleton className='h-4 w-10 rounded' />
                  ) : (
                    `${matchedAccountsCount} / ${recordings.length}`
                  )}
                </span>
              </div>
            </div>

            {/* Refresh Button */}
            <Button
              variant='outline'
              size='icon'
              onClick={() => refetch()}
              disabled={isLoading || isFetching}
              title='Refresh call recordings'
              className='h-9 w-9 rounded-lg border-border/60 text-muted-foreground hover:text-foreground cursor-pointer shadow-2xs'
            >
              <RotateCw
                className={`h-4 w-4 ${isFetching ? 'animate-spin text-blue-600' : ''}`}
              />
            </Button>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className='flex-1 flex flex-col overflow-hidden p-4 sm:p-6 gap-3.5'>
          <div className='bg-background rounded-xl border border-border/60 p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs shrink-0'>
            {/* Search Input */}
            <form
              onSubmit={handleSearchSubmit}
              className='flex items-center gap-2 flex-1 min-w-[280px] max-w-lg'
            >
              <div className='relative w-full'>
                <Search className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search by account name, telecrm name, phone, or caller email...'
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className='pl-9 pr-8 h-9 text-xs rounded-lg bg-background'
                />
                {searchInput && (
                  <button
                    type='button'
                    onClick={handleClearSearch}
                    className='absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground'
                  >
                    <X className='h-4 w-4' />
                  </button>
                )}
              </div>
              <Button
                type='submit'
                size='sm'
                className='h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3.5 gap-1.5 cursor-pointer font-medium shadow-2xs'
              >
                <Search className='h-3.5 w-3.5' /> Search
              </Button>
            </form>

            {/* Filters & Page Size */}
            <div className='flex items-center gap-2.5 flex-wrap'>
              {/* Call Type Filter */}
              <div className='flex items-center gap-1.5'>
                <span className='text-xs text-muted-foreground whitespace-nowrap font-medium'>
                  Call Type:
                </span>
                <Select
                  value={callTypeFilter}
                  onValueChange={(val) => {
                    setCallTypeFilter(val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className='h-9 text-xs w-[140px] rounded-lg bg-background'>
                    <SelectValue placeholder='All Types' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Types</SelectItem>
                    <SelectItem value='outgoing'>Outgoing Calls</SelectItem>
                    <SelectItem value='incoming'>Incoming Calls</SelectItem>
                    <SelectItem value='missed'>Missed Calls</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Rows Per Page */}
              <div className='flex items-center gap-1.5'>
                <span className='text-xs text-muted-foreground whitespace-nowrap font-medium'>
                  Show:
                </span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(val) => {
                    setPageSize(Number(val));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className='h-9 text-xs w-[90px] rounded-lg bg-background'>
                    <SelectValue placeholder='20' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='10'>10 / page</SelectItem>
                    <SelectItem value='20'>20 / page</SelectItem>
                    <SelectItem value='50'>50 / page</SelectItem>
                    <SelectItem value='100'>100 / page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className='flex-1 bg-background rounded-xl border border-border/60 shadow-2xs overflow-hidden flex flex-col'>
            <div className='flex-1 overflow-auto'>
              <Table>
                <TableHeader className='bg-muted/40 sticky top-0 z-10 border-b border-border/60 shadow-xs'>
                  <TableRow className='hover:bg-transparent'>
                    <TableHead className='w-[48px] text-center'>#</TableHead>
                    <TableHead className='min-w-[190px]'>
                      Account Name (Our System)
                    </TableHead>
                    <TableHead className='min-w-[190px]'>
                      TeleCRM Name (TeleCRM)
                    </TableHead>
                    <TableHead className='min-w-[150px]'>Lead Phone</TableHead>
                    <TableHead className='min-w-[130px]'>Call Type</TableHead>
                    <TableHead className='min-w-[130px] text-right'>
                      Duration & Audio
                    </TableHead>
                    <TableHead className='min-w-[210px]'>
                      Caller / Employee Email
                    </TableHead>
                    <TableHead className='min-w-[160px]'>
                      Creation Timestamp
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoading ? (
                    // Loading Skeletons
                    Array.from({ length: 8 }).map((_, idx) => (
                      <TableRow key={`skeleton-${idx}`}>
                        <TableCell className='text-center'>
                          <Skeleton className='h-4 w-4 mx-auto rounded' />
                        </TableCell>
                        <TableCell>
                          <Skeleton className='h-4 w-36 rounded' />
                        </TableCell>
                        <TableCell>
                          <Skeleton className='h-4 w-32 rounded' />
                        </TableCell>
                        <TableCell>
                          <Skeleton className='h-4 w-28 rounded' />
                        </TableCell>
                        <TableCell>
                          <Skeleton className='h-5 w-20 rounded-full' />
                        </TableCell>
                        <TableCell>
                          <Skeleton className='h-4 w-44 rounded' />
                        </TableCell>
                        <TableCell>
                          <Skeleton className='h-4 w-28 rounded' />
                        </TableCell>
                        <TableCell className='text-right'>
                          <Skeleton className='h-4 w-16 ml-auto rounded' />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : isError ? (
                    // Error State
                    <TableRow>
                      <TableCell colSpan={8} className='h-56 text-center'>
                        <div className='flex flex-col items-center justify-center gap-2'>
                          <p className='text-sm font-medium text-destructive'>
                            Failed to load call recordings.
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            {error instanceof Error
                              ? error.message
                              : 'An unexpected error occurred'}
                          </p>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => refetch()}
                            className='mt-2 text-xs gap-1.5'
                          >
                            <RotateCw className='h-3.5 w-3.5' /> Try Again
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : recordings.length === 0 ? (
                    // Empty State
                    <TableRow>
                      <TableCell colSpan={8} className='h-56 text-center'>
                        <div className='flex flex-col items-center justify-center gap-2'>
                          <div className='h-12 w-12 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground mb-1'>
                            <Headphones className='h-6 w-6' />
                          </div>
                          <p className='text-sm font-medium text-foreground'>
                            No call recordings found
                          </p>
                          <p className='text-xs text-muted-foreground max-w-sm'>
                            {appliedSearch || callTypeFilter !== 'all'
                              ? 'Try adjusting your search query or filters to find what you are looking for.'
                              : 'No call records have been logged in the collection yet.'}
                          </p>
                          {(appliedSearch || callTypeFilter !== 'all') && (
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => {
                                handleClearSearch();
                                setCallTypeFilter('all');
                              }}
                              className='mt-2 text-xs'
                            >
                              Reset Filters
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    // Data Rows
                    recordings.map((item, index) => {
                      const rowNumber =
                        (pagination.page - 1) * pagination.limit + index + 1;
                      const hasAccount = Boolean(
                        item.account_name && item.account_id,
                      );
                      const isCopied = copiedId === item.id;

                      // Call Type badge styling
                      const callTypeLower = (
                        item.normalized_call_type ||
                        item.call_type ||
                        ''
                      ).toLowerCase();
                      const isOutgoing =
                        callTypeLower.includes('out') ||
                        callTypeLower.includes('dial');
                      const isIncoming =
                        callTypeLower.includes('inc') ||
                        callTypeLower.includes('rec');
                      const isMissed = callTypeLower.includes('miss');

                      return (
                        <TableRow
                          key={item.id || index}
                          className='hover:bg-muted/40 transition-colors group'
                        >
                          {/* Row Index */}
                          <TableCell className='text-center text-xs text-muted-foreground font-mono'>
                            {rowNumber}
                          </TableCell>

                          {/* Account Name (Our System) */}
                          <TableCell>
                            {hasAccount ? (
                              <button
                                type='button'
                                onClick={() =>
                                  navigate(`/accounts/${item.account_id}`)
                                }
                                className='inline-flex items-center gap-1.5 text-left font-medium text-sm text-foreground hover:text-blue-600 dark:hover:text-blue-400 group-hover:underline cursor-pointer transition-colors max-w-[240px] truncate'
                                title={`View CRM Account: ${item.account_name}`}
                              >
                                <Building2 className='h-3.5 w-3.5 shrink-0 text-blue-600/75 dark:text-blue-400/75' />
                                <span className='truncate'>
                                  {item.account_name}
                                </span>
                              </button>
                            ) : (
                              <span
                                className='text-muted-foreground/60 text-xs italic select-none'
                                title='No matching CRM account found for this phone number'
                              >
                                —
                              </span>
                            )}
                          </TableCell>

                          {/* TeleCRM Name (TeleCRM) */}
                          <TableCell>
                            {item.telecrm_url ? (
                              <a
                                href={item.telecrm_url}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline max-w-[240px] truncate'
                                title={`Open TeleCRM Lead: ${item.telecrm_name || 'TeleCRM Lead'}`}
                              >
                                <span className='truncate'>
                                  {item.telecrm_name && item.telecrm_name.trim()
                                    ? item.telecrm_name
                                    : 'TeleCRM Lead'}
                                </span>
                                <ExternalLink className='h-3 w-3 shrink-0 opacity-70 group-hover:opacity-100' />
                              </a>
                            ) : (
                              <span className='text-sm text-foreground truncate max-w-[240px]'>
                                {item.telecrm_name && item.telecrm_name.trim()
                                  ? item.telecrm_name
                                  : '—'}
                              </span>
                            )}
                          </TableCell>

                          {/* Lead Phone */}
                          <TableCell>
                            <div className='flex items-center gap-1.5'>
                              <a
                                href={`tel:${item.lead_phone}`}
                                className='text-xs font-mono font-medium text-foreground hover:text-blue-600 transition-colors'
                              >
                                {formatPhone(item.lead_phone)}
                              </a>
                              {item.lead_phone && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type='button'
                                      onClick={() =>
                                        handleCopyPhone(
                                          item.lead_phone,
                                          item.id,
                                        )
                                      }
                                      className='h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer'
                                    >
                                      {isCopied ? (
                                        <Check className='h-3 w-3 text-emerald-600' />
                                      ) : (
                                        <Copy className='h-3 w-3' />
                                      )}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side='top'
                                    className='text-xs'
                                  >
                                    {isCopied ? 'Copied!' : 'Copy phone'}
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>

                          {/* Call Type */}
                          <TableCell>
                            {isMissed ? (
                              <Badge
                                variant='outline'
                                className='bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800 text-[11px] font-medium gap-1 px-2 py-0.5'
                              >
                                <PhoneMissed className='h-3 w-3' />
                                Missed
                              </Badge>
                            ) : isIncoming ? (
                              <Badge
                                variant='outline'
                                className='bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 text-[11px] font-medium gap-1 px-2 py-0.5'
                              >
                                <PhoneIncoming className='h-3 w-3' />
                                Incoming
                              </Badge>
                            ) : (
                              <Badge
                                variant='outline'
                                className='bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800 text-[11px] font-medium gap-1 px-2 py-0.5'
                              >
                                <PhoneOutgoing className='h-3 w-3' />
                                Outgoing
                              </Badge>
                            )}
                          </TableCell>

                          {/* Duration & Audio */}
                          <TableCell className='text-center'>
                            <div className='inline-flex items-center justify-end gap-2'>
                              <span className='text-xs font-mono text-muted-foreground'>
                                {formatDuration(item.duration)}
                              </span>
                            </div>
                          </TableCell>

                          {/* Actor Employee Email */}
                          <TableCell>
                            <div className='flex items-center gap-2 max-w-[230px]'>
                              <div className='h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground border border-border/60 shrink-0'>
                                {getInitials(item.actor_employee_email)}
                              </div>
                              <span
                                className='text-xs text-foreground truncate'
                                title={item.actor_employee_email || '—'}
                              >
                                {item.actor_employee_email || '—'}
                              </span>
                            </div>
                          </TableCell>

                          {/* Creation Timestamp */}
                          <TableCell>
                            <div className='flex flex-col'>
                              <span className='text-xs font-medium text-foreground whitespace-nowrap'>
                                {item.creation_timestamp || '—'}
                              </span>
                              {item.relative_time && (
                                <span className='text-[10px] text-muted-foreground'>
                                  {formatDuration(item.relative_time)} ago
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Footer */}
            <div className='p-3.5 border-t border-border/60 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0'>
              <span className='text-xs text-muted-foreground'>
                Showing{' '}
                <span className='font-medium text-foreground'>
                  {recordings.length > 0
                    ? (pagination.page - 1) * pagination.limit + 1
                    : 0}
                </span>{' '}
                to{' '}
                <span className='font-medium text-foreground'>
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  )}
                </span>{' '}
                of{' '}
                <span className='font-medium text-foreground'>
                  {pagination.total.toLocaleString()}
                </span>{' '}
                call recordings
              </span>

              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.total_pages}
                onPageChange={(p) => setCurrentPage(p)}
              />
            </div>
          </div>
        </div>

        {/* Audio Recording Modal */}
        {activeAudioItem && (
          <Dialog
            open={Boolean(activeAudioItem)}
            onOpenChange={(open) => !open && setActiveAudioItem(null)}
          >
            <DialogContent className='sm:max-w-md'>
              <DialogHeader>
                <DialogTitle className='flex items-center gap-2 text-base font-semibold'>
                  <Volume2 className='h-5 w-5 text-blue-600' />
                  Call Recording Playback
                </DialogTitle>
              </DialogHeader>

              <div className='flex flex-col gap-4 py-2'>
                {/* Call Metadata summary */}
                <div className='bg-muted/40 rounded-xl p-3 border border-border/60 flex flex-col gap-2 text-xs'>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Account:</span>
                    <span className='font-medium text-foreground'>
                      {activeAudioItem.account_name || '— (Unlinked)'}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>TeleCRM Lead:</span>
                    <span className='font-medium text-foreground'>
                      {activeAudioItem.telecrm_name || '—'}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Phone:</span>
                    <span className='font-mono font-medium text-foreground'>
                      {activeAudioItem.lead_phone}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Caller:</span>
                    <span className='font-medium text-foreground truncate max-w-[200px]'>
                      {activeAudioItem.actor_employee_email || '—'}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Timestamp:</span>
                    <span className='font-medium text-foreground'>
                      {activeAudioItem.creation_timestamp}
                    </span>
                  </div>
                </div>

                {/* HTML5 Audio Player */}
                {activeAudioItem.call_recording_url ? (
                  <div className='flex flex-col items-center gap-2 pt-2'>
                    <audio
                      controls
                      autoPlay
                      src={activeAudioItem.call_recording_url}
                      className='w-full'
                    >
                      Your browser does not support audio playback.
                    </audio>
                    <a
                      href={activeAudioItem.call_recording_url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-xs text-blue-600 hover:underline inline-flex items-center gap-1 mt-1'
                    >
                      Open audio file in new tab{' '}
                      <ExternalLink className='h-3 w-3' />
                    </a>
                  </div>
                ) : (
                  <p className='text-xs text-muted-foreground text-center py-4'>
                    No direct audio URL available for this call.
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </TooltipProvider>
  );
}
