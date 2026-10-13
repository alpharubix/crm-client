import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Megaphone,
  Phone,
  RefreshCw,
  Copy,
  Check,
  CheckCheck,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronDown,
  Clock,
  FileText,
  Loader2,
  ExternalLink,
  MessageSquare,
  Info,
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
import { fetchMessagesByPhone } from '@/api/whatsapp';
import type { WhatsAppMessage } from '@/types/whatsapp';
import { formatFullIST, formatStatusHistoryIST, parseUTCDate } from '@/lib/date-utils';
import { WhatsAppAudioPlayer } from '@/components/whatsapp/whatsapp-audio-player';
import { ImagePreviewModal } from '@/components/whatsapp/image-preview-modal';
import { ENV } from '@/conf';

export interface BroadcastMessagesTabProps {
  leadPhone?: string | null;
  accountName?: string | null;
  contacts?: Array<{
    id?: number | string;
    contact_name?: string;
    name?: string;
    phone?: string;
    mobile?: string;
  }>;
  hideHeaderCard?: boolean;
  onTotalCountChange?: (count: number) => void;
  // External filter & refresh synchronization
  activeFilter?: 'all' | 'outgoing' | 'incoming';
  refreshTrigger?: number;
  onCountsChange?: (counts: { total: number; outgoing: number; incoming: number }) => void;
  onLoadingChange?: (loading: boolean) => void;
}

const PAGE_SIZE = 50;

function formatPhone(phoneStr?: string | null): string {
  if (!phoneStr) return '—';
  const clean = String(phoneStr).trim().replace(/\D/g, '');
  if (clean.length === 12 && clean.startsWith('91')) {
    return `+91 ${clean.slice(2, 7)} ${clean.slice(7)}`;
  }
  if (clean.length === 10) {
    return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
  }
  return String(phoneStr);
}

