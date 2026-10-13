import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Calendar,
  FileText,
  Loader2,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { fetchMessagesByPhone } from '@/api/whatsapp';
import type { WhatsAppMessage } from '@/types/whatsapp';
import { formatFullIST, formatISTTime, formatStatusHistoryIST } from '@/lib/date-utils';
import { WhatsAppAudioPlayer } from '@/components/whatsapp/whatsapp-audio-player';
import { ImagePreviewModal } from '@/components/whatsapp/image-preview-modal';

interface BroadcastMessagesTabProps {
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
}

const PAGE_SIZE = 6;

export default function BroadcastMessagesTab({
  leadPhone,
  accountName,
  contacts = [],
  hideHeaderCard = false,
  onTotalCountChange,
}: BroadcastMessagesTabProps) {
  // Collect all available phone numbers for this account
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
    leadPhone || availablePhones[0]?.phone || ''
  );

  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState<'all' | 'outbound' | 'inbound'>('all');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Image lightbox preview modal
  const [previewImage, setPreviewImage] = useState<{ url: string; caption?: string } | null>(null);

  useEffect(() => {
    if (leadPhone && !selectedPhone) {
      setSelectedPhone(leadPhone);
    }
  }, [leadPhone, selectedPhone]);

  // Initial load or phone change: load first 6 messages
  const loadInitialMessages = useCallback(async () => {
    if (!selectedPhone) {
      setMessages([]);
      setTotalCount(0);
      setHasMore(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchMessagesByPhone({
        phone: selectedPhone,
        limit: PAGE_SIZE,
        skip: 0,
        direction: activeFilter === 'all' ? undefined : activeFilter,
      });

      setMessages(res.data);
      setTotalCount(res.total);
      setHasMore(res.has_more);
      onTotalCountChange?.(res.total);
    } catch (err: any) {
      console.error('Failed to load broadcast messages:', err);
      setError(err?.message || 'Failed to load broadcast messages');
    } finally {
      setIsLoading(false);
    }
  }, [selectedPhone, activeFilter, onTotalCountChange]);

  // Load more: fetch 6 extra messages and append
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore || !selectedPhone) return;

    setIsLoadingMore(true);
    try {
      const res = await fetchMessagesByPhone({
        phone: selectedPhone,
        limit: PAGE_SIZE,
        skip: messages.length,
        direction: activeFilter === 'all' ? undefined : activeFilter,
      });

      setMessages((prev) => [...prev, ...res.data]);
      setTotalCount(res.total);
      setHasMore(res.has_more);
      onTotalCountChange?.(res.total);
    } catch (err: any) {
      console.error('Failed to load more broadcast messages:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    loadInitialMessages();
  }, [loadInitialMessages]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const remainingCount = Math.max(0, totalCount - messages.length);
  const nextIncrement = Math.min(PAGE_SIZE, remainingCount);

  return (
    <TooltipProvider delayDuration={150}>
      <div className={hideHeaderCard ? 'p-4 space-y-4' : 'space-y-4'}>
        {/* ================= Header Summary Bar ================= */}
        {hideHeaderCard ? (
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-muted/50 text-foreground font-medium text-xs px-2.5 py-1"
              >
                Total in DB: {totalCount}
              </Badge>
              {messages.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  (Showing {messages.length} of {totalCount})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={loadInitialMessages}
                disabled={isLoading}
                className="h-7 text-xs flex items-center gap-1.5 cursor-pointer"
                title="Refresh messages from MongoDB"
              >
                <RefreshCw className={`size-3 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
                <span>Refresh</span>
              </Button>

              <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border text-xs">
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'outbound', label: 'Broadcast' },
                    { id: 'inbound', label: 'Inbound' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilter(tab.id)}
                    className={`px-2 py-0.5 rounded-md transition-all font-medium text-xs cursor-pointer ${
                      activeFilter === tab.id
                        ? 'bg-background text-foreground shadow-xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border bg-card text-card-foreground shadow-xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Header Title Badge */}
              <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-sm font-semibold">
                <Megaphone className="size-4 text-emerald-600" />
                <span>Broadcast & WhatsApp Chats</span>
              </div>

              {/* Phone Selector / Display */}
              {availablePhones.length > 1 ? (
                <div className="flex items-center gap-1.5 bg-background border px-2.5 py-1 rounded-lg text-xs font-medium">
                  <Phone className="size-3.5 text-muted-foreground" />
                  <select
                    value={selectedPhone}
                    onChange={(e) => setSelectedPhone(e.target.value)}
                    className="bg-transparent border-0 text-foreground text-xs font-medium focus:outline-none cursor-pointer pr-2"
                  >
                    {availablePhones.map((item, idx) => (
                      <option key={idx} value={item.phone}>
                        {item.label}: {item.phone}
                      </option>
                    ))}
                  </select>
                </div>
              ) : selectedPhone ? (
                <div className="flex items-center gap-2 bg-background border px-3 py-1 rounded-lg text-xs font-medium">
                  <Phone className="size-3.5 text-muted-foreground" />
                  <span>+{selectedPhone}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedPhone, 'phone')}
                    className="text-muted-foreground hover:text-foreground transition-colors ml-0.5"
                    title="Copy Phone Number"
                  >
                    {copiedText === 'phone' ? (
                      <Check className="size-3 text-emerald-600" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                  </button>
                </div>
              ) : null}

              {/* Total Messages Count Badge */}
              <Badge
                variant="outline"
                className="bg-muted/50 text-foreground font-medium text-xs px-2.5 py-1"
              >
                Total in DB: {totalCount}
              </Badge>

              {messages.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  (Showing {messages.length} of {totalCount})
                </span>
              )}
            </div>

            {/* Action Buttons & Filter Tabs */}
            <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={loadInitialMessages}
                disabled={isLoading}
                className="h-8 text-xs flex items-center gap-1.5 cursor-pointer"
                title="Refresh messages from MongoDB"
              >
                <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
                <span>Refresh</span>
              </Button>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border text-xs">
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'outbound', label: 'Broadcast / Outbound' },
                    { id: 'inbound', label: 'Customer Inbound' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1.5 cursor-pointer text-xs ${
                      activeFilter === tab.id
                        ? 'bg-background text-foreground shadow-xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= Messages List ================= */}
        {isLoading ? (
          <div className="p-12 border rounded-xl bg-card flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="size-6 animate-spin text-emerald-600" />
            <span>Fetching broadcast messages from MongoDB messages collection...</span>
          </div>
        ) : !selectedPhone ? (
          <div className="p-12 border rounded-xl bg-card text-center text-sm text-muted-foreground">
            <Phone className="size-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="font-medium text-foreground">No phone number linked to this account</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add a phone number to this account or contact to view broadcast WhatsApp messages.
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="p-12 border rounded-xl bg-card text-center text-sm text-muted-foreground space-y-2">
            <MessageSquare className="size-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="font-medium text-foreground">No messages found for +{selectedPhone}</p>
            <p className="text-xs text-muted-foreground">
              No WhatsApp messages or campaigns have been sent or received for this number yet in MongoDB.
            </p>
            {error && <p className="text-xs text-rose-500">{error}</p>}
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, index) => {
              const isOutbound = msg.direction === 'outbound';
              const isTemplate = msg.type === 'template';
              const content = msg.content || {};
              const rawTimestamp =
                msg.timestamp ||
                (msg.status_history && msg.status_history.length > 0
                  ? msg.status_history[0].timestamp
                  : msg.created_at);

              const timeIST = formatISTTime(rawTimestamp);
              const fullIST = formatFullIST(rawTimestamp);
              const historyTooltip = formatStatusHistoryIST(msg.status_history);

              return (
                <Card
                  key={msg.id || msg._id || index}
                  className="overflow-hidden border border-border/80 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-800 transition-all"
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Top Row: Direction, Status, Timestamp & Meta Info */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Direction Badge */}
                        {isOutbound ? (
                          <Badge
                            variant="outline"
                            className="bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-[11px] font-semibold gap-1 px-2.5 py-0.5"
                          >
                            <ArrowUpRight className="size-3 text-emerald-600" />
                            <span>Broadcast / Outbound</span>
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800 text-[11px] font-semibold gap-1 px-2.5 py-0.5"
                          >
                            <ArrowDownLeft className="size-3 text-sky-600" />
                            <span>Customer Reply / Inbound</span>
                          </Badge>
                        )}

                        {/* Message Type Badge */}
                        <Badge
                          variant="secondary"
                          className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5"
                        >
                          {msg.type}
                        </Badge>

                        {/* Status with Checkmarks */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="inline-flex items-center gap-1 text-xs font-medium cursor-help px-2 py-0.5 rounded-md bg-muted/60">
                              {msg.status === 'read' ? (
                                <>
                                  <CheckCheck className="size-3.5 text-sky-500" />
                                  <span className="text-sky-700 dark:text-sky-400 font-semibold">Read</span>
                                </>
                              ) : msg.status === 'delivered' ? (
                                <>
                                  <CheckCheck className="size-3.5 text-slate-500" />
                                  <span className="text-slate-700 dark:text-slate-300">Delivered</span>
                                </>
                              ) : msg.status === 'sent' || msg.status === 'sent_to_meta' ? (
                                <>
                                  <Check className="size-3.5 text-slate-500" />
                                  <span className="text-slate-700 dark:text-slate-300">Sent</span>
                                </>
                              ) : msg.status === 'failed' ? (
                                <>
                                  <AlertCircle className="size-3.5 text-rose-500" />
                                  <span className="text-rose-600 font-semibold">Failed</span>
                                </>
                              ) : (
                                <span className="text-muted-foreground capitalize">{msg.status}</span>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs whitespace-pre-line">
                            {historyTooltip || `Status: ${msg.status}`}
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      {/* Right: IST Timestamp & WAMID */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 cursor-default font-mono text-[11px]">
                              <Clock className="size-3" />
                              <span>{timeIST}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            {fullIST}
                          </TooltipContent>
                        </Tooltip>

                        {msg.wamid && (
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.wamid!, `wamid-${msg.id || index}`)}
                            className="text-[10px] font-mono text-muted-foreground/80 hover:text-foreground flex items-center gap-1 transition-colors"
                            title="Copy Meta WAMID"
                          >
                            <span>wamid:...{msg.wamid.slice(-6)}</span>
                            {copiedText === `wamid-${msg.id || index}` ? (
                              <Check className="size-2.5 text-emerald-600" />
                            ) : (
                              <Copy className="size-2.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Middle: Rendered Message Body */}
                    <div className="text-sm">
                      {/* Template Card Content */}
                      {isTemplate && (
                        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-900/60 p-3.5 space-y-2">
                          <div className="flex items-center justify-between text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                            <span className="flex items-center gap-1.5">
                              <FileText className="size-3.5 text-emerald-600" />
                              Template: {content.template_name || 'Approved Template'}
                            </span>
                            {content.language && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 uppercase">
                                {content.language}
                              </Badge>
                            )}
                          </div>

                          {/* Rendered Body Text */}
                          <div className="text-xs text-foreground whitespace-pre-wrap leading-relaxed font-normal bg-background/80 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                            {content.rendered?.body ||
                              content.text ||
                              (content.components &&
                                content.components.find((c: any) => c.type === 'body')?.parameters?.[0]?.text) ||
                              'Template content delivered to recipient'}
                          </div>

                          {/* Rendered Buttons */}
                          {content.rendered?.buttons && content.rendered.buttons.length > 0 && (
                            <div className="pt-1.5 flex flex-wrap gap-1.5">
                              {content.rendered.buttons.map((btn: any, bi: number) => (
                                <div
                                  key={bi}
                                  className="text-center py-1 px-3 rounded-lg bg-white/90 dark:bg-slate-800 border border-emerald-200 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px] shadow-2xs"
                                >
                                  {btn.title || btn.id}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Plain Text Content */}
                      {!isTemplate && msg.type === 'text' && (
                        <div className="text-xs text-foreground whitespace-pre-wrap leading-relaxed bg-muted/30 p-3 rounded-xl border border-border/60">
                          {content.text || JSON.stringify(content)}
                        </div>
                      )}

                      {/* Image Message */}
                      {msg.type === 'image' && content.media_id && (
                        <div className="space-y-1.5 max-w-sm">
                          <div
                            className="group relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 max-h-56 flex items-center justify-center cursor-pointer border border-border shadow-2xs"
                            onClick={() =>
                              setPreviewImage({
                                url: `${import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8080'}/api/v1/whatsapp/media/${content.media_id}`,
                                caption: content.caption,
                              })
                            }
                            title="Click to view & zoom image"
                          >
                            <img
                              src={`${import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8080'}/api/v1/whatsapp/media/${content.media_id}`}
                              alt={content.caption || 'WhatsApp Image'}
                              className="max-h-56 w-full object-contain rounded-xl transition-transform duration-200 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                              <span className="bg-black/75 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
                                Click to zoom
                              </span>
                            </div>
                          </div>
                          {content.caption && (
                            <p className="text-xs text-muted-foreground">{content.caption}</p>
                          )}
                        </div>
                      )}

                      {/* Audio Message */}
                      {msg.type === 'audio' && content.media_id && (
                        <WhatsAppAudioPlayer
                          src={`${import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8080'}/api/v1/whatsapp/media/${content.media_id}`}
                          isOutbound={isOutbound}
                        />
                      )}

                      {/* Document Message */}
                      {msg.type === 'document' && content.media_id && (
                        <a
                          href={`${import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8080'}/api/v1/whatsapp/media/${content.media_id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 p-2.5 rounded-xl bg-muted/60 hover:bg-muted transition-colors text-foreground font-medium text-xs border"
                        >
                          <span className="text-lg">📄</span>
                          <span className="truncate underline">
                            {content.filename || 'Download Document'}
                          </span>
                          <ExternalLink className="size-3 text-muted-foreground ml-1" />
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* ================= Pagination: See More (+6 more) ================= */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                Showing {messages.length} of {totalCount} total messages
              </span>

              {hasMore ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="h-9 px-5 text-xs font-semibold rounded-xl border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin text-emerald-600" />
                      <span>Loading 6 more...</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="size-4 text-emerald-600" />
                      <span>See More (+{nextIncrement} more)</span>
                    </>
                  )}
                </Button>
              ) : (
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 px-3 py-1 rounded-full">
                  ✓ All {totalCount} messages loaded
                </span>
              )}
            </div>
          </div>
        )}

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
