import React, { useState, useMemo } from 'react';
import {
  PhoneOutgoing,
  PhoneIncoming,
  PhoneMissed,
  Volume2,
  ExternalLink,
  Info,
  Calendar,
  Sparkles,
  Pin,
  Phone,
  Copy,
  Check,
  Search,
  Clock,
  Activity,
  User,
  Hash,
  BarChart3,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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

// Custom SIM card icon matching the reference design
function SimCardIcon({
  className = 'size-4 text-muted-foreground',
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.75'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={className}
    >
      <path d='M8 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6l4-4z' />
      <rect x='7.5' y='10' width='9' height='8' rx='1' strokeWidth='1.5' />
      <path d='M7.5 14h9' strokeWidth='1.2' />
      <path d='M12 10v8' strokeWidth='1.2' />
    </svg>
  );
}

// Payload structure received from TeleCRM backend / MongoDB
export interface TeleCRMPayload {
  id?: string;
  telecrm_lead_id?: string;
  telecrm_url?: string;
  phone?: string;
  lead_phone?: string;
  status?: string;
  employeeid?: string;
  rating?: number;
  score?: number;
  createdBy?: string;
  modifiedBy?: string;
  last_call?: string | number;
  creation_timestamp?: string;
  call_recording_url?: string;
  call_recording?: string;
  fields?: Record<string, any>;
  data?: any;
  raw?: any;
  lead_data?: any;
  actions?: any[];
  leads?: {
    name?: string;
    profession?: string;
    total_turnover?: string;
    monthly_income?: string;
    loan_amount_required?: string;
    lead_source?: string;
    email?: string;
    customer_location?: string;
    created_on?: string;
    modified_on?: string;
    company_or_business_name?: string;
    alternate_phone?: string;
    lost_reason_id?: string;
    assignee_phone_number?: string;
    assignee_email?: string;
    lead_id?: string;
    lead_assignee_manager_email?: string;
    lead_assignee_manager?: string;
    lead_assignee?: string;
    status?: string;
    callback_date_time?: string;
  };
  call_action?: {
    creation_timestamp?: string;
    raw_timestamp?: string | number;
    call_recording_url?: string;
    feedback?: string;
    duration?: string | number;
    actor_employee_email?: string;
    type?: string;
  };
  caller_desk_incoming_call?: {
    call_recording_url?: string;
    customer_number?: string;
    virtual_number?: string;
    duration?: string | number;
    status?: string;
    actor_employee_email?: string;
  };
  ivr_call?: {
    creation_timestamp?: string;
    customer_number?: string;
    virtual_number?: string;
    duration?: string | number;
    direction?: string;
  };
  is_pinned?: boolean;
  has_ai_notes?: boolean;
  relative_time?: string;
}

// Helper to check if a value represents a Unix Epoch Milliseconds timestamp
export function isUnixEpochMs(val: any, keyName?: string): boolean {
  if (val === null || val === undefined) return false;
  let numVal: number | null = null;
  if (typeof val === 'number') {
    numVal = val;
  } else if (typeof val === 'string' && /^\d+$/.test(val.trim())) {
    numVal = Number(val.trim());
  } else if (typeof val === 'object' && val?.$numberLong) {
    numVal = Number(val.$numberLong);
  }

  if (numVal !== null) {
    // 13-digit Unix ms epoch (covers years ~1973 to ~2286, e.g. 1789730733627)
    if (numVal > 1e11 && numVal < 1e14) return true;
    // 10-digit Unix seconds epoch for explicit date/time keys
    if (
      numVal > 1e9 &&
      numVal < 4e9 &&
      keyName &&
      /(_on|_at|timestamp|date|time|_call)/i.test(keyName)
    ) {
      return true;
    }
  }
  return false;
}

// Convert Unix ms timestamp (or numeric/ISO string) into readable IST format: "09 Sep 2026, 04:55 PM"
export function formatUnixMsToReadable(val: any): string {
  if (val === null || val === undefined || val === '') return '—';
  let millis: number | null = null;
  if (typeof val === 'number') {
    millis = val > 1e11 ? val : val * 1000;
  } else if (typeof val === 'string' && /^\d+$/.test(val.trim())) {
    const num = Number(val.trim());
    millis = num > 1e11 ? num : num * 1000;
  } else if (typeof val === 'object' && val?.$numberLong) {
    const num = Number(val.$numberLong);
    millis = num > 1e11 ? num : num * 1000;
  } else if (typeof val === 'string') {
    const parsed = Date.parse(val);
    if (!isNaN(parsed)) millis = parsed;
  }

  if (millis === null || isNaN(millis)) return String(val);

  try {
    const date = new Date(millis);
    const datePart = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);

    const timePart = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);

    return `${datePart}, ${timePart}`;
  } catch {
    return String(val);
  }
}

