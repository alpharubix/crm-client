import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  MessageSquare,
  Send,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  RotateCw,
  Copy,
  Check,
  ExternalLink,
  Building2,
  Calendar as CalendarIcon,
  Clock,
  RotateCcw,
  User,
  X,
  Eye,
  FileText,
  Phone,
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
import { DatePicker } from '@/components/ui/date-picker';
import { format, subDays, startOfWeek, startOfMonth } from 'date-fns';
import Pagination from '@/components/shared/pagination';
import telecrmUsers from '@/utils/telecrm_users.json';
import { ENV } from '@/conf';

export type PeriodPresetId =
  | 'ALL'
  | 'TODAY'
  | 'YESTERDAY'
  | 'THIS_WEEK'
  | 'THIS_MONTH'
  | 'LAST_30_DAYS'
  | 'CUSTOM';

export const PERIOD_PRESETS: { id: PeriodPresetId; label: string }[] = [
  { id: 'ALL', label: 'All Time' },
  { id: 'TODAY', label: 'Today' },
  { id: 'YESTERDAY', label: 'Yesterday' },
  { id: 'THIS_WEEK', label: 'This Week' },
  { id: 'THIS_MONTH', label: 'This Month' },
  { id: 'LAST_30_DAYS', label: 'Last 30 Days' },
];

export interface WhatsAppRecordItem {
  id: string;
  account_id: number | string | null;
  account_name: string | null;
  telecrm_name: string;
  lead_name: string;
  lead_id: string;
  telecrm_url: string | null;
  lead_phone: string;
  type: string;
  normalized_type: 'outgoing' | 'incoming';
  messageText: string;
  msgType: string;
  wa_msg_type: string;
  wa_msg_txt: string;
  created_on: string;
  creation_timestamp: string;
  created_at?: string;
  relative_time?: string;
  assignee_phone_number: string;
  assignee_email: string;
  lead_assignee: string;
  actor_employee_email?: string;
  my_name?: string;
  status?: string;
  url?: string;
}

export interface WhatsAppRecordsResponse {
  status: string;
  data: WhatsAppRecordItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

// Format phone for clean display (+91 XXXXX XXXXX)
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

// Map for fast user lookup from telecrm_users.json
const callerMap = new Map<string, string>(
  telecrmUsers.map((u) => [u.email.toLowerCase(), u.name]),
);

// Format actor / assignee display name
function formatActorName(nameOrEmail?: string): string {
  if (!nameOrEmail) return '—';
  const str = String(nameOrEmail).trim();
  if (!str || str === '—') return '—';

  const lower = str.toLowerCase();
  if (callerMap.has(lower)) {
    return callerMap.get(lower)!;
  }

  // Get username part before '@' if email
  const username = str.includes('@') ? str.split('@')[0] : str;
  // Get first name before the dot '.'
  const firstName = username.split('.')[0].trim();
  if (!firstName) return str;

  // Capitalize first letter
  return firstName.charAt(0).toUpperCase() + firstName.slice(1);
}

// Format timestamp into 12-hour format time & date
function formatCreationTimestamp(ts?: string | null): string {
  if (!ts || ts === '—') return '—';
  const clean = String(ts).trim();
  if (!clean) return '—';

  // Match DD/MM/YYYY HH:mm:ss or DD-MM-YYYY HH:mm:ss
  const dmyMatch = clean.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
  );
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    const rawHour = dmyMatch[4];
    const mins = dmyMatch[5];
    const secs = dmyMatch[6];

