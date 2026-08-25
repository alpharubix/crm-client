import { useState, useEffect, Fragment } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Label } from '@/components/ui/label';
import Pagination from '@/components/shared/pagination';
import { ENV } from '@/conf';

import { Button } from '@/components/ui/button';
import HighlightedText from '@/components/shared/highlighted-text';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

import { Spinner } from '@/components/ui/spinner';
import { formatExactDate } from '@/utils/date-formatter';
import UploadCsv from '@/components/accounts/csv-upload';
import { DatePicker } from '@/components/ui/date-picker';

import users from '@/utils/users.json';
import { useAuth } from '@/context/auth-context';
import type { Option } from '@/components/ui/multi-select';
import { useManageColumns } from '@/hooks/use-manage-columns';
import { ManageColumnsDialog } from '@/components/shared/manage-columns';
import { MultiSelect } from '@/components/ui/multi-select';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Hash,
  SlidersHorizontal,
  RotateCw,
  Users,
  Plus,
  MoreVertical,
  Columns,
  X,
  ExternalLink,
  Calendar as CalendarIcon,
  CheckCircle2,
  Info,
  ArrowRight,
  Clock,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { computeStageSummary, STATUS_COLOR_MAP } from './accounts-status-page';

const ACCOUNT_STATUS_OPTIONS: Option[] = [
  { value: 'Yet to be dialed', label: 'Yet to be dialed' },
  { value: 'Wrong Number', label: 'Wrong Number' },
  { value: 'Contact Established', label: 'Contact Established' },
  { value: 'Contact Not Established', label: 'Contact Not Established' },
  { value: 'Awareness', label: 'Awareness' },
  { value: 'Attention', label: 'Attention' },
  { value: 'Assessment', label: 'Assessment' },
  { value: 'Lender Review', label: 'Lender Review' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'Not Interested', label: 'Not Interested' },
  { value: 'Location Unserviceable', label: 'Location Unserviceable' },
]

const SOURCE_OPTIONS: Option[] = [
  { value: 'Himalaya', label: 'Himalaya' },
  { value: 'CavinKare', label: 'CavinKare' },
  {
    value: 'ALL INDIA CHEMISTS AND DRUGGISTS ASSOCIATION OF INDIA',
    label: 'ALL INDIA CHEMISTS AND DRUGGISTS ASSOCIATION OF INDIA',
  },
  {
    value: 'All India Hardware Association (Based in Mumbai Charni Road)',
    label: 'All India Hardware Association (Based in Mumbai Charni Road)',
  },
  { value: 'Alpharubix', label: 'Alpharubix' },
  { value: 'Condor Footwear', label: 'Condor Footwear' },
  { value: 'DVG Dist Petroleum', label: 'DVG Dist Petroleum' },
  {
    value:
      'Federation of Hotel and Restaurant Association of India (Based in New Delhi)',
    label:
      'Federation of Hotel and Restaurant Association of India (Based in New Delhi)',
  },
  { value: 'Havells', label: 'Havells' },
  { value: 'Liberty', label: 'Liberty' },
  { value: 'Marico', label: 'Marico' },
  { value: 'Reference', label: 'Reference' },
  {
    value: 'Retail Association of India',
    label: 'Retail Association of India',
  },
  { value: 'SME CHAMBER', label: 'SME CHAMBER' },
  { value: 'Swastik', label: 'Swastik' },
  { value: 'Unicharm', label: 'Unicharm' },
  { value: 'Vibhava Marketing', label: 'Vibhava Marketing' },
  { value: 'R1X Website', label: 'R1X Website' },
  { value: '5pointcredit', label: '5pointcredit' },
];

const INDUSTRY_OPTIONS: Option[] = [
  { value: 'Pharma', label: 'Pharma' },
  { value: 'AHP', label: 'AHP' },
  { value: 'CPD', label: 'CPD' },
  { value: 'FMCG', label: 'FMCG' },
  { value: 'OTX', label: 'OTX' },
  { value: 'Footwear', label: 'Footwear' },
  { value: 'OTC', label: 'OTC' },
  { value: 'RAAGA', label: 'RAAGA' },
  { value: 'Hardware', label: 'Hardware' },
  { value: 'Electronics', label: 'Electronics' },
  { value: 'DVG Dist Petroleum', label: 'DVG Dist Petroleum' },
];

const TYPE_OF_BUSINESS_OPTIONS: Option[] = [
  { value: 'Proprietorship', label: 'Proprietorship' },
  { value: 'Partnership', label: 'Partnership' },
  { value: 'Distributor', label: 'Distributor' },
  { value: 'Pvt Ltd', label: 'Pvt Ltd' },
  { value: 'LLP', label: 'LLP' },
];

const SOURCE_TYPE_OPTIONS: Option[] = [
  { value: 'Direct', label: 'Direct' },
  { value: 'Referral', label: 'Referral' },
  { value: 'Partner', label: 'Partner' },
  { value: 'Website', label: 'Website' },
  { value: 'Other', label: 'Other' },
];

const ACCOUNT_STAGE_OPTIONS: Option[] = [
  { value: 'Initial Pitch', label: 'Initial Pitch' },
  { value: 'Product Offering', label: 'Product Offering' },
  { value: 'Doc List Shared to Cust', label: 'Doc List Shared to Cust' },
  { value: 'Partial Docs Rec', label: 'Partial Docs Rec' },
  { value: 'Yet To Review', label: 'Yet To Review' },
  { value: 'Under Internal Review', label: 'Under Internal Review' },
  { value: 'In Review with Lender', label: 'In Review with Lender' },
  { value: 'Interested', label: 'Interested' },
  { value: 'Commercial NI', label: 'Commercial NI' },
  { value: 'Location not doable', label: 'Location not doable' },
  { value: 'No Requirement', label: 'No Requirement' },
];

const BUSINESS_STATUS_OPTIONS: Option[] = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'Not sure', label: 'Not sure' },
];

const DEFAULT_COLUMNS = [
  { id: 'account_name', label: 'Account Name', selected: true },
  { id: 'account_owner', label: 'Account Owner', selected: true },
  { id: 'account_status', label: 'Account Status', selected: true },
  { id: 'source', label: 'Source', selected: true },
  { id: 'type_of_business', label: 'Type of Business', selected: true },
  { id: 'industry', label: 'Industry', selected: true },
  { id: 'phone', label: 'Phone', selected: true },
  { id: 'city', label: 'City', selected: true },
  { id: 'state', label: 'State', selected: true },
  { id: 'business_status', label: 'Business Status', selected: true },
  { id: 'priority_account', label: 'Priority Account', selected: true },
  { id: 'source_date', label: 'Source Date', selected: true },
  { id: 'assignment_date', label: 'Assignment Date', selected: true },
  { id: 'modified_time', label: 'Modified At', selected: true },
];

const getInitialAvatarColor = (name: string) => {
  if (!name) return 'bg-purple-100 text-purple-700 border-purple-200';
  const char = name.trim().charAt(0).toUpperCase();
  if (['A', 'B', 'C', 'D'].includes(char))
    return 'bg-blue-100 text-blue-700 border-blue-200';
  if (['E', 'F', 'G', 'H'].includes(char))
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (['I', 'J', 'K', 'L'].includes(char))
    return 'bg-purple-100 text-purple-700 border-purple-200';
  if (['M', 'N', 'O', 'P'].includes(char))
    return 'bg-rose-100 text-rose-700 border-rose-200';
  if (['Q', 'R', 'S', 'T'].includes(char))
    return 'bg-indigo-100 text-indigo-700 border-indigo-200';
  return 'bg-amber-100 text-amber-700 border-amber-200';
};