// Helper to format any timestamp to IST compact format: "4:52 PM Fri, 18 Sep 26"
export function formatTimestampIST(timestamp?: string | number | null): string {
  if (!timestamp) return '';
  const str = String(timestamp).trim();
  if (/(?:AM|PM)/i.test(str) && /[A-Za-z]{3}/.test(str)) {
    return str;
  }
  try {
    let millis: number | null = null;
    if (typeof timestamp === 'number') {
      millis = timestamp > 1e11 ? timestamp : timestamp * 1000;
    } else if (/^\d+$/.test(str)) {
      const num = Number(str);
      millis = num > 1e11 ? num : num * 1000;
    } else {
      const parsed = Date.parse(str);
      if (!isNaN(parsed)) millis = parsed;
    }

    if (millis === null || isNaN(millis)) return str;

    const date = new Date(millis);
    const timeStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);

    const weekdayStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
    }).format(date);

    const dayStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
    }).format(date);

    const monthStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
    }).format(date);

    const yearStr = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      year: '2-digit',
    }).format(date);

    return `${timeStr} ${weekdayStr}, ${dayStr} ${monthStr} ${yearStr}`;
  } catch {
    return str;
  }
}

// Convert call duration: if >= 60 seconds, convert into minutes (e.g. 1285s -> 21m 25s, 60s -> 1m, 45s -> 45s)
export function formatDuration(duration?: string | number | null): string {
  if (duration === undefined || duration === null || duration === '')
    return '0s';
  const str = String(duration).trim();

  // If already formatted with 'm' or 'h' (e.g. "11m 15s" or "2h 5m"), keep as is
  if (/[a-zA-Z]/.test(str) && (str.includes('m') || str.includes('h'))) {
    return str;
  }

  // Extract raw seconds number
  const match = str.match(/(\d+)/);
  if (!match) return str;
  const totalSec = parseInt(match[1], 10);
  if (isNaN(totalSec)) return str;

  if (totalSec >= 60) {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  return `${totalSec}s`;
}

// Convert field key into clean display title
export function formatFieldLabel(key: string): string {
  if (!key) return '';
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\(%\)/g, '(%)')
    .replace(/\(ltv\)/i, '(LTV)')
    .replace(/id\b/i, 'ID')
    .trim();
}

// Format any field value with duration and timestamp conversion
export function formatFieldValue(key: string, value: any): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  if (/(?:phone|mobile|contact)/i.test(key)) {
    return String(value);
  }

  // Handle MongoDB NumberLong / NumberInt objects
  let cleanVal = value;
  if (typeof value === 'object') {
    if (value.$numberLong !== undefined) cleanVal = value.$numberLong;
    else if (value.$numberInt !== undefined) cleanVal = value.$numberInt;
  }

  // Duration fields: convert to minutes if >= 60
  if (/(?:total_call_duration|^call_duration$|^duration$)/i.test(key)) {
    return formatDuration(cleanVal);
  }

  // Percentage / Rate fields
  if (
    key.includes('(%)') ||
    key.includes('rate') ||
    key.includes('percentage')
  ) {
    const s = String(cleanVal).trim();
    return s.endsWith('%') ? s : `${s}%`;
  }

  // Unix Epoch Milliseconds timestamps
  if (isUnixEpochMs(cleanVal, key)) {
    return formatUnixMsToReadable(cleanVal);
  }

  if (typeof cleanVal === 'boolean') {
    return cleanVal ? 'Yes' : 'No';
  }

  return String(cleanVal);
}

// Helper to normalize call direction
export function normalizeCallType(
  raw?: string,
): 'incoming' | 'outgoing' | 'missed' {
  const t = String(raw || '')
    .toLowerCase()
    .trim();
  if (t.includes('miss')) return 'missed';
  if (t.includes('out') || t.includes('dial')) return 'outgoing';
  if (t.includes('in') || t.includes('received')) return 'incoming';
  return 'outgoing';
}