    if (rawHour !== undefined && mins !== undefined) {
      const h24 = parseInt(rawHour, 10);
      const period = h24 >= 12 ? 'PM' : 'AM';
      const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
      const h12Str = String(h12).padStart(2, '0');
      const timeStr =
        secs !== undefined
          ? `${h12Str}:${mins.padStart(2, '0')}:${secs.padStart(2, '0')} ${period}`
          : `${h12Str}:${mins.padStart(2, '0')} ${period}`;
      return `${day}/${month}/${year}, ${timeStr}`;
    }
    return `${day}/${month}/${year}`;
  }

  // Match YYYY-MM-DD HH:mm:ss
  const ymdMatch = clean.match(
    /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
  );
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    const rawHour = ymdMatch[4];
    const mins = ymdMatch[5];
    const secs = ymdMatch[6];

    if (rawHour !== undefined && mins !== undefined) {
      const h24 = parseInt(rawHour, 10);
      const period = h24 >= 12 ? 'PM' : 'AM';
      const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
      const h12Str = String(h12).padStart(2, '0');
      const timeStr =
        secs !== undefined
          ? `${h12Str}:${mins.padStart(2, '0')}:${secs.padStart(2, '0')} ${period}`
          : `${h12Str}:${mins.padStart(2, '0')} ${period}`;
      return `${day}/${month}/${year}, ${timeStr}`;
    }
    return `${day}/${month}/${year}`;
  }

  // Fallback for ISO format or standard date string
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    const h24 = parsed.getHours();
    const period = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    const h12Str = String(h12).padStart(2, '0');
    const mins = String(parsed.getMinutes()).padStart(2, '0');
    const secs = String(parsed.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year}, ${h12Str}:${mins}:${secs} ${period}`;
  }

  return clean;
}

export default function WhatsAppRecordsTab() {
  const navigate = useNavigate();

  // Query & pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [searchInput, setSearchInput] = useState<string>('');
  const [appliedSearch, setAppliedSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [msgTypeFilter, setMsgTypeFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [fromTime, setFromTime] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [toTime, setToTime] = useState<string>('');
  const [activePreset, setActivePreset] = useState<PeriodPresetId>('ALL');

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Active message detail modal
  const [activeDetailItem, setActiveDetailItem] =
    useState<WhatsAppRecordItem | null>(null);

  // Fetch WhatsApp records with pagination & filters
  const { data, isLoading, isFetching, isError, error, refetch } =
    useQuery<WhatsAppRecordsResponse>({
      queryKey: [
        'whatsapp-records',
        currentPage,
        pageSize,
        appliedSearch,
        typeFilter,
        msgTypeFilter,
        userFilter,
        fromDate,
        fromTime,
        toDate,
        toTime,
      ],
      queryFn: async () => {
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: String(pageSize),
        });
        if (appliedSearch.trim()) {
          params.append('search', appliedSearch.trim());
        }
        if (typeFilter && typeFilter !== 'all') {
          params.append('type', typeFilter);
        }
        if (msgTypeFilter && msgTypeFilter !== 'all') {
          params.append('msg_type', msgTypeFilter);
        }
        if (userFilter && userFilter !== 'all') {
          params.append('user', userFilter);
        }
        if (fromDate) {
          const fromParam = fromTime
            ? `${fromDate} ${fromTime}${fromTime.length === 5 ? ':00' : ''}`
            : `${fromDate} 00:00:00`;
          params.append('from_date', fromParam);
        }
        if (toDate) {
          const toParam = toTime
            ? `${toDate} ${toTime}${toTime.length === 5 ? ':59' : ''}`
            : `${toDate} 23:59:59`;
          params.append('to_date', toParam);
        }

        const res = await fetch(
          `${ENV.VITE_BACKEND_BASE_URL}/tele-crm/whatsapp-records?${params.toString()}`,
          { credentials: 'include' },
        );

        if (!res.ok) {
          throw new Error(`Failed to load WhatsApp records (${res.status})`);
        }
        return res.json();
      },
      placeholderData: keepPreviousData,
    });

  const records = data?.data || [];
  const pagination = data?.pagination || {
    total: 0,
    page: 1,
    limit: pageSize,
    total_pages: 1,
  };

  // User options for filter loaded from telecrm_users.json + returned data
  const availableUsers = useMemo(() => {
    const list = telecrmUsers.map((u) => ({
      name: u.name,
      email: u.email,
    }));
    const existingEmails = new Set(list.map((u) => u.email.toLowerCase()));

    records.forEach((r) => {
      const email = (r.assignee_email || r.actor_employee_email || '').trim().toLowerCase();
      if (email && !existingEmails.has(email)) {
        existingEmails.add(email);
        list.push({
          name: formatActorName(email),
          email,
        });
      }
    });
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [records]);

  // Client-side safety filter for user if active
  const displayedRecords = useMemo(() => {
    if (userFilter && userFilter !== 'all') {
      const filterLower = userFilter.toLowerCase().trim();
      const filterPrefix = filterLower.includes('@')
        ? filterLower.split('@')[0]
        : filterLower;
      return records.filter((r) => {
        const email = (r.assignee_email || r.actor_employee_email || '').toLowerCase().trim();
        const assignee = (r.lead_assignee || '').toLowerCase().trim();
        const phone = (r.assignee_phone_number || '').trim();
        return (
          email === filterLower ||
          email.startsWith(filterPrefix) ||
          assignee.includes(filterPrefix) ||
          (phone && filterLower.includes(phone.slice(-10)))
        );
      });
    }
    return records;
  }, [records, userFilter]);

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

  // Period presets
  const applyPreset = (presetId: PeriodPresetId) => {
    setActivePreset(presetId);
    setCurrentPage(1);
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');

    switch (presetId) {
      case 'ALL':
        setFromDate('');
        setFromTime('');
        setToDate('');
        setToTime('');
        break;
      case 'TODAY':
        setFromDate(todayStr);
        setFromTime('00:00');
        setToDate(todayStr);
        setToTime('23:59');
        break;
      case 'YESTERDAY': {
        const yesterday = subDays(now, 1);
        const yStr = format(yesterday, 'yyyy-MM-dd');
        setFromDate(yStr);
        setFromTime('00:00');
        setToDate(yStr);
        setToTime('23:59');
        break;
      }
      case 'THIS_WEEK': {
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        setFromDate(format(weekStart, 'yyyy-MM-dd'));
        setFromTime('00:00');
        setToDate(todayStr);
        setToTime('23:59');
        break;
      }
      case 'THIS_MONTH': {
        const monthStart = startOfMonth(now);
        setFromDate(format(monthStart, 'yyyy-MM-dd'));
        setFromTime('00:00');
        setToDate(todayStr);
        setToTime('23:59');
        break;
      }
      case 'LAST_30_DAYS': {
        const thirtyDaysAgo = subDays(now, 30);
        setFromDate(format(thirtyDaysAgo, 'yyyy-MM-dd'));
        setFromTime('00:00');
        setToDate(todayStr);
        setToTime('23:59');
        break;
      }
      default:
        break;
    }
  };

  const handleFromDateChange = (val: string) => {
    setFromDate(val);
    setActivePreset('CUSTOM');
    setCurrentPage(1);
  };

  const handleToDateChange = (val: string) => {
    setToDate(val);
    setActivePreset('CUSTOM');
    setCurrentPage(1);
  };

  const handleClearPeriod = () => {
    setFromDate('');
    setFromTime('');
    setToDate('');
    setToTime('');
    setActivePreset('ALL');
    setCurrentPage(1);
  };

  // Reset all filters
  const handleResetAllFilters = () => {
    setSearchInput('');
    setAppliedSearch('');
    setTypeFilter('all');
    setMsgTypeFilter('all');
    setUserFilter('all');
    setFromDate('');
    setFromTime('');
    setToDate('');
    setToTime('');
    setActivePreset('ALL');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    appliedSearch.trim() ||
      searchInput.trim() ||
      typeFilter !== 'all' ||
      msgTypeFilter !== 'all' ||
      userFilter !== 'all' ||
      fromDate ||
      toDate ||
      fromTime ||
      toTime,
  );

  // Copy handler
  const handleCopyText = (text: string, id: string, label = 'Text') => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(`Copied ${label}`);
    setTimeout(() => {
      setCopiedId((curr) => (curr === id ? null : curr));
    }, 2000);
  };

  // Count metrics for current view
  const matchedAccountsCount = useMemo(() => {
    return displayedRecords.filter((r) =>
      Boolean(r.account_id && r.account_name),
    ).length;
  }, [displayedRecords]);

  return (
    <TooltipProvider>
      <div className='flex flex-col h-full w-full bg-muted/20 overflow-hidden'>
        {/* Top Header */}
        <div className='bg-background border-b border-border/60 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 shadow-2xs'>
          <div className='flex items-center gap-3'>
            <div className='h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs border border-emerald-500/20'>
              <MessageSquare className='h-5 w-5' />
            </div>
            <div>
              <div className='flex items-center gap-2'>
                <h1 className='text-xl font-bold text-foreground tracking-tight'>
                  WhatsApp Record
                </h1>
                <Badge
                  variant='outline'
                  className='bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[11px] font-semibold px-2 py-0.2'
                >
                  telecrm-whatsapp
                </Badge>
              </div>
              <p className='text-xs text-muted-foreground mt-0.5'>
                Centralized WhatsApp messages and conversation logs archive mapped with system accounts and TeleCRM
              </p>
            </div>
          </div>

          {/* Stat Cards & Actions */}
          <div className='flex items-center gap-3 self-end sm:self-auto'>
            {/* Total Count Card */}
            <div className='flex items-center gap-3 bg-muted/40 border border-border/50 rounded-xl px-3.5 py-1.5 shadow-2xs'>
              <div className='flex flex-col text-right'>
                <span className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wider'>
                  Total Messages
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
                    `${matchedAccountsCount} / ${displayedRecords.length}`
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
              title='Refresh WhatsApp records'
              className='h-9 w-9 rounded-lg border-border/60 text-muted-foreground hover:text-foreground cursor-pointer shadow-2xs'
            >
              <RotateCw
                className={`h-4 w-4 ${isFetching ? 'animate-spin text-emerald-600' : ''}`}
              />
            </Button>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className='flex-1 flex flex-col overflow-hidden p-4 sm:p-6 gap-3.5'>
          <div className='bg-background rounded-xl border border-border/60 p-3 flex flex-col gap-3 shadow-2xs shrink-0'>
            {/* Top Row: Search Input & Dropdowns & Reset */}
            <div className='flex flex-wrap items-center justify-between gap-3'>
              {/* Search Input */}
              <form
                onSubmit={handleSearchSubmit}
                className='flex items-center gap-2 flex-1 min-w-[280px] max-w-lg'
              >
                <div className='relative w-full'>
                  <Search className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
                  <Input
                    placeholder='Search account name, lead name, phone, message text, or assignee...'
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className='pl-9 pr-8 h-9 text-xs rounded-lg bg-background'
                  />
                  {searchInput && (
                    <button
                      type='button'
                      onClick={handleClearSearch}
                      className='absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer'
                    >
                      <X className='h-4 w-4' />
                    </button>
                  )}
                </div>
                <Button
                  type='submit'
                  size='sm'
                  className='h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3.5 gap-1.5 cursor-pointer font-medium shadow-2xs'
                >
                  <Search className='h-3.5 w-3.5' /> Search
                </Button>
              </form>

              {/* Filters & Page Size */}
              <div className='flex items-center gap-2.5 flex-wrap'>
                {/* User / Assignee Filter */}
                <div className='flex items-center gap-1.5'>
                  <span className='text-xs text-muted-foreground whitespace-nowrap font-medium'>
                    Assignee:
                  </span>
                  <div className='flex items-center gap-1'>
                    <Select
                      value={userFilter}
                      onValueChange={(val) => {
                        setUserFilter(val);
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className='h-9 text-xs w-[140px] rounded-lg bg-background'>
                        <SelectValue placeholder='All Users' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='all'>All Users</SelectItem>
                        {availableUsers.map((user) => (
                          <SelectItem key={user.email} value={user.email}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {userFilter !== 'all' && (
                      <Button
                        variant='ghost'
                        size='icon'
                        type='button'
                        onClick={() => {
                          setUserFilter('all');
                          setCurrentPage(1);
                        }}
                        title='Clear user filter'
                        className='h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer rounded-md'
                      >
                        <X className='h-3.5 w-3.5' />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Type Filter */}
                <div className='flex items-center gap-1.5'>
                  <span className='text-xs text-muted-foreground whitespace-nowrap font-medium'>
                    Type:
                  </span>
                  <Select
                    value={typeFilter}
                    onValueChange={(val) => {
                      setTypeFilter(val);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className='h-9 text-xs w-[145px] rounded-lg bg-background'>
                      <SelectValue placeholder='All Types' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Types</SelectItem>
                      <SelectItem value='outgoing'>Outgoing (OUTGOING_WHATSAPP_MSG)</SelectItem>
                      <SelectItem value='incoming'>Incoming (INCOMING_WHATSAPP_MSG)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Msg Type Filter */}
                <div className='flex items-center gap-1.5'>
                  <span className='text-xs text-muted-foreground whitespace-nowrap font-medium'>
                    Msg Type:
                  </span>
                  <Select
                    value={msgTypeFilter}
                    onValueChange={(val) => {
                      setMsgTypeFilter(val);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className='h-9 text-xs w-[120px] rounded-lg bg-background'>
                      <SelectValue placeholder='All' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Formats</SelectItem>
                      <SelectItem value='TEXT'>TEXT</SelectItem>
                      <SelectItem value='IMAGE'>IMAGE</SelectItem>
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

                {/* Reset Button */}
                {hasActiveFilters && (
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={handleResetAllFilters}
                    className='h-9 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer shrink-0'
                    title='Reset all filters'
                  >
                    <RotateCcw className='w-3.5 h-3.5 mr-1' /> Reset
                  </Button>
                )}
              </div>
            </div>

            {/* Bottom Row: Period-wise Date & Time Filter */}
            <div className='pt-2.5 border-t border-border/60 flex flex-col xl:flex-row xl:items-center justify-between gap-3'>
              {/* Date & Time pickers (From - To) */}
              <div className='flex items-center gap-2.5 flex-wrap'>
                <div className='flex items-center gap-1.5 text-foreground mr-1'>
                  <CalendarIcon className='w-3.5 h-3.5 text-emerald-600 shrink-0' />
                  <span className='text-xs font-semibold'>Period:</span>
                </div>

                {/* From Date & Time */}
                <div className='flex items-center gap-1.5'>
                  <span className='text-[11px] font-medium text-muted-foreground'>
                    From
                  </span>
                  <div className='w-32 sm:w-34'>
                    <DatePicker
                      value={fromDate}
                      onChange={handleFromDateChange}
                      placeholder='From date'
                      className='h-8 text-xs'
                    />
                  </div>
                  <div className='flex items-center gap-1 bg-muted/40 border border-border/70 rounded-lg px-2 h-8 hover:bg-muted/60 transition-colors'>
                    <Clock className='w-3 h-3 text-muted-foreground shrink-0' />
                    <input
                      type='time'
                      value={fromTime}
                      onChange={(e) => {
                        setFromTime(e.target.value);
                        if (!fromDate) {
                          setFromDate(format(new Date(), 'yyyy-MM-dd'));
                        }
                        setActivePreset('CUSTOM');
                        setCurrentPage(1);
                      }}
                      className='bg-transparent text-xs text-foreground outline-none w-18 cursor-pointer font-medium'
                      title='From Time (HH:mm)'
                    />
                    {fromTime && (
                      <button
                        type='button'
                        onClick={() => {
                          setFromTime('');
                          setActivePreset('CUSTOM');
                          setCurrentPage(1);
                        }}
                        className='text-muted-foreground hover:text-foreground p-0.5 cursor-pointer'
                        title='Clear time'
                      >
                        <X className='w-3 h-3' />
                      </button>
                    )}
                  </div>
                </div>

                {/* To Date & Time */}
                <div className='flex items-center gap-1.5'>
                  <span className='text-[11px] font-medium text-muted-foreground'>
                    To
                  </span>
                  <div className='w-32 sm:w-34'>
                    <DatePicker
                      value={toDate}
                      onChange={handleToDateChange}
                      placeholder='To date'
                      className='h-8 text-xs'
                    />
                  </div>
                  <div className='flex items-center gap-1 bg-muted/40 border border-border/70 rounded-lg px-2 h-8 hover:bg-muted/60 transition-colors'>
                    <Clock className='w-3 h-3 text-muted-foreground shrink-0' />
                    <input
                      type='time'
                      value={toTime}
                      onChange={(e) => {
                        setToTime(e.target.value);
                        if (!toDate) {
                          setToDate(format(new Date(), 'yyyy-MM-dd'));
                        }
                        setActivePreset('CUSTOM');
                        setCurrentPage(1);
                      }}
                      className='bg-transparent text-xs text-foreground outline-none w-18 cursor-pointer font-medium'
                      title='To Time (HH:mm)'
                    />
                    {toTime && (
                      <button
                        type='button'
                        onClick={() => {
                          setToTime('');
                          setActivePreset('CUSTOM');
                          setCurrentPage(1);
                        }}
                        className='text-muted-foreground hover:text-foreground p-0.5 cursor-pointer'
                        title='Clear time'
                      >
                        <X className='w-3 h-3' />
                      </button>
                    )}
                  </div>
                </div>

                {(fromDate || toDate || fromTime || toTime) && (
                  <button
                    type='button'
                    onClick={handleClearPeriod}
                    className='p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted text-xs transition-colors cursor-pointer'
                    title='Clear date & time filter'
                  >
                    <X className='w-3.5 h-3.5' />
                  </button>
                )}
              </div>

              {/* Quick Period Presets */}
              <div className='flex items-center gap-1.5 overflow-x-auto pb-1 xl:pb-0'>
                {PERIOD_PRESETS.map((preset) => {
                  const isSelected =
                    activePreset === preset.id &&
                    (preset.id === 'ALL'
                      ? !fromDate && !toDate
                      : Boolean(fromDate || toDate));
                  return (
                    <button
                      key={preset.id}
                      type='button'
                      onClick={() => applyPreset(preset.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
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
                    <TableHead className='min-w-[180px]'>
                      Account Name (Our System)
                    </TableHead>
                    <TableHead className='min-w-[180px]'>
                      TeleCRM Name (TeleCRM)
                    </TableHead>
                    <TableHead className='min-w-[140px]'>Lead Phone</TableHead>
                    <TableHead className='min-w-[150px]'>Type</TableHead>
                    <TableHead className='min-w-[240px]'>Message</TableHead>
                    <TableHead className='min-w-[90px] text-center'>Msg Type</TableHead>
                    <TableHead className='min-w-[160px]'>Assignee / Phone</TableHead>
                    <TableHead className='min-w-[170px]'>
                      Created On
                    </TableHead>
                    <TableHead className='w-[60px] text-center'>View</TableHead>
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
                          <Skeleton className='h-5 w-24 rounded-full' />
                        </TableCell>
                        <TableCell>
                          <Skeleton className='h-4 w-48 rounded' />
                        </TableCell>
                        <TableCell className='text-center'>
                          <Skeleton className='h-4 w-12 mx-auto rounded' />
                        </TableCell>
                        <TableCell>
                          <Skeleton className='h-4 w-28 rounded' />
                        </TableCell>
                        <TableCell>
                          <Skeleton className='h-4 w-24 rounded' />
                        </TableCell>
                        <TableCell className='text-center'>
                          <Skeleton className='h-5 w-5 mx-auto rounded' />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : isError ? (
                    // Error State
                    <TableRow>
                      <TableCell colSpan={10} className='h-56 text-center'>
                        <div className='flex flex-col items-center justify-center gap-2'>
                          <p className='text-sm font-medium text-destructive'>
                            Failed to load WhatsApp records.
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
                            className='mt-2 text-xs gap-1.5 cursor-pointer'
                          >
                            <RotateCw className='h-3.5 w-3.5' /> Try Again
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : displayedRecords.length === 0 ? (
                    // Empty State
                    <TableRow>
                      <TableCell colSpan={10} className='h-56 text-center'>
                        <div className='flex flex-col items-center justify-center gap-2'>
                          <div className='h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-1'>
                            <MessageSquare className='h-6 w-6' />
                          </div>
                          <p className='text-sm font-medium text-foreground'>
                            No WhatsApp records found
                          </p>
                          <p className='text-xs text-muted-foreground max-w-sm'>
                            {hasActiveFilters
                              ? 'Try adjusting your search query, type filter, period, or assignee selection to find what you are looking for.'
                              : 'No WhatsApp messages have been recorded in the telecrm-whatsapp collection yet.'}
                          </p>
                          {hasActiveFilters && (
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={handleResetAllFilters}
                              className='mt-2 text-xs cursor-pointer'
                            >
                              Reset All Filters
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    // Data Rows
                    displayedRecords.map((item, index) => {
                      const rowNumber =
                        (pagination.page - 1) * pagination.limit + index + 1;
                      const hasAccount = Boolean(
                        item.account_name && item.account_id,
                      );
                      const isPhoneCopied = copiedId === `phone-${item.id}`;
                      const isAssigneePhoneCopied = copiedId === `assignee-${item.id}`;

                      const typeLower = (item.normalized_type || item.type || '').toLowerCase();
                      const isOutgoing =
                        typeLower.includes('out') ||
                        typeLower.includes('sent');
                      const isIncoming =
                        typeLower.includes('in') ||
                        typeLower.includes('rec');

                      const displayMessage =
                        item.messageText || item.wa_msg_txt || '—';
                      const displayMsgType =
                        item.msgType || item.wa_msg_type || 'TEXT';

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
                                className='inline-flex items-center gap-1.5 text-left font-medium text-sm text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 group-hover:underline cursor-pointer transition-colors max-w-[220px] truncate'
                                title={`View CRM Account: ${item.account_name}`}
                              >
                                <Building2 className='h-3.5 w-3.5 shrink-0 text-emerald-600/75 dark:text-emerald-400/75' />
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
                            <div className='flex flex-col max-w-[220px]'>
                              {item.telecrm_url ? (
                                <a
                                  href={item.telecrm_url}
                                  target='_blank'
                                  rel='noopener noreferrer'
                                  className='inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline truncate'
                                  title={`Open TeleCRM Lead: ${item.telecrm_name || item.lead_name || 'TeleCRM Lead'}`}
                                >
                                  <span className='truncate'>
                                    {item.telecrm_name || item.lead_name || 'TeleCRM Lead'}
                                  </span>
                                  <ExternalLink className='h-3 w-3 shrink-0 opacity-70 group-hover:opacity-100' />
                                </a>
                              ) : (
                                <span className='text-sm text-foreground truncate'>
                                  {item.telecrm_name || item.lead_name || '—'}
                                </span>
                              )}
                              {item.lead_id && (
                                <span
                                  className='text-[10px] font-mono text-muted-foreground/75 truncate mt-0.5'
                                  title={`Lead ID: ${item.lead_id}`}
                                >
                                  ID: {item.lead_id}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* Lead Phone */}
                          <TableCell>
                            <div className='flex items-center gap-1.5'>
                              <a
                                href={`tel:${item.lead_phone}`}
                                className='text-xs font-mono font-medium text-foreground hover:text-emerald-600 transition-colors'
                              >
                                {formatPhone(item.lead_phone)}
                              </a>
                              {item.lead_phone && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type='button'
                                      onClick={() =>
                                        handleCopyText(
                                          item.lead_phone.slice(-10),
                                          `phone-${item.id}`,
                                          'phone number',
                                        )
                                      }
                                      className='h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer'
                                    >
                                      {isPhoneCopied ? (
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
                                    {isPhoneCopied ? 'Copied!' : 'Copy phone'}
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>

                          {/* Type */}
                          <TableCell>
                            {isOutgoing ? (
                              <Badge
                                variant='outline'
                                className='bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 text-[11px] font-medium gap-1 px-2 py-0.5 whitespace-nowrap'
                                title={item.type}
                              >
                                <ArrowUpRight className='h-3 w-3 shrink-0' />
                                <span className='truncate max-w-[130px]'>
                                  {item.type || 'OUTGOING_WHATSAPP_MSG'}
                                </span>
                              </Badge>
                            ) : isIncoming ? (
                              <Badge
                                variant='outline'
                                className='bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800 text-[11px] font-medium gap-1 px-2 py-0.5 whitespace-nowrap'
                                title={item.type}
                              >
                                <ArrowDownLeft className='h-3 w-3 shrink-0' />
                                <span className='truncate max-w-[130px]'>
                                  {item.type || 'INCOMING_WHATSAPP_MSG'}
                                </span>
                              </Badge>
                            ) : (
                              <Badge
                                variant='outline'
                                className='bg-muted text-muted-foreground border-border text-[11px] font-medium px-2 py-0.5 whitespace-nowrap'
                              >
                                {item.type || 'WHATSAPP_MSG'}
                              </Badge>
                            )}
                          </TableCell>

                          {/* Message Text */}
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type='button'
                                  onClick={() => setActiveDetailItem(item)}
                                  className='text-left group/msg block max-w-[280px] cursor-pointer'
                                >
                                  <span className='text-xs text-foreground/90 font-normal line-clamp-2 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors'>
                                    {displayMessage}
                                  </span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent
                                side='bottom'
                                className='max-w-md p-3 text-xs leading-relaxed'
                              >
                                <div className='font-semibold mb-1 text-[11px] text-muted-foreground uppercase tracking-wider'>
                                  Full Message Preview
                                </div>
                                <div className='whitespace-pre-wrap break-words'>
                                  {displayMessage}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>

                          {/* Msg Type */}
                          <TableCell className='text-center'>
                            <Badge
                              variant='secondary'
                              className='text-[10px] font-mono uppercase px-1.5 py-0.5 bg-muted/70 text-foreground/80'
                            >
                              {displayMsgType}
                            </Badge>
                          </TableCell>

                          {/* Assignee / Phone */}
                          <TableCell>
                            <div className='flex flex-col max-w-[190px]'>
                              {item.assignee_phone_number ? (
                                <div className='flex items-center gap-1'>
                                  <span className='text-xs font-mono font-medium text-foreground'>
                                    {formatPhone(item.assignee_phone_number)}
                                  </span>
                                  <button
                                    type='button'
                                    onClick={() =>
                                      handleCopyText(
                                        item.assignee_phone_number.slice(-10),
                                        `assignee-${item.id}`,
                                        'assignee phone',
                                      )
                                    }
                                    className='h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer'
                                    title='Copy assignee phone'
                                  >
                                    {isAssigneePhoneCopied ? (
                                      <Check className='h-2.5 w-2.5 text-emerald-600' />
                                    ) : (
                                      <Copy className='h-2.5 w-2.5' />
                                    )}
                                  </button>
                                </div>
                              ) : null}

                              {(item.assignee_email || item.lead_assignee) && (
                                <div className='flex items-center gap-1.5 mt-0.5'>
                                  <div className='h-4 w-4 rounded-full bg-muted flex items-center justify-center text-[9px] font-semibold text-muted-foreground border border-border/60 shrink-0'>
                                    {getInitials(
                                      item.assignee_email || item.lead_assignee,
                                    )}
                                  </div>
                                  <span
                                    className='text-[11px] text-muted-foreground truncate'
                                    title={
                                      item.assignee_email || item.lead_assignee
                                    }
                                  >
                                    {formatActorName(
                                      item.assignee_email || item.lead_assignee,
                                    )}
                                  </span>
                                </div>
                              )}
                            </div>
                          </TableCell>

                          {/* Created On */}
                          <TableCell>
                            <div className='flex flex-col'>
                              <span className='text-xs font-medium text-foreground whitespace-nowrap'>
                                {formatCreationTimestamp(
                                  item.created_on ||
                                    item.creation_timestamp ||
                                    item.created_at,
                                )}
                              </span>
                              {item.relative_time && (
                                <span className='text-[10px] text-muted-foreground'>
                                  {item.relative_time.endsWith('ago')
                                    ? item.relative_time
                                    : `${item.relative_time} ago`}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* View Detail Action */}
                          <TableCell className='text-center'>
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={() => setActiveDetailItem(item)}
                              title='View message details'
                              className='h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg cursor-pointer'
                            >
                              <Eye className='h-4 w-4' />
                            </Button>
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
                  {displayedRecords.length > 0
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
                WhatsApp records
              </span>

              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.total_pages}
                onPageChange={(p) => setCurrentPage(p)}
              />
            </div>
          </div>
        </div>

        {/* Message Details Modal */}
        {activeDetailItem && (
          <Dialog
            open={Boolean(activeDetailItem)}
            onOpenChange={(open) => !open && setActiveDetailItem(null)}
          >
            <DialogContent className='sm:max-w-xl max-h-[90vh] overflow-y-auto'>
              <DialogHeader>
                <DialogTitle className='flex items-center gap-2 text-base font-semibold'>
                  <MessageSquare className='h-5 w-5 text-emerald-600' />
                  WhatsApp Record Details
                </DialogTitle>
              </DialogHeader>

              <div className='flex flex-col gap-4 py-2'>
                {/* Meta details grid */}
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/40 rounded-xl p-3.5 border border-border/60 text-xs'>
                  <div className='flex flex-col gap-0.5'>
                    <span className='text-muted-foreground font-medium'>
                      Account (Our System):
                    </span>
                    <span className='font-semibold text-foreground'>
                      {activeDetailItem.account_name ? (
                        <button
                          type='button'
                          onClick={() => {
                            navigate(`/accounts/${activeDetailItem.account_id}`);
                            setActiveDetailItem(null);
                          }}
                          className='inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer text-left'
                        >
                          <Building2 className='h-3 w-3 shrink-0' />
                          {activeDetailItem.account_name}
                        </button>
                      ) : (
                        '— (Unlinked)'
                      )}
                    </span>
                  </div>

                  <div className='flex flex-col gap-0.5'>
                    <span className='text-muted-foreground font-medium'>
                      TeleCRM Lead:
                    </span>
                    <span className='font-semibold text-foreground'>
                      {activeDetailItem.telecrm_url ? (
                        <a
                          href={activeDetailItem.telecrm_url}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline'
                        >
                          {activeDetailItem.telecrm_name ||
                            activeDetailItem.lead_name ||
                            'TeleCRM Lead'}
                          <ExternalLink className='h-3 w-3 shrink-0' />
                        </a>
                      ) : (
                        activeDetailItem.telecrm_name ||
                        activeDetailItem.lead_name ||
                        '—'
                      )}
                    </span>
                  </div>

                  <div className='flex flex-col gap-0.5'>
                    <span className='text-muted-foreground font-medium'>
                      Lead Phone:
                    </span>
                    <div className='flex items-center gap-1 font-mono font-medium text-foreground'>
                      <span>{formatPhone(activeDetailItem.lead_phone)}</span>
                      {activeDetailItem.lead_phone && (
                        <button
                          type='button'
                          onClick={() =>
                            handleCopyText(
                              activeDetailItem.lead_phone.slice(-10),
                              `modal-lead-${activeDetailItem.id}`,
                              'lead phone',
                            )
                          }
                          className='p-0.5 text-muted-foreground hover:text-foreground cursor-pointer'
                        >
                          <Copy className='h-3 w-3' />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className='flex flex-col gap-0.5'>
                    <span className='text-muted-foreground font-medium'>
                      Lead ID:
                    </span>
                    <div className='flex items-center gap-1 font-mono text-muted-foreground'>
                      <span className='truncate'>{activeDetailItem.lead_id || '—'}</span>
                      {activeDetailItem.lead_id && (
                        <button
                          type='button'
                          onClick={() =>
                            handleCopyText(
                              activeDetailItem.lead_id,
                              `modal-lead-id-${activeDetailItem.id}`,
                              'lead ID',
                            )
                          }
                          className='p-0.5 text-muted-foreground hover:text-foreground cursor-pointer'
                        >
                          <Copy className='h-3 w-3' />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className='flex flex-col gap-0.5'>
                    <span className='text-muted-foreground font-medium'>
                      Type:
                    </span>
                    <span className='font-mono font-medium text-foreground'>
                      {activeDetailItem.type || '—'}
                    </span>
                  </div>

                  <div className='flex flex-col gap-0.5'>
                    <span className='text-muted-foreground font-medium'>
                      Msg Type (msgType / wa_msg_type):
                    </span>
                    <span className='font-mono font-medium text-foreground'>
                      {activeDetailItem.msgType || activeDetailItem.wa_msg_type || 'TEXT'}
                    </span>
                  </div>

                  <div className='flex flex-col gap-0.5'>
                    <span className='text-muted-foreground font-medium'>
                      Assignee Phone:
                    </span>
                    <div className='flex items-center gap-1 font-mono font-medium text-foreground'>
                      <span>{formatPhone(activeDetailItem.assignee_phone_number)}</span>
                      {activeDetailItem.assignee_phone_number && (
                        <button
                          type='button'
                          onClick={() =>
                            handleCopyText(
                              activeDetailItem.assignee_phone_number.slice(-10),
                              `modal-assignee-${activeDetailItem.id}`,
                              'assignee phone',
                            )
                          }
                          className='p-0.5 text-muted-foreground hover:text-foreground cursor-pointer'
                        >
                          <Copy className='h-3 w-3' />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className='flex flex-col gap-0.5'>
                    <span className='text-muted-foreground font-medium'>
                      Assignee / User:
                    </span>
                    <span className='font-medium text-foreground truncate'>
                      {formatActorName(
                        activeDetailItem.assignee_email ||
                          activeDetailItem.lead_assignee,
                      )}
                    </span>
                  </div>

                  <div className='flex flex-col gap-0.5'>
                    <span className='text-muted-foreground font-medium'>
                      Created On (created_on):
                    </span>
                    <span className='font-medium text-foreground'>
                      {activeDetailItem.created_on
                        ? formatCreationTimestamp(activeDetailItem.created_on)
                        : '—'}
                    </span>
                  </div>

                  <div className='flex flex-col gap-0.5'>
                    <span className='text-muted-foreground font-medium'>
                      Creation Timestamp:
                    </span>
                    <span className='font-medium text-foreground'>
                      {formatCreationTimestamp(
                        activeDetailItem.creation_timestamp ||
                          activeDetailItem.created_at,
                      )}
                    </span>
                  </div>
                </div>

                {/* Primary Message Content */}
                <div className='flex flex-col gap-1.5'>
                  <div className='flex items-center justify-between'>
                    <span className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
                      <FileText className='h-3.5 w-3.5 text-emerald-600' />
                      Message Content (messageText):
                    </span>
                    {(activeDetailItem.messageText || activeDetailItem.wa_msg_txt) && (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                          handleCopyText(
                            activeDetailItem.messageText ||
                              activeDetailItem.wa_msg_txt,
                            `modal-body-${activeDetailItem.id}`,
                            'message text',
                          )
                        }
                        className='h-7 text-xs gap-1 px-2 text-muted-foreground hover:text-foreground cursor-pointer'
                      >
                        <Copy className='h-3 w-3' /> Copy Message
                      </Button>
                    )}
                  </div>
                  <div className='bg-muted/30 border border-border/70 rounded-xl p-3.5 text-xs text-foreground font-normal whitespace-pre-wrap leading-relaxed select-text max-h-60 overflow-y-auto'>
                    {activeDetailItem.messageText ||
                      activeDetailItem.wa_msg_txt ||
                      'No message text provided.'}
                  </div>
                </div>

                {/* Secondary wa_msg_txt if distinct from messageText */}
                {activeDetailItem.wa_msg_txt &&
                  activeDetailItem.wa_msg_txt !== activeDetailItem.messageText && (
                    <div className='flex flex-col gap-1.5'>
                      <div className='flex items-center justify-between'>
                        <span className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
                          <MessageSquare className='h-3.5 w-3.5 text-blue-600' />
                          WhatsApp Msg Text (wa_msg_txt):
                        </span>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() =>
                            handleCopyText(
                              activeDetailItem.wa_msg_txt,
                              `modal-wa-${activeDetailItem.id}`,
                              'wa_msg_txt',
                            )
                          }
                          className='h-7 text-xs gap-1 px-2 text-muted-foreground hover:text-foreground cursor-pointer'
                        >
                          <Copy className='h-3 w-3' /> Copy
                        </Button>
                      </div>
                      <div className='bg-muted/30 border border-border/70 rounded-xl p-3.5 text-xs text-foreground font-normal whitespace-pre-wrap leading-relaxed select-text max-h-40 overflow-y-auto'>
                        {activeDetailItem.wa_msg_txt}
                      </div>
                    </div>
                  )}

                {/* Media Link if present */}
                {activeDetailItem.url && (
                  <div className='flex items-center justify-between bg-muted/40 p-3 rounded-xl border border-border/60 text-xs'>
                    <span className='text-muted-foreground'>Media / Action URL:</span>
                    <a
                      href={activeDetailItem.url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-flex items-center gap-1 text-emerald-600 hover:underline font-medium'
                    >
                      Open Attachment / Link <ExternalLink className='h-3 w-3' />
                    </a>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </TooltipProvider>
  );
}
