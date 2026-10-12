import React from 'react';
import type { WhatsAppConversation } from '@/types/whatsapp';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, RefreshCw, ChevronDown, Check, CheckCheck } from 'lucide-react';
import { WhatsAppMenuDropdown } from './whatsapp-menu-dropdown';

interface ConversationListProps {
  conversations: WhatsAppConversation[];
  activeId: string | null;
  onSelect: (conv: WhatsAppConversation) => void;
  search: string;
  onSearchChange: (val: string) => void;
  activeTab: 'all' | 'pending' | 'intervened' | 'closed';
  onTabChange: (tab: 'all' | 'pending' | 'intervened' | 'closed') => void;
  onRefresh: () => void;
  refreshing: boolean;
  onNavigateMenu?: (view: any) => void;
  channelName?: string;
  channelPhone?: string;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeId,
  onSelect,
  search,
  onSearchChange,
  activeTab,
  onTabChange,
  onRefresh,
  refreshing,
  onNavigateMenu,
  channelName = 'R1Xchange',
  channelPhone = '919364111650',
}) => {
  // Filter counts
  const allCount = conversations.length;
  const pendingCount = conversations.filter((c) => c.status === 'open' && (c.unread_count > 0 || c.last_message_direction === 'inbound')).length;
  const intervenedCount = conversations.filter((c) => c.last_message_direction === 'outbound').length;
  const closedCount = conversations.filter((c) => c.status === 'closed').length;

  // Filter based on tab
  const filtered = conversations.filter((c) => {
    if (activeTab === 'pending') {
      return c.status === 'open' && (c.unread_count > 0 || c.last_message_direction === 'inbound');
    }
    if (activeTab === 'intervened') {
      return c.last_message_direction === 'outbound';
    }
    if (activeTab === 'closed') {
      return c.status === 'closed';
    }
    return true;
  });

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const isToday =
        date.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }) ===
        now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });
      if (isToday) {
        return date.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }).toLowerCase();
      }
      return date.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="w-80 md:w-96 border-r border-slate-200 bg-white flex flex-col h-full select-none">
      {/* 1. Header Bar matching TeleCRM: Channel name, refresh, and Hamburger menu */}
      <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* WhatsApp green icon */}
          <div className="w-7 h-7 rounded-full bg-[#25D366] flex items-center justify-center text-white font-bold text-xs shadow-sm">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.067-1.118-.069-.264-.085-.606-.2-1.026-.38-1.782-.767-2.939-2.582-3.028-2.701-.088-.119-.724-.963-.724-1.836 0-.874.457-1.303.62-1.479.163-.176.356-.22.474-.22.119 0 .237.001.341.006.11.005.258-.042.403.308.148.356.505 1.233.549 1.322.044.089.074.193.015.312-.059.119-.089.193-.177.297-.089.104-.187.232-.267.312-.089.089-.182.186-.078.365.104.178.463.763.994 1.237.684.61 1.26.799 1.439.888.178.089.282.074.386-.044.104-.119.445-.519.564-.697.119-.178.237-.148.4-.089.163.059 1.037.489 1.215.578.178.089.297.133.341.208.044.074.044.43-.1 1.035z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-sm text-slate-800">
              <span>{channelName}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              <button
                onClick={onRefresh}
                className="text-slate-400 hover:text-indigo-600 transition-colors ml-0.5"
                title="Refresh Conversations"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="text-[11px] text-slate-500 font-mono tracking-tight">
              {channelPhone}
            </div>
          </div>
        </div>

        {/* ≡ Menu Dropdown */}
        <WhatsAppMenuDropdown onNavigate={onNavigateMenu} />
      </div>

      {/* 2. Search & Lead filter input */}
      <div className="p-3 border-b border-slate-100 space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search lead(s)"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-3 h-9 text-xs rounded-lg border-slate-200 bg-slate-50/60 focus:bg-white transition-colors"
          />
        </div>

        {/* Filters pills: Assignee, Lead Status, + Add Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[11px] font-medium text-slate-600 rounded-md border-slate-200 gap-1 px-2"
          >
            <span>Assignee</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[11px] font-medium text-slate-600 rounded-md border-slate-200 gap-1 px-2"
          >
            <span>Lead Status</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-md px-2"
          >
            + Add Filters
          </Button>
        </div>
      </div>

      {/* 3. Filter Tabs: All (7), Pending (5), Intervened (1), Closed (1) */}
      <div className="flex items-center border-b border-slate-100 px-2 text-xs font-semibold text-slate-500">
        <button
          onClick={() => onTabChange('all')}
          className={`flex-1 py-2.5 text-center transition-all relative ${
            activeTab === 'all'
              ? 'text-indigo-600 border-b-2 border-indigo-600 font-bold'
              : 'hover:text-slate-800'
          }`}
        >
          All <span className="text-[10px] ml-0.5 px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">{allCount}</span>
        </button>

        <button
          onClick={() => onTabChange('pending')}
          className={`flex-1 py-2.5 text-center transition-all relative ${
            activeTab === 'pending'
              ? 'text-indigo-600 border-b-2 border-indigo-600 font-bold'
              : 'hover:text-slate-800'
          }`}
        >
          Pending <span className="text-[10px] ml-0.5 px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">{pendingCount}</span>
        </button>

        <button
          onClick={() => onTabChange('intervened')}
          className={`flex-1 py-2.5 text-center transition-all relative ${
            activeTab === 'intervened'
              ? 'text-indigo-600 border-b-2 border-indigo-600 font-bold'
              : 'hover:text-slate-800'
          }`}
        >
          Intervened <span className="text-[10px] ml-0.5 px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">{intervenedCount}</span>
        </button>

        <button
          onClick={() => onTabChange('closed')}
          className={`flex-1 py-2.5 text-center transition-all relative ${
            activeTab === 'closed'
              ? 'text-indigo-600 border-b-2 border-indigo-600 font-bold'
              : 'hover:text-slate-800'
          }`}
        >
          Closed <span className="text-[10px] ml-0.5 px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">{closedCount}</span>
        </button>
      </div>

      {/* 4. Conversation Items List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
        {filtered.length === 0 ? (
          <div className="text-center py-16 px-4">
            <p className="text-xs text-slate-400 font-medium">No conversations found</p>
          </div>
        ) : (
          filtered.map((conv) => {
            const isSelected = activeId === (conv.id || conv._id);
            const displayName = conv.customer_name || conv.customer_wa_id;
            const preview = conv.last_message_preview || 'No messages yet';
            const isOutbound = conv.last_message_direction === 'outbound';
            const unread = conv.unread_count > 0;

            return (
              <div
                key={conv.id || conv._id}
                onClick={() => onSelect(conv)}
                className={`p-3.5 cursor-pointer transition-colors flex flex-col gap-1 ${
                  isSelected
                    ? 'bg-indigo-50/60 border-l-4 border-indigo-600 pl-2.5'
                    : 'hover:bg-slate-50/80 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs truncate font-bold ${
                      isSelected ? 'text-indigo-900' : 'text-slate-800'
                    }`}
                  >
                    {displayName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                    {formatTime(conv.last_message_at)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate">
                    {isOutbound && (
                      <span className="text-indigo-500 flex-shrink-0 inline-flex items-center">
                        {conv.last_message_status === 'read' ? (
                          <CheckCheck className="h-3.5 w-3.5 text-sky-500" />
                        ) : conv.last_message_status === 'delivered' ? (
                          <CheckCheck className="h-3.5 w-3.5 text-slate-400" />
                        ) : (
                          <Check className="h-3 w-3 text-slate-400" />
                        )}
                      </span>
                    )}
                    <span className="truncate">{preview}</span>
                  </div>

                  {unread && (
                    <span className="h-4 min-w-[16px] px-1 rounded-full bg-indigo-600 text-white font-bold text-[9px] flex items-center justify-center flex-shrink-0">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
