import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  Megaphone,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  RotateCw,
  Copy,
  Check,
  CheckCheck,
  Building2,
  Calendar as CalendarIcon,
  Clock,
  RotateCcw,
  X,
  Eye,
  FileText,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Sparkles,
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
import { ImagePreviewModal } from '@/components/whatsapp/image-preview-modal';
import { WhatsAppAudioPlayer } from '@/components/whatsapp/whatsapp-audio-player';
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

export interface BroadcastRecordItem {
  id: string;
  wamid?: string;
  account_id: number | string | null;
  account_name: string | null;
  customer_name: string;
  customer_wa_id: string;
  lead_phone: string;
  direction: 'outbound' | 'inbound' | string;
  type: string;
  normalized_type: 'outgoing' | 'incoming';
  msg_type: string;
  message_text: string;
  template_name?: string;
  response_intent?: string | null;
  response_button?: string | null;
  is_exact_reply?: boolean;
  buttons?: Array<{ id?: string; title?: string; text?: string }>;
  status: string;
  status_history?: Array<{
    status: string;
    timestamp: string;
    error?: any;
  }>;
  error?: any;
  media_id?: string | null;
  mime_type?: string | null;
  created_at?: string;
  timestamp?: string;
  relative_time?: string;
  conversation_id?: string;
}

export interface BroadcastRecordsResponse {
  status: string;
  data: BroadcastRecordItem[];
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
  const clean = String(phoneStr).trim().replace(/\D/g, '');
  if (clean.length === 12 && clean.startsWith('91')) {
    return `+91 ${clean.slice(2, 7)} ${clean.slice(7)}`;
  }
  if (clean.length === 10) {
    return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
  }
  return phoneStr;
}

