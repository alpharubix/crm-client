import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshCw,
  Loader2,
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
import { ENV } from '@/conf';

// Custom SIM card icon matching the reference screenshot
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
      {/* SIM card body with angled top-left corner */}
      <path d='M8 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6l4-4z' />
      {/* Microchip lines inside */}
      <rect x='7.5' y='10' width='9' height='8' rx='1' strokeWidth='1.5' />
      <path d='M7.5 14h9' strokeWidth='1.2' />
      <path d='M12 10v8' strokeWidth='1.2' />
    </svg>
  );
}

// Payload structure received from TeleCRM backend / test-tele-crm collection
export interface TeleCRMPayload {
  id?: string;
  _id?: string;
  lead_id?: string;
  lead_name?: string;
  lead_phone?: string;
  status?: string;
  call_back_date_time?: string;
  my_name?: string;
  creation_timestamp?: string;
  call_recording_url?: string;
  call_note?: string;
  duration?: string | number;
  actor_employee_email?: string;
  call_type?: string;
  type?: string;
  system_note?: { text?: string } | string;
  user_note?: { text?: string; actor_employee_email?: string } | string;
  telecrm_url?: string;
  relative_time?: string;
  is_pinned?: boolean;
  has_ai_notes?: boolean;
  leads?: {
    lead_id?: string;
    name?: string;
    alternate_phone?: string;
    status?: string;
    callback_date_time?: string;
    lead_assignee?: string;
    assignee_email?: string;
    company_or_business_name?: string;
    profession?: string;
    monthly_income?: string;
    total_turnover?: string;
    loan_amount_required?: string;
    lead_source?: string;
    customer_location?: string;
    lead_assignee_manager?: string;
    created_on?: string;
  };
  call_action?: {
    type?: 'incoming' | 'outgoing' | 'missed';
    duration?: string;
    creation_timestamp?: string;
    feedback?: string;
    call_recording_url?: string;
    actor_employee_email?: string;
  };
  caller_desk_incoming_call?: {
    call_recording_url?: string;
    duration?: string;
    status?: string;
    actor_employee_email?: string;
  };
  missed_call?: {
    actor_employee_email?: string;
  };
  ivr_call?: {
    creation_timestamp?: string;
    duration?: string;
  };
  raw?: Record<string, any>;
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

// Get badge color variant according to lead status
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
  return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800';
}

interface TeleCRMActivityHistoryProps {
  leadPhone?: string;
  leadStatus?: string;
  activities?: TeleCRMPayload[];
}

