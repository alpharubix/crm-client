import React, { useState } from 'react';
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

// Custom SIM card icon matching the reference screenshot
function SimCardIcon({ className = 'size-4 text-muted-foreground' }: { className?: string }) {
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

// Payload structure received from TeleCRM backend
export interface TeleCRMPayload {
  id?: string;
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
  my_details?: {
    email?: string;
    name?: string;
  };
  call_action?: {
    creation_timestamp?: string;
    call_recording_url?: string;
    feedback?: string;
    duration?: string;
    actor_employee_email?: string;
    type?: 'incoming' | 'outgoing' | 'missed';
  };
  missed_call?: {
    actor_employee_email?: string;
  };
  caller_desk_incoming_call?: {
    call_recording_url?: string;
    customer_number?: string;
    virtual_number?: string;
    duration?: string;
    status?: string;
    actor_employee_email?: string;
  };
  ivr_call?: {
    creation_timestamp?: string;
    customer_number?: string;
    virtual_number?: string;
    duration?: string;
    direction?: string;
  };
  system_note?: {
    text?: string;
  };
  user_note?: {
    text?: string;
    actor_employee_email?: string;
  };
  payment?: {
    payment_id?: string;
    note?: string;
    amount?: string;
    status?: string;
  };
  incoming_whatsapp?: {
    team_member_phone_number?: string;
    url?: string;
    message_type?: string;
    message_text?: string;
  };
  otp_action?: {
    attempts?: string;
    employee_id?: string;
  };
  document_collected?: {
    bank_statement?: string;
    salary_slip?: string;
    aadhar_card?: string;
    documents_status?: string;
    pan_card?: string;
  };
  disbursement_details?: {
    loan_type?: string;
    loan_account_number?: string;
    bank_name?: string;
    tenure?: string;
    interest_rate?: string;
    disbursed_loan_amount?: string;
    disbursement_date?: string;
    notes?: string;
  };
  customer_profile?: {
    any_existing_loan?: string;
    monthly_income?: string;
    employment_type?: string;
    cibil_score?: string;
    loan_amount_required?: string;
    loan_type?: string;
    notes?: string;
  };
  lead_recapture?: {
    lead_source?: string;
  };
  is_pinned?: boolean;
  has_ai_notes?: boolean;
  relative_time?: string;
}

// Default dummy dataset representing realistic TeleCRM webhook / API entries
export const DUMMY_TELECRM_ACTIVITIES: TeleCRMPayload[] = [
  {
    id: 'tele-1',
    is_pinned: true,
    has_ai_notes: false,
    relative_time: '1d',
    leads: {
      lead_id: 'TC-98214',
      name: 'Rajesh Kumar Verma',
      alternate_phone: '+91 98450 12345',
      email: 'rajesh.verma@example.com',
      company_or_business_name: 'Verma Logistics & Retail',
      profession: 'Business Owner',
      monthly_income: '₹ 1,85,000',
      total_turnover: '₹ 2.4 Cr',
      loan_amount_required: '₹ 25,00,000',
      lead_source: 'Google Ads / Web Callback',
      customer_location: 'Bengaluru, Karnataka',
      lead_assignee: 'Harish O.',
      assignee_email: 'harish.o@telecrm.in',
      lead_assignee_manager: 'Naveen Rao',
      lead_assignee_manager_email: 'naveen.r@telecrm.in',
      status: 'Interested',
      callback_date_time: 'Tomorrow at 11:30 AM (05 Sep 2026)',
      created_on: '2026-09-02T10:00:00Z',
    },
    call_action: {
      type: 'outgoing',
      duration: '11m 15s',
      creation_timestamp: '4:35 PM Thu, 3 Sep 26',
      feedback: 'CONNECTED',
      call_recording_url: 'https://telecrm.in/recordings/call-rec-98214-outgoing.mp3',
      actor_employee_email: 'harish.o@telecrm.in',
    },
    user_note: {
      text: 'Customer discussed ₹25L business expansion loan. Documents list shared on WhatsApp.',
      actor_employee_email: 'harish.o@telecrm.in',
    },
    system_note: {
      text: 'Outgoing call connected successfully via CallerDesk SIP trunk.',
    },
  },
  {
    id: 'tele-2',
    is_pinned: true,
    has_ai_notes: false,
    relative_time: '1d',
    leads: {
      lead_id: 'TC-98214',
      alternate_phone: '+91 98450 12345',
      status: 'In Progress',
      callback_date_time: 'Tomorrow at 11:30 AM (05 Sep 2026)',
    },
    call_action: {
      type: 'outgoing',
      duration: '0s',
      creation_timestamp: '11:20 AM Thu, 3 Sep 26',
      feedback: 'Feedback not added',
      actor_employee_email: 'harish.o@telecrm.in',
    },
    system_note: {
      text: 'Call not picked up by customer (Ringing timeout).',
    },
  },
  {
    id: 'tele-3',
    is_pinned: true,
    has_ai_notes: true,
    relative_time: '1d',
    leads: {
      lead_id: 'TC-98214',
      alternate_phone: '+91 98450 12345',
      status: 'Interested',
      callback_date_time: 'Tomorrow at 11:30 AM (05 Sep 2026)',
    },
    call_action: {
      type: 'outgoing',
      duration: '18s',
      creation_timestamp: '10:05 AM Thu, 3 Sep 26',
      feedback: 'CONNECTED',
      call_recording_url: 'https://telecrm.in/recordings/call-rec-98214-brief.mp3',
      actor_employee_email: 'harish.o@telecrm.in',
    },
    user_note: {
      text: 'Customer requested quick callback in the evening as he was in a meeting.',
      actor_employee_email: 'harish.o@telecrm.in',
    },
  },
  {
    id: 'tele-4',
    is_pinned: false,
    has_ai_notes: false,
    relative_time: '2d',
    leads: {
      lead_id: 'TC-98214',
      alternate_phone: '+91 98450 12345',
      status: 'Warm Lead',
    },
    caller_desk_incoming_call: {
      call_recording_url: 'https://telecrm.in/recordings/call-rec-98214-incoming.mp3',
      customer_number: '+91 98450 12345',
      virtual_number: '+91 80491 12300',
      duration: '4m 32s',
      status: 'CONNECTED',
      actor_employee_email: 'priya.s@telecrm.in',
    },
    call_action: {
      type: 'incoming',
      duration: '4m 32s',
      creation_timestamp: '3:15 PM Wed, 2 Sep 26',
      feedback: 'CONNECTED',
      call_recording_url: 'https://telecrm.in/recordings/call-rec-98214-incoming.mp3',
      actor_employee_email: 'priya.s@telecrm.in',
    },
    user_note: {
      text: 'Customer inquired regarding repayment tenure and interest rates for partnership firm.',
      actor_employee_email: 'priya.s@telecrm.in',
    },
  },
  {
    id: 'tele-5',
    is_pinned: false,
    has_ai_notes: false,
    relative_time: '3d',
    leads: {
      lead_id: 'TC-98214',
      alternate_phone: '+91 98450 12345',
      status: 'Follow Up',
    },
    missed_call: {
      actor_employee_email: 'harish.o@telecrm.in',
    },
    call_action: {
      type: 'missed',
      duration: '0s',
      creation_timestamp: '09:40 AM Tue, 1 Sep 26',
      feedback: 'MISSED CALL',
      actor_employee_email: 'harish.o@telecrm.in',
    },
    system_note: {
      text: 'Inbound missed call from customer on virtual DID +91 80491 12300.',
    },
  },
];

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
  if (s.includes('connected') || s.includes('interested') || s.includes('won')) {
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
  // Use provided activities or realistic dummy data
  const dataList = activities && activities.length > 0 ? activities : DUMMY_TELECRM_ACTIVITIES;

  const [activeFilter, setActiveFilter] = useState<'all' | 'outgoing' | 'incoming' | 'missed'>('all');
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TeleCRMPayload | null>(null);

  // Extract the latest lead metadata from the first payload
  const primaryLead = dataList[0]?.leads;
  const displayPhone = leadPhone || primaryLead?.alternate_phone || '+91 98450 12345';
  const displayStatus = leadStatus || primaryLead?.status || 'Interested';
  const displayCallback = primaryLead?.callback_date_time || 'Tomorrow at 11:30 AM (05 Sep 2026)';

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
    const type = item.call_action?.type || (item.caller_desk_incoming_call ? 'incoming' : 'outgoing');
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
            <div className='flex items-center gap-2 bg-background border px-3 py-1.5 rounded-md text-sm font-medium'>
              <Phone className='size-3.5 text-muted-foreground' />
              <span className='font-semibold text-foreground tracking-wide'>{displayPhone}</span>
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

            {/* Lead Status Badge */}
            <div className='flex items-center gap-1.5'>
              <span className='text-xs text-muted-foreground font-medium'>Status:</span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getLeadStatusColor(
                  displayStatus
                )}`}
              >
                {displayStatus}
              </span>
            </div>

            {/* Callback Date & Time Highlight */}
            {displayCallback && (
              <div className='flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md text-xs text-amber-700 dark:text-amber-400'>
                <Calendar className='size-3.5 text-amber-600 dark:text-amber-400' />
                <span className='font-medium'>Callback:</span>
                <span>{displayCallback}</span>
              </div>
            )}
          </div>

          {/* Filter Pills */}
          <div className='flex items-center gap-1 bg-muted/50 p-1 rounded-lg border text-xs self-start md:self-auto'>
            {(
              [
                { id: 'all', label: 'All', count: dataList.length },
                {
                  id: 'outgoing',
                  label: 'Outgoing',
                  count: dataList.filter((i) => i.call_action?.type === 'outgoing').length,
                },
                {
                  id: 'incoming',
                  label: 'Incoming',
                  count: dataList.filter(
                    (i) => i.call_action?.type === 'incoming' || !!i.caller_desk_incoming_call
                  ).length,
                },
                {
                  id: 'missed',
                  label: 'Missed',
                  count: dataList.filter(
                    (i) => i.call_action?.type === 'missed' || !!i.missed_call
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

        {/* ================= Activity History List (Matching Reference Image) ================= */}
        <div className='divide-y divide-border/60'>
          {filteredList.length === 0 ? (
            <div className='p-8 text-center text-sm text-muted-foreground'>
              No call activities found for this filter.
            </div>
          ) : (
            filteredList.map((item, index) => {
              const callType =
                item.call_action?.type ||
                (item.caller_desk_incoming_call ? 'incoming' : 'outgoing');
              const duration =
                item.call_action?.duration ||
                item.caller_desk_incoming_call?.duration ||
                '0s';
              const recordingUrl =
                item.call_action?.call_recording_url ||
                item.caller_desk_incoming_call?.call_recording_url;
              const timestamp =
                item.call_action?.creation_timestamp ||
                item.ivr_call?.creation_timestamp ||
                '4:35 PM Thu, 3 Sep 26';
              const feedback =
                item.call_action?.feedback ||
                item.caller_desk_incoming_call?.status ||
                'Feedback not added';
              const noteText = item.user_note?.text || item.system_note?.text;
              const actorEmail =
                item.call_action?.actor_employee_email ||
                item.user_note?.actor_employee_email ||
                item.caller_desk_incoming_call?.actor_employee_email ||
                item.leads?.assignee_email ||
                'harish.o@telecrm.in';
              const initials = getInitials(actorEmail);

              return (
                <div
                  key={item.id || index}
                  onClick={() => setSelectedItem(item)}
                  className='px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer flex items-center justify-between gap-3 group'
                >
                  {/* Left Section: Pin, SIM, Call Direction, Duration, Timestamp, Recording, Status & Notes */}
                  <div className='flex items-start gap-3 min-w-0'>
                    {/* Pin Icon */}
                    <div className='pt-0.5 shrink-0'>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Pin
                              className={`size-3.5 ${
                                item.is_pinned
                                  ? 'text-muted-foreground rotate-45'
                                  : 'text-muted-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity'
                              }`}
                            />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side='top'>
                          {item.is_pinned ? 'Pinned activity' : 'Pin activity'}
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    {/* SIM Card Icon */}
                    <div className='pt-0.5 shrink-0'>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <SimCardIcon className='size-4 text-muted-foreground' />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side='top'>SIM Activity / GSM</TooltipContent>
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
                                onClick={(e) => handleOpenRecording(e, recordingUrl)}
                                className='inline-flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors p-0.5 rounded hover:bg-muted cursor-pointer'
                              >
                                <Volume2 className='size-3.5' />
                                <ExternalLink className='size-2.5 opacity-60' />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side='top' className='max-w-xs'>
                              <p className='font-medium'>Listen / View Call Recording</p>
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
                          <TooltipContent side='top'>View full payload details</TooltipContent>
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
                          {noteText ? `(Note: ${noteText})` : '(Note not added)'}
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
                        <p className='text-[11px] text-muted-foreground'>{actorEmail}</p>
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
            TeleCRM Activity History • Showing {filteredList.length} of {dataList.length} interactions
          </span>
          <span className='flex items-center gap-1'>
            <Volume2 className='size-3' /> Click audio icon to open TeleCRM recording
          </span>
        </div>

        {/* ================= Details Dialog (Full Payload View) ================= */}
        <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
          <DialogContent className='max-w-2xl max-h-[85vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2 text-base font-semibold'>
                <span>TeleCRM Activity Details</span>
                {selectedItem?.leads?.status && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${getLeadStatusColor(
                      selectedItem.leads.status
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
                        {(selectedItem.call_action?.type || 'call').toUpperCase()} CALL
                      </span>
                      <span className='text-xs text-muted-foreground'>
                        ({selectedItem.call_action?.duration || '0s'})
                      </span>
                    </div>

                    {(selectedItem.call_action?.call_recording_url ||
                      selectedItem.caller_desk_incoming_call?.call_recording_url) && (
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={(e) =>
                          handleOpenRecording(
                            e,
                            selectedItem.call_action?.call_recording_url ||
                              selectedItem.caller_desk_incoming_call?.call_recording_url
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
                      <span className='text-muted-foreground block'>Timestamp:</span>
                      <span className='font-medium'>
                        {selectedItem.call_action?.creation_timestamp || '—'}
                      </span>
                    </div>
                    <div>
                      <span className='text-muted-foreground block'>Status / Feedback:</span>
                      <span className='font-medium italic'>
                        {selectedItem.call_action?.feedback || '—'}
                      </span>
                    </div>
                    <div>
                      <span className='text-muted-foreground block'>Actor Employee:</span>
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
                      <span className='text-muted-foreground block'>Phone / Alternate Phone:</span>
                      <span className='font-medium'>
                        {selectedItem.leads?.alternate_phone || displayPhone || '—'}
                      </span>
                    </div>
                    <div>
                      <span className='text-muted-foreground block'>Scheduled Callback:</span>
                      <span className='font-medium text-amber-600 dark:text-amber-400'>
                        {selectedItem.leads?.callback_date_time || '—'}
                      </span>
                    </div>
                    <div>
                      <span className='text-muted-foreground block'>Lead Assignee:</span>
                      <span className='font-medium'>
                        {selectedItem.leads?.lead_assignee ||
                          selectedItem.leads?.assignee_email ||
                          '—'}
                      </span>
                    </div>
                    <div>
                      <span className='text-muted-foreground block'>Assignee Manager:</span>
                      <span className='font-medium'>
                        {selectedItem.leads?.lead_assignee_manager || '—'}
                      </span>
                    </div>
                    <div>
                      <span className='text-muted-foreground block'>Company / Business:</span>
                      <span className='font-medium'>
                        {selectedItem.leads?.company_or_business_name || '—'}
                      </span>
                    </div>
                    <div>
                      <span className='text-muted-foreground block'>Loan Required / Turnover:</span>
                      <span className='font-medium'>
                        {selectedItem.leads?.loan_amount_required || '—'}{' '}
                        {selectedItem.leads?.total_turnover ? `(${selectedItem.leads.total_turnover})` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                <div className='border rounded-lg p-3 space-y-2'>
                  <h4 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                    Notes & Remarks
                  </h4>
                  {selectedItem.user_note?.text && (
                    <div className='bg-muted/30 p-2.5 rounded text-xs'>
                      <span className='text-muted-foreground block font-medium mb-1'>
                        User Note (by {selectedItem.user_note.actor_employee_email || 'Agent'}):
                      </span>
                      <p className='text-foreground'>{selectedItem.user_note.text}</p>
                    </div>
                  )}
                  {selectedItem.system_note?.text && (
                    <div className='bg-muted/20 p-2.5 rounded text-xs'>
                      <span className='text-muted-foreground block font-medium mb-1'>System Note:</span>
                      <p className='text-foreground'>{selectedItem.system_note.text}</p>
                    </div>
                  )}
                  {!selectedItem.user_note?.text && !selectedItem.system_note?.text && (
                    <p className='text-xs text-muted-foreground italic'>No notes added for this call.</p>
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