// Format timestamp into 12-hour format time & date
function formatCreationTimestamp(ts?: string | null): string {
  if (!ts || ts === '—') return '—';
  const clean = String(ts).trim();
  if (!clean) return '—';

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

// Render status badge with icon and appropriate colors
function renderStatusBadge(status?: string) {
  const s = String(status || 'sent').toLowerCase();

  if (s === 'read') {
    return (
      <Badge
        variant='outline'
        className='bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800 text-[10px] font-semibold gap-1 px-1.5 py-0.5 whitespace-nowrap'
        title='Read by recipient'
      >
        <CheckCheck className='h-3 w-3 text-sky-500' />
        Read
      </Badge>
    );
  }

  if (s === 'delivered') {
    return (
      <Badge
        variant='outline'
        className='bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-[10px] font-semibold gap-1 px-1.5 py-0.5 whitespace-nowrap'
        title='Delivered to device'
      >
        <CheckCheck className='h-3 w-3 text-muted-foreground' />
        Delivered
      </Badge>
    );
  }

  if (s === 'sent' || s === 'sent_to_meta') {
    return (
      <Badge
        variant='outline'
        className='bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 text-[10px] font-medium gap-1 px-1.5 py-0.5 whitespace-nowrap'
        title='Sent to WhatsApp'
      >
        <Check className='h-3 w-3 text-blue-500' />
        Sent
      </Badge>
    );
  }

  if (s === 'received') {
    return (
      <Badge
        variant='outline'
        className='bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 text-[10px] font-semibold gap-1 px-1.5 py-0.5 whitespace-nowrap'
        title='Inbound message received'
      >
        <ArrowDownLeft className='h-3 w-3 text-purple-600' />
        Received
      </Badge>
    );
  }

  if (s === 'failed') {
    return (
      <Badge
        variant='outline'
        className='bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 text-[10px] font-semibold gap-1 px-1.5 py-0.5 whitespace-nowrap'
        title='Delivery failed'
      >
        <AlertCircle className='h-3 w-3 text-rose-600' />
        Failed
      </Badge>
    );
  }

  return (
    <Badge
      variant='outline'
      className='bg-muted text-muted-foreground border-border text-[10px] font-medium px-1.5 py-0.5 whitespace-nowrap uppercase'
    >
      {status || 'Unknown'}
    </Badge>
  );
}

export default function BroadcastMessagesRecordsTab() {
  const navigate = useNavigate();

  // Query & pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [searchInput, setSearchInput] = useState<string>('');
  const [appliedSearch, setAppliedSearch] = useState<string>('');
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [msgTypeFilter, setMsgTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [templateFilter, setTemplateFilter] = useState<string>('all');
  const [interestedFilter, setInterestedFilter] = useState<string>('all');
  const [responseScope, setResponseScope] = useState<'all' | 'replies_only'>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [fromTime, setFromTime] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [toTime, setToTime] = useState<string>('');
  const [activePreset, setActivePreset] = useState<PeriodPresetId>('ALL');

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Active detail modal
  const [activeDetailItem, setActiveDetailItem] = useState<BroadcastRecordItem | null>(null);

  // Image preview state
  const [previewImage, setPreviewImage] = useState<{ url: string; caption?: string } | null>(null);

  // Fetch available broadcast template names
  const { data: templatesData } = useQuery<{ status: string; data: string[] }>({
    queryKey: ['broadcast-templates-list'],
    queryFn: async () => {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/tele-crm/broadcast-templates`,
        { credentials: 'include' },
      );
      if (!res.ok) return { status: 'success', data: [] };
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
  const availableTemplates: string[] = templatesData?.data || [];

  // Copy helper
  const handleCopyText = (textToCopy: string, id: string, label: string) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(id);
    toast.success(`Copied ${label} to clipboard`);
    setTimeout(() => {
      setCopiedId((current) => (current === id ? null : current));
    }, 2000);
  };

  // Fetch Broadcast records with pagination & filters
  const { data, isLoading, isError, error, refetch, isFetching } =
    useQuery<BroadcastRecordsResponse>({
      queryKey: [
        'broadcast-messages-records',
        currentPage,
        pageSize,
        appliedSearch,
        directionFilter,
        msgTypeFilter,
        statusFilter,
        templateFilter,
        interestedFilter,
        responseScope,
        fromDate,
        fromTime,
        toDate,
        toTime,
      ],
      queryFn: async () => {
        const params = new URLSearchParams();
        params.append('page', String(currentPage));
        params.append('limit', String(pageSize));

        if (appliedSearch) {
          params.append('search', appliedSearch);
        }
        if (directionFilter && directionFilter !== 'all') {
          params.append('type', directionFilter);
        }
        if (msgTypeFilter && msgTypeFilter !== 'all') {
          params.append('msg_type', msgTypeFilter);
        }
        if (statusFilter && statusFilter !== 'all') {
          params.append('status', statusFilter);
        }
        if (templateFilter && templateFilter !== 'all') {
          params.append('template_name', templateFilter);
        }
        if (interestedFilter && interestedFilter !== 'all') {
          params.append('interested_status', interestedFilter);
        }
        if (
          (templateFilter && templateFilter !== 'all') ||
          (interestedFilter && interestedFilter !== 'all')
        ) {
          params.append('response_scope', responseScope);
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
          `${ENV.VITE_BACKEND_BASE_URL}/tele-crm/broadcast-messages?${params.toString()}`,
          { credentials: 'include' },
        );

        if (!res.ok) {
          throw new Error(`Failed to load Broadcast messages (${res.status})`);
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

  const handleFromDateChange = (date: string) => {
    setFromDate(date);
    if (date && !fromTime) setFromTime('00:00');
    if (!date) setFromTime('');
    setActivePreset('CUSTOM');
    setCurrentPage(1);
  };

  const handleToDateChange = (date: string) => {
    setToDate(date);
    if (date && !toTime) setToTime('23:59');
    if (!date) setToTime('');
    setActivePreset('CUSTOM');
    setCurrentPage(1);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchInput('');
    setAppliedSearch('');
    setDirectionFilter('all');
    setMsgTypeFilter('all');
    setStatusFilter('all');
    setTemplateFilter('all');
    setInterestedFilter('all');
    setResponseScope('all');
    setFromDate('');
    setFromTime('');
    setToDate('');
    setToTime('');
    setActivePreset('ALL');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    Boolean(appliedSearch) ||
    directionFilter !== 'all' ||
    msgTypeFilter !== 'all' ||
    statusFilter !== 'all' ||
    templateFilter !== 'all' ||
    interestedFilter !== 'all' ||
    Boolean(fromDate) ||
    Boolean(toDate);

  const matchedAccountsCount = records.filter((r) => Boolean(r.account_id)).length;

  return (
    <TooltipProvider>
      <div className='flex flex-col h-full w-full overflow-hidden bg-background'>
        {/* Top Header */}
        <div className='bg-background border-b border-border/60 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 shadow-2xs'>
          <div className='flex items-center gap-3'>
            <div className='h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-2xs border border-purple-500/20'>
              <Megaphone className='h-5 w-5' />
            </div>
            <div>
              <div className='flex items-center gap-2'>
                <h1 className='text-xl font-bold text-foreground tracking-tight'>
                  Broadcast WhatsApp Records
                </h1>
                <Badge
                  variant='outline'
                  className='bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 text-[11px] font-semibold px-2 py-0.2'
                >
                  messages collection
                </Badge>
              </div>
              <p className='text-xs text-muted-foreground mt-0.5'>
                Centralized archive of broadcast and WhatsApp Cloud API messages mapped with CRM accounts
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
                <span className='text-base font-bold text-purple-600 dark:text-purple-400 leading-none mt-0.5'>
                  {isLoading ? (
                    <Skeleton className='h-4 w-10 rounded' />
                  ) : (
                    `${matchedAccountsCount} / ${records.length}`
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
              title='Refresh Broadcast records'
              className='h-9 w-9 rounded-lg border-border/60 text-muted-foreground hover:text-foreground cursor-pointer shadow-2xs'
            >
              <RotateCw
                className={`h-4 w-4 ${isFetching ? 'animate-spin text-purple-600' : ''}`}
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
                className='relative flex-1 min-w-[240px] max-w-md'
              >
                <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none' />
                <Input
                  type='text'
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder='Search account, customer, phone, template, text...'
                  className='pl-9 pr-20 h-9 text-xs rounded-lg bg-background'
                />
                {searchInput && (
                  <button
                    type='button'
                    onClick={handleClearSearch}
                    className='absolute right-12 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer'
                    title='Clear search'
                  >
                    <X className='h-3.5 w-3.5' />
                  </button>
                )}
                <Button
                  type='submit'
                  size='sm'
                  variant='ghost'
                  className='absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2 text-xs font-semibold text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 cursor-pointer'
                >
                  Search
                </Button>
              </form>

              {/* Filters Right Group */}
              <div className='flex flex-wrap items-center gap-2'>
                {/* Direction Filter */}
                <div className='flex items-center gap-1.5'>
                  <span className='text-xs text-muted-foreground whitespace-nowrap font-medium'>
                    Direction:
                  </span>
                  <Select
                    value={directionFilter}
                    onValueChange={(val) => {
                      setDirectionFilter(val);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className='h-9 text-xs w-[130px] rounded-lg bg-background'>
                      <SelectValue placeholder='All' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Directions</SelectItem>
                      <SelectItem value='outbound'>Outgoing (Outbound)</SelectItem>
                      <SelectItem value='inbound'>Incoming (Inbound)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Msg Type Filter */}
                <div className='flex items-center gap-1.5'>
                  <span className='text-xs text-muted-foreground whitespace-nowrap font-medium'>
                    Type:
                  </span>
                  <Select
                    value={msgTypeFilter}
                    onValueChange={(val) => {
                      setMsgTypeFilter(val);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className='h-9 text-xs w-[130px] rounded-lg bg-background'>
                      <SelectValue placeholder='All Types' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Types</SelectItem>
                      <SelectItem value='template'>Template</SelectItem>
                      <SelectItem value='text'>Text</SelectItem>
                      <SelectItem value='image'>Image</SelectItem>
                      <SelectItem value='audio'>Audio</SelectItem>
                      <SelectItem value='interactive_reply'>Interactive Reply</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div className='flex items-center gap-1.5'>
                  <span className='text-xs text-muted-foreground whitespace-nowrap font-medium'>
                    Status:
                  </span>
                  <Select
                    value={statusFilter}
                    onValueChange={(val) => {
                      setStatusFilter(val);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className='h-9 text-xs w-[120px] rounded-lg bg-background'>
                      <SelectValue placeholder='All Status' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Status</SelectItem>
                      <SelectItem value='read'>Read</SelectItem>
                      <SelectItem value='delivered'>Delivered</SelectItem>
                      <SelectItem value='sent'>Sent</SelectItem>
                      <SelectItem value='received'>Received</SelectItem>
                      <SelectItem value='failed'>Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Template Filter (Responded Customers) */}
                <div className='flex items-center gap-1.5'>
                  <span className='text-xs text-muted-foreground whitespace-nowrap font-medium'>
                    Template:
                  </span>
                  <Select
                    value={templateFilter}
                    onValueChange={(val) => {
                      setTemplateFilter(val);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className='h-9 text-xs w-[165px] rounded-lg bg-background'>
                      <SelectValue placeholder='All Templates' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Templates</SelectItem>
                      {availableTemplates.map((tName) => (
                        <SelectItem key={tName} value={tName}>
                          {tName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Interested Accounts Filter */}
                <div className='flex items-center gap-1.5'>
                  <span className='text-xs text-muted-foreground whitespace-nowrap font-medium'>
                    Interested Accounts:
                  </span>
                  <Select
                    value={interestedFilter}
                    onValueChange={(val) => {
                      setInterestedFilter(val);
                      if (val !== 'all') {
                        setResponseScope('replies_only');
                      } else if (templateFilter === 'all') {
                        setResponseScope('all');
                      }
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className='h-9 text-xs w-[160px] rounded-lg bg-background'>
                      <SelectValue placeholder='All' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>All Accounts</SelectItem>
                      <SelectItem value='interested'>
                        <span className='flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium'>
                          <span className='h-2 w-2 rounded-full bg-emerald-500' />
                          Interested
                        </span>
                      </SelectItem>
                      <SelectItem value='not_interested'>
                        <span className='flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium'>
                          <span className='h-2 w-2 rounded-full bg-rose-500' />
                          Not Interested
                        </span>
                      </SelectItem>
                      <SelectItem value='responded'>
                        <span className='flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium'>
                          <span className='h-2 w-2 rounded-full bg-blue-500' />
                          All Responded
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Response Scope Toggle (visible when template or interested filter is selected) */}
                {(templateFilter !== 'all' || interestedFilter !== 'all') && (
                  <div className='flex items-center bg-muted/60 p-0.5 rounded-lg border border-purple-500/30 gap-1 text-xs'>
                    <button
                      type='button'
                      onClick={() => {
                        setResponseScope('all');
                        setCurrentPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        responseScope === 'all'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      title='Show all conversation messages of customers matching this filter'
                    >
                      All Messages
                    </button>
                    <button
                      type='button'
                      onClick={() => {
                        setResponseScope('replies_only');
                        setCurrentPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        responseScope === 'replies_only'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                      title='Show only the customer reply messages received'
                    >
                      Replies Only
                    </button>
                  </div>
                )}

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

                {/* Reset Filters */}
                {hasActiveFilters && (
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={handleResetFilters}
                    className='h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1 cursor-pointer'
                    title='Reset all filters'
                  >
                    <RotateCcw className='h-3.5 w-3.5' /> Reset
                  </Button>
                )}
              </div>
            </div>

            {/* Bottom Row: Date Range & Quick Presets */}
            <div className='flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/40'>
              <div className='flex flex-wrap items-center gap-2 sm:gap-3'>
                {/* From Date & Time */}
                <div className='flex items-center gap-1.5'>
                  <span className='text-[11px] font-medium text-muted-foreground flex items-center gap-1'>
                    <CalendarIcon className='w-3 h-3 text-muted-foreground' />
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
              </div>

              {/* Quick Period Presets */}
              <div className='flex flex-wrap items-center gap-1 sm:gap-1.5'>
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
                          ? 'bg-purple-600 text-white shadow-xs'
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
                    <TableHead className='min-w-[170px]'>
                      Customer / Contact
                    </TableHead>
                    <TableHead className='min-w-[140px]'>WhatsApp Phone</TableHead>
                    <TableHead className='min-w-[110px]'>Direction</TableHead>
                    <TableHead className='min-w-[240px]'>Message</TableHead>
                    <TableHead className='min-w-[90px] text-center'>Format</TableHead>
                    <TableHead className='min-w-[100px] text-center'>Status</TableHead>
                    <TableHead className='min-w-[170px]'>
                      Sent / Received At
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
                          <Skeleton className='h-5 w-20 rounded-full' />
                        </TableCell>
                        <TableCell>
                          <Skeleton className='h-4 w-48 rounded' />
                        </TableCell>
                        <TableCell className='text-center'>
                          <Skeleton className='h-4 w-12 mx-auto rounded' />
                        </TableCell>
                        <TableCell className='text-center'>
                          <Skeleton className='h-5 w-16 mx-auto rounded-full' />
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
                            Failed to load Broadcast messages.
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
                  ) : records.length === 0 ? (
                    // Empty State
                    <TableRow>
                      <TableCell colSpan={10} className='h-56 text-center'>
                        <div className='flex flex-col items-center justify-center gap-2'>
                          <div className='h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600 mb-1'>
                            <Megaphone className='h-6 w-6' />
                          </div>
                          <p className='text-sm font-medium text-foreground'>
                            No Broadcast messages found
                          </p>
                          <p className='text-xs text-muted-foreground max-w-sm'>
                            {hasActiveFilters
                              ? 'Try adjusting your search query, format, status, or date filters to find what you are looking for.'
                              : 'No messages have been logged in the messages collection yet.'}
                          </p>
                          {hasActiveFilters && (
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={handleResetFilters}
                              className='mt-2 text-xs gap-1.5 cursor-pointer'
                            >
                              <RotateCcw className='h-3.5 w-3.5' /> Reset All Filters
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    // Data Rows
                    records.map((item, index) => {
                      const rowNumber = (pagination.page - 1) * pagination.limit + index + 1;
                      const hasAccount = Boolean(item.account_name && item.account_id);
                      const isOutgoing = item.direction === 'outbound' || item.normalized_type === 'outgoing';
                      const isPhoneCopied = copiedId === `phone-${item.id}`;

                      return (
                        <TableRow
                          key={item.id}
                          className='group hover:bg-muted/40 transition-colors'
                        >
                          {/* Row Number */}
                          <TableCell className='text-center text-xs font-mono text-muted-foreground font-medium'>
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
                                className='inline-flex items-center gap-1.5 text-left font-medium text-sm text-foreground hover:text-purple-600 dark:hover:text-purple-400 group-hover:underline cursor-pointer transition-colors max-w-[220px] truncate'
                                title={`View CRM Account: ${item.account_name}`}
                              >
                                <Building2 className='h-3.5 w-3.5 shrink-0 text-purple-600/75 dark:text-purple-400/75' />
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

                          {/* Customer / Contact Name */}
                          <TableCell>
                            <div className='flex flex-col max-w-[190px]'>
                              <span className='text-sm font-medium text-foreground truncate'>
                                {item.customer_name || '—'}
                              </span>
                              {(item.template_name || (item.direction === 'inbound' && item.response_intent)) && (
                                <span
                                  className={`text-[10px] truncate flex items-center gap-1 font-medium ${
                                    item.direction === 'inbound'
                                      ? 'text-sky-600 dark:text-sky-400'
                                      : 'text-purple-600 dark:text-purple-400'
                                  }`}
                                  title={
                                    item.direction === 'inbound'
                                      ? `Responded: ${item.response_intent || item.template_name}`
                                      : `Template: ${item.template_name || 'Broadcast'}`
                                  }
                                >
                                  {item.template_name && (
                                    <>
                                      <Sparkles className='h-2.5 w-2.5 shrink-0' />
                                      <span className='truncate'>{item.template_name}</span>
                                    </>
                                  )}
                                  {item.direction === 'inbound' && item.response_intent && (
                                    <span
                                      className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold shrink-0 ${
                                        item.response_intent.toLowerCase().includes('not')
                                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border border-rose-200/50'
                                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200/50'
                                      }`}
                                    >
                                      {item.response_intent.replace('_', ' ')}
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* WhatsApp Phone */}
                          <TableCell>
                            <div className='flex items-center gap-1.5'>
                              <a
                                href={`tel:${item.customer_wa_id || item.lead_phone}`}
                                className='text-xs font-mono font-medium text-foreground hover:text-purple-600 transition-colors'
                              >
                                {formatPhone(item.customer_wa_id || item.lead_phone)}
                              </a>
                              {(item.customer_wa_id || item.lead_phone) && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type='button'
                                      onClick={() =>
                                        handleCopyText(
                                          (item.customer_wa_id || item.lead_phone).slice(-10),
                                          `phone-${item.id}`,
                                          'phone number',
                                        )
                                      }
                                      className='h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer'
                                    >
                                      {isPhoneCopied ? (
                                        <Check className='h-3 w-3 text-purple-600' />
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

                          {/* Direction */}
                          <TableCell>
                            {isOutgoing ? (
                              <Badge
                                variant='outline'
                                className='bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 text-[11px] font-medium gap-1 px-2 py-0.5 whitespace-nowrap'
                              >
                                <ArrowUpRight className='h-3 w-3 shrink-0' />
                                Outbound
                              </Badge>
                            ) : (
                              <Badge
                                variant='outline'
                                className='bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800 text-[11px] font-medium gap-1 px-2 py-0.5 whitespace-nowrap'
                              >
                                <ArrowDownLeft className='h-3 w-3 shrink-0' />
                                Inbound
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
                                  <span className='text-xs text-foreground/90 font-normal line-clamp-2 hover:text-purple-600 dark:hover:text-purple-400 transition-colors'>
                                    {item.message_text || '—'}
                                  </span>
                                </button>
                              </TooltipTrigger>
                              <TooltipContent
                                side='bottom'
                                className='max-w-md p-3 text-xs leading-relaxed'
                              >
                                <div className='font-semibold mb-1 text-[11px] text-muted-foreground uppercase tracking-wider'>
                                  Message Preview
                                </div>
                                <div className='whitespace-pre-wrap break-words'>
                                  {item.message_text}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>

                          {/* Format */}
                          <TableCell className='text-center'>
                            <Badge
                              variant='secondary'
                              className='text-[10px] font-mono uppercase px-1.5 py-0.5 bg-muted/70 text-foreground/80'
                            >
                              {item.msg_type || 'text'}
                            </Badge>
                          </TableCell>

                          {/* Status */}
                          <TableCell className='text-center'>
                            {renderStatusBadge(item.status)}
                          </TableCell>

                          {/* Created / Sent At */}
                          <TableCell>
                            <div className='flex flex-col'>
                              <span className='text-xs font-medium text-foreground whitespace-nowrap'>
                                {formatCreationTimestamp(item.timestamp || item.created_at)}
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
                  {records.length > 0
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
                Broadcast messages
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
                  <Megaphone className='h-5 w-5 text-purple-600' />
                  Broadcast WhatsApp Message Details
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
                          className='inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:underline cursor-pointer text-left'
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
                      Customer Name:
                    </span>
                    <span className='font-semibold text-foreground'>
                      {activeDetailItem.customer_name || '—'}
                    </span>
                  </div>

                  <div className='flex flex-col gap-0.5'>
                    <span className='text-muted-foreground font-medium'>
                      WhatsApp Phone:
                    </span>
                    <div className='flex items-center gap-1 font-mono font-medium text-foreground'>
                      <span>{formatPhone(activeDetailItem.customer_wa_id || activeDetailItem.lead_phone)}</span>
                      {(activeDetailItem.customer_wa_id || activeDetailItem.lead_phone) && (
                        <button
                          type='button'
                          onClick={() =>
                            handleCopyText(
                              (activeDetailItem.customer_wa_id || activeDetailItem.lead_phone).slice(-10),
                              `modal-lead-${activeDetailItem.id}`,
                              'phone number',
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
                      Status:
                    </span>
                    <div>{renderStatusBadge(activeDetailItem.status)}</div>
                  </div>

                  <div className='flex flex-col gap-0.5'>
                    <span className='text-muted-foreground font-medium'>
                      Direction:
                    </span>
                    <span className='font-mono font-medium text-foreground capitalize'>
                      {activeDetailItem.direction || 'outbound'}
                    </span>
                  </div>

                  <div className='flex flex-col gap-0.5'>
                    <span className='text-muted-foreground font-medium'>
                      Format (type):
                    </span>
                    <span className='font-mono font-medium text-foreground uppercase'>
                      {activeDetailItem.msg_type || 'text'}
                    </span>
                  </div>

                  {activeDetailItem.template_name && (
                    <div className='flex flex-col gap-0.5'>
                      <span className='text-muted-foreground font-medium'>
                        {activeDetailItem.direction === 'inbound'
                          ? 'Responded Template:'
                          : 'Template Name:'}
                      </span>
                      <span className='font-mono font-medium text-purple-600 truncate'>
                        {activeDetailItem.template_name}
                      </span>
                    </div>
                  )}

                  {activeDetailItem.direction === 'inbound' && activeDetailItem.response_intent && (
                    <div className='flex flex-col gap-0.5'>
                      <span className='text-muted-foreground font-medium'>
                        Customer Response:
                      </span>
                      <span
                        className={`font-semibold capitalize ${
                          activeDetailItem.response_intent.toLowerCase().includes('not')
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {activeDetailItem.response_intent.replace('_', ' ')}
                        {activeDetailItem.response_button && ` (${activeDetailItem.response_button})`}
                      </span>
                    </div>
                  )}

                  {activeDetailItem.wamid && (
                    <div className='flex flex-col gap-0.5 col-span-1 sm:col-span-2'>
                      <span className='text-muted-foreground font-medium'>
                        WhatsApp Message ID (wamid):
                      </span>
                      <div className='flex items-center gap-1 font-mono text-[11px] text-muted-foreground break-all'>
                        <span>{activeDetailItem.wamid}</span>
                        <button
                          type='button'
                          onClick={() =>
                            handleCopyText(
                              activeDetailItem.wamid || '',
                              `modal-wamid-${activeDetailItem.id}`,
                              'wamid',
                            )
                          }
                          className='p-0.5 text-muted-foreground hover:text-foreground cursor-pointer shrink-0'
                        >
                          <Copy className='h-3 w-3' />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className='flex flex-col gap-0.5'>
                    <span className='text-muted-foreground font-medium'>
                      Timestamp:
                    </span>
                    <span className='font-medium text-foreground'>
                      {formatCreationTimestamp(activeDetailItem.timestamp || activeDetailItem.created_at)}
                    </span>
                  </div>
                </div>

                {/* Error Banner if failed */}
                {activeDetailItem.error && (
                  <div className='bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl p-3 flex items-start gap-2 text-xs'>
                    <AlertCircle className='h-4 w-4 text-rose-600 shrink-0 mt-0.5' />
                    <div className='flex flex-col gap-0.5'>
                      <span className='font-semibold text-rose-800 dark:text-rose-300'>
                        {activeDetailItem.error.title || 'Delivery Failure'}
                      </span>
                      <p className='text-rose-700 dark:text-rose-400'>
                        {activeDetailItem.error.error_data?.details ||
                          activeDetailItem.error.message ||
                          JSON.stringify(activeDetailItem.error)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Media Preview if Image or Audio */}
                {activeDetailItem.media_id && activeDetailItem.msg_type === 'image' && (
                  <div className='flex flex-col gap-1.5'>
                    <span className='text-xs font-semibold text-foreground'>
                      Image Attachment:
                    </span>
                    <div
                      className='relative rounded-xl overflow-hidden bg-slate-100 max-h-60 flex items-center justify-center cursor-pointer border border-border'
                      onClick={() =>
                        setPreviewImage({
                          url: `${ENV.VITE_BACKEND_BASE_URL || 'http://localhost:8080'}/api/v1/whatsapp/media/${activeDetailItem.media_id}`,
                          caption: activeDetailItem.message_text,
                        })
                      }
                    >
                      <img
                        src={`${ENV.VITE_BACKEND_BASE_URL || 'http://localhost:8080'}/api/v1/whatsapp/media/${activeDetailItem.media_id}`}
                        alt='Attachment'
                        className='max-h-60 w-full object-contain'
                      />
                    </div>
                  </div>
                )}

                {activeDetailItem.media_id && activeDetailItem.msg_type === 'audio' && (
                  <div className='flex flex-col gap-1.5'>
                    <span className='text-xs font-semibold text-foreground'>
                      Audio Recording:
                    </span>
                    <WhatsAppAudioPlayer
                      src={`${ENV.VITE_BACKEND_BASE_URL || 'http://localhost:8080'}/api/v1/whatsapp/media/${activeDetailItem.media_id}`}
                      isOutbound={activeDetailItem.direction === 'outbound'}
                    />
                  </div>
                )}

                {/* Primary Message Content */}
                <div className='flex flex-col gap-1.5'>
                  <div className='flex items-center justify-between'>
                    <span className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
                      <FileText className='h-3.5 w-3.5 text-purple-600' />
                      Message Content:
                    </span>
                    {activeDetailItem.message_text && (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                          handleCopyText(
                            activeDetailItem.message_text,
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
                    {activeDetailItem.message_text || 'No message text provided.'}
                  </div>
                </div>

                {/* Buttons if template buttons exist */}
                {activeDetailItem.buttons && activeDetailItem.buttons.length > 0 && (
                  <div className='flex flex-col gap-1.5'>
                    <span className='text-xs font-semibold text-foreground'>
                      Quick Action Buttons:
                    </span>
                    <div className='flex flex-wrap gap-2'>
                      {activeDetailItem.buttons.map((btn, idx) => (
                        <Badge
                          key={idx}
                          variant='outline'
                          className='bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 text-xs py-1 px-2.5'
                        >
                          {btn.title || btn.text || btn.id}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status History Timeline */}
                {activeDetailItem.status_history && activeDetailItem.status_history.length > 0 && (
                  <div className='flex flex-col gap-1.5 pt-2 border-t border-border/40'>
                    <span className='text-xs font-semibold text-foreground'>
                      Delivery Status History:
                    </span>
                    <div className='flex flex-col gap-1 bg-muted/20 p-2.5 rounded-xl border border-border/50 text-[11px]'>
                      {activeDetailItem.status_history.map((sh, idx) => (
                        <div key={idx} className='flex items-center justify-between'>
                          <span className='font-mono uppercase font-medium text-foreground'>
                            {sh.status}
                          </span>
                          <span className='text-muted-foreground'>
                            {formatCreationTimestamp(sh.timestamp)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Image Modal */}
        <ImagePreviewModal
          isOpen={Boolean(previewImage)}
          onClose={() => setPreviewImage(null)}
          imageUrl={previewImage?.url || ''}
          caption={previewImage?.caption}
        />
      </div>
    </TooltipProvider>
  );
}
