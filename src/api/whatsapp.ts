import { ENV } from '@/conf';
import type { WhatsAppConversation, WhatsAppMessage, WhatsAppTemplate } from '@/types/whatsapp';

export type { WhatsAppConversation, WhatsAppMessage, WhatsAppTemplate };


const BASE_URL = `${ENV.VITE_BACKEND_BASE_URL || 'http://localhost:8080'}/api/v1/whatsapp`;

export async function fetchConversations(params?: {
  page?: number;
  limit?: number;
  search?: string;
  unread_only?: boolean;
}): Promise<{ data: WhatsAppConversation[]; total_count: number }> {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.search) query.append('search', params.search);
  if (params?.unread_only) query.append('unread_only', 'true');

  const res = await fetch(`${BASE_URL}/conversations?${query.toString()}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch WhatsApp conversations');
  const json = await res.json();
  return {
    data: json.data || [],
    total_count: json.page_info?.total_count || json.data?.length || 0,
  };
}

export async function fetchConversationMessages(
  conversationId: string,
  limit = 50,
  beforeTimestamp?: string
): Promise<WhatsAppMessage[]> {
  const query = new URLSearchParams({ limit: limit.toString() });
  if (beforeTimestamp) query.append('before_timestamp', beforeTimestamp);

  const res = await fetch(`${BASE_URL}/conversations/${conversationId}/messages?${query.toString()}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch messages');
  const json = await res.json();
  return json.data || [];
}

export async function sendTextMessage(
  recipientPhone: string,
  text: string
): Promise<WhatsAppMessage> {
  const res = await fetch(`${BASE_URL}/messages/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      recipient_phone: recipientPhone,
      text,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to send text message');
  }
  const json = await res.json();
  return json.data;
}

export async function sendTemplateMessage(
  recipientPhone: string,
  templateName: string,
  languageCode = 'en',
  components: any[] = []
): Promise<WhatsAppMessage> {
  const res = await fetch(`${BASE_URL}/messages/template`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      recipient_phone: recipientPhone,
      template_name: templateName,
      language_code: languageCode,
      components,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to send template message');
  }
  const json = await res.json();
  return json.data;
}

export async function markConversationAsRead(conversationId: string): Promise<void> {
  await fetch(`${BASE_URL}/conversations/${conversationId}/read`, {
    method: 'POST',
    credentials: 'include',
  });
}

export async function fetchTemplates(): Promise<WhatsAppTemplate[]> {
  const res = await fetch(`${BASE_URL}/templates`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch templates');
  const json = await res.json();
  return json.data || [];
}

export async function syncTemplates(): Promise<WhatsAppTemplate[]> {
  const res = await fetch(`${BASE_URL}/templates/sync`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to sync templates');
  const json = await res.json();
  return json.data || [];
}

export async function sendBroadcastCampaign(payload: {
  campaign_name: string;
  send_mode: 'template' | 'text';
  template_name?: string;
  language_code?: string;
  recipients: Array<{
    phone: string;
    custom_text?: string;
    components?: any[];
  }>;
}): Promise<{
  total: number;
  sent: number;
  failed: number;
  details: any[];
}> {
  const res = await fetch(`${BASE_URL}/broadcasts/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to trigger broadcast campaign');
  }
  return res.json();
}

export async function fetchMessagesByPhone(params: {
  phone: string;
  limit?: number;
  skip?: number;
  direction?: string;
}): Promise<{
  data: WhatsAppMessage[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}> {
  const query = new URLSearchParams({
    phone: params.phone,
    limit: (params.limit ?? 6).toString(),
    skip: (params.skip ?? 0).toString(),
  });
  if (params.direction && params.direction !== 'all') {
    query.append('direction', params.direction);
  }

  const res = await fetch(`${BASE_URL}/messages/by-phone?${query.toString()}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch broadcast messages for phone');
  const json = await res.json();
  return {
    data: json.data || [],
    total: json.total || 0,
    skip: json.skip || 0,
    limit: json.limit || 6,
    has_more: Boolean(json.has_more),
  };
}
