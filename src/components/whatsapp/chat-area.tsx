import React, { useState, useRef, useEffect } from 'react';
import type {
  WhatsAppConversation,
  WhatsAppMessage,
  WhatsAppTemplate,
} from '@/types/whatsapp';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Send,
  Plus,
  MessageSquare,
  X,
  Star,
  Check,
  CheckCheck,
  ChevronRight,
  ChevronLeft,
  ZoomIn,
} from 'lucide-react';
import { WhatsAppAudioPlayer } from './whatsapp-audio-player';
import { ImagePreviewModal } from './image-preview-modal';
import {
  formatISTTime,
  formatFullIST,
  formatStatusHistoryIST,
} from '@/lib/date-utils';

interface ChatAreaProps {
  conversation: WhatsAppConversation | null;
  messages: WhatsAppMessage[];
  templates?: WhatsAppTemplate[];
  loading: boolean;
  onSendMessage: (text: string) => Promise<void>;
  onOpenTemplates: () => void;
  onCloseChat?: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  messages,
  templates = [],
  loading,
  onSendMessage,
  onOpenTemplates,
  onCloseChat,
}) => {
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    caption?: string;
  } | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (smooth = true) => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;
    setSending(true);
    const textToSend = inputText.trim();
    setInputText('');
    try {
      await onSendMessage(textToSend);
    } catch (err) {
      console.error(err);
      setInputText(textToSend);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessageTime = (isoString?: string) => {
    return formatISTTime(isoString);
  };

  if (!conversation) {
    return (
      <div className='flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-8 select-none'>
        <div className='w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 text-indigo-500 border border-slate-100'>
          <MessageSquare className='h-8 w-8' />
        </div>
        <h3 className='text-sm font-bold text-slate-700 mb-1'>
          No conversation selected
        </h3>
        <p className='text-xs text-slate-400 max-w-sm text-center'>
          Choose a lead from the left conversation list to view message history
          or start a conversation.
        </p>
      </div>
    );
  }

  const displayName = conversation.customer_name || conversation.customer_wa_id;

  return (
    <div className='flex-1 flex flex-col h-full bg-[#EFEAE2] relative overflow-hidden'>
      {/* 1. WhatsApp Doodle Pattern Background Overlay */}
      <div
        className='absolute inset-0 pointer-events-none opacity-[0.06] bg-repeat z-0'
        style={{
          backgroundImage: `radial-gradient(#4a5568 0.75px, transparent 0.75px), radial-gradient(#4a5568 0.75px, #EFEAE2 0.75px)`,
          backgroundSize: '30px 30px',
          backgroundPosition: '0 0, 15px 15px',
        }}
      />

      {/* 2. Top Lead Header matching TeleCRM Screenshot 1 */}
      <div className='h-14 px-4 bg-white/95 backdrop-blur-md border-b border-slate-200 flex items-center justify-between z-10 flex-shrink-0 shadow-sm'>
        <div className='flex items-center gap-3'>
          <div>
            <div className='flex items-center gap-2'>
              <span className='font-bold text-base text-indigo-950 tracking-tight'>
                {displayName}
              </span>
            </div>
            <div className='text-[11px] text-slate-400 font-mono'>
              +{conversation.customer_wa_id}
            </div>
          </div>
        </div>

        <div className='flex items-center gap-2'>
          {onCloseChat && (
            <Button
              variant='outline'
              size='sm'
              onClick={onCloseChat}
              className='h-8 text-xs font-semibold text-slate-600 rounded-lg border-slate-200 gap-1.5 hover:bg-slate-50'
            >
              <X className='h-3.5 w-3.5' />
              <span>Close Chat</span>
            </Button>
          )}
        </div>
      </div>

      {/* 3. Messages Stream Area */}
      <div
        ref={messagesContainerRef}
        className='flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 md:p-6 space-y-3 z-10'
      >
        {/* Date separator badge matching TeleCRM: "Today" */}
        <div className='flex justify-center my-2'>
          <span className='bg-white/80 backdrop-blur-sm text-slate-600 text-[11px] font-medium px-3 py-1 rounded-md shadow-xs border border-slate-100'>
            Today
          </span>
        </div>

        {loading ? (
          <div className='flex justify-center py-8'>
            <span className='text-xs text-slate-400 animate-pulse'>
              Loading messages...
            </span>
          </div>
        ) : messages.length === 0 ? (
          <div className='text-center py-12 text-slate-400 text-xs font-medium'>
            No messages yet. Send a template or text to start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isOutbound = msg.direction === 'outbound';
            const isTemplate = msg.type === 'template';
            const isInteractive = msg.type === 'interactive_reply';

            return (
              <div
                key={msg.id || msg._id}
                className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] md:max-w-[65%] rounded-2xl px-3.5 py-2.5 shadow-sm text-xs relative ${
                    msg.type === 'audio' ? 'min-w-[280px] sm:min-w-[320px]' : ''
                  } ${
                    isOutbound
                      ? 'bg-[#E7FFDB] text-slate-800 rounded-tr-none'
                      : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                  }`}
                >
                  {/* Quoted Message (WhatsApp reply-to context header) */}
                  {(() => {
                    const ctx =
                      msg.reply_to || (msg as any).raw_payload?.context;
                    if (!ctx) return null;

                    // Find parent message in local state or fallback to quoted_text
                    const parentMsg = messages.find(
                      (m) =>
                        (m.wamid && m.wamid === ctx.message_id) ||
                        (m.wamid && m.wamid === ctx.id),
                    );
                    const parentText =
                      ctx.quoted_text ||
                      (parentMsg?.type === 'template'
                        ? parentMsg.content?.rendered?.body ||
                          templates
                            ?.find(
                              (t) =>
                                t.name === parentMsg.content?.template_name,
                            )
                            ?.components?.find((c) => c.type === 'BODY')
                            ?.text ||
                          `Template: ${parentMsg.content?.template_name || ''}`
                        : parentMsg?.content?.text) ||
                      'Original message';
                    const parentSender =
                      ctx.quoted_from ||
                      (parentMsg?.direction === 'outbound'
                        ? 'R1Xchange'
                        : conversation?.customer_name ||
                          conversation?.customer_wa_id ||
                          'User');

                    return (
                      <div className='mb-2 p-2 rounded-lg bg-black/5 dark:bg-white/5 border-l-4 border-emerald-600 text-[11px] leading-snug select-none'>
                        <div className='font-bold text-emerald-700 flex items-center justify-between text-[10px]'>
                          <span>~{parentSender}</span>
                        </div>
                        <div className='text-slate-600 truncate mt-0.5 line-clamp-2'>
                          {parentText}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Template Card Rendering */}
                  {isTemplate &&
                    (() => {
                      const contentObj =
                        typeof msg.content === 'object' && msg.content !== null
                          ? msg.content
                          : {};
                      const templateName =
                        contentObj.template_name || 'Template';
                      const matchedTmpl = templates?.find(
                        (t) => t.name === templateName,
                      );
                      const bodyText =
                        contentObj.rendered?.body ||
                        matchedTmpl?.components?.find((c) => c.type === 'BODY')
                          ?.text ||
                        contentObj.text;
                      const headerText =
                        contentObj.rendered?.header ||
                        matchedTmpl?.components?.find(
                          (c) => c.type === 'HEADER',
                        )?.text;
                      const footerText =
                        contentObj.rendered?.footer ||
                        matchedTmpl?.components?.find(
                          (c) => c.type === 'FOOTER',
                        )?.text;
                      const buttons =
                        contentObj.rendered?.buttons ||
                        matchedTmpl?.components
                          ?.find((c) => c.type === 'BUTTONS')
                          ?.buttons?.map((b) => ({
                            id: b.text,
                            title: b.text,
                          }));

                      return (
                        <div className='space-y-1.5 mb-1'>
                          <div className='text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5'>
                            <span>📋</span>
                            <span>Template: {templateName}</span>
                          </div>
                          {headerText && (
                            <div className='font-bold text-xs text-slate-800'>
                              {headerText}
                            </div>
                          )}
                          <div className='whitespace-pre-wrap leading-relaxed text-slate-800 font-normal'>
                            {bodyText || (
                              <span className='italic text-slate-500'>
                                Template message sent to customer
                              </span>
                            )}
                          </div>
                          {footerText && (
                            <div className='text-[10px] text-slate-400 italic pt-0.5'>
                              {footerText}
                            </div>
                          )}
                          {/* Render Buttons */}
                          {buttons && buttons.length > 0 && (
                            <div className='pt-2 border-t border-emerald-100/80 space-y-1'>
                              {buttons.map((btn, bi) => (
                                <div
                                  key={bi}
                                  className='text-center py-1.5 px-3 rounded-lg bg-white/80 border border-emerald-200 text-emerald-800 font-semibold text-[11px]'
                                >
                                  {btn.title}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                  {/* Interactive Button / List Reply Rendering (render as natural clean text) */}
                  {isInteractive && (
                    <div className='whitespace-pre-wrap leading-relaxed break-words font-normal text-slate-900 text-xs'>
                      {msg.content?.text ||
                        msg.content?.title ||
                        'Button reply'}
                    </div>
                  )}

                  {/* Media Bubble: Image, Audio, Video, Document */}
                  {(msg.type === 'image' ||
                    msg.type === 'audio' ||
                    msg.type === 'video' ||
                    msg.type === 'document' ||
                    (msg.content && msg.content.media_id)) && (
                    <div className='space-y-2 mb-1'>
                      {msg.type === 'image' && (
                        <div
                          className='group relative rounded-xl overflow-hidden bg-slate-100 max-h-72 flex items-center justify-center cursor-pointer shadow-xs border border-black/5'
                          onClick={() =>
                            setPreviewImage({
                              url: `${import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8080'}/api/v1/whatsapp/media/${msg.content.media_id}`,
                              caption: msg.content?.caption,
                            })
                          }
                          title='Click to preview & zoom'
                        >
                          <img
                            src={`${import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8080'}/api/v1/whatsapp/media/${msg.content.media_id}`}
                            alt={msg.content?.caption || 'WhatsApp Image'}
                            className='max-h-72 w-full object-contain rounded-xl transition-transform duration-200 group-hover:scale-105'
                            onError={(e) => {
                              // Fallback display if media url not yet cached
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          {/* Hover Zoom Overlay Badge */}
                          <div className='absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none'>
                            <span className='bg-black/75 backdrop-blur-xs text-white text-[11px] font-medium px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg'>
                              <ZoomIn className='h-3.5 w-3.5 text-emerald-400' />{' '}
                              Click to view & zoom
                            </span>
                          </div>
                        </div>
                      )}

                      {msg.type === 'audio' && (
                        <WhatsAppAudioPlayer
                          src={`${import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8080'}/api/v1/whatsapp/media/${msg.content.media_id}`}
                          isOutbound={isOutbound}
                        />
                      )}

                      {msg.type === 'video' && (
                        <div className='rounded-xl overflow-hidden bg-black max-h-72'>
                          <video
                            controls
                            className='w-full max-h-72 rounded-xl'
                            src={`${import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8080'}/api/v1/whatsapp/media/${msg.content.media_id}`}
                          />
                        </div>
                      )}

                      {msg.type === 'document' && (
                        <a
                          href={`${import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8080'}/api/v1/whatsapp/media/${msg.content.media_id}`}
                          target='_blank'
                          rel='noreferrer'
                          className='flex items-center gap-2 p-2.5 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 transition-colors text-slate-800 font-medium'
                        >
                          <span className='text-xl'>📄</span>
                          <span className='truncate underline text-xs'>
                            {msg.content.filename || 'Download Document'}
                          </span>
                        </a>
                      )}

                      {/* Optional Media Caption */}
                      {msg.content?.caption && (
                        <div className='text-xs text-slate-800 whitespace-pre-wrap leading-relaxed mt-1'>
                          {msg.content.caption}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Plain Text Rendering */}
                  {!isTemplate &&
                    !isInteractive &&
                    msg.type !== 'image' &&
                    msg.type !== 'audio' &&
                    msg.type !== 'video' &&
                    msg.type !== 'document' &&
                    !msg.content?.media_id && (
                      <div className='whitespace-pre-wrap leading-relaxed break-words font-normal text-slate-900 text-xs'>
                        {msg.content?.text ||
                          (typeof msg.content === 'string'
                            ? msg.content
                            : JSON.stringify(msg.content))}
                      </div>
                    )}

                  {/* Message Meta Info: Timestamp & Double Checkmark */}
                  <div
                    className='flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400 select-none'
                    title={
                      formatStatusHistoryIST(msg.status_history) ||
                      formatFullIST(
                        msg.timestamp ||
                          msg.status_history?.[0]?.timestamp ||
                          msg.created_at,
                      )
                    }
                  >
                    <span>
                      {formatMessageTime(
                        msg.timestamp ||
                          msg.status_history?.[0]?.timestamp ||
                          msg.created_at,
                      )}
                    </span>
                    {isOutbound && (
                      <span
                        className='inline-flex items-center'
                        title={
                          formatStatusHistoryIST(msg.status_history) ||
                          `Status: ${msg.status}`
                        }
                      >
                        {msg.status === 'read' ? (
                          <CheckCheck className='h-3.5 w-3.5 text-sky-500' />
                        ) : msg.status === 'delivered' ? (
                          <CheckCheck className='h-3.5 w-3.5 text-slate-400' />
                        ) : msg.status === 'failed' ? (
                          <span className='text-red-500 font-bold'>!</span>
                        ) : (
                          <Check className='h-3 w-3 text-slate-400' />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. Bottom Composer Input matching TeleCRM Screenshot 1 */}
      <div className='p-3 bg-white border-t border-slate-200 z-10 flex-shrink-0 shadow-sm'>
        <div className='flex items-end gap-2 bg-slate-50 rounded-2xl p-2 border border-slate-200 focus-within:border-indigo-400 focus-within:bg-white transition-all'>
          {/* Quick Action: Templates icon */}
          <Button
            variant='ghost'
            size='icon'
            onClick={onOpenTemplates}
            className='h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg flex-shrink-0'
            title='Send Template'
          >
            <MessageSquare className='h-4 w-4' />
          </Button>

          {/* Text Area */}
          <Textarea
            placeholder='Type a message'
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            className='min-h-[36px] max-h-28 py-2 px-1 text-xs border-0 bg-transparent resize-none focus-visible:ring-0 shadow-none placeholder:text-slate-400'
          />

          {/* Send Button */}
          <Button
            size='icon'
            onClick={handleSend}
            disabled={!inputText.trim() || sending}
            className='h-8 w-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex-shrink-0 shadow-sm transition-all'
            title='Send'
          >
            <Send className='h-3.5 w-3.5' />
          </Button>
        </div>
      </div>

      {/* Image Preview Lightbox with Zoom In / Out & Pan controls */}
      <ImagePreviewModal
        isOpen={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage?.url || ''}
        caption={previewImage?.caption}
      />
    </div>
  );
};
