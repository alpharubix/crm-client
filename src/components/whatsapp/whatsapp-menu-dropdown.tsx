import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Megaphone,
  MessageSquare,
  List,
  PlusCircle,
  BarChart3,
  Settings,
  Menu,
} from 'lucide-react';

interface WhatsAppMenuDropdownProps {
  onNavigate?: (view: 'inbox' | 'templates' | 'broadcasts' | 'lists' | 'interactive' | 'analytics' | 'setup') => void;
}

export const WhatsAppMenuDropdown: React.FC<WhatsAppMenuDropdownProps> = ({ onNavigate }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-md border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 transition-colors shadow-sm"
          title="WhatsApp Menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-56 p-1.5 shadow-xl rounded-xl border border-slate-100 bg-white/95 backdrop-blur-md"
      >
        <DropdownMenuItem
          onClick={() => onNavigate?.('broadcasts')}
          className="flex items-center gap-3 px-3.5 py-2.5 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-lg cursor-pointer font-medium text-sm transition-colors"
        >
          <Megaphone className="h-4 w-4 text-slate-500" />
          <span>Broadcasts</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onNavigate?.('templates')}
          className="flex items-center gap-3 px-3.5 py-2.5 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-lg cursor-pointer font-medium text-sm transition-colors"
        >
          <MessageSquare className="h-4 w-4 text-slate-500" />
          <span>Templates</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onNavigate?.('lists')}
          className="flex items-center gap-3 px-3.5 py-2.5 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-lg cursor-pointer font-medium text-sm transition-colors"
        >
          <List className="h-4 w-4 text-slate-500" />
          <span>Lists</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onNavigate?.('interactive')}
          className="flex items-center gap-3 px-3.5 py-2.5 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-lg cursor-pointer font-medium text-sm transition-colors"
        >
          <PlusCircle className="h-4 w-4 text-slate-500" />
          <span>Interactive</span>
        </DropdownMenuItem>

        <div className="h-px bg-slate-100 my-1" />

        <DropdownMenuItem
          onClick={() => onNavigate?.('analytics')}
          className="flex items-center gap-3 px-3.5 py-2.5 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-lg cursor-pointer font-medium text-sm transition-colors"
        >
          <BarChart3 className="h-4 w-4 text-slate-500" />
          <span>Analytics</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onNavigate?.('setup')}
          className="flex items-center gap-3 px-3.5 py-2.5 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-lg cursor-pointer font-medium text-sm transition-colors"
        >
          <Settings className="h-4 w-4 text-slate-500" />
          <span>Setup</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