// Helper to calculate relative time (e.g. 1d, 3d, 2h)
export function formatRelativeTime(timestamp?: string | number | null): string {
  if (!timestamp) return '';
  let millis: number | null = null;
  if (typeof timestamp === 'number') {
    millis = timestamp > 1e11 ? timestamp : timestamp * 1000;
  } else if (/^\d+$/.test(String(timestamp).trim())) {
    const num = Number(timestamp);
    millis = num > 1e11 ? num : num * 1000;
  } else {
    const parsed = Date.parse(String(timestamp));
    if (!isNaN(parsed)) millis = parsed;
  }
  if (!millis) return '';
  const diffSec = Math.floor((Date.now() - millis) / 1000);
  if (diffSec < 0) return 'Just now';
  if (diffSec < 60) return `${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo`;
  return `${Math.floor(diffMonths / 12)}y`;
}

// Helper to extract initials from employee email or name
function getInitials(emailOrName?: string): string {
  if (!emailOrName) return 'TC';
  const clean = emailOrName.split('@')[0].replace(/[._-]/g, ' ').trim();
  const parts = clean.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

// Get badge color according to lead status
function getLeadStatusColor(status?: string): string {
  const s = (status || '').toLowerCase();
  if (
    s.includes('connected') ||
    s.includes('interested') ||
    s.includes('won')
  ) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800';
  }
  if (s.includes('progress') || s.includes('follow') || s.includes('warm')) {
    return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800';
  }
  if (s.includes('lost') || s.includes('cancelled') || s.includes('missed')) {
    return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800';
  }
  if (s.includes('yet') || s.includes('dial') || s.includes('new')) {
    return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700';
  }
  return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800';
}

interface TeleCRMActivityHistoryProps {
  leadPhone?: string;
  leadStatus?: string;
  activities?: TeleCRMPayload[] | any[];
}

