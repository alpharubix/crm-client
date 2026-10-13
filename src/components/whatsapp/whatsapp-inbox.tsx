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

              // If message belongs to active chat, add to thread immediately
              if (!activeConvId || String(activeConvId) === String(msgConvId)) {
                setMessages((prev) => {
                  if (prev.some((m) => (m.id || m._id) === (newMsg.id || newMsg._id))) {
                    return prev;
                  }
                  return [...prev, newMsg];
                });
              }
              // Silently refresh left sidebar snippet
              loadConversations(true);
            }

            // 2. Outbound status update (sent -> delivered -> read)
            if (data.type === 'status_update' && data.wamid && data.status) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.wamid === data.wamid ? { ...m, status: data.status } : m
                )
              );
              loadConversations(true);
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

  // When active conversation changes, load messages & mark read
  useEffect(() => {
    if (activeConversation) {
      const convId = activeConversation.id || activeConversation._id;
      if (convId) {
        loadMessages(convId);
        markConversationAsRead(convId).catch(() => {});
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
      // Replace optimistic placeholder with actual confirmed message doc
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId || m._id === tempId ? savedMsg : m))
      );
      loadConversations(true);
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
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId || m._id === tempId ? savedMsg : m))
      );
      loadConversations(true);
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
