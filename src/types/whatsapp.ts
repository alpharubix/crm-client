export interface WhatsAppConversation {
  id: string;
  _id?: string;
  contact_id?: number | null;
  business_phone_number_id: string;
  customer_wa_id: string;
  customer_name?: string | null;
  status: 'open' | 'closed' | 'archived' | string;
  assigned_to?: number | string | null;
  unread_count: number;
  last_message_id?: string | null;
  last_message_preview?: string | null;
  last_message_direction?: 'inbound' | 'outbound' | null;
  last_message_status?: string | null;
  last_message_at?: string | null;
  created_at: string;
  updated_at: string;
  // Lead info computed or joined for display
  lead_status?: string;
  lead_rating?: number;
}

export interface WhatsAppMessage {
  id: string;
  _id?: string;
  conversation_id: string;
  contact_id?: number | null;
  business_phone_number_id: string;
  customer_wa_id: string;
  wamid?: string | null;
  direction: 'inbound' | 'outbound';
  type: 'text' | 'template' | 'interactive_reply' | 'image' | 'document' | 'audio' | 'video' | 'sticker' | string;
  content: {
    text?: string;
    template_name?: string;
    language?: string;
    components?: any[];
    rendered?: {
      body?: string;
      buttons?: Array<{ id: string; title: string }>;
    };
    interaction_type?: string;
    button_id?: string;
    item_id?: string;
    title?: string;
    media_id?: string;
    caption?: string;
    mime_type?: string;
    [key: string]: any;
  };
  reply_to?: {
    message_id?: string;
    from?: string;
    quoted_text?: string;
    quoted_from?: string;
    forwarded?: boolean;
    frequently_forwarded?: boolean;
  } | null;
  status: 'pending' | 'sent_to_meta' | 'sent' | 'delivered' | 'read' | 'failed' | 'received' | string;
  status_updated_at?: string;
  status_history?: Array<{
    status: string;
    timestamp: string;
    error?: any;
  }>;
  timestamp: string;
  created_at: string;
}

export interface WhatsAppTemplate {
  id: string;
  _id?: string;
  waba_id: string;
  name: string;
  language: string;
  category: string;
  status: string;
  components: Array<{
    type: string;
    text?: string;
    format?: string;
    buttons?: Array<{
      type: string;
      text: string;
      url?: string;
      phone_number?: string;
    }>;
    [key: string]: any;
  }>;
  synced_at?: string;
  updated_at?: string;
}