const getStatusBadgeStyle = (status: string) => {
  if (!status) return 'bg-slate-100 text-slate-600 border-slate-200';
  const s = status.toLowerCase();
  if (s.includes('rejected')) {
    return 'bg-red-100 text-red-600 border-red-200 hover:bg-red-100 font-medium';
  }
  if (s.includes('attention')) {
    return 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 font-medium';
  }
  if (s.includes('call back') || s.includes('callback')) {
    return 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100 font-medium';
  }
  if (s.includes('additional bank docs') || s.includes('bank docs')) {
    return 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100 font-medium';
  }
  if (s.includes('bank processing') || s.includes('processing')) {
    return 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100 font-medium font-medium';
  }
  if (s.includes('awareness')) {
    return 'bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-100 font-medium';
  }
  if (s.includes('yet to be dialed') || s.includes('dialed')) {
    return 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-100 font-medium';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200 font-medium';
};

export default function AccountsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [pageSize, setPageSize] = useState<number>(25);

  const [filters, setFilters] = useState({
    accountId: searchParams.get('accountId') || searchParams.get('account_id') || '',
    accountName: searchParams.get('accountName') || searchParams.get('account_name') || '',
    accountStatus: [] as Option[],
    statusFilterName: searchParams.get('status_filter_name') || '',
    statusFromDate: searchParams.get('status_from_date') || '',
    statusToDate: searchParams.get('status_to_date') || '',
    statusMinDays: searchParams.get('status_min_days') || '',
    source: [] as Option[],
    industry: [] as Option[],
    phone: searchParams.get('phone') || '',
    city: searchParams.get('city') || '',
    state: searchParams.get('state') || '',
    accountOwnerId: [] as Option[],
    sourceType: [] as Option[],
    accountStage: [] as Option[],
    businessStatus: [] as Option[],
    typeOfBusiness: [] as Option[],
    wabaInterested: 'all',
    isPriorityAccount: 'all',
    createdFromDate:
      searchParams.get('createdFromDate') ||
      (!searchParams.get('module') ? searchParams.get('from_date') || '' : ''),
    createdToDate:
      searchParams.get('createdToDate') ||
      (!searchParams.get('module') ? searchParams.get('to_date') || '' : ''),
    assignmentFromDate:
      searchParams.get('assignmentFromDate') || searchParams.get('assignment_from_date') || '',
    assignmentToDate:
      searchParams.get('assignmentToDate') || searchParams.get('assignment_to_date') || '',
    noteFromDate:
      searchParams.get('noteFromDate') || searchParams.get('note_from_date') || '',
    noteToDate:
      searchParams.get('noteToDate') || searchParams.get('note_to_date') || '',
    cbCondition: 'Is',
    cbUsers: [] as Option[],
    cbDateCondition: 'all',
    cbFromDate: '',
    cbToDate: '',
    bsaFromDate:
      searchParams.get('bsaFromDate') ||
      (searchParams.get('module') === 'bsa'
        ? searchParams.get('from_date') || ''
        : ''),
    bsaToDate:
      searchParams.get('bsaToDate') ||
      (searchParams.get('module') === 'bsa'
        ? searchParams.get('to_date') || ''
        : ''),
    gstFromDate:
      searchParams.get('gstFromDate') ||
      (searchParams.get('module') === 'gst'
        ? searchParams.get('from_date') || ''
        : ''),
    gstToDate:
      searchParams.get('gstToDate') ||
      (searchParams.get('module') === 'gst'
        ? searchParams.get('to_date') || ''
        : ''),
    cibilFromDate:
      searchParams.get('cibilFromDate') ||
      (searchParams.get('module') === 'cibil'
        ? searchParams.get('from_date') || ''
        : ''),
    cibilToDate:
      searchParams.get('cibilToDate') ||
      (searchParams.get('module') === 'cibil'
        ? searchParams.get('to_date') || ''
        : ''),
    itrFromDate:
      searchParams.get('itrFromDate') ||
      (searchParams.get('module') === 'itr'
        ? searchParams.get('from_date') || ''
        : ''),
    itrToDate:
      searchParams.get('itrToDate') ||
      (searchParams.get('module') === 'itr'
        ? searchParams.get('to_date') || ''
        : ''),
  });

  const { columns, savePreferences, resetToDefault } = useManageColumns(
    'accounts',
    DEFAULT_COLUMNS,
  );

  const visibleColumns = columns.filter((c) => c.selected);

  const [appliedFilters, setAppliedFilters] = useState(filters);

  const [currentPage, setCurrentPage] = useState(() => {
    const page = searchParams.get('page');
    return page ? Number(page) : 1;
  });

  const { data: ownerResponse, isSuccess } = useQuery({
    queryKey: ['account-owners'],
    queryFn: async () => {
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/user/filter`, {
        credentials: 'include',
      });

      if (res.status === 403) {
        return { forbidden: true };
      }

      if (!res.ok) throw new Error('Failed');

      return res.json();
    },
    retry: false,
  });

  const showOwnerFilter = isSuccess && !ownerResponse?.forbidden;
  const owners = ownerResponse?.data ?? [];

  useEffect(() => {
    const loadedFilters: Partial<typeof filters> = {};

    const ownerIds = searchParams.getAll('accountOwnerId');
    if (ownerIds.length > 0 && isSuccess && owners.length > 0) {
      loadedFilters.accountOwnerId = ownerIds.map((id) => {
        const o = owners.find((owner: any) => owner.id.toString() === id);
        return { value: id, label: o ? o.full_name : id };
      });
    }

    const statuses = searchParams.getAll('accountStatus');
    if (statuses.length > 0) {
      loadedFilters.accountStatus = statuses.map((val) => {
        const matched = ACCOUNT_STATUS_OPTIONS.find((o) => o.value === val);
        return { value: val, label: matched ? matched.label : val };
      });
    }

    const srcs = searchParams.getAll('source');
    if (srcs.length > 0) {
      loadedFilters.source = srcs.map((val) => {
        const matched = SOURCE_OPTIONS.find((o) => o.value === val);
        return { value: val, label: matched ? matched.label : val };
      });
    }

    const inds = searchParams.getAll('industry');
    if (inds.length > 0) {
      loadedFilters.industry = inds.map((val) => {
        const matched = INDUSTRY_OPTIONS.find((o) => o.value === val);
        return { value: val, label: matched ? matched.label : val };
      });
    }

    const fromDate = searchParams.get('from_date');
    const toDate = searchParams.get('to_date');
    const mod = searchParams.get('module');
    if (!mod && (fromDate || toDate)) {
      if (fromDate) loadedFilters.createdFromDate = fromDate;
      if (toDate) loadedFilters.createdToDate = toDate;
    }

    if (Object.keys(loadedFilters).length > 0) {
      setFilters((prev) => ({ ...prev, ...loadedFilters }));
      setAppliedFilters((prev) => ({ ...prev, ...loadedFilters }));
    }
  }, [isSuccess, owners, searchParams]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['accounts', currentPage, appliedFilters, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', currentPage.toString());

      if (appliedFilters.accountId) {
        params.set('account_id', appliedFilters.accountId);
      }
      if (appliedFilters.assignmentFromDate) {
        params.set('assignment_from_date', appliedFilters.assignmentFromDate);
      }
      if (appliedFilters.assignmentToDate) {
        params.set('assignment_to_date', appliedFilters.assignmentToDate);
      }
      if (appliedFilters.noteFromDate) {
        params.set('note_from_date', appliedFilters.noteFromDate);
      }
      if (appliedFilters.noteToDate) {
        params.set('note_to_date', appliedFilters.noteToDate);
      }

      if (appliedFilters.accountName)
        params.set('account_name', appliedFilters.accountName);
      if (
        appliedFilters.accountStatus &&
        appliedFilters.accountStatus.length > 0
      ) {
        appliedFilters.accountStatus.forEach((o: Option) =>
          params.append('account_status', o.value),
        );
      }
      if (appliedFilters.statusFilterName) {
        params.set('status_filter_name', appliedFilters.statusFilterName);
      }
      if (appliedFilters.statusFromDate) {
        params.set('status_from_date', appliedFilters.statusFromDate);
      }
      if (appliedFilters.statusToDate) {
        params.set('status_to_date', appliedFilters.statusToDate);
      }
      if (appliedFilters.statusMinDays) {
        params.set('status_min_days', appliedFilters.statusMinDays);
      }
      if (appliedFilters.source && appliedFilters.source.length > 0) {
        appliedFilters.source.forEach((o: Option) =>
          params.append('source', o.value),
        );
      }
      if (appliedFilters.industry && appliedFilters.industry.length > 0) {
        appliedFilters.industry.forEach((o: Option) =>
          params.append('industry', o.value),
        );
      }
      if (appliedFilters.phone) params.set('phone', appliedFilters.phone);
      if (appliedFilters.city) params.set('city', appliedFilters.city);
      if (appliedFilters.state) params.set('state', appliedFilters.state);
      if (
        appliedFilters.accountOwnerId &&
        appliedFilters.accountOwnerId.length > 0
      ) {
        appliedFilters.accountOwnerId.forEach((o: Option) =>
          params.append('account_owner_id', o.value),
        );
      }
      if (appliedFilters.sourceType && appliedFilters.sourceType.length > 0) {
        appliedFilters.sourceType.forEach((o: Option) =>
          params.append('source_type', o.value),
        );
      }
      if (
        appliedFilters.accountStage &&
        appliedFilters.accountStage.length > 0
      ) {
        appliedFilters.accountStage.forEach((o: Option) =>
          params.append('account_stage', o.value),
        );
      }
      if (
        appliedFilters.businessStatus &&
        appliedFilters.businessStatus.length > 0
      ) {
        appliedFilters.businessStatus.forEach((o: Option) =>
          params.append('business_status', o.value),
        );
      }
      if (
        appliedFilters.wabaInterested &&
        appliedFilters.wabaInterested !== 'all'
      ) {
        params.set('waba_interested', appliedFilters.wabaInterested);
      }
      if (
        appliedFilters.isPriorityAccount &&
        appliedFilters.isPriorityAccount !== 'all'
      ) {
        params.set('is_priority_account', appliedFilters.isPriorityAccount);
      }
      if (appliedFilters.cbCondition) {
        params.set('cb_condition', appliedFilters.cbCondition);
      }
      if (appliedFilters.cbUsers && appliedFilters.cbUsers.length > 0) {
        appliedFilters.cbUsers.forEach((o: Option) =>
          params.append('cb_users', o.value),
        );
      }
      if (appliedFilters.cbFromDate || appliedFilters.cbToDate) {
        const cond =
          appliedFilters.cbDateCondition &&
          appliedFilters.cbDateCondition !== 'all'
            ? appliedFilters.cbDateCondition
            : 'Due Dates';
        params.set('cb_date_condition', cond);
        if (appliedFilters.cbFromDate)
          params.set('cb_from_date', appliedFilters.cbFromDate);
        if (appliedFilters.cbToDate)
          params.set('cb_to_date', appliedFilters.cbToDate);
      } else if (
        appliedFilters.cbDateCondition &&
        appliedFilters.cbDateCondition !== 'all'
      ) {
        params.set('cb_date_condition', appliedFilters.cbDateCondition);
      }

      if (appliedFilters.createdFromDate || appliedFilters.createdToDate) {
        if (appliedFilters.createdFromDate)
          params.set('from_date', appliedFilters.createdFromDate);
        if (appliedFilters.createdToDate)
          params.set('to_date', appliedFilters.createdToDate);
      } else if (appliedFilters.bsaFromDate || appliedFilters.bsaToDate) {
        params.set('module', 'bsa');
        if (appliedFilters.bsaFromDate)
          params.set('from_date', appliedFilters.bsaFromDate);
        if (appliedFilters.bsaToDate)
          params.set('to_date', appliedFilters.bsaToDate);
      } else if (appliedFilters.gstFromDate || appliedFilters.gstToDate) {
        params.set('module', 'gst');
        if (appliedFilters.gstFromDate)
          params.set('from_date', appliedFilters.gstFromDate);
        if (appliedFilters.gstToDate)
          params.set('to_date', appliedFilters.gstToDate);
      } else if (appliedFilters.cibilFromDate || appliedFilters.cibilToDate) {
        params.set('module', 'cibil');
        if (appliedFilters.cibilFromDate)
          params.set('from_date', appliedFilters.cibilFromDate);
        if (appliedFilters.cibilToDate)
          params.set('to_date', appliedFilters.cibilToDate);
      } else if (appliedFilters.itrFromDate || appliedFilters.itrToDate) {
        params.set('module', 'itr');
        if (appliedFilters.itrFromDate)
          params.set('from_date', appliedFilters.itrFromDate);
        if (appliedFilters.itrToDate)
          params.set('to_date', appliedFilters.itrToDate);
      }

      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/accounts?${params.toString()}`,
        { credentials: 'include' },
      );

      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    placeholderData: keepPreviousData,
  });

  const accounts = data?.data || [];
  const pageInfo = data?.page_info || { page: 1, total_pages: 1, data_size: 0 };
  const totalCount =
    pageInfo.data_size ||
    (pageInfo.total_pages ? pageInfo.total_pages * pageSize : accounts.length);

  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([]);

  useEffect(() => {
    setSelectedAccountIds([]);
  }, [currentPage, appliedFilters]);

  const isAllOnPageSelected =
    accounts.length > 0 &&
    accounts.every((acc: any) => selectedAccountIds.includes(acc.id));

  const isSomeOnPageSelected =
    accounts.some((acc: any) => selectedAccountIds.includes(acc.id)) &&
    !isAllOnPageSelected;

  const handleToggleSelectAll = () => {
    if (isAllOnPageSelected) {
      setSelectedAccountIds([]);
    } else {
      setSelectedAccountIds(accounts.map((acc: any) => acc.id));
    }
  };

  const handleToggleSelectRow = (accId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedAccountIds((prev) =>
      prev.includes(accId)
        ? prev.filter((id) => id !== accId)
        : [...prev, accId],
    );
  };

  const bulkCreateTasksMutation = useMutation({
    mutationFn: async (accountIds: number[]) => {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/account-tasks/bulk`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ account_ids: accountIds }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Failed to bulk create tasks');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(
        data.message ||
          `Created ${data.tasks_created} tasks for ${data.accounts_count} account(s)!`,
      );
      setSelectedAccountIds([]);
      queryClient.invalidateQueries({ queryKey: ['account-tasks-list'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Error creating tasks for selected accounts');
    },
  });

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const getStatusPeriodValidationError = (): string | null => {
    if (!filters.statusFilterName) return null;
    const { statusFromDate, statusToDate, statusMinDays } = filters;
    if (statusFromDate && statusToDate) {
      const fromDt = new Date(statusFromDate);
      const toDt = new Date(statusToDate);
      if (fromDt.getTime() > toDt.getTime()) {
        return 'From Date cannot be after To Date in Status Filter.';
      }
      if (statusMinDays && Number(statusMinDays) > 0) {
        const diffTime = toDt.getTime() - fromDt.getTime();
        const rangeDays = Math.floor(diffTime / (1000 * 3600 * 24)) + 1;
        const minDaysNum = Number(statusMinDays);
        if (minDaysNum > rangeDays) {
          return `Minimum stay period (${minDaysNum} days) cannot exceed the selected date range (${rangeDays} days).`;
        }
      }
    }
    return null;
  };

  const handleSearch = () => {
    const periodErr = getStatusPeriodValidationError();
    if (periodErr) {
      toast.error(periodErr);
      return false;
    }
    const params = new URLSearchParams();
    params.set('page', '1');

    const searchFilters = { ...filters };

    // Multi-select option fields -> append as snake_case or standard key
    if (searchFilters.accountOwnerId && searchFilters.accountOwnerId.length > 0) {
      searchFilters.accountOwnerId.forEach((o: Option) => params.append('account_owner_id', o.value));
    }
    if (searchFilters.accountStatus && searchFilters.accountStatus.length > 0) {
      searchFilters.accountStatus.forEach((o: Option) => params.append('account_status', o.value));
    }
    if (searchFilters.source && searchFilters.source.length > 0) {
      searchFilters.source.forEach((o: Option) => params.append('source', o.value));
    }
    if (searchFilters.industry && searchFilters.industry.length > 0) {
      searchFilters.industry.forEach((o: Option) => params.append('industry', o.value));
    }
    if (searchFilters.sourceType && searchFilters.sourceType.length > 0) {
      searchFilters.sourceType.forEach((o: Option) => params.append('source_type', o.value));
    }
    if (searchFilters.accountStage && searchFilters.accountStage.length > 0) {
      searchFilters.accountStage.forEach((o: Option) => params.append('account_stage', o.value));
    }
    if (searchFilters.businessStatus && searchFilters.businessStatus.length > 0) {
      searchFilters.businessStatus.forEach((o: Option) => params.append('business_status', o.value));
    }
    if (searchFilters.cbUsers && searchFilters.cbUsers.length > 0) {
      searchFilters.cbUsers.forEach((o: Option) => params.append('cb_users', o.value));
    }

    // String fields
    if (searchFilters.accountId) params.set('account_id', searchFilters.accountId);
    if (searchFilters.accountName) params.set('account_name', searchFilters.accountName);
    if (searchFilters.phone) params.set('phone', searchFilters.phone);
    if (searchFilters.city) params.set('city', searchFilters.city);
    if (searchFilters.state) params.set('state', searchFilters.state);

    if (searchFilters.assignmentFromDate) params.set('assignment_from_date', searchFilters.assignmentFromDate);
    if (searchFilters.assignmentToDate) params.set('assignment_to_date', searchFilters.assignmentToDate);
    if (searchFilters.noteFromDate) params.set('note_from_date', searchFilters.noteFromDate);
    if (searchFilters.noteToDate) params.set('note_to_date', searchFilters.noteToDate);

    if (searchFilters.wabaInterested && searchFilters.wabaInterested !== 'all') {
      params.set('waba_interested', searchFilters.wabaInterested);
    }
    if (searchFilters.isPriorityAccount && searchFilters.isPriorityAccount !== 'all') {
      params.set('is_priority_account', searchFilters.isPriorityAccount);
    }

    // Call Back Date Filter (cb_condition, cb_date_condition, cb_from_date, cb_to_date)
    if (searchFilters.cbCondition) {
      params.set('cb_condition', searchFilters.cbCondition);
    }
    if (searchFilters.cbFromDate || searchFilters.cbToDate) {
      const cond = searchFilters.cbDateCondition && searchFilters.cbDateCondition !== 'all' ? searchFilters.cbDateCondition : 'Due Dates';
      params.set('cb_date_condition', cond);
      if (searchFilters.cbFromDate) params.set('cb_from_date', searchFilters.cbFromDate);
      if (searchFilters.cbToDate) params.set('cb_to_date', searchFilters.cbToDate);
    } else if (searchFilters.cbDateCondition && searchFilters.cbDateCondition !== 'all') {
      params.set('cb_date_condition', searchFilters.cbDateCondition);
    }

    // Account Created Date (from_date / to_date) OR Underwriting Module Filters (bsa, gst, cibil, itr)
    if (searchFilters.createdFromDate || searchFilters.createdToDate) {
      if (searchFilters.createdFromDate) params.set('from_date', searchFilters.createdFromDate);
      if (searchFilters.createdToDate) params.set('to_date', searchFilters.createdToDate);
    } else if (searchFilters.bsaFromDate || searchFilters.bsaToDate) {
      params.set('module', 'bsa');
      if (searchFilters.bsaFromDate) params.set('from_date', searchFilters.bsaFromDate);
      if (searchFilters.bsaToDate) params.set('to_date', searchFilters.bsaToDate);
    } else if (searchFilters.gstFromDate || searchFilters.gstToDate) {
      params.set('module', 'gst');
      if (searchFilters.gstFromDate) params.set('from_date', searchFilters.gstFromDate);
      if (searchFilters.gstToDate) params.set('to_date', searchFilters.gstToDate);
    } else if (searchFilters.cibilFromDate || searchFilters.cibilToDate) {
      params.set('module', 'cibil');
      if (searchFilters.cibilFromDate) params.set('from_date', searchFilters.cibilFromDate);
      if (searchFilters.cibilToDate) params.set('to_date', searchFilters.cibilToDate);
    } else if (searchFilters.itrFromDate || searchFilters.itrToDate) {
      params.set('module', 'itr');
      if (searchFilters.itrFromDate) params.set('from_date', searchFilters.itrFromDate);
      if (searchFilters.itrToDate) params.set('to_date', searchFilters.itrToDate);
    }

    setSearchParams(params);
    setAppliedFilters(searchFilters);
    setCurrentPage(1);
  };

  const handleClear = () => {
    const emptyFilters = {
      accountId: '',
      accountName: '',
      accountStatus: [] as Option[],
      source: [] as Option[],
      industry: [] as Option[],
      phone: '',
      city: '',
      state: '',
      accountOwnerId: [] as Option[],
      sourceType: [] as Option[],
      accountStage: [] as Option[],
      businessStatus: [] as Option[],
      typeOfBusiness: [] as Option[],
      wabaInterested: 'all',
      isPriorityAccount: 'all',
      createdFromDate: '',
      createdToDate: '',
      assignmentFromDate: '',
      assignmentToDate: '',
      noteFromDate: '',
      noteToDate: '',
      cbCondition: 'Is',
      cbUsers: [] as Option[],
      cbDateCondition: 'all',
      cbFromDate: '',
      cbToDate: '',
      bsaFromDate: '',
      bsaToDate: '',
      gstFromDate: '',
      gstToDate: '',
      cibilFromDate: '',
      cibilToDate: '',
      itrFromDate: '',
      itrToDate: '',
    };

    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setSearchParams(new URLSearchParams());
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    setSearchParams(params);
  };

  const handleRowClick = async (id: string) => {
    try {
      await queryClient.ensureQueryData({
        queryKey: ['account', id],
        queryFn: async () => {
          const res = await fetch(
            `${ENV.VITE_BACKEND_BASE_URL}/accounts?account_id=${id}`,
            { credentials: 'include' },
          );
          if (!res.ok) throw new Error('Failed to fetch account');
          return res.json();
        },
      });
      window.open(`${window.location.origin}/accounts/${id}`, '_blank');
    } catch {
      window.open(`${window.location.origin}/accounts/${id}`, '_blank');
    }
  };

  const { user } = useAuth();

  const isAllowToCreate =
    user?.role?.toLowerCase().includes('admin') ||
    user?.role?.toLowerCase().includes('super_admin') ||
    user?.role?.toLowerCase().includes('manager');

  return (
    <div className='flex flex-col h-screen overflow-hidden bg-slate-50/50 dark:bg-background'>
      {/* ── Top Header Bar ── */}
      <div className='bg-background border-b border-border/60 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-2xs'>
        <div>
          <h1 className='text-2xl font-bold text-foreground tracking-tight'>
            Accounts
          </h1>
          <p className='text-xs text-muted-foreground mt-0.5'>
            Manage and track all your accounts in one place.
          </p>
        </div>

        <div className='flex items-center gap-4'>
          {/* Stat Card: Total Accounts */}
          <div className='flex items-center gap-3 bg-muted/40 border border-border/50 rounded-xl px-4 py-2 shadow-2xs'>
            <div className='h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0'>
              <Users className='h-5 w-5' />
            </div>
            <div className='flex flex-col'>
              <span className='text-[11px] font-medium text-muted-foreground uppercase tracking-wider'>
                Total Accounts
              </span>
              <span className='text-lg font-bold text-foreground leading-none mt-0.5'>
                {isLoading ? (
                  <Skeleton className='h-5 w-16 rounded' />
                ) : (
                  totalCount.toLocaleString()
                )}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex items-center gap-2.5'>
            {isAllowToCreate && (
              <Button
                onClick={() => navigate('/accounts/create')}
                className='bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium text-xs rounded-lg px-4 h-9 gap-1.5 cursor-pointer'
              >
                <Plus className='h-4 w-4' /> Create Account
              </Button>
            )}
            <UploadCsv isLoading={isLoading} refetch={refetch} />
            <Button
              variant='outline'
              size='icon'
              onClick={() => refetch()}
              title='Refresh accounts'
              className='h-9 w-9 rounded-lg border-border/60 text-muted-foreground hover:text-foreground cursor-pointer'
            >
              <RotateCw
                className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              />
            </Button>
          </div>
        </div>
      </div>

      {/* ── Toolbar & Content Container ── */}
      <div className='flex-1 flex flex-col overflow-hidden p-6 gap-4'>
        {/* Quick Filter Control Toolbar */}
        <div className='bg-background rounded-xl border border-border/60 p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs shrink-0'>
          {/* Left: Quick Search & Selects */}
          <div className='flex flex-wrap items-center gap-2.5 flex-1'>
            {/* Search Input with Direct Search Button */}
            <div className='flex items-center gap-1.5'>
              {/* Account ID Filter */}
              <div className='relative w-24 sm:w-28'>
                <Hash className='absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/70 pointer-events-none' />
                <Input
                  placeholder='ID'
                  value={filters.accountId}
                  onChange={(e) =>
                    handleFilterChange('accountId', e.target.value)
                  }
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className='pl-8 h-9 text-xs font-mono bg-background border-border/60 focus-visible:border-primary transition-colors shadow-none rounded-lg'
                />
              </div>

              <div className='relative w-full max-w-[220px]'>
                <Search className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search accounts...'
                  value={filters.accountName}
                  onChange={(e) =>
                    handleFilterChange('accountName', e.target.value)
                  }
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className='pl-9 h-9 text-xs rounded-lg bg-background'
                />
              </div>
              <Button
                size='sm'
                onClick={handleSearch}
                className='h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3.5 gap-1.5 cursor-pointer font-medium shadow-2xs'
              >
                <Search className='h-3.5 w-3.5' /> Search
              </Button>
            </div>

            {/* Quick Select: Account Owner */}
            {showOwnerFilter && (
              <div className='w-[140px]'>
                <Select
                  value={
                    filters.accountOwnerId.length === 1
                      ? filters.accountOwnerId[0].value
                      : 'all'
                  }
                  onValueChange={(val) => {
                    let updatedOwner: Option[] = [];
                    if (val !== 'all') {
                      const matched = owners.find(
                        (o: any) => o.id.toString() === val,
                      );
                      updatedOwner = [
                        {
                          value: val,
                          label: matched ? matched.full_name : val,
                        },
                      ];
                    }
                    const newFilters = {
                      ...filters,
                      accountOwnerId: updatedOwner,
                    };
                    setFilters(newFilters);
                    setAppliedFilters(newFilters);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className='h-9 text-xs rounded-lg bg-background'>
                    <SelectValue placeholder='All Owners' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Owners</SelectItem>
                    {owners.map((owner: any) => (
                      <SelectItem key={owner.id} value={owner.id.toString()}>
                        {owner.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Quick Select: Account Status */}
            <div className='w-[140px]'>
              <Select
                value={
                  filters.accountStatus.length === 1
                    ? filters.accountStatus[0].value
                    : 'all'
                }
                onValueChange={(val) => {
                  const updatedStatus =
                    val === 'all' ? [] : [{ value: val, label: val }];
                  const newFilters = {
                    ...filters,
                    accountStatus: updatedStatus,
                  };
                  setFilters(newFilters);
                  setAppliedFilters(newFilters);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className='h-9 text-xs rounded-lg bg-background'>
                  <SelectValue placeholder='All Statuses' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Statuses</SelectItem>
                  {ACCOUNT_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quick Select: Source */}
            <div className='w-[140px]'>
              <Select
                value={
                  filters.source.length === 1 ? filters.source[0].value : 'all'
                }
                onValueChange={(val) => {
                  const updatedSource =
                    val === 'all' ? [] : [{ value: val, label: val }];
                  const newFilters = { ...filters, source: updatedSource };
                  setFilters(newFilters);
                  setAppliedFilters(newFilters);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className='h-9 text-xs rounded-lg bg-background'>
                  <SelectValue placeholder='All Sources' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Sources</SelectItem>
                  {SOURCE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quick Select: Type of Business */}
            <div className='w-[140px]'>
              <Select
                value={
                  filters.typeOfBusiness.length === 1
                    ? filters.typeOfBusiness[0].value
                    : 'all'
                }
                onValueChange={(val) => {
                  if (val === 'all') {
                    handleFilterChange('typeOfBusiness', []);
                  } else {
                    handleFilterChange('typeOfBusiness', [
                      { value: val, label: val },
                    ]);
                  }
                }}
              >
                <SelectTrigger className='h-9 text-xs rounded-lg bg-background'>
                  <SelectValue placeholder='All Types' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Types</SelectItem>
                  {TYPE_OF_BUSINESS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filters Button (Opens Side Drawer) */}
            <Button
              variant='outline'
              onClick={() => setIsFilterSheetOpen(true)}
              className='h-9 text-xs gap-1.5 rounded-lg border-border font-medium cursor-pointer hover:bg-muted/50'
            >
              <SlidersHorizontal className='h-3.5 w-3.5 text-muted-foreground' />
              Filters
            </Button>

            {/* Clear Filters */}
            <Button
              variant='ghost'
              onClick={handleClear}
              className='h-9 text-xs text-blue-600 font-medium hover:bg-blue-50 hover:text-blue-700 cursor-pointer'
            >
              Clear
            </Button>
          </div>

          {/* Right Controls: Entries count & Columns button */}
          <div className='flex items-center gap-3'>
            {/* <div className='flex items-center gap-2 text-xs text-muted-foreground'>
              <span>Show</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(val) => setPageSize(Number(val))}
              >
                <SelectTrigger className='h-8 w-16 text-xs rounded-md bg-background px-2'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='10'>10</SelectItem>
                  <SelectItem value='25'>25</SelectItem>
                  <SelectItem value='50'>50</SelectItem>
                  <SelectItem value='100'>100</SelectItem>
                </SelectContent>
              </Select>
              <span>entries</span>
            </div> */}

            <ManageColumnsDialog
              columns={columns}
              onSave={savePreferences}
              onReset={resetToDefault}
            />
          </div>
        </div>

        {/* ── Main Data Table Card ── */}
        <div className='flex-1 bg-background rounded-xl border border-border/60 shadow-2xs overflow-hidden flex flex-col'>
          {/* Selected Rows Bulk Action Bar */}
          {selectedAccountIds.length > 0 && (
            <div className='flex items-center justify-between bg-blue-500/10 border-b border-blue-500/25 text-blue-600 dark:text-blue-400 px-5 py-2.5 shrink-0 text-xs font-medium'>
              <div className='flex items-center gap-2.5'>
                <div className='h-2 w-2 rounded-full bg-blue-500 animate-pulse' />
                <span className='font-semibold'>
                  {selectedAccountIds.length} selected
                </span>
                <span className='text-muted-foreground/60'>·</span>
                <span className='font-normal text-muted-foreground'>
                  {selectedAccountIds.length} task(s) will be created
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <Button
                  size='sm'
                  onClick={() =>
                    bulkCreateTasksMutation.mutate(selectedAccountIds)
                  }
                  disabled={bulkCreateTasksMutation.isPending}
                  className='h-7 text-xs px-3 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer gap-1.5'
                >
                  {bulkCreateTasksMutation.isPending ? (
                    <>
                      <Spinner className='h-3.5 w-3.5' />
                      Creating...
                    </>
                  ) : (
                    `Create Tasks (${selectedAccountIds.length})`
                  )}
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => setSelectedAccountIds([])}
                  className='h-7 text-xs px-2 cursor-pointer text-muted-foreground hover:text-foreground'
                >
                  Deselect All
                </Button>
              </div>
            </div>
          )}

          {/* Table Container */}
          <div className='flex-1 overflow-auto'>
            {isLoading ? (
              <div className='flex flex-col items-center justify-center h-64 gap-2 text-muted-foreground'>
                <Spinner className='h-7 w-7 text-blue-600' />
                <span className='text-xs font-medium'>Loading accounts...</span>
              </div>
            ) : (
              <Table>
                <TableHeader className='bg-slate-50/80 dark:bg-muted/30 sticky top-0 z-10 border-b border-border/60'>
                  <TableRow className='hover:bg-transparent'>
                    <TableHead className='w-[48px] px-4 text-center'>
                      <Checkbox
                        checked={
                          isAllOnPageSelected
                            ? true
                            : isSomeOnPageSelected
                              ? 'indeterminate'
                              : false
                        }
                        onCheckedChange={handleToggleSelectAll}
                        aria-label='Select all accounts'
                      />
                    </TableHead>
                    {visibleColumns.map((col: any) => (
                      <TableHead
                        key={col.id}
                        className='text-xs font-semibold text-muted-foreground tracking-wide py-3'
                      >
                        {col.label}
                      </TableHead>
                    ))}
                    <TableHead className='w-[48px] px-3' />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {accounts.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={visibleColumns.length + 2}
                        className='text-center h-36 text-muted-foreground text-sm'
                      >
                        No accounts found matching your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    accounts.map((acc: any) => {
                      const isSelected = selectedAccountIds.includes(acc.id);
                      const ownerName =
                        (users as Record<string, string>)[
                          acc.account_owner_id
                        ] ||
                        acc.account_owner ||
                        '—';
                      const initialColorClass = getInitialAvatarColor(
                        acc.account_name,
                      );
                      const statusStyle = getStatusBadgeStyle(
                        acc.account_status,
                      );

                      return (
                        <Fragment key={acc.id}>
                          <TableRow
                            className={`cursor-pointer transition-colors border-b border-border/40 ${
                            isSelected
                              ? 'bg-blue-50/60 dark:bg-blue-950/20'
                              : 'hover:bg-slate-50/80 dark:hover:bg-muted/30'
                          }`}
                          onClick={() => handleRowClick(acc.id)}
                        >
                          {/* Checkbox cell */}
                          <TableCell
                            className='w-[48px] px-4 text-center'
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() =>
                                handleToggleSelectRow(acc.id)
                              }
                              aria-label={`Select account ${acc.account_name}`}
                            />
                          </TableCell>

                          {/* Render Dynamic Visible Columns */}
                          {visibleColumns.map((col: any) => {
                            switch (col.id) {
                              case 'account_name':
                                return (
                                  <TableCell key={col.id} className='py-3.5'>
                                    <div className='flex items-center gap-3'>
                                      {/* Account Initial Avatar */}
                                      <div
                                        className={`h-8 w-8 rounded-full border ${initialColorClass} font-semibold text-xs flex items-center justify-center shrink-0 shadow-2xs`}
                                      >
                                        {acc.account_name
                                          ? acc.account_name
                                              .trim()
                                              .charAt(0)
                                              .toUpperCase()
                                          : 'A'}
                                      </div>
                                      <span className='font-semibold text-foreground text-xs hover:text-blue-600 transition-colors'>
                                        <HighlightedText
                                          text={acc.account_name}
                                          highlight={appliedFilters.accountName}
                                        />
                                      </span>
                                    </div>
                                  </TableCell>
                                );

                              case 'account_owner':
                                return (
                                  <TableCell key={col.id} className='py-3.5'>
                                    <div className='flex items-center gap-2.5'>
                                      <Avatar className='h-6 w-6 border border-border/60'>
                                        <AvatarFallback className='text-[10px] bg-slate-200 text-slate-700 font-semibold'>
                                          {ownerName !== '—'
                                            ? ownerName
                                                .split(' ')
                                                .map((n: string) => n[0])
                                                .slice(0, 2)
                                                .join('')
                                            : 'U'}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className='text-xs font-medium text-slate-700 dark:text-slate-200'>
                                        {ownerName}
                                      </span>
                                    </div>
                                  </TableCell>
                                );

                              case 'account_status':
                                return (
                                  <TableCell key={col.id} className='py-3.5'>
                                    {acc.account_status ? (
                                      <Badge
                                        variant='outline'
                                        className={`rounded-full px-3 py-1 text-[11px] font-medium border border-transparent shadow-2xs ${statusStyle}`}
                                      >
                                        {acc.account_status}
                                      </Badge>
                                    ) : (
                                      <span className='text-xs text-muted-foreground'>
                                        —
                                      </span>
                                    )}
                                  </TableCell>
                                );

                              case 'source':
                                return (
                                  <TableCell
                                    key={col.id}
                                    className='text-xs text-muted-foreground py-3.5'
                                  >
                                    {acc.source || '—'}
                                  </TableCell>
                                );

                              case 'type_of_business':
                                return (
                                  <TableCell
                                    key={col.id}
                                    className='text-xs text-slate-700 dark:text-slate-300 font-medium py-3.5'
                                  >
                                    {acc.type_of_business || '—'}
                                  </TableCell>
                                );

                              case 'industry':
                                return (
                                  <TableCell
                                    key={col.id}
                                    className='text-xs text-muted-foreground py-3.5'
                                  >
                                    {acc.industry || '—'}
                                  </TableCell>
                                );

                              case 'phone':
                                return (
                                  <TableCell
                                    key={col.id}
                                    className='text-xs text-slate-700 dark:text-slate-300 py-3.5'
                                  >
                                    <HighlightedText
                                      text={acc.phone}
                                      highlight={appliedFilters.phone}
                                    />
                                  </TableCell>
                                );

                              case 'city':
                                return (
                                  <TableCell
                                    key={col.id}
                                    className='text-xs text-muted-foreground py-3.5'
                                  >
                                    <HighlightedText
                                      text={acc.city}
                                      highlight={appliedFilters.city}
                                    />
                                  </TableCell>
                                );

                              case 'state':
                                return (
                                  <TableCell
                                    key={col.id}
                                    className='text-xs text-muted-foreground py-3.5'
                                  >
                                    <HighlightedText
                                      text={acc.state}
                                      highlight={appliedFilters.state}
                                    />
                                  </TableCell>
                                );

                              case 'business_status':
                                return (
                                  <TableCell
                                    key={col.id}
                                    className='text-xs text-muted-foreground py-3.5'
                                  >
                                    {acc.business_status || '—'}
                                  </TableCell>
                                );

                              case 'priority_account':
                                return (
                                  <TableCell
                                    key={col.id}
                                    className='text-xs text-muted-foreground py-3.5'
                                  >
                                    {acc?.is_priority_account || '—'}
                                  </TableCell>
                                );

                              case 'source_date':
                                return (
                                  <TableCell
                                    key={col.id}
                                    className='text-xs text-muted-foreground py-3.5'
                                  >
                                    {acc.source_date
                                      ? formatExactDate(
                                          acc.source_date,
                                          'dd MMM yyyy',
                                        )
                                      : '—'}
                                  </TableCell>
                                );

                              case 'assignment_date':
                                return (
                                  <TableCell
                                    key={col.id}
                                    className='text-xs text-muted-foreground py-3.5'
                                  >
                                    {acc.assignment_date
                                      ? formatExactDate(
                                          acc.assignment_date,
                                          'dd MMM yyyy',
                                        )
                                      : '—'}
                                  </TableCell>
                                );

                              case 'modified_time':
                                return (
                                  <TableCell
                                    key={col.id}
                                    className='text-xs text-muted-foreground py-3.5'
                                  >
                                    {acc.modified_time
                                      ? formatExactDate(
                                          acc.modified_time,
                                          'dd MMM yyyy',
                                        )
                                      : '—'}
                                  </TableCell>
                                );

                              default:
                                return <TableCell key={col.id} />;
                            }
                          })}

                          {/* Row Actions Menu */}
                          <TableCell
                            className='w-[48px] px-3 py-3.5 text-center'
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  className='h-7 w-7 rounded-md text-muted-foreground hover:text-foreground cursor-pointer'
                                >
                                  <MoreVertical className='h-4 w-4' />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align='end' className='w-40'>
                                <DropdownMenuItem
                                  onClick={() => handleRowClick(acc.id)}
                                  className='text-xs cursor-pointer gap-2'
                                >
                                  <ExternalLink className='h-3.5 w-3.5' /> View
                                  Details
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                        <TableRow
                          key={`${acc.id}-tracker`}
                          className="hover:bg-transparent border-b border-border/40 mt-none"
                        >
                          <TableCell
                            colSpan={visibleColumns.length + 2}
                            className="px-6 py-3 bg-muted/20"
                          >
                            {(() => {
                              const journey = acc.journey || acc.status_journey || [];

                              return (
                                <TooltipProvider>
                                  <div className="flex items-center gap-2 flex-wrap py-1 min-h-[40px]">
                                    {journey.length > 0 && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <button
                                            type="button"
                                            className="inline-flex items-center justify-center p-1 rounded-full bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 transition-colors mr-1 cursor-pointer"
                                            aria-label="Calculated Status grouping"
                                          >
                                            <Info className="w-3.5 h-3.5" />
                                          </button>
                                        </TooltipTrigger>

                                        <TooltipContent
                                          side="top"
                                          className="p-3 max-w-md bg-popover text-popover-foreground border shadow-md space-y-1.5"
                                        >
                                          <div className="flex items-center gap-1.5 font-bold text-xs text-foreground border-b pb-1">
                                            <Info className="w-3.5 h-3.5 text-amber-500" />
                                            Calculated Status Grouping
                                          </div>

                                          <div className="px-2.5 py-1.5 rounded bg-yellow-100 dark:bg-yellow-950/70 border border-yellow-300 dark:border-yellow-700 text-yellow-900 dark:text-yellow-200 font-mono text-xs font-semibold tracking-wide">
                                            {computeStageSummary(journey)}
                                          </div>

                                          <p className="text-[11px] text-muted-foreground leading-tight">
                                            Calculated grouping on which Status has taken how many
                                            days and how many times it got changed to same Status.
                                          </p>
                                        </TooltipContent>
                                      </Tooltip>
                                    )}

                                    {journey.length === 0 ? (
                                      <span className="text-xs text-muted-foreground italic">
                                        No status history recorded yet
                                      </span>
                                    ) : (
                                      journey.map((step: any, idx: number) => {
                                        const style =
                                          STATUS_COLOR_MAP[step.color] || STATUS_COLOR_MAP.blue;

                                        return (
                                          <div key={idx} className="flex items-center gap-2">
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <div
                                                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${style.bg} ${style.border} ${style.text} shadow-2xs font-medium text-xs cursor-pointer hover:scale-105 transition-transform`}
                                                >
                                                  <span
                                                    className={`w-2.5 h-2.5 rounded-full ${style.dot} flex-shrink-0`}
                                                  />

                                                  <span className="font-bold text-xs">
                                                    {step.name}
                                                  </span>

                                                  <span className="text-[11px] opacity-90 font-mono">
                                                    · {step.duration}
                                                  </span>
                                                </div>
                                              </TooltipTrigger>

                                              <TooltipContent
                                                side="top"
                                                className="text-xs space-y-1 p-2.5"
                                              >
                                                <p className="font-bold">
                                                  Status: {step.name}
                                                </p>

                                                <div className="text-[11px] space-y-0.5">
                                                  <p>
                                                    Duration spent:{' '}
                                                    <span className="font-semibold text-foreground">
                                                      {step.duration}
                                                    </span>
                                                  </p>

                                                  {step.startDate && (
                                                    <p>Started: {step.startDate}</p>
                                                  )}

                                                  {step.endDate && (
                                                    <p>Ended: {step.endDate}</p>
                                                  )}

                                                  {step.updatedBy && (
                                                    <p>Updated by: {step.updatedBy}</p>
                                                  )}
                                                </div>
                                              </TooltipContent>
                                            </Tooltip>

                                            {idx < journey.length - 1 && (
                                              <ArrowRight className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
                                            )}
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                </TooltipProvider>
                              );
                            })()}
                          </TableCell>
                        </TableRow>
                      </Fragment>
                    );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Table Bottom Pagination Bar */}
          <div className='px-5 py-3 border-t border-border/60 shrink-0 bg-background flex flex-col md:flex-row md:items-center justify-between gap-3'>
            <span className='text-xs text-muted-foreground font-medium'>
              Showing{' '}
              <span className='text-foreground font-semibold'>
                {accounts.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
              </span>{' '}
              to{' '}
              <span className='text-foreground font-semibold'>
                {Math.min(currentPage * pageSize, totalCount)}
              </span>{' '}
              of{' '}
              <span className='text-foreground font-semibold'>
                {totalCount.toLocaleString()}
              </span>{' '}
              accounts
            </span>

            <Pagination
              currentPage={pageInfo.page || currentPage}
              totalPages={pageInfo.total_pages || 1}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>

      {/* ── Advanced Filters Right Side Sheet Drawer ── */}
      <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
        <SheetContent
          side='right'
          className='w-full sm:w-[500px] sm:max-w-none p-0 flex flex-col gap-0 border-l shadow-2xl bg-background'
        >
          {/* Sheet Header */}
          <SheetHeader className='px-6 py-4 border-b border-border/60 flex flex-row items-center justify-between shrink-0 space-y-0'>
            <SheetTitle className='text-base font-bold text-foreground'>
              Filters
            </SheetTitle>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleClear}
              className='h-7 text-xs text-blue-600 font-medium hover:bg-blue-50 hover:text-blue-700 px-2'
            >
              Clear all
            </Button>
          </SheetHeader>

          {/* Sheet Body (Scrollable filter fields) */}
          <div className='flex-1 overflow-y-auto px-6 py-5 space-y-4'>
            {/* Account ID */}
            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold text-foreground'>
                Account ID
              </Label>
              <Input
                placeholder='Enter Account ID (e.g. 1001)...'
                value={filters.accountId}
                onChange={(e) => handleFilterChange('accountId', e.target.value)}
                className='h-9 text-xs font-mono rounded-lg'
              />
            </div>
            {/* Account Owner */}
            {showOwnerFilter && (
              <div className='space-y-1.5'>
                <Label className='text-xs font-semibold text-foreground'>
                  Account Owner
                </Label>
                <MultiSelect
                  options={owners.map((owner: any) => ({
                    label: owner.full_name,
                    value: owner.id.toString(),
                  }))}
                  value={filters.accountOwnerId}
                  onChange={(val) => handleFilterChange('accountOwnerId', val)}
                  placeholder='Select Owners...'
                />
              </div>
            )}

            {/* Account Status */}
            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold text-foreground'>
                Account Status
              </Label>
              <MultiSelect
                options={ACCOUNT_STATUS_OPTIONS}
                value={filters.accountStatus}
                onChange={(val) => handleFilterChange('accountStatus', val)}
                placeholder='Select Status...'
              />
            </div>

            {/* Dedicated Single Status & Period Filter */}
            <div className='p-3.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 space-y-3'>
              <div className='flex items-center gap-2'>
                <Clock className='w-4 h-4 text-blue-600 dark:text-blue-400' />
                <Label className='text-xs font-bold text-blue-900 dark:text-blue-200'>
                  Status History & Stay Duration Filter
                </Label>
              </div>

              <div className='space-y-1.5'>
                <Label className='text-[11px] font-medium text-muted-foreground'>
                  Select Single Status
                </Label>
                <Select
                  value={filters.statusFilterName || 'all'}
                  onValueChange={(val) => handleFilterChange('statusFilterName', val === 'all' ? '' : val)}
                >
                  <SelectTrigger className='h-8 text-xs bg-background'>
                    <SelectValue placeholder='Select a status...' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>None (All Statuses)</SelectItem>
                    {ACCOUNT_STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filters.statusFilterName && (
                <div className='space-y-2.5 pt-1 border-t border-blue-200/60 dark:border-blue-800/60'>
                  <div className='grid grid-cols-2 gap-2'>
                    <div className='space-y-1'>
                      <Label className='text-[10px] font-medium text-muted-foreground'>
                        From Date
                      </Label>
                      <DatePicker
                        value={filters.statusFromDate}
                        onChange={(val) => handleFilterChange('statusFromDate', val)}
                        placeholder='From Date'
                      />
                    </div>
                    <div className='space-y-1'>
                      <Label className='text-[10px] font-medium text-muted-foreground'>
                        To Date
                      </Label>
                      <DatePicker
                        value={filters.statusToDate}
                        onChange={(val) => handleFilterChange('statusToDate', val)}
                        placeholder='To Date'
                      />
                    </div>
                  </div>

                  <div className='space-y-1'>
                    <Label className='text-[10px] font-medium text-muted-foreground'>
                      Minimum Stay Period (Days)
                    </Label>
                    <Input
                      type='number'
                      min='0'
                      step='0.5'
                      placeholder='e.g. 5 (for 5+ days stay)'
                      value={filters.statusMinDays}
                      onChange={(e) => handleFilterChange('statusMinDays', e.target.value)}
                      className='h-8 text-xs bg-background'
                    />
                    <p className='text-[10px] text-muted-foreground mt-0.5'>
                      Filters accounts that stayed in status &ge; requested days.
                    </p>
                  </div>

                  {getStatusPeriodValidationError() && (
                    <p className='text-[11px] text-red-500 font-medium leading-tight bg-red-50 dark:bg-red-950/40 p-2 rounded-md border border-red-200 dark:border-red-900'>
                      ⚠️ {getStatusPeriodValidationError()}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Source */}
            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold text-foreground'>
                Source
              </Label>
              <MultiSelect
                options={SOURCE_OPTIONS}
                value={filters.source}
                onChange={(val) => handleFilterChange('source', val)}
                placeholder='Select Source...'
              />
            </div>

            {/* Type of Business */}
            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold text-foreground'>
                Type of Business
              </Label>
              <MultiSelect
                options={TYPE_OF_BUSINESS_OPTIONS}
                value={filters.typeOfBusiness}
                onChange={(val) => handleFilterChange('typeOfBusiness', val)}
                placeholder='Select Type of Business...'
              />
            </div>

            {/* Industry */}
            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold text-foreground'>
                Industry
              </Label>
              <MultiSelect
                options={INDUSTRY_OPTIONS}
                value={filters.industry}
                onChange={(val) => handleFilterChange('industry', val)}
                placeholder='Select Industry...'
              />
            </div>

            {/* City */}
            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold text-foreground'>
                City
              </Label>
              <Input
                placeholder='Select city...'
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                className='h-9 text-xs rounded-lg'
              />
            </div>

            {/* State */}
            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold text-foreground'>
                State
              </Label>
              <Input
                placeholder='Select state...'
                value={filters.state}
                onChange={(e) => handleFilterChange('state', e.target.value)}
                className='h-9 text-xs rounded-lg'
              />
            </div>

            {/* Phone */}
            <div className='space-y-1.5'>
              <Label className='text-xs font-semibold text-foreground'>
                Phone
              </Label>
              <Input
                placeholder='Enter phone number...'
                value={filters.phone}
                onChange={(e) => handleFilterChange('phone', e.target.value)}
                className='h-9 text-xs rounded-lg'
              />
            </div>

            {/* Created Date Section */}
            <div className='space-y-2 pt-2 border-t border-border/60'>
              <Label className='text-xs font-semibold text-foreground block'>
                Created Date
              </Label>
              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <Label className='text-[11px] text-muted-foreground'>
                    From
                  </Label>
                  <DatePicker
                    value={filters.createdFromDate}
                    onChange={(val) => handleFilterChange('createdFromDate', val)}
                    placeholder='From Date'
                  />
                </div>
                <div>
                  <Label className='text-[11px] text-muted-foreground'>
                    To
                  </Label>
                  <DatePicker
                    value={filters.createdToDate}
                    onChange={(val) => handleFilterChange('createdToDate', val)}
                    placeholder='To Date'
                  />
                </div>
              </div>
            </div>

            {/* Account Assignment Date Section */}
            <div className='space-y-2 pt-2 border-t border-border/60'>
              <Label className='text-xs font-semibold text-foreground block'>
                Account Assignment Date
              </Label>
              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <Label className='text-[11px] text-muted-foreground'>
                    From
                  </Label>
                  <DatePicker
                    value={filters.assignmentFromDate}
                    onChange={(val) => handleFilterChange('assignmentFromDate', val)}
                    placeholder='From Date'
                  />
                </div>
                <div>
                  <Label className='text-[11px] text-muted-foreground'>
                    To
                  </Label>
                  <DatePicker
                    value={filters.assignmentToDate}
                    onChange={(val) => handleFilterChange('assignmentToDate', val)}
                    placeholder='To Date'
                  />
                </div>
              </div>
            </div>

            {/* Last Updated Note Date Section */}
            <div className='space-y-2 pt-2 border-t border-border/60'>
              <Label className='text-xs font-semibold text-foreground block'>
                Last Updated Note Date
              </Label>
              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <Label className='text-[11px] text-muted-foreground'>
                    From
                  </Label>
                  <DatePicker
                    value={filters.noteFromDate}
                    onChange={(val) => handleFilterChange('noteFromDate', val)}
                    placeholder='From Date'
                  />
                </div>
                <div>
                  <Label className='text-[11px] text-muted-foreground'>
                    To
                  </Label>
                  <DatePicker
                    value={filters.noteToDate}
                    onChange={(val) => handleFilterChange('noteToDate', val)}
                    placeholder='To Date'
                  />
                </div>
              </div>
            </div>

            {/* Advanced Call Back Date & Time Filter Section */}
            <div className='space-y-3 p-3 bg-muted/30 rounded-xl border border-border/60'>
              <Label className='font-semibold text-xs text-foreground block border-b pb-1'>
                Call Back Date / Time Filter
              </Label>

              <div className='space-y-1.5'>
                <Label className='text-[11px] text-muted-foreground'>
                  Logical Condition
                </Label>
                <Select
                  value={filters.cbCondition}
                  onValueChange={(val) =>
                    handleFilterChange('cbCondition', val)
                  }
                >
                  <SelectTrigger className='h-8 text-xs bg-background rounded-md'>
                    <SelectValue placeholder='Condition' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Is'>Is (Matches)</SelectItem>
                    <SelectItem value='Not'>Not (Negates)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-1.5'>
                <Label className='text-[11px] text-muted-foreground'>
                  Field Condition
                </Label>
                <Select
                  value={filters.cbDateCondition}
                  onValueChange={(val) =>
                    handleFilterChange('cbDateCondition', val)
                  }
                >
                  <SelectTrigger className='h-8 text-xs bg-background rounded-md'>
                    <SelectValue placeholder='Select Condition' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Date Conditions</SelectItem>
                    <SelectItem value='Blank'>Blank</SelectItem>
                    <SelectItem value='Overdue'>Overdue</SelectItem>
                    <SelectItem value='Due Today'>Due Today</SelectItem>
                    <SelectItem value='Due Tomorrow'>Due Tomorrow</SelectItem>
                    <SelectItem value='Due This Week'>Due This Week</SelectItem>
                    <SelectItem value='Due Next Week'>Due Next Week</SelectItem>
                    <SelectItem value='Due Dates'>Due Dates</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-1.5 pt-1 border-t border-border/40'>
                <Label className='text-[11px] text-muted-foreground'>
                  Call Back Date Range (From / To)
                </Label>
                <div className='grid grid-cols-2 gap-2'>
                  <DatePicker
                    value={filters.cbFromDate}
                    onChange={(val) => handleFilterChange('cbFromDate', val)}
                    placeholder='From Date'
                  />
                  <DatePicker
                    value={filters.cbToDate}
                    onChange={(val) => handleFilterChange('cbToDate', val)}
                    placeholder='To Date'
                  />
                </div>
              </div>
            </div>

            {/* Module Filters (BSA, GST, CIBIL, ITR) */}
            <div className='space-y-3 pt-2 border-t border-border/60'>
              <Label className='text-xs font-semibold text-foreground block'>
                Underwriting Module Filters
              </Label>

              {/* BSA Filter */}
              <div className='space-y-2 bg-muted/20 p-3 rounded-lg border border-border/50'>
                <Label className='text-[11px] font-medium text-muted-foreground block'>
                  BSA Filter (Month)
                </Label>
                <div className='grid grid-cols-2 gap-2'>
                  <Input
                    type='month'
                    value={filters.bsaFromDate}
                    onChange={(e) =>
                      handleFilterChange('bsaFromDate', e.target.value)
                    }
                    className='h-8 text-xs bg-background'
                  />
                  <Input
                    type='month'
                    value={filters.bsaToDate}
                    onChange={(e) =>
                      handleFilterChange('bsaToDate', e.target.value)
                    }
                    className='h-8 text-xs bg-background'
                  />
                </div>
              </div>

              {/* GST Filter */}
              <div className='space-y-2 bg-muted/20 p-3 rounded-lg border border-border/50'>
                <Label className='text-[11px] font-medium text-muted-foreground block'>
                  GST Filter (Month)
                </Label>
                <div className='grid grid-cols-2 gap-2'>
                  <Input
                    type='month'
                    value={filters.gstFromDate}
                    onChange={(e) =>
                      handleFilterChange('gstFromDate', e.target.value)
                    }
                    className='h-8 text-xs bg-background'
                  />
                  <Input
                    type='month'
                    value={filters.gstToDate}
                    onChange={(e) =>
                      handleFilterChange('gstToDate', e.target.value)
                    }
                    className='h-8 text-xs bg-background'
                  />
                </div>
              </div>

              {/* CIBIL Filter */}
              <div className='space-y-2 bg-muted/20 p-3 rounded-lg border border-border/50'>
                <Label className='text-[11px] font-medium text-muted-foreground block'>
                  CIBIL Filter (Month)
                </Label>
                <div className='grid grid-cols-2 gap-2'>
                  <Input
                    type='month'
                    value={filters.cibilFromDate}
                    onChange={(e) =>
                      handleFilterChange('cibilFromDate', e.target.value)
                    }
                    className='h-8 text-xs bg-background'
                  />
                  <Input
                    type='month'
                    value={filters.cibilToDate}
                    onChange={(e) =>
                      handleFilterChange('cibilToDate', e.target.value)
                    }
                    className='h-8 text-xs bg-background'
                  />
                </div>
              </div>

              {/* ITR Filter (Year) */}
              <div className='space-y-2 bg-muted/20 p-3 rounded-lg border border-border/50'>
                <Label className='text-[11px] font-medium text-muted-foreground block'>
                  ITR Filter (Year)
                </Label>
                <div className='grid grid-cols-2 gap-2'>
                  <Input
                    type='number'
                    min='2000'
                    max='2100'
                    placeholder='From Year (YYYY)'
                    value={filters.itrFromDate}
                    onChange={(e) =>
                      handleFilterChange('itrFromDate', e.target.value)
                    }
                    className='h-8 text-xs bg-background'
                  />
                  <Input
                    type='number'
                    min='2000'
                    max='2100'
                    placeholder='To Year (YYYY)'
                    value={filters.itrToDate}
                    onChange={(e) =>
                      handleFilterChange('itrToDate', e.target.value)
                    }
                    className='h-8 text-xs bg-background'
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sheet Footer */}
          <SheetFooter className='p-4 border-t border-border/60 flex flex-row items-center justify-end gap-2 bg-slate-50/50 dark:bg-muted/20 shrink-0'>
            <Button
              variant='outline'
              onClick={() => setIsFilterSheetOpen(false)}
              className='h-9 text-xs rounded-lg px-4 cursor-pointer'
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (handleSearch() !== false) {
                  setIsFilterSheetOpen(false);
                }
              }}
              className='h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 font-semibold cursor-pointer shadow-sm'
            >
              Apply Filters
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
