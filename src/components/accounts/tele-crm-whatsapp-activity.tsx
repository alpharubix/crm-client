import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Send,
  ArrowUpRight,
  ArrowDownLeft,
  ExternalLink,
  Info,
  Calendar,
  Phone,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  FileText,
  User,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import telecrmUsers from '@/utils/telecrm_users.json';

// WhatsApp Payload structure from telecrm-whatsapp collection
export interface TeleCRMWhatsAppPayload {
  id?: string;
  _id?: string;
  lead_id?: string;
  lead_name?: string;
  lead_phone?: string;
  phone?: string;
  status?: string;
  type?: string;
  normalized_type?: 'outgoing' | 'incoming';
  messageText?: string;
  wa_msg_txt?: string;
  msgType?: string;
  wa_msg_type?: string;
  created_on?: string;
  creation_timestamp?: string;
  created_at?: string;
  relative_time?: string;
  assignee_phone_number?: string;
  assignee_email?: string;
  lead_assignee?: string;
  actor_employee_email?: string;
  my_name?: string;
  telecrm_url?: string;
  url?: string;
}

// User map for fast lookup
const callerMap = new Map<string, string>(
  telecrmUsers.map((u) => [u.email.toLowerCase(), u.name]),
);

function formatActorName(nameOrEmail?: string): string {
  if (!nameOrEmail) return '—';
  const str = String(nameOrEmail).trim();
  if (!str || str === '—') return '—';

  const lower = str.toLowerCase();
  if (callerMap.has(lower)) {
    return callerMap.get(lower)!;
  }

  const username = str.includes('@') ? str.split('@')[0] : str;
  const firstName = username.split('.')[0].trim();
  if (!firstName) return str;

  return firstName.charAt(0).toUpperCase() + firstName.slice(1);
}