function getRelativeTimeString(isoString?: string | null): string {
  const d = parseUTCDate(isoString);
  if (!d) return '—';
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  if (diffMs < 0) return 'just now';
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 30) return `${diffDays}d`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo`;
  return `${Math.floor(diffMonths / 12)}y`;
}

function getMessagePreviewText(msg: WhatsAppMessage): string {
  const isTemplate = msg.type === 'template';
  const content = msg.content || {};

  if (isTemplate) {
    if (content.rendered?.body) return content.rendered.body;
    if (content.text) return content.text;
    if (content.components) {
      const bodyComp = content.components.find(
        (c: any) => c.type === 'body' || c.type === 'BODY',
      );
      if (bodyComp?.parameters?.[0]?.text) {
        return bodyComp.parameters[0].text;
      }
      if (bodyComp?.text) {
        return bodyComp.text;
      }
    }
    if (content.template_name) {
      return `Template: ${content.template_name}`;
    }
    return 'Broadcast Template Message';
  }

  if (msg.type === 'text') {
    return content.text || 'Text Message';
  }

  if (msg.type === 'image') {
    return content.caption ? `📷 ${content.caption}` : '📷 Image';
  }

  if (msg.type === 'audio') {
    return '🎵 Audio Message';
  }

  if (msg.type === 'document') {
    return content.filename ? `📄 ${content.filename}` : '📄 Document';
  }

  if (msg.type === 'interactive_reply') {
    return content.title || content.button_id || 'Interactive Reply';
  }

  return content.text || `${msg.type} message`;
}

function getMessageTextForCopy(msg: WhatsAppMessage | null): string {
  if (!msg) return '';
  if (msg.type === 'template') {
    return (
      msg.content?.rendered?.body ||
      msg.content?.text ||
      (msg.content?.components?.find((c: any) => c.type === 'body' || c.type === 'BODY')
        ?.parameters?.[0]?.text) ||
      msg.content?.template_name ||
      ''
    );
  }
  return msg.content?.text || msg.content?.caption || '';
}

export default function BroadcastMessagesTab({
  leadPhone,
  accountName,
  contacts = [],
  hideHeaderCard = false,
  onTotalCountChange,
  activeFilter,
  refreshTrigger,
  onCountsChange,
  onLoadingChange,
}: BroadcastMessagesTabProps) {
  // Available phones
  const availablePhones = useMemo(() => {
    const list: Array<{ label: string; phone: string }> = [];
    if (leadPhone) {
      list.push({ label: `${accountName || 'Account'} Primary`, phone: String(leadPhone) });
    }
    contacts.forEach((c) => {
      const p = c.phone || c.mobile;
      if (p && !list.some((item) => item.phone === p)) {
        list.push({
          label: c.contact_name || c.name || 'Contact',
          phone: String(p),
        });
      }
    });
    return list;
  }, [leadPhone, accountName, contacts]);

  const [selectedPhone, setSelectedPhone] = useState<string>(
    leadPhone || availablePhones[0]?.phone || '',
  );

  useEffect(() => {
    if (leadPhone && !selectedPhone) {
      setSelectedPhone(leadPhone);
    }
  }, [leadPhone, selectedPhone]);

  // Messages state
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Local filter fallback if not controlled by parent
  const [localFilter, setLocalFilter] = useState<'all' | 'outgoing' | 'incoming'>('all');
  const currentFilter = activeFilter || localFilter;

  // Modals & interaction
  const [selectedItem, setSelectedItem] = useState<WhatsAppMessage | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; caption?: string } | null>(null);

  // Refs for parent callbacks to prevent infinite re-render loops
  const onCountsChangeRef = useRef(onCountsChange);
  onCountsChangeRef.current = onCountsChange;

  const onTotalCountChangeRef = useRef(onTotalCountChange);
  onTotalCountChangeRef.current = onTotalCountChange;

  const onLoadingChangeRef = useRef(onLoadingChange);
  onLoadingChangeRef.current = onLoadingChange;

  // Load initial messages
  const loadInitialMessages = useCallback(async () => {
    if (!selectedPhone) {
      setMessages([]);
      setTotalCount(0);
      setHasMore(false);
      onCountsChangeRef.current?.({ total: 0, outgoing: 0, incoming: 0 });
      onTotalCountChangeRef.current?.(0);
      return;
    }

    setIsLoading(true);
    onLoadingChangeRef.current?.(true);
    setError(null);
    try {
      const res = await fetchMessagesByPhone({
        phone: selectedPhone,
        limit: PAGE_SIZE,
        skip: 0,
      });

      const list = res.data || [];
      setMessages(list);
      setTotalCount(res.total);
      setHasMore(res.has_more);

      // Compute counts for All, Outgoing, Incoming
      const outCount = list.filter((m) => m.direction === 'outbound').length;
      const inCount = list.filter((m) => m.direction === 'inbound').length;
      const totalInDB = res.total ?? list.length;

      onCountsChangeRef.current?.({
        total: totalInDB,
        outgoing: outCount,
        incoming: inCount,
      });
      onTotalCountChangeRef.current?.(totalInDB);
    } catch (err: any) {
      console.error('Failed to load broadcast messages:', err);
      setError(err?.message || 'Failed to load broadcast messages');
    } finally {
      setIsLoading(false);
      onLoadingChangeRef.current?.(false);
    }
  }, [selectedPhone]);

  // Trigger on phone change or refreshTrigger
  useEffect(() => {
    loadInitialMessages();
  }, [loadInitialMessages, refreshTrigger]);

  // Load more from MongoDB
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore || !selectedPhone) return;

    setIsLoadingMore(true);
    try {
      const res = await fetchMessagesByPhone({
        phone: selectedPhone,
        limit: PAGE_SIZE,
        skip: messages.length,
      });

      const nextList = [...messages, ...(res.data || [])];
      setMessages(nextList);
      setTotalCount(res.total);
      setHasMore(res.has_more);

      const outCount = nextList.filter((m) => m.direction === 'outbound').length;
      const inCount = nextList.filter((m) => m.direction === 'inbound').length;

      onCountsChange?.({
        total: res.total ?? nextList.length,
        outgoing: outCount,
        incoming: inCount,
      });
      onTotalCountChange?.(res.total);
    } catch (err: any) {
      console.error('Failed to load more broadcast messages:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter messages list
  const filteredList = useMemo(() => {
    return messages.filter((m) => {
      if (currentFilter === 'outgoing') return m.direction === 'outbound';
      if (currentFilter === 'incoming') return m.direction === 'inbound';
      return true;
    });
  }, [messages, currentFilter]);

  return (
    <TooltipProvider delayDuration={150}>
      <div className='flex flex-col'>
        {/* ================= Optional Standalone Header (Only if hideHeaderCard is false) ================= */}
        {!hideHeaderCard && (
          <div className='p-4 border-b bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-4'>
            <div className='flex flex-wrap items-center gap-3'>
              <div className='flex items-center gap-2 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-md text-sm font-semibold'>
                <Megaphone className='size-4 text-emerald-600 dark:text-emerald-400' />
                <span>Broadcast Msg</span>
                <span className='text-[11px] px-1.5 py-0.5 rounded-full font-medium bg-emerald-500/20 text-emerald-800 dark:text-emerald-200'>
                  {totalCount}
                </span>
              </div>

              {availablePhones.length > 1 ? (
                <div className='flex items-center gap-1.5 bg-background border px-2.5 py-1 rounded-md text-xs font-medium'>
                  <Phone className='size-3 text-muted-foreground' />
                  <select
                    value={selectedPhone}
                    onChange={(e) => setSelectedPhone(e.target.value)}
                    className='bg-transparent border-0 text-foreground text-xs font-medium focus:outline-none cursor-pointer pr-1'
                  >
                    {availablePhones.map((item, idx) => (
                      <option key={idx} value={item.phone}>
                        {item.label}: {item.phone}
                      </option>
                    ))}
                  </select>
                </div>
              ) : selectedPhone ? (
                <div className='flex items-center gap-2 bg-background border px-3 py-1.5 rounded-md text-sm font-medium'>
                  <Phone className='size-3.5 text-muted-foreground' />
                  <span className='font-semibold text-foreground tracking-wide font-mono'>
                    {formatPhone(selectedPhone)}
                  </span>
                  <button
                    type='button'
                    onClick={() => handleCopy(selectedPhone, 'header-phone')}
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
              ) : null}
            </div>

            {/* Standalone Filter Pills & Refresh */}
            <div className='flex items-center gap-2 self-start md:self-auto flex-wrap'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={loadInitialMessages}
                disabled={isLoading}
                className='h-7 text-xs flex items-center gap-1.5 cursor-pointer'
                title='Refresh broadcast messages from MongoDB'
              >
                <RefreshCw
                  className={`size-3 ${isLoading ? 'animate-spin text-emerald-600' : ''}`}
                />
                <span>Refresh</span>
              </Button>

              <div className='flex items-center gap-1 bg-muted/50 p-1 rounded-lg border text-xs'>
                {(
                  [
                    { id: 'all', label: 'All', count: totalCount },
                    {
                      id: 'outgoing',
                      label: 'Outgoing',
                      count: messages.filter((m) => m.direction === 'outbound').length,
                    },
                    {
                      id: 'incoming',
                      label: 'Incoming',
                      count: messages.filter((m) => m.direction === 'inbound').length,
                    },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type='button'
                    onClick={() => setLocalFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1.5 cursor-pointer ${
                      currentFilter === tab.id
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
        )}

        {/* ================= Broadcast Message List (Static height, inside scrollable) ================= */}
        <div className='h-[420px] overflow-y-auto divide-y divide-border/60'>
          {isLoading ? (
            <div className='p-8 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground'>
              <Loader2 className='size-5 animate-spin text-emerald-600' />
              <span>Fetching broadcast messages from MongoDB...</span>
            </div>
          ) : !selectedPhone ? (
            <div className='p-8 text-center text-sm text-muted-foreground space-y-2'>
              <Phone className='size-8 text-muted-foreground/40 mx-auto mb-2' />
              <p className='font-medium text-foreground'>No phone number linked to this account</p>
              <p className='text-xs text-muted-foreground'>
                Add a phone number to this account or contact to view broadcast WhatsApp messages.
              </p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className='p-8 text-center text-sm text-muted-foreground space-y-2'>
              <MessageSquare className='size-8 text-muted-foreground/40 mx-auto mb-2' />
              <p className='font-medium text-foreground'>
                No broadcast WhatsApp records found
                {selectedPhone ? ` for phone ${formatPhone(selectedPhone)}` : ''}.
              </p>
              <p className='text-xs text-muted-foreground'>
                {currentFilter === 'outgoing'
                  ? 'No outgoing broadcast campaigns sent to this number.'
                  : currentFilter === 'incoming'
                  ? 'No incoming customer replies received from this number.'
                  : 'No WhatsApp messages or campaigns have been recorded yet.'}
              </p>
              {error && <p className='text-xs text-rose-500'>{error}</p>}
            </div>
          ) : (
            filteredList.map((msg, index) => {
              const isOutgoing = msg.direction === 'outbound';
              const messageText = getMessagePreviewText(msg);
              const msgType = msg.type || 'TEXT';
              const rawTimestamp =
                msg.timestamp ||
                msg.created_at ||
                (msg.status_history && msg.status_history.length > 0
                  ? msg.status_history[0].timestamp
                  : null);
              const formattedTimestamp = formatFullIST(rawTimestamp) || '—';
              const relativeTime = getRelativeTimeString(rawTimestamp);
              const initials = isOutgoing ? 'BC' : 'IN';

              return (
                <div
                  key={msg.id || msg._id || index}
                  onClick={() => setSelectedItem(msg)}
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
                          title='BROADCAST_OUTGOING_MSG'
                        >
                          <ArrowUpRight className='size-3 shrink-0' />
                          <span>Outgoing</span>
                        </Badge>
                      ) : (
                        <Badge
                          variant='outline'
                          className='bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800 text-[11px] font-semibold gap-1 px-2 py-0.5 whitespace-nowrap'
                          title='CUSTOMER_INCOMING_MSG'
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
                                setSelectedItem(msg);
                              }}
                              className='text-muted-foreground/60 hover:text-foreground transition-colors p-0.5 cursor-pointer shrink-0'
                            >
                              <Info className='size-3.5' />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side='top'>
                            View full broadcast details
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      {/* Bottom Line: Msg Type, Status with Checkmarks, IST Timestamp */}
                      <div className='flex items-center flex-wrap gap-2 text-[11px] text-muted-foreground'>
                        <Badge
                          variant='secondary'
                          className='text-[10px] font-mono uppercase px-1.5 py-0 bg-muted text-foreground/80'
                        >
                          {msgType}
                        </Badge>

                        {/* Status with Checkmarks */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className='inline-flex items-center gap-1 text-[11px] font-medium cursor-help'>
                              {msg.status === 'read' ? (
                                <>
                                  <CheckCheck className='size-3.5 text-sky-500' />
                                  <span className='text-sky-700 dark:text-sky-400 font-semibold'>
                                    Read
                                  </span>
                                </>
                              ) : msg.status === 'delivered' ? (
                                <>
                                  <CheckCheck className='size-3.5 text-slate-500' />
                                  <span className='text-slate-700 dark:text-slate-300'>
                                    Delivered
                                  </span>
                                </>
                              ) : msg.status === 'sent' || msg.status === 'sent_to_meta' ? (
                                <>
                                  <Check className='size-3.5 text-slate-500' />
                                  <span className='text-slate-700 dark:text-slate-300'>
                                    Sent
                                  </span>
                                </>
                              ) : msg.status === 'failed' ? (
                                <>
                                  <AlertCircle className='size-3.5 text-rose-500' />
                                  <span className='text-rose-600 font-semibold'>Failed</span>
                                </>
                              ) : (
                                <span className='text-muted-foreground capitalize'>{msg.status}</span>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side='top' className='text-xs whitespace-pre-line'>
                            {formatStatusHistoryIST(msg.status_history) || `Status: ${msg.status}`}
                          </TooltipContent>
                        </Tooltip>

                        <span>•</span>

                        <span>{formattedTimestamp}</span>

                      </div>
                    </div>
                  </div>

                  {/* Right Section: Relative Time & Avatar Badge */}
                  <div className='flex items-center gap-2.5 shrink-0 pl-2'>
                    {/* Relative Time */}
                    <span className='text-xs text-muted-foreground font-medium whitespace-nowrap'>
                      {relativeTime}
                    </span>

                    {/* Avatar Badge */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className='size-7 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 font-semibold text-xs flex items-center justify-center border border-emerald-200 dark:border-emerald-800 shadow-2xs shrink-0'>
                          {initials}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side='left'>
                        <p className='font-medium'>
                          {isOutgoing
                            ? msg.content?.template_name
                              ? `Template: ${msg.content.template_name}`
                              : 'Broadcast Campaign'
                            : `Customer: ${formatPhone(msg.customer_wa_id)}`}
                        </p>
                        <p className='text-[11px] text-muted-foreground'>
                          {isOutgoing ? 'Meta WhatsApp Cloud Broadcast' : 'Customer WhatsApp Reply'}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ================= Footer Info Banner ================= */}
        <div className='px-4 py-2 bg-muted/10 border-t flex items-center justify-between text-xs text-muted-foreground'>
          <span>
            Showing {filteredList.length} of{' '}
            {totalCount || messages.length} messages
          </span>
          {hasMore && (
            <button
              type='button'
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className='text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium cursor-pointer text-xs disabled:opacity-50'
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className='size-3 animate-spin' />
                  <span>Loading more...</span>
                </>
              ) : (
                <span>Load more ({totalCount - messages.length} remaining)</span>
              )}
            </button>
          )}
        </div>

        {/* ================= Details Dialog (Full Broadcast Message View) ================= */}
        <Dialog
          open={!!selectedItem}
          onOpenChange={(open) => !open && setSelectedItem(null)}
        >
          <DialogContent className='sm:max-w-lg max-h-[85vh] overflow-y-auto'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-2 text-base font-semibold'>
                <Megaphone className='size-4 text-emerald-600' />
                <span>Broadcast Message Details</span>
              </DialogTitle>
            </DialogHeader>

            {selectedItem && (
              <div className='space-y-4 py-2 text-xs'>
                {/* Meta details grid */}
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-muted/40 rounded-xl p-3.5 border border-border/60'>
                  <div>
                    <span className='text-muted-foreground font-medium block'>
                      Direction:
                    </span>
                    <span className='font-mono font-semibold text-foreground capitalize'>
                      {selectedItem.direction === 'outbound'
                        ? 'Broadcast / Outbound'
                        : 'Customer Reply / Inbound'}
                    </span>
                  </div>

                  <div>
                    <span className='text-muted-foreground font-medium block'>
                      Msg Type:
                    </span>
                    <span className='font-mono font-semibold text-foreground uppercase'>
                      {selectedItem.type || 'TEXT'}
                    </span>
                  </div>

                  <div>
                    <span className='text-muted-foreground font-medium block'>
                      Customer Phone:
                    </span>
                    <span className='font-mono font-medium text-foreground'>
                      {formatPhone(selectedItem.customer_wa_id)}
                    </span>
                  </div>

                  <div>
                    <span className='text-muted-foreground font-medium block'>
                      Status:
                    </span>
                    <span className='font-semibold text-foreground capitalize flex items-center gap-1.5'>
                      {selectedItem.status === 'read' ? (
                        <>
                          <CheckCheck className='size-3.5 text-sky-500' />
                          <span className='text-sky-700 dark:text-sky-400'>Read</span>
                        </>
                      ) : selectedItem.status === 'delivered' ? (
                        <>
                          <CheckCheck className='size-3.5 text-slate-500' />
                          <span>Delivered</span>
                        </>
                      ) : selectedItem.status === 'sent' ||
                        selectedItem.status === 'sent_to_meta' ? (
                        <>
                          <Check className='size-3.5 text-slate-500' />
                          <span>Sent</span>
                        </>
                      ) : selectedItem.status === 'failed' ? (
                        <>
                          <AlertCircle className='size-3.5 text-rose-500' />
                          <span className='text-rose-600'>Failed</span>
                        </>
                      ) : (
                        selectedItem.status
                      )}
                    </span>
                  </div>

                  <div>
                    <span className='text-muted-foreground font-medium block'>
                      Timestamp (IST):
                    </span>
                    <span className='font-medium text-foreground'>
                      {formatFullIST(
                        selectedItem.timestamp ||
                          selectedItem.created_at ||
                          selectedItem.status_history?.[0]?.timestamp,
                      )}
                    </span>
                  </div>

                  {selectedItem.content?.template_name && (
                    <div>
                      <span className='text-muted-foreground font-medium block'>
                        Template:
                      </span>
                      <span className='font-medium text-foreground'>
                        {selectedItem.content.template_name}
                      </span>
                    </div>
                  )}

                </div>

                {/* Primary Message Content */}
                <div className='flex flex-col gap-1.5'>
                  <div className='flex items-center justify-between'>
                    <span className='font-semibold text-foreground flex items-center gap-1.5'>
                      <FileText className='size-3.5 text-emerald-600' />
                      Message Content:
                    </span>
                    {getMessageTextForCopy(selectedItem) && (
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                          handleCopy(getMessageTextForCopy(selectedItem), 'modal-msg')
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

                  {/* Render content based on type */}
                  {selectedItem.type === 'template' ? (
                    <div className='rounded-xl border border-emerald-200/80 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-900/60 p-3.5 space-y-2'>
                      <div className='flex items-center justify-between text-xs font-semibold text-emerald-900 dark:text-emerald-300'>
                        <span className='flex items-center gap-1.5'>
                          <FileText className='size-3.5 text-emerald-600' />
                          Template: {selectedItem.content?.template_name || 'Approved Template'}
                        </span>
                        {selectedItem.content?.language && (
                          <Badge variant='outline' className='text-[10px] px-1.5 py-0 uppercase'>
                            {selectedItem.content.language}
                          </Badge>
                        )}
                      </div>
                      <div className='text-xs text-foreground whitespace-pre-wrap leading-relaxed font-normal bg-background/80 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/40'>
                        {selectedItem.content?.rendered?.body ||
                          selectedItem.content?.text ||
                          (selectedItem.content?.components?.find(
                            (c: any) => c.type === 'body' || c.type === 'BODY',
                          )?.parameters?.[0]?.text) ||
                          'Template message delivered to customer'}
                      </div>
                      {selectedItem.content?.rendered?.buttons &&
                        selectedItem.content.rendered.buttons.length > 0 && (
                          <div className='pt-1.5 flex flex-wrap gap-1.5'>
                            {selectedItem.content.rendered.buttons.map(
                              (btn: any, bi: number) => (
                                <div
                                  key={bi}
                                  className='text-center py-1 px-3 rounded-lg bg-white/90 dark:bg-slate-800 border border-emerald-200 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px] shadow-2xs'
                                >
                                  {btn.title || btn.id}
                                </div>
                              ),
                            )}
                          </div>
                        )}
                    </div>
                  ) : selectedItem.type === 'image' && selectedItem.content?.media_id ? (
                    <div className='space-y-1.5'>
                      <div
                        className='group relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 max-h-56 flex items-center justify-center cursor-pointer border border-border'
                        onClick={() =>
                          setPreviewImage({
                            url: `${ENV.VITE_BACKEND_BASE_URL || 'http://localhost:8080'}/api/v1/whatsapp/media/${selectedItem.content.media_id}`,
                            caption: selectedItem.content.caption,
                          })
                        }
                      >
                        <img
                          src={`${ENV.VITE_BACKEND_BASE_URL || 'http://localhost:8080'}/api/v1/whatsapp/media/${selectedItem.content.media_id}`}
                          alt={selectedItem.content.caption || 'WhatsApp Image'}
                          className='max-h-56 w-full object-contain rounded-xl'
                        />
                      </div>
                      {selectedItem.content.caption && (
                        <p className='text-xs text-muted-foreground'>
                          {selectedItem.content.caption}
                        </p>
                      )}
                    </div>
                  ) : selectedItem.type === 'audio' && selectedItem.content?.media_id ? (
                    <WhatsAppAudioPlayer
                      src={`${ENV.VITE_BACKEND_BASE_URL || 'http://localhost:8080'}/api/v1/whatsapp/media/${selectedItem.content.media_id}`}
                      isOutbound={selectedItem.direction === 'outbound'}
                    />
                  ) : selectedItem.type === 'document' && selectedItem.content?.media_id ? (
                    <a
                      href={`${ENV.VITE_BACKEND_BASE_URL || 'http://localhost:8080'}/api/v1/whatsapp/media/${selectedItem.content.media_id}`}
                      target='_blank'
                      rel='noreferrer'
                      className='inline-flex items-center gap-2 p-2.5 rounded-xl bg-muted/60 hover:bg-muted transition-colors text-foreground font-medium text-xs border'
                    >
                      <span className='text-lg'>📄</span>
                      <span className='truncate underline'>
                        {selectedItem.content.filename || 'Download Document'}
                      </span>
                      <ExternalLink className='size-3 text-muted-foreground ml-1' />
                    </a>
                  ) : (
                    <div className='bg-muted/30 border border-border/70 rounded-xl p-3.5 text-foreground whitespace-pre-wrap leading-relaxed select-text max-h-48 overflow-y-auto'>
                      {selectedItem.content?.text || JSON.stringify(selectedItem.content)}
                    </div>
                  )}
                </div>

                {/* Status History Timeline */}
                {selectedItem.status_history && selectedItem.status_history.length > 0 && (
                  <div className='space-y-1.5 pt-1'>
                    <span className='font-semibold text-foreground flex items-center gap-1.5'>
                      <Clock className='size-3.5 text-emerald-600' />
                      Delivery Timeline:
                    </span>
                    <div className='bg-muted/30 border border-border/70 rounded-xl p-3 space-y-2'>
                      {selectedItem.status_history.map((sh, idx) => (
                        <div key={idx} className='flex items-center justify-between text-[11px]'>
                          <span className='capitalize font-medium text-foreground flex items-center gap-1.5'>
                            {sh.status === 'read' ? (
                              <CheckCheck className='size-3 text-sky-500' />
                            ) : sh.status === 'delivered' ? (
                              <CheckCheck className='size-3 text-slate-500' />
                            ) : sh.status === 'sent' || sh.status === 'sent_to_meta' ? (
                              <Check className='size-3 text-slate-500' />
                            ) : sh.status === 'failed' ? (
                              <AlertCircle className='size-3 text-rose-500' />
                            ) : null}
                            {sh.status === 'sent_to_meta' ? 'Sent to Meta' : sh.status}
                          </span>
                          <span className='font-mono text-muted-foreground'>
                            {formatFullIST(sh.timestamp)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Image Preview Lightbox */}
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