export default function TeleCRMActivityHistory({
  leadPhone,
  leadStatus,
  activities,
}: TeleCRMActivityHistoryProps) {
  const [remoteActivities, setRemoteActivities] = useState<TeleCRMPayload[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    if (!leadPhone) {
      setRemoteActivities([]);
      return;
    }
    const cleanDigits = String(leadPhone).replace(/\D/g, '');
    const phone10 =
      cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;
    if (!phone10) {
      setRemoteActivities([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/tele-crm/call-details?phone=${encodeURIComponent(phone10)}`,
        { credentials: 'include' },
      );
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      const json = await res.json();
      const list = Array.isArray(json) ? json : json.data || [];
      setRemoteActivities(list);
    } catch (err: any) {
      console.error('Failed to load TeleCRM activities:', err);
      setError(err?.message || 'Failed to load call activities');
    } finally {
      setIsLoading(false);
    }
  }, [leadPhone]);

  useEffect(() => {
    if (activities && activities.length > 0) {
      return;
    }
    fetchActivities();
  }, [leadPhone, activities, fetchActivities]);

  const dataList =
    activities && activities.length > 0 ? activities : remoteActivities;

  const [activeFilter, setActiveFilter] = useState<
    'all' | 'outgoing' | 'incoming' | 'missed'
  >('all');
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TeleCRMPayload | null>(null);

  // Extract the latest lead metadata from the first payload
  const primaryItem = dataList[0];
  const primaryLead = primaryItem?.leads;
  const displayPhone =
    primaryLead?.alternate_phone || primaryItem?.lead_phone || '';
  const displayStatus = primaryLead?.status || primaryItem?.status;
  const rawCallback =
    primaryLead?.callback_date_time || primaryItem?.call_back_date_time || '';
  const displayCallback =
    rawCallback.trim() && !rawCallback.toLowerCase().includes('undefined')
      ? rawCallback.trim()
      : null;

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

  const filteredList = dataList.filter((item) => {
    const type =
      item.call_action?.type ||
      (item.call_type?.toLowerCase().includes('in')
        ? 'incoming'
        : item.call_type?.toLowerCase().includes('miss')
          ? 'missed'
          : item.caller_desk_incoming_call
            ? 'incoming'
            : 'outgoing');
    if (activeFilter === 'all') return true;
    return type === activeFilter;
  });

  return (
    <TooltipProvider delayDuration={150}>
      <div className='rounded-lg border bg-card text-card-foreground shadow-xs overflow-hidden'>
        {/* ================= Header Summary Bar ================= */}
        <div className='p-4 border-b bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-4'>
          <div className='flex flex-wrap items-center gap-3'>
            {/* Phone number display with click-to-call and copy */}
            {displayPhone && (
              <div className='flex items-center gap-2 bg-background border px-3 py-1.5 rounded-md text-sm font-medium'>
                <Phone className='size-3.5 text-muted-foreground' />
                <span className='font-semibold text-foreground tracking-wide'>
                  {displayPhone || '—'}
                </span>
                {displayPhone && (
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
                )}
              </div>
            )}

            {/* Lead Status Badge */}
            {displayStatus && (
              <div className='flex items-center gap-1.5'>
                <span className='text-xs text-muted-foreground font-medium'>
                  Status:
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getLeadStatusColor(
                    displayStatus,
                  )}`}
                >
                  {displayStatus}
                </span>
              </div>
            )}

            {/* Callback Date & Time Highlight */}
            {displayCallback && (
              <div className='flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md text-xs text-amber-700 dark:text-amber-400'>
                <Calendar className='size-3.5 text-amber-600 dark:text-amber-400' />
                <span className='font-medium'>Callback:</span>
                <span>{displayCallback}</span>
              </div>
            )}
          </div>

          {/* Filter Pills & Refresh */}
          <div className='flex items-center gap-2 self-start md:self-auto flex-wrap'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={fetchActivities}
              disabled={isLoading}
              className='h-7 text-xs flex items-center gap-1.5'
              title='Refresh call activities'
            >
              <RefreshCw
                className={`size-3 ${isLoading ? 'animate-spin' : ''}`}
              />
              <span>Refresh</span>
            </Button>

            <div className='flex items-center gap-1 bg-muted/50 p-1 rounded-lg border text-xs'>
              {(
                [
                  { id: 'all', label: 'All', count: dataList.length },
                  {
                    id: 'outgoing',
                    label: 'Outgoing',
                    count: dataList.filter(
                      (i) =>
                        i.call_action?.type === 'outgoing' ||
                        (!i.call_action?.type &&
                          !i.call_type?.toLowerCase().includes('in') &&
                          !i.call_type?.toLowerCase().includes('miss')),
                    ).length,
                  },
                  {
                    id: 'incoming',
                    label: 'Incoming',
                    count: dataList.filter(
                      (i) =>
                        i.call_action?.type === 'incoming' ||
                        i.call_type?.toLowerCase().includes('incoming') ||
                        !!i.caller_desk_incoming_call,
                    ).length,
                  },
                  {
                    id: 'missed',
                    label: 'Missed',
                    count: dataList.filter(
                      (i) =>
                        i.call_action?.type === 'missed' ||
                        i.call_type?.toLowerCase().includes('miss') ||
                        !!i.missed_call,
                    ).length,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type='button'
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1.5 cursor-pointer ${
                    activeFilter === tab.id
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className='text-[10px] px-1 rounded-full bg-muted text-muted-foreground'>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ================= Activity History List (Matching Reference Image) ================= */}
        <div className='divide-y divide-border/60'>
          {isLoading ? (
            <div className='p-8 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground'>
              <Loader2 className='size-5 animate-spin text-primary' />
              <span>Fetching call recordings from TeleCRM...</span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className='p-8 text-center text-sm text-muted-foreground space-y-2'>
              <p>
                No call activities found
                {displayPhone ? ` for phone ${displayPhone}` : ''}.
              </p>
              {error && <p className='text-xs text-rose-500'>{error}</p>}
            </div>
          ) : (
            filteredList.map((item, index) => {
              const callType =
                item.call_action?.type ||
                (item.call_type?.toLowerCase().includes('in')
                  ? 'incoming'
                  : item.call_type?.toLowerCase().includes('miss')
                    ? 'missed'
                    : item.caller_desk_incoming_call
                      ? 'incoming'
                      : 'outgoing');
              const duration =
                item.call_action?.duration ||
                item.caller_desk_incoming_call?.duration ||
                (item.duration !== undefined && item.duration !== ''
                  ? `${item.duration}s`
                  : '0s');
              const recordingUrl =
                item.call_action?.call_recording_url ||
                item.caller_desk_incoming_call?.call_recording_url ||
                item.call_recording_url ||
                item.telecrm_url;
              const timestamp =
                item.call_action?.creation_timestamp ||
                item.ivr_call?.creation_timestamp ||
                item.creation_timestamp ||
                '—';
              const feedback =
                item.call_action?.feedback ||
                item.caller_desk_incoming_call?.status ||
                item.status ||
                'Feedback not added';
              const rawNote =
                (typeof item.user_note === 'object'
                  ? item.user_note?.text
                  : item.user_note) ||
                (typeof item.system_note === 'object'
                  ? item.system_note?.text
                  : item.system_note) ||
                item.call_note ||
                '';
              const noteText =
                rawNote && !rawNote.toLowerCase().includes('undefined')
                  ? rawNote
                  : '';
              const actorEmail =
                item.call_action?.actor_employee_email ||
                (typeof item.user_note === 'object'
                  ? item.user_note?.actor_employee_email
                  : undefined) ||
                item.caller_desk_incoming_call?.actor_employee_email ||
                item.actor_employee_email ||
                item.my_name ||
                item.leads?.assignee_email ||
                'Agent';
              const initials = getInitials(actorEmail);

              return (
                <div
                  key={item.id || index}
                  onClick={() => setSelectedItem(item)}
                  className='px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer flex items-center justify-between gap-3 group'
                >
                  {/* Left Section: Pin, SIM, Call Direction, Duration, Timestamp, Recording, Status & Notes */}
                  <div className='flex items-start gap-3 min-w-0'>

                    {/* SIM Card Icon */}
                    <div className='pt-0.5 shrink-0'>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <SimCardIcon className='size-4 text-muted-foreground' />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side='top'>
                          SIM Activity / GSM
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Call Information Details */}
                    <div className='space-y-1 min-w-0'>
                      {/* Top Line: Phone Call Icon + Duration + Timestamp + Recording Link + Info Icon */}
                      <div className='flex flex-wrap items-center gap-2'>
                        {/* Call Direction Icon */}
                        {callType === 'outgoing' && (
                          <span className='inline-flex items-center text-emerald-600 dark:text-emerald-500'>
                            <PhoneOutgoing className='size-4' />
                          </span>
                        )}
                        {callType === 'incoming' && (
                          <span className='inline-flex items-center text-sky-600 dark:text-sky-500'>
                            <PhoneIncoming className='size-4' />
                          </span>
                        )}
                        {callType === 'missed' && (
                          <span className='inline-flex items-center text-rose-600 dark:text-rose-500'>
                            <PhoneMissed className='size-4' />
                          </span>
                        )}

                        {/* Duration */}
                        <span className='text-sm font-semibold text-foreground tracking-tight'>
                          {duration}
                        </span>

                        {/* Audio / Recording Redirection Link (as requested: redirect to TeleCRM recording) */}
                        {recordingUrl && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type='button'
                                onClick={(e) =>
                                  handleOpenRecording(e, recordingUrl)
                                }
                                className='inline-flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors p-0.5 rounded hover:bg-muted cursor-pointer'
                              >
                                <Volume2 className='size-3.5' />
                                <ExternalLink className='size-2.5 opacity-60' />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side='top' className='max-w-xs'>
                              <p className='font-medium'>
                                Listen / View Call Recording
                              </p>
                              <p className='text-[11px] text-muted-foreground'>
                                Opens recording on TeleCRM in a new tab
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}

                        {/* Timestamp in parentheses: e.g. (4:35 PM Thu, 3 Sep 26) */}
                        <span className='text-xs text-muted-foreground'>
                          ({timestamp})
                        </span>

                        {/* Info details toggle */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type='button'
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedItem(item);
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

                      {/* Bottom Line: Status/Feedback & Note */}
                      <div className='flex items-center flex-wrap gap-2 text-xs'>
                        {/* Status (Italic font as in reference image) */}
                        <span
                          className={`italic font-medium ${
                            feedback === 'CONNECTED'
                              ? 'text-foreground font-semibold'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {feedback}
                        </span>

                        {/* Note text */}
                        <span className='text-muted-foreground'>
                          {noteText
                            ? `(Note: ${noteText})`
                            : '(Note not added)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Section: Sparkles (AI notes), Relative Time, Employee Initials Badge */}
                  <div className='flex items-center gap-2.5 shrink-0 pl-2'>
                    {/* Relative Time (e.g. 1d) */}
                    <span className='text-xs text-muted-foreground font-medium'>
                      {item.relative_time || '1d'}
                    </span>

                    {/* Employee Avatar Badge with initials (HO) */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className='size-7 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 font-semibold text-xs flex items-center justify-center border border-purple-200 dark:border-purple-800 shadow-2xs'>
                          {initials}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side='left'>
                        <p className='font-medium'>TeleCRM Agent</p>
                        <p className='text-[11px] text-muted-foreground'>
                          {actorEmail}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info banner */}
        <div className='px-4 py-2 bg-muted/10 border-t flex items-center justify-between text-xs text-muted-foreground'>
          <span>
            TeleCRM Activity History • Showing {filteredList.length} of{' '}
            {dataList.length} interactions
          </span>
          <span className='flex items-center gap-1'>
            <Volume2 className='size-3' /> Click audio icon to open TeleCRM
            recording
          </span>
        </div>

        {/* ================= Details Dialog (Full Payload View) ================= */}
        <Dialog
          open={!!selectedItem}
          onOpenChange={(open) => !open && setSelectedItem(null)}
        >
          <DialogContent className='min-w-3xl max-h-[85vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2 text-base font-semibold'>
                <span>TeleCRM Activity Details</span>
                {selectedItem?.leads?.status && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${getLeadStatusColor(
                      selectedItem.leads.status,
                    )}`}
                  >
                    {selectedItem.leads.status}
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
                      {selectedItem.call_action?.type === 'outgoing' ? (
                        <PhoneOutgoing className='size-4 text-emerald-600' />
                      ) : selectedItem.call_action?.type === 'incoming' ? (
                        <PhoneIncoming className='size-4 text-sky-600' />
                      ) : (
                        <PhoneMissed className='size-4 text-rose-600' />
                      )}
                      <span className='font-semibold'>
                        {(
                          selectedItem.call_action?.type || 'call'
                        ).toUpperCase()}{' '}
                        CALL
                      </span>
                      <span className='text-xs text-muted-foreground'>
                        ({selectedItem.call_action?.duration || '0s'})
                      </span>
                    </div>

                    {(selectedItem.call_action?.call_recording_url ||
                      selectedItem.caller_desk_incoming_call
                        ?.call_recording_url) && (
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={(e) =>
                          handleOpenRecording(
                            e,
                            selectedItem.call_action?.call_recording_url ||
                              selectedItem.caller_desk_incoming_call
                                ?.call_recording_url,
                          )
                        }
                        className='h-7 text-xs flex items-center gap-1.5'
                      >
                        <Volume2 className='size-3.5' />
                        <span>Open TeleCRM Recording</span>
                        <ExternalLink className='size-3' />
                      </Button>
                    )}
                  </div>

                  <div className='grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 text-xs border-t'>
                    <div>
                      <span className='text-muted-foreground block'>
                        Timestamp:
                      </span>
                      <span className='font-medium'>
                        {selectedItem.call_action?.creation_timestamp || '—'}
                      </span>
                    </div>
                    <div>
                      <span className='text-muted-foreground block'>
                        Status / Feedback:
                      </span>
                      <span className='font-medium italic'>
                        {selectedItem.call_action?.feedback || '—'}
                      </span>
                    </div>
                    <div>
                      <span className='text-muted-foreground block'>
                        Actor Employee:
                      </span>
                      <span className='font-medium'>
                        {selectedItem.call_action?.actor_employee_email || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lead Summary Info */}
                <div className='border rounded-lg p-3 space-y-2'>
                  <h4 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                    Lead Information
                  </h4>
                  <div className='grid grid-cols-2 gap-y-2 text-xs'>
                    <div>
                      <span className='text-muted-foreground block'>
                        Lead Name:
                      </span>
                      <span className='font-medium'>
                        {selectedItem.leads?.name ||
                          selectedItem.lead_name ||
                          '—'}
                      </span>
                    </div>
                    <div>
                      <span className='text-muted-foreground block'>
                        Phone / Alternate Phone:
                      </span>
                      <span className='font-medium'>
                        {selectedItem.leads?.alternate_phone ||
                          selectedItem.lead_phone ||
                          displayPhone ||
                          '—'}
                      </span>
                    </div>
                    <div>
                      <span className='text-muted-foreground block'>
                        Scheduled Callback:
                      </span>
                      <span className='font-medium text-amber-600 dark:text-amber-400'>
                        {selectedItem.leads?.callback_date_time ||
                          selectedItem.call_back_date_time ||
                          '—'}
                      </span>
                    </div>
                    <div>
                      <span className='text-muted-foreground block'>
                        Assignee Email:
                      </span>
                      <span className='font-medium'>
                        {selectedItem.leads?.assignee_email ||
                          selectedItem.actor_employee_email ||
                          '—'}
                      </span>
                    </div>
                    <div>
                      <span className='text-muted-foreground block'>
                        Call Type / Duration:
                      </span>
                      <span className='font-medium'>
                        {selectedItem.call_type ||
                          selectedItem.type ||
                          'Outgoing Call'}{' '}
                        (
                        {selectedItem.call_action?.duration ||
                          (selectedItem.duration !== undefined &&
                          selectedItem.duration !== ''
                            ? `${selectedItem.duration}s`
                            : '0s')}
                        )
                      </span>
                    </div>
                    {selectedItem.leads?.company_or_business_name && (
                      <div>
                        <span className='text-muted-foreground block'>
                          Company / Business:
                        </span>
                        <span className='font-medium'>
                          {selectedItem.leads.company_or_business_name}
                        </span>
                      </div>
                    )}
                    {selectedItem.leads?.loan_amount_required && (
                      <div>
                        <span className='text-muted-foreground block'>
                          Loan Required / Turnover:
                        </span>
                        <span className='font-medium'>
                          {selectedItem.leads.loan_amount_required}{' '}
                          {selectedItem.leads?.total_turnover
                            ? `(${selectedItem.leads.total_turnover})`
                            : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes Section */}
                <div className='border rounded-lg p-3 space-y-2'>
                  <h4 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                    Notes & Remarks
                  </h4>
                  {selectedItem.call_note &&
                    !selectedItem.call_note
                      .toLowerCase()
                      .includes('undefined') && (
                      <div className='bg-muted/30 p-2.5 rounded text-xs'>
                        <span className='text-muted-foreground block font-medium mb-1'>
                          Call Note:
                        </span>
                        <p className='text-foreground'>
                          {selectedItem.call_note}
                        </p>
                      </div>
                    )}
                  {typeof selectedItem.user_note === 'object' &&
                    selectedItem.user_note?.text &&
                    !selectedItem.user_note.text
                      .toLowerCase()
                      .includes('undefined') && (
                      <div className='bg-muted/30 p-2.5 rounded text-xs'>
                        <span className='text-muted-foreground block font-medium mb-1'>
                          User Note (by{' '}
                          {selectedItem.user_note.actor_employee_email ||
                            selectedItem.actor_employee_email ||
                            selectedItem.my_name ||
                            'Agent'}
                          ):
                        </span>
                        <p className='text-foreground'>
                          {selectedItem.user_note.text}
                        </p>
                      </div>
                    )}
                  {typeof selectedItem.system_note === 'object' &&
                    selectedItem.system_note?.text &&
                    !selectedItem.system_note.text
                      .toLowerCase()
                      .includes('undefined') && (
                      <div className='bg-muted/20 p-2.5 rounded text-xs'>
                        <span className='text-muted-foreground block font-medium mb-1'>
                          System Note:
                        </span>
                        <p className='text-foreground'>
                          {selectedItem.system_note.text}
                        </p>
                      </div>
                    )}
                  {!selectedItem.call_note &&
                    !(
                      typeof selectedItem.user_note === 'object' &&
                      selectedItem.user_note?.text &&
                      !selectedItem.user_note.text
                        .toLowerCase()
                        .includes('undefined')
                    ) &&
                    !(
                      typeof selectedItem.system_note === 'object' &&
                      selectedItem.system_note?.text &&
                      !selectedItem.system_note.text
                        .toLowerCase()
                        .includes('undefined')
                    ) && (
                      <p className='text-xs text-muted-foreground italic'>
                        No notes added for this call.
                      </p>
                    )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