function getInitials(nameOrEmail?: string): string {
  if (!nameOrEmail) return 'WA';
  const clean = nameOrEmail.split('@')[0].replace(/[._-]/g, ' ').trim();
  const parts = clean.split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

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

function formatCreationTimestamp(ts?: string | null): string {
  if (!ts || ts === '—') return '—';
  const clean = String(ts).trim();
  if (!clean) return '—';

  // DD/MM/YYYY or DD-MM-YYYY
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

  // YYYY-MM-DD
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

interface TeleCRMWhatsAppActivityProps {
  leadPhone?: string;
  leadStatus?: string;
}

export default function TeleCRMWhatsAppActivity({
  leadPhone,
  leadStatus,
}: TeleCRMWhatsAppActivityProps) {
  const [activities, setActivities] = useState<TeleCRMWhatsAppPayload[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState<'all' | 'outgoing' | 'incoming'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<TeleCRMWhatsAppPayload | null>(null);

  // Pagination requirement: 3 messages initially, click See More expands to 6
  const [visibleCount, setVisibleCount] = useState<number>(3);

  const fetchWhatsAppActivities = useCallback(async () => {
    if (!leadPhone) {
      setActivities([]);
      return;
    }
    const cleanDigits = String(leadPhone).replace(/\D/g, '');
    const phone10 = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;
    if (!phone10) {
      setActivities([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/tele-crm/whatsapp-details?phone=${encodeURIComponent(phone10)}`,
        { credentials: 'include' },
      );
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      const json = await res.json();
      const list = Array.isArray(json) ? json : json.data || [];
      setActivities(list);
    } catch (err: any) {
      console.error('Failed to load WhatsApp activities:', err);
      setError(err?.message || 'Failed to load WhatsApp activities');
    } finally {
      setIsLoading(false);
    }
  }, [leadPhone]);

  useEffect(() => {
    fetchWhatsAppActivities();
  }, [fetchWhatsAppActivities]);

  useEffect(() => {
    setVisibleCount(3);
  }, [activeFilter, leadPhone]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredList = activities.filter((item) => {
    const rawType = (item.normalized_type || item.type || '').toLowerCase();
    const isOut = rawType.includes('out') || rawType.includes('sent');
    const isIn = rawType.includes('in') || rawType.includes('rec');

    if (activeFilter === 'outgoing') return isOut;
    if (activeFilter === 'incoming') return isIn;
    return true;
  });

  // Display only 3 initially, up to 6 on See More
  const displayedList = filteredList.slice(0, visibleCount);

  const primaryItem = activities[0];
  const displayPhone = primaryItem?.lead_phone || leadPhone || '';

  return (
    <TooltipProvider delayDuration={150}>
      <div className='rounded-lg border bg-card text-card-foreground shadow-xs overflow-hidden'>
        {/* ================= Header Summary Bar ================= */}
        <div className='p-4 border-b bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-4'>
          <div className='flex flex-wrap items-center gap-3'>
            {/* Section Badge with Icon */}
            <div className='flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-md text-sm font-semibold'>
              <MessageSquare className='size-4' />
              <span>WhatsApp Messages</span>
            </div>

            {/* Phone number display with copy */}
            {displayPhone && (
              <div className='flex items-center gap-2 bg-background border px-3 py-1.5 rounded-md text-sm font-medium'>
                <Phone className='size-3.5 text-muted-foreground' />
                <span className='font-semibold text-foreground tracking-wide font-mono'>
                  {formatPhone(displayPhone)}
                </span>
                <button
                  type='button'
                  onClick={() => handleCopy(displayPhone.slice(-10), 'header-phone')}
                  title='Copy Phone Number'
                  className='text-muted-foreground hover:text-foreground transition-colors p-0.5 cursor-pointer'
                >
                  {copiedId === 'header-phone' ? (
                    <Check className='size-3.5 text-emerald-600' />
                  ) : (
                    <Copy className='size-3.5' />
                  )}
                </button>
              </div>
            )}

            {/* Total Messages Count */}
            <Badge
              variant='outline'
              className='bg-muted/50 text-foreground font-medium text-xs px-2.5 py-1'
            >
              Total: {activities.length}
            </Badge>
          </div>

          {/* Filter Pills & Refresh */}
          <div className='flex items-center gap-2 self-start md:self-auto flex-wrap'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={fetchWhatsAppActivities}
              disabled={isLoading}
              className='h-7 text-xs flex items-center gap-1.5 cursor-pointer'
              title='Refresh WhatsApp activities'
            >
              <RefreshCw
                className={`size-3 ${isLoading ? 'animate-spin text-emerald-600' : ''}`}
              />
              <span>Refresh</span>
            </Button>

            <div className='flex items-center gap-1 bg-muted/50 p-1 rounded-lg border text-xs'>
              {(
                [
                  { id: 'all', label: 'All', count: activities.length },
                  {
                    id: 'outgoing',
                    label: 'Outgoing',
                    count: activities.filter(
                      (i) =>
                        (i.normalized_type || i.type || '').toLowerCase().includes('out') ||
                        (i.normalized_type || i.type || '').toLowerCase().includes('sent'),
                    ).length,
                  },
                  {
                    id: 'incoming',
                    label: 'Incoming',
                    count: activities.filter(
                      (i) =>
                        (i.normalized_type || i.type || '').toLowerCase().includes('in') ||
                        (i.normalized_type || i.type || '').toLowerCase().includes('rec'),
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
                      ? 'bg-background text-foreground shadow-xs font-semibold'
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

        {/* ================= WhatsApp Activity List ================= */}
        <div className='divide-y divide-border/60'>
          {isLoading ? (
            <div className='p-8 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground'>
              <Loader2 className='size-5 animate-spin text-emerald-600' />
              <span>Fetching WhatsApp records from TeleCRM...</span>
            </div>
          ) : filteredList.length === 0 ? (
            <div className='p-8 text-center text-sm text-muted-foreground space-y-2'>
              <p>
                No WhatsApp records found
                {displayPhone ? ` for phone ${formatPhone(displayPhone)}` : ''}.
              </p>
              {error && <p className='text-xs text-rose-500'>{error}</p>}
            </div>
          ) : (
            displayedList.map((item, index) => {
              const rawType = (item.normalized_type || item.type || '').toLowerCase();
              const isOutgoing = rawType.includes('out') || rawType.includes('sent');
              const messageText = item.messageText || item.wa_msg_txt || '—';
              const msgType = item.msgType || item.wa_msg_type || 'TEXT';
              const timestamp =
                item.created_on ||
                item.creation_timestamp ||
                item.created_at ||
                '—';

              const actorName =
                item.assignee_email ||
                item.lead_assignee ||
                item.actor_employee_email ||
                item.my_name ||
                'Agent';
              const initials = getInitials(actorName);

              return (
                <div
                  key={item.id || index}
                  onClick={() => setSelectedItem(item)}
                  className='px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer flex items-center justify-between gap-3 group'
                >
                  {/* Left Section: Direction badge, Message preview, Timestamp */}
                  <div className='flex items-start gap-3 min-w-0 flex-1'>
                    {/* Direction Badge */}
                    <div className='pt-0.5 shrink-0'>
                      {isOutgoing ? (
                        <Badge
                          variant='outline'
                          className='bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 text-[11px] font-semibold gap-1 px-2 py-0.5 whitespace-nowrap'
                          title={item.type || 'OUTGOING_WHATSAPP_MSG'}
                        >
                          <ArrowUpRight className='size-3 shrink-0' />
                          <span>Outgoing</span>
                        </Badge>
                      ) : (
                        <Badge
                          variant='outline'
                          className='bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800 text-[11px] font-semibold gap-1 px-2 py-0.5 whitespace-nowrap'
                          title={item.type || 'INCOMING_WHATSAPP_MSG'}
                        >
                          <ArrowDownLeft className='size-3 shrink-0' />
                          <span>Incoming</span>
                        </Badge>
                      )}
                    </div>

                    {/* Middle Details: Message Content, Msg Type & Assignee */}
                    <div className='flex flex-col gap-1 min-w-0 flex-1'>
                      {/* Top Line: Message Preview */}
                      <div className='flex items-center gap-2'>
                        <span className='text-xs text-foreground font-medium line-clamp-2 select-text hover:text-emerald-600 transition-colors'>
                          {messageText}
                        </span>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type='button'
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedItem(item);
                              }}
                              className='text-muted-foreground/60 hover:text-foreground transition-colors p-0.5 cursor-pointer shrink-0'
                            >
                              <Info className='size-3.5' />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side='top'>
                            View full message details
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      {/* Bottom Line: Msg Type, Assignee Phone, Timestamp */}
                      <div className='flex items-center flex-wrap gap-2 text-[11px] text-muted-foreground'>
                        <Badge
                          variant='secondary'
                          className='text-[10px] font-mono uppercase px-1.5 py-0 bg-muted text-foreground/80'
                        >
                          {msgType}
                        </Badge>

                        {item.assignee_phone_number && (
                          <span className='font-mono'>
                            Assignee: {formatPhone(item.assignee_phone_number)}
                          </span>
                        )}

                        <span>•</span>

                        <span>
                          {formatCreationTimestamp(timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Section: Relative Time & Agent Initials Badge */}
                  <div className='flex items-center gap-2.5 shrink-0 pl-2'>
                    {/* Relative Time */}
                    <span className='text-xs text-muted-foreground font-medium whitespace-nowrap'>
                      {item.relative_time || '1d'}
                    </span>

                    {/* Employee Avatar Badge */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className='size-7 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 font-semibold text-xs flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shadow-2xs shrink-0'>
                          {initials}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side='left'>
                        <p className='font-medium'>
                          {formatActorName(actorName)}
                        </p>
                        {item.assignee_email && (
                          <p className='text-[11px] text-muted-foreground'>
                            {item.assignee_email}
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* See More (expands from 3 to 6 messages) */}
        {filteredList.length > 3 && (
          <div className='p-2.5 bg-muted/20 border-t flex items-center justify-center'>
            {visibleCount === 3 ? (
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => setVisibleCount(6)}
                className='h-8 text-xs font-medium gap-1.5 cursor-pointer hover:bg-muted'
              >
                <span>See More ({Math.min(filteredList.length, 6) - 3} more)</span>
              </Button>
            ) : (
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => setVisibleCount(3)}
                className='h-8 text-xs font-medium gap-1.5 cursor-pointer hover:bg-muted'
              >
                <span>See Less</span>
              </Button>
            )}
          </div>
        )}

        {/* Footer info banner */}
        <div className='px-4 py-2 bg-muted/10 border-t flex items-center justify-between text-xs text-muted-foreground'>
          <span>
            TeleCRM WhatsApp History • Showing {displayedList.length} of{' '}
            {filteredList.length} messages
          </span>
          {primaryItem?.telecrm_url && (
            <a
              href={primaryItem.telecrm_url}
              target='_blank'
              rel='noopener noreferrer'
              className='text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium'
            >
              <span>Open in TeleCRM</span>
              <ExternalLink className='size-3' />
            </a>
          )}
        </div>

        {/* ================= Details Dialog (Full Message View) ================= */}
        <Dialog
          open={!!selectedItem}
          onOpenChange={(open) => !open && setSelectedItem(null)}
        >
          <DialogContent className='sm:max-w-lg max-h-[85vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2 text-base font-semibold'>
                <MessageSquare className='size-4 text-emerald-600' />
                <span>WhatsApp Message Details</span>
              </DialogTitle>
            </DialogHeader>

            {selectedItem && (
              <div className='space-y-4 py-2 text-xs'>
                {/* Meta details grid */}
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-muted/40 rounded-xl p-3.5 border border-border/60'>
                  <div>
                    <span className='text-muted-foreground font-medium block'>
                      Type:
                    </span>
                    <span className='font-mono font-semibold text-foreground'>
                      {selectedItem.type || '—'}
                    </span>
                  </div>

                  <div>
                    <span className='text-muted-foreground font-medium block'>
                      Msg Type:
                    </span>
                    <span className='font-mono font-semibold text-foreground'>
                      {selectedItem.msgType || selectedItem.wa_msg_type || 'TEXT'}
                    </span>
                  </div>

                  <div>
                    <span className='text-muted-foreground font-medium block'>
                      Lead Phone:
                    </span>
                    <span className='font-mono font-medium text-foreground'>
                      {formatPhone(selectedItem.lead_phone)}
                    </span>
                  </div>

                  <div>
                    <span className='text-muted-foreground font-medium block'>
                      Assignee Phone:
                    </span>
                    <span className='font-mono font-medium text-foreground'>
                      {formatPhone(selectedItem.assignee_phone_number)}
                    </span>
                  </div>

                  <div>
                    <span className='text-muted-foreground font-medium block'>
                      Assignee Name:
                    </span>
                    <span className='font-medium text-foreground'>
                      {formatActorName(
                        selectedItem.assignee_email || selectedItem.lead_assignee,
                      )}
                    </span>
                  </div>

                  <div>
                    <span className='text-muted-foreground font-medium block'>
                      Timestamp:
                    </span>
                    <span className='font-medium text-foreground'>
                      {formatCreationTimestamp(
                        selectedItem.created_on ||
                          selectedItem.creation_timestamp ||
                          selectedItem.created_at,
                      )}
                    </span>
                  </div>
                </div>

                {/* Primary Message Content */}
                <div className='flex flex-col gap-1.5'>
                  <div className='flex items-center justify-between'>
                    <span className='font-semibold text-foreground flex items-center gap-1.5'>
                      <FileText className='size-3.5 text-emerald-600' />
                      Message Content (messageText):
                    </span>
                    {(selectedItem.messageText || selectedItem.wa_msg_txt) && (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                          handleCopy(
                            selectedItem.messageText || selectedItem.wa_msg_txt || '',
                            'modal-msg',
                          )
                        }
                        className='h-6 text-[11px] gap-1 px-2 text-muted-foreground hover:text-foreground cursor-pointer'
                      >
                        {copiedId === 'modal-msg' ? (
                          <Check className='size-3 text-emerald-600' />
                        ) : (
                          <Copy className='size-3' />
                        )}
                        Copy
                      </Button>
                    )}
                  </div>
                  <div className='bg-muted/30 border border-border/70 rounded-xl p-3.5 text-foreground whitespace-pre-wrap leading-relaxed select-text max-h-48 overflow-y-auto'>
                    {selectedItem.messageText ||
                      selectedItem.wa_msg_txt ||
                      'No message text.'}
                  </div>
                </div>

                {/* Secondary wa_msg_txt if different */}
                {selectedItem.wa_msg_txt &&
                  selectedItem.wa_msg_txt !== selectedItem.messageText && (
                    <div className='flex flex-col gap-1.5'>
                      <span className='font-semibold text-foreground flex items-center gap-1.5'>
                        <MessageSquare className='size-3.5 text-blue-600' />
                        WhatsApp Msg Text (wa_msg_txt):
                      </span>
                      <div className='bg-muted/30 border border-border/70 rounded-xl p-3.5 text-foreground whitespace-pre-wrap leading-relaxed select-text max-h-36 overflow-y-auto'>
                        {selectedItem.wa_msg_txt}
                      </div>
                    </div>
                  )}

                {/* TeleCRM Lead Link */}
                {selectedItem.telecrm_url && (
                  <div className='flex items-center justify-between bg-muted/40 p-3 rounded-xl border border-border/60'>
                    <span className='text-muted-foreground'>TeleCRM Lead:</span>
                    <a
                      href={selectedItem.telecrm_url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='inline-flex items-center gap-1 text-emerald-600 hover:underline font-medium'
                    >
                      <span>Open Lead in TeleCRM</span>
                      <ExternalLink className='size-3' />
                    </a>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
