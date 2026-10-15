import React, { useState, useEffect, useCallback } from 'react';
import type {
  WhatsAppConversation,
  WhatsAppMessage,
  WhatsAppTemplate,
} from '@/types/whatsapp';
import {
  fetchConversations,
  fetchConversationMessages,
  sendTextMessage,
  sendTemplateMessage,
  markConversationAsRead,
  fetchTemplates,
  syncTemplates,
} from '@/api/whatsapp';
import { ConversationList } from './conversation-list';
import { ChatArea } from './chat-area';
import { SendTemplateDialog } from './send-template-dialog';
import { TemplatesView } from './templates-view';
import { BroadcastsView } from './broadcasts-view';

export const WhatsAppInbox: React.FC = () => {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<WhatsAppConversation | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);

  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'intervened' | 'closed'>('all');
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);

  // Active module view: 'inbox' | 'templates' | 'broadcasts'
  const [currentView, setCurrentView] = useState<'inbox' | 'templates' | 'broadcasts'>('inbox');

  const activeConversationRef = React.useRef<WhatsAppConversation | null>(activeConversation);
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  const loadConversations = useCallback(async (silent = false) => {
    if (!silent) setLoadingConversations(true);
    try {
      const res = await fetchConversations({ search });
      setConversations(res.data);
      if (res.data.length > 0 && !activeConversationRef.current) {
        setActiveConversation(res.data[0]);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      if (!silent) setLoadingConversations(false);
    }
  }, [search]);

  const loadMessages = useCallback(async (convId: string) => {
    setLoadingMessages(true);
    try {
      const msgs = await fetchConversationMessages(convId);
      setMessages(msgs);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const loadTemplates = useCallback(async () => {
    try {
      const tmpls = await fetchTemplates();
      setTemplates(tmpls);
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadConversations();
    loadTemplates();
  }, []);

  // Connect to Real-Time WebSocket for instant live messages & checkmarks
  // Connect to Real-Time WebSocket for instant live messages & checkmarks
  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:8080';
    const wsProto = backendUrl.startsWith('https') ? 'wss:' : 'ws:';
    const host = backendUrl.replace(/^https?:\/\//, '');
    const wsUrl = `${wsProto}//${host}/api/v1/whatsapp/ws`;

    let ws: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;
    let isDisposed = false;

    const connectWs = () => {
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('✅ WhatsApp WebSocket connected');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            // 1. New incoming / outbound message
            if (data.type === 'new_message' && data.message) {
              const newMsg = data.message;
              const currentActive = activeConversationRef.current;
              const activeConvId = currentActive?.id || currentActive?._id;
              const msgConvId = newMsg.conversation_id || data.conversation_id;

              // If message belongs to active chat, add or reconcile with optimistic placeholder
              if (!activeConvId || String(activeConvId) === String(msgConvId)) {
                setMessages((prev) => {
                  // 1. If message already exists by ID or wamid, ignore
                  const alreadyExists = prev.some(
                    (m) =>
                      (m.id && (m.id === newMsg.id || m.id === newMsg._id)) ||
                      (m._id && (m._id === newMsg.id || m._id === newMsg._id)) ||
                      (m.wamid && newMsg.wamid && m.wamid === newMsg.wamid)
                  );
                  if (alreadyExists) return prev;

                  // 2. If it's an outbound message, check if there's an optimistic 'temp_' message to replace
                  if (newMsg.direction === 'outbound') {
                    const tempIndex = prev.findIndex(
                      (m) =>
                        String(m.id || m._id).startsWith('temp_') &&
                        m.content?.text === newMsg.content?.text
                    );
                    if (tempIndex !== -1) {
                      const updated = [...prev];
                      updated[tempIndex] = newMsg;
                      return updated;
                    }
                  }

                  // 3. Otherwise append new message
                  return [...prev, newMsg];
                });
              }

              // Update left sidebar conversation purely in memory via WebSocket:
              // Update details AND move this active/updated conversation to the very top!
              setConversations((prev) => {
                const preview =
                  newMsg.content?.text ||
                  newMsg.preview_text ||
                  (newMsg.type === 'image' ? '[IMAGE]' : newMsg.type === 'audio' ? '[AUDIO]' : '[MESSAGE]');

                const targetConvId = String(msgConvId);
                const isActiveChat = activeConvId && String(activeConvId) === targetConvId;

                const foundIndex = prev.findIndex(
                  (c) =>
                    String(c.id || c._id) === targetConvId ||
                    (c.customer_wa_id && c.customer_wa_id === newMsg.customer_wa_id)
                );

                if (foundIndex === -1) return prev;

                const targetConv = {
                  ...prev[foundIndex],
                  last_message_preview: preview,
                  last_message_at: newMsg.timestamp || new Date().toISOString(),
                  last_message_direction: newMsg.direction,
                  last_message_status: newMsg.status || 'received',
                  unread_count: isActiveChat ? 0 : (newMsg.direction === 'inbound' ? (prev[foundIndex].unread_count || 0) + 1 : prev[foundIndex].unread_count || 0),
                };

                // Move targetConv to the top (index 0) of the list
                const filtered = prev.filter((_, idx) => idx !== foundIndex);
                return [targetConv, ...filtered];
              });
            }

            // 2. Outbound status update (sent -> delivered -> read)
            if (data.type === 'status_update' && data.wamid && data.status) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.wamid === data.wamid ? { ...m, status: data.status } : m
                )
              );
              // Update status in sidebar purely in memory
              setConversations((prev) =>
                prev.map((c) => {
                  if (data.conversation_id && String(c.id || c._id) === String(data.conversation_id)) {
                    return { ...c, last_message_status: data.status };
                  }
                  return c;
                })
              );
            }

            // 3. Conversation read event via WebSocket
            if (data.type === 'conversation_read' && data.conversation_id) {
              setConversations((prev) =>
                prev.map((c) =>
                  (c.id === data.conversation_id || c._id === data.conversation_id)
                    ? { ...c, unread_count: 0 }
                    : c
                )
              );
            }
          } catch (e) {
            console.error('Error parsing WS message:', e);
          }
        };

        ws.onclose = () => {
          if (!isDisposed) {
            console.log('WhatsApp WebSocket disconnected, retrying in 3s...');
            reconnectTimer = setTimeout(connectWs, 3000);
          }
        };

        ws.onerror = (err) => {
          console.warn('WhatsApp WebSocket encountered error:', err);
          ws?.close();
        };
      } catch (e) {
        console.warn('Could not establish WebSocket connection:', e);
        if (!isDisposed) {
          reconnectTimer = setTimeout(connectWs, 3000);
        }
      }
    };

    connectWs();

    return () => {
      isDisposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [loadConversations]);

  // When active conversation changes, load messages & clear unread locally
  useEffect(() => {
    if (activeConversation) {
      const convId = activeConversation.id || activeConversation._id;
      if (convId) {
        // Optimistically clear unread count in local sidebar list immediately
        setConversations((prev) =>
          prev.map((c) =>
            (c.id === convId || c._id === convId) ? { ...c, unread_count: 0 } : c
          )
        );
        loadMessages(convId);
      }
    } else {
      setMessages([]);
    }
  }, [activeConversation, loadMessages]);

  const handleSendMessage = async (text: string) => {
    if (!activeConversation) return;
    const cleanPhone = activeConversation.customer_wa_id;
    const convId = activeConversation.id || activeConversation._id;

    // Optimistic message placeholder so user sees the bubble INSTANTLY (0ms latency)
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg: WhatsAppMessage = {
      id: tempId,
      _id: tempId,
      conversation_id: String(convId),
      business_phone_number_id: activeConversation.business_phone_number_id,
      customer_wa_id: cleanPhone,
      direction: 'outbound',
      type: 'text',
      content: { text },
      status: 'pending',
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const savedMsg = await sendTextMessage(cleanPhone, text);
      // Replace optimistic placeholder with actual confirmed message doc,
      // or if WebSocket already inserted savedMsg, remove tempId to avoid duplicates
      setMessages((prev) => {
        const alreadyHasSaved = prev.some(
          (m) =>
            m.id === savedMsg.id ||
            m._id === savedMsg._id ||
            (m.wamid && savedMsg.wamid && m.wamid === savedMsg.wamid)
        );
        if (alreadyHasSaved) {
          return prev.filter((m) => m.id !== tempId && m._id !== tempId);
        }
        return prev.map((m) => (m.id === tempId || m._id === tempId ? savedMsg : m));
      });
      // Move this conversation to the top and update preview in memory without HTTP call
      setConversations((prev) => {
        const foundIndex = prev.findIndex((c) => String(c.id || c._id) === String(convId));
        if (foundIndex === -1) return prev;
        const targetConv = {
          ...prev[foundIndex],
          last_message_preview: text,
          last_message_at: new Date().toISOString(),
          last_message_direction: 'outbound',
          last_message_status: savedMsg.status || 'sent',
        };
        return [targetConv, ...prev.filter((_, idx) => idx !== foundIndex)];
      });
    } catch (err) {
      console.error('Failed to send text message:', err);
      // Remove temporary message on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId && m._id !== tempId));
      throw err;
    }
  };

  const handleSendTemplate = async (templateName: string, language: string, components: any[]) => {
    if (!activeConversation) return;
    const cleanPhone = activeConversation.customer_wa_id;
    const convId = activeConversation.id || activeConversation._id;

    const tempId = `temp_tmpl_${Date.now()}`;
    const optimisticMsg: WhatsAppMessage = {
      id: tempId,
      _id: tempId,
      conversation_id: String(convId),
      business_phone_number_id: activeConversation.business_phone_number_id,
      customer_wa_id: cleanPhone,
      direction: 'outbound',
      type: 'template',
      content: {
        template_name: templateName,
        language,
        components,
      },
      status: 'pending',
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const savedMsg = await sendTemplateMessage(cleanPhone, templateName, language, components);
      setMessages((prev) => {
        const alreadyHasSaved = prev.some(
          (m) =>
            m.id === savedMsg.id ||
            m._id === savedMsg._id ||
            (m.wamid && savedMsg.wamid && m.wamid === savedMsg.wamid)
        );
        if (alreadyHasSaved) {
          return prev.filter((m) => m.id !== tempId && m._id !== tempId);
        }
        return prev.map((m) => (m.id === tempId || m._id === tempId ? savedMsg : m));
      });
      // Move conversation to top in memory without HTTP call
      setConversations((prev) => {
        const foundIndex = prev.findIndex((c) => String(c.id || c._id) === String(convId));
        if (foundIndex === -1) return prev;
        const targetConv = {
          ...prev[foundIndex],
          last_message_preview: `Template: ${templateName}`,
          last_message_at: new Date().toISOString(),
          last_message_direction: 'outbound',
          last_message_status: savedMsg.status || 'sent',
        };
        return [targetConv, ...prev.filter((_, idx) => idx !== foundIndex)];
      });
    } catch (err) {
      console.error('Failed to send template message:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId && m._id !== tempId));
      throw err;
    }
  };

  const handleSyncTemplates = async () => {
    const synced = await syncTemplates();
    setTemplates(synced);
  };

  const handleNavigateMenu = (view: any) => {
    if (view === 'templates') setCurrentView('templates');
    else if (view === 'broadcasts') setCurrentView('broadcasts');
    else setCurrentView('inbox');
  };

  if (currentView === 'templates') {
    return (
      <TemplatesView
        templates={templates}
        onBack={() => setCurrentView('inbox')}
        onSync={handleSyncTemplates}
      />
    );
  }

  if (currentView === 'broadcasts') {
    return (
      <BroadcastsView
        templates={templates}
        onBack={() => {
          setCurrentView('inbox');
          loadConversations();
        }}
      />
    );
  }

  return (
    <div className="flex-1 flex h-screen max-h-screen overflow-hidden bg-white">
      {/* Left Conversations Sidebar matching TeleCRM */}
      <ConversationList
        conversations={conversations}
        activeId={activeConversation ? activeConversation.id || activeConversation._id : null}
        onSelect={(conv) => setActiveConversation(conv)}
        search={search}
        onSearchChange={setSearch}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onRefresh={loadConversations}
        refreshing={loadingConversations}
        onNavigateMenu={handleNavigateMenu}
      />

      {/* Center Chat Area matching TeleCRM */}
      <ChatArea
        conversation={activeConversation}
        messages={messages}
        templates={templates}
        loading={loadingMessages}
        onSendMessage={handleSendMessage}
        onOpenTemplates={() => setTemplateDialogOpen(true)}
        onCloseChat={() => setActiveConversation(null)}
      />

      {/* Send Template Dialog */}
      <SendTemplateDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        templates={templates}
        onSend={handleSendTemplate}
        onSync={handleSyncTemplates}
      />
    </div>
  );
};
export default WhatsAppInbox;