export default function TeleCRMActivityHistory({
  leadPhone,
  leadStatus,
  activities,
}: TeleCRMActivityHistoryProps) {
  const dataList: any[] = Array.isArray(activities) ? activities : [];

  const [copiedPhone, setCopiedPhone] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TeleCRMPayload | null>(null);
  const [fieldSearch, setFieldSearch] = useState('');

  // Primary source item from activities
  const primaryItem = dataList[0] || {};
  const primaryLead = primaryItem?.leads;

  // Extract all TeleCRM fields dictionary
  const fieldsData: Record<string, any> = useMemo(() => {
    return (
      primaryItem?.fields ||
      primaryItem?.lead_data?.fields ||
      primaryItem?.raw?.fields ||
      primaryItem?.data?.fields ||
      {}
    );
  }, [primaryItem]);

  // Extract metadata properties
  const displayPhone =
    leadPhone ||
    fieldsData?.phone ||
    primaryLead?.alternate_phone ||
    primaryItem?.phone ||
    primaryItem?.lead_phone ||
    '';

  const telecrmStatus =
    fieldsData?.status ||
    primaryItem?.status ||
    primaryItem?.lead_data?.status ||
    primaryItem?.raw?.status ||
    primaryLead?.status ||
    '';

  const leadName =
    fieldsData?.name || primaryLead?.name || primaryItem?.lead_data?.name || '';

  const leadSource =
    fieldsData?.lead_source ||
    primaryLead?.lead_source ||
    primaryItem?.lead_data?.lead_source ||
    '';

  const employeeId =
    primaryItem?.employeeid ||
    primaryItem?.lead_data?.employeeid ||
    primaryItem?.raw?.employeeid ||
    primaryItem?.actor_employee_email ||
    primaryLead?.assignee_email ||
    '';

  const displayCallback =
    fieldsData?.callback_date_time ||
    primaryLead?.callback_date_time ||
    primaryItem?.call_back_date_time ||
    null;

  // TeleCRM Lead ID and direct link
  const leadOverlayId =
    primaryItem?.telecrm_lead_id ||
    primaryItem?.lead_data?.id ||
    primaryItem?.raw?.id ||
    primaryItem?.data?.id ||
    (primaryItem?.id && String(primaryItem.id).length === 24
      ? primaryItem.id
      : undefined);

  const headerTelecrmUrl =
    primaryItem?.telecrm_url ||
    (leadOverlayId
      ? `https://next.telecrm.in/6a8c537f3aeed414e38866a5/views/all-leads-v2/overlay/l/${leadOverlayId}`
      : undefined);

  // Key KPI metrics from fields
  const totalCalls =
    fieldsData?.calls_count ??
    (dataList.length > 0 ? dataList.length : undefined);
  const connectedCalls = fieldsData?.connected_call_count;
  const connectionRate = fieldsData?.['call_connection_rate_(%)'];
  const totalDuration = fieldsData?.total_call_duration;
  const lastActivityType =
    fieldsData?.last_activity_type || fieldsData?.last_outgoing_activity_type;
  const lastActivityOn =
    fieldsData?.last_activity_on || fieldsData?.last_outgoing_activity_on;

  // Build complete list of all fields with same naming
  const allFieldsList = useMemo(() => {
    const list: {
      key: string;
      label: string;
      rawValue: any;
      formattedValue: string;
    }[] = [];

    // Include top-level metadata if present
    if (primaryItem?.id || leadOverlayId) {
      const idVal = leadOverlayId || primaryItem?.id;
      list.push({
        key: 'id',
        label: 'Lead ID',
        rawValue: idVal,
        formattedValue: String(idVal),
      });
    }
    if (employeeId) {
      list.push({
        key: 'employeeid',
        label: 'Employee ID',
        rawValue: employeeId,
        formattedValue: String(employeeId),
      });
    }
    if (telecrmStatus) {
      list.push({
        key: 'status',
        label: 'Status',
        rawValue: telecrmStatus,
        formattedValue: String(telecrmStatus),
      });
    }
    if (
      primaryItem?.rating !== undefined ||
      primaryItem?.raw?.rating !== undefined
    ) {
      const r = primaryItem?.rating ?? primaryItem?.raw?.rating ?? 0;
      list.push({
        key: 'rating',
        label: 'Rating',
        rawValue: r,
        formattedValue: String(r),
      });
    }
    if (
      primaryItem?.score !== undefined ||
      primaryItem?.raw?.score !== undefined
    ) {
      const sc = primaryItem?.score ?? primaryItem?.raw?.score ?? 0;
      list.push({
        key: 'score',
        label: 'Score',
        rawValue: sc,
        formattedValue: String(sc),
      });
    }

    // Add all key-values from fields object
    Object.entries(fieldsData).forEach(([k, val]) => {
      list.push({
        key: k,
        label: formatFieldLabel(k),
        rawValue: val,
        formattedValue: formatFieldValue(k, val),
      });
    });

    return list;
  }, [fieldsData, primaryItem, leadOverlayId, employeeId, telecrmStatus]);

  // Filtered fields based on search input
  const filteredFields = useMemo(() => {
    if (!fieldSearch.trim()) return allFieldsList;
    const q = fieldSearch.toLowerCase().trim();
    return allFieldsList.filter(
      (f) =>
        f.key.toLowerCase().includes(q) ||
        f.label.toLowerCase().includes(q) ||
        f.formattedValue.toLowerCase().includes(q),
    );
  }, [allFieldsList, fieldSearch]);

  const handleCopyPhone = () => {
    if (displayPhone) {
      navigator.clipboard.writeText(displayPhone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const handleOpenRecording = (e: React.MouseEvent, url?: string) => {
    e.stopPropagation();
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Determine individual call records: filter buttons are removed, display all activities directly
  const callRecords = dataList;

  return (
    <TooltipProvider delayDuration={150}>
      <div className='rounded-lg border bg-card text-card-foreground shadow-xs overflow-hidden'>
        {/* ================= Header Summary Bar ================= */}
        <div className='p-4 border-b bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-4'>
          <div className='flex flex-wrap items-center gap-3'>
            {/* Phone number display with copy button */}
            {displayPhone && (
              <div className='flex items-center gap-2 bg-background border px-3 py-1.5 rounded-md text-sm font-medium'>
                <Phone className='size-3.5 text-muted-foreground' />
                <span className='font-semibold text-foreground tracking-wide'>
                  {displayPhone}
                </span>
                <button
                  type='button'
                  onClick={handleCopyPhone}
                  title='Copy Phone Number'
                  className='text-muted-foreground hover:text-foreground transition-colors p-0.5 cursor-pointer'
                >
                  {copiedPhone ? (
                    <Check className='size-3.5 text-emerald-600' />
                  ) : (
                    <Copy className='size-3.5' />
                  )}
                </button>
              </div>
            )}

            {/* Lead Name Badge if present */}
            {leadName && (
              <div className='flex items-center gap-1 bg-background border px-2.5 py-1 rounded-md text-xs font-semibold text-foreground'>
                <span>{leadName}</span>
              </div>
            )}

            {/* Lead Status Badge */}
            {telecrmStatus && (
              <div className='flex items-center gap-1.5'>
                <span className='text-xs text-muted-foreground font-medium'>
                  Status:
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getLeadStatusColor(
                    telecrmStatus,
                  )}`}
                >
                  {telecrmStatus}
                </span>
              </div>
            )}

            {/* Lead Source Badge */}
            {leadSource && (
              <div className='flex items-center gap-1.5 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-md text-xs text-sky-700 dark:text-sky-400 font-medium'>
                <span>Source:</span>
                <span className='font-semibold'>{leadSource}</span>
              </div>
            )}

            {/* Callback Date & Time */}
            {displayCallback && (
              <div className='flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md text-xs text-amber-700 dark:text-amber-400'>
                <Calendar className='size-3.5 text-amber-600 dark:text-amber-400' />
                <span className='font-medium'>Callback:</span>
                <span>{displayCallback}</span>
              </div>
            )}

            {/* Direct Link to TeleCRM & Info Details Button */}
            <div className='flex items-center gap-2'>
              {headerTelecrmUrl && (
                <a
                  href={headerTelecrmUrl}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium'
                >
                  <span>Open Lead in TeleCRM</span>
                  <ExternalLink className='size-3' />
                </a>
              )}

              {/* Info details toggle to open dialog */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type='button'
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedItem(primaryItem || {});
                    }}
                    className='text-muted-foreground/60 hover:text-foreground transition-colors p-0.5 cursor-pointer'
                  >
                    <Info className='size-3.5' />
                  </button>
                </TooltipTrigger>
                <TooltipContent side='top'>
                  View full payload details
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* ================= Top KPI Summary Cards ================= */}
        {allFieldsList.length > 0 && (
          <div className='p-4 border-b bg-muted/5 grid grid-cols-2 sm:grid-cols-4 gap-3'>
            {/* Total Calls Card */}
            <div className='bg-background border rounded-lg p-3 shadow-2xs space-y-1'>
              <div className='flex items-center justify-between text-xs text-muted-foreground'>
                <span className='font-medium'>Calls Count</span>
                <Phone className='size-3.5 text-emerald-600' />
              </div>
              <div className='text-xl font-bold text-foreground'>
                {totalCalls !== undefined ? totalCalls : '—'}
              </div>
              {connectedCalls !== undefined && (
                <div className='text-[11px] text-muted-foreground flex items-center gap-1.5 pt-0.5'>
                  <span>
                    Connected:{' '}
                    <strong className='text-foreground'>
                      {connectedCalls}
                    </strong>
                  </span>
                  {connectionRate !== undefined && (
                    <span className='text-emerald-600 font-semibold'>
                      ({connectionRate}%)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Total Call Duration Card (converted to minutes if >= 60s) */}
            <div className='bg-background border rounded-lg p-3 shadow-2xs space-y-1'>
              <div className='flex items-center justify-between text-xs text-muted-foreground'>
                <span className='font-medium'>Total Duration</span>
                <Clock className='size-3.5 text-sky-600' />
              </div>
              <div className='text-xl font-bold text-foreground'>
                {totalDuration !== undefined
                  ? formatDuration(totalDuration)
                  : '0s'}
              </div>
              <div className='text-[11px] text-muted-foreground'>
                {totalDuration && Number(totalDuration) >= 60
                  ? `Raw: ${totalDuration}s`
                  : 'Call Time'}
              </div>
            </div>

            {/* Last Activity Card */}
            <div className='bg-background border rounded-lg p-3 shadow-2xs space-y-1'>
              <div className='flex items-center justify-between text-xs text-muted-foreground'>
                <span className='font-medium'>Last Activity</span>
                <Activity className='size-3.5 text-purple-600' />
              </div>
              <div
                className='text-sm font-semibold text-foreground truncate'
                title={String(lastActivityType || '—')}
              >
                {lastActivityType || '—'}
              </div>
              <div className='text-[11px] text-muted-foreground truncate'>
                {lastActivityOn
                  ? formatUnixMsToReadable(lastActivityOn)
                  : 'No activity logged'}
              </div>
            </div>

            {/* TeleCRM Agent / Assigned Employee Card */}
            <div className='bg-background border rounded-lg p-3 shadow-2xs space-y-1'>
              <div className='flex items-center justify-between text-xs text-muted-foreground'>
                <span className='font-medium'>Employee</span>
                <User className='size-3.5 text-amber-600' />
              </div>
              <div
                className='text-xs font-semibold text-foreground truncate'
                title={employeeId || '—'}
              >
                {employeeId || '—'}
              </div>
              <div className='text-[11px] text-muted-foreground'>
                Lead Assignee
              </div>
            </div>
          </div>
        )}

        {/* ================= Details Dialog (Full Payload View) ================= */}
        <Dialog
          open={!!selectedItem}
          onOpenChange={(open) => !open && setSelectedItem(null)}
        >
          <DialogContent className='w-1/2 min-w-[700px] max-h-[85vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2 text-base font-semibold'>
                <span>TeleCRM Activity Details</span>
                {telecrmStatus && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${getLeadStatusColor(
                      telecrmStatus,
                    )}`}
                  >
                    {telecrmStatus}
                  </span>
                )}
              </DialogTitle>
            </DialogHeader>

            {selectedItem && (
              <div className='space-y-4 py-2 text-sm'>
                {/* Call Overview Card */}
                <div className='bg-muted/40 p-3 rounded-lg border space-y-2'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <div className='text-lg font-semibold text-foreground tracking-wide text-green-400'>
                        Total Call Duration:
                      </div>
                      <span className='text-lg'>
                        (
                        {formatDuration(
                          selectedItem.call_action?.duration ||
                            fieldsData?.total_call_duration ||
                            '0s',
                        )}
                        )
                      </span>
                    </div>

                    {(selectedItem.telecrm_url ||
                      selectedItem.call_action?.call_recording_url ||
                      selectedItem.caller_desk_incoming_call
                        ?.call_recording_url ||
                      headerTelecrmUrl) && (
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={(e) =>
                          handleOpenRecording(
                            e,
                            selectedItem.telecrm_url ||
                              selectedItem.call_action?.call_recording_url ||
                              selectedItem.caller_desk_incoming_call
                                ?.call_recording_url ||
                              headerTelecrmUrl,
                          )
                        }
                        className='h-7 text-xs flex items-center gap-1.5'
                      >
                        <Volume2 className='size-3.5' />
                        <span>Open in TeleCRM</span>
                        <ExternalLink className='size-3' />
                      </Button>
                    )}
                  </div>

                  <div className='grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-xs border-t'>
                    <div>
                      <span className='text-muted-foreground block'>
                        Last Call:
                      </span>
                      <span className='font-medium'>
                        {formatTimestampIST(
                          selectedItem.call_action?.creation_timestamp ||
                            selectedItem.call_action?.raw_timestamp ||
                            fieldsData?.last_call,
                        ) || '—'}
                      </span>
                    </div>
                    <div>
                      <span className='text-muted-foreground block'>
                        Last Call Activity:
                      </span>
                      <span className='font-medium italic'>
                        {selectedItem.call_action?.feedback ||
                          selectedItem.status ||
                          fieldsData?.last_activity_type ||
                          '—'}
                      </span>
                    </div>
                    <div>
                      <span className='text-muted-foreground block'>
                        Employee ID:
                      </span>
                      <span className='font-medium'>
                        {selectedItem.call_action?.actor_employee_email ||
                          employeeId ||
                          '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* All Lead Fields Breakdown */}
                <div className='border rounded-lg p-3 space-y-2'>
                  <h4 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                    All TeleCRM Fields
                  </h4>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs'>
                    {allFieldsList.map((f) => (
                      <div key={f.key} className='border-b pb-1.5'>
                        <div className='flex items-center justify-between text-muted-foreground text-[11px]'>
                          <span>{f.label}:</span>
                        </div>
                        <span className='font-medium text-foreground'>
                          {f.formattedValue}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
