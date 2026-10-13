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
  onNavigate?: (
    view:
      | 'inbox'
      | 'templates'
      | 'broadcasts'
      | 'lists'
      | 'interactive'
      | 'analytics'
      | 'setup',
  ) => void;
}

export const WhatsAppMenuDropdown: React.FC<WhatsAppMenuDropdownProps> = ({
  onNavigate,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='outline'
          size='icon'
          className='h-9 w-9 rounded-md border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 transition-colors shadow-sm'
          title='WhatsApp Menu'
        >
          <Menu className='h-5 w-5' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='start'
        className='w-56 p-1.5 shadow-xl rounded-xl border border-slate-100 bg-white/95 backdrop-blur-md'
      >
        <DropdownMenuItem
          onClick={() => onNavigate?.('broadcasts')}
          className='flex items-center gap-3 px-3.5 py-2.5 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-lg cursor-pointer font-medium text-sm transition-colors'
        >
          <Megaphone className='h-4 w-4 text-slate-500' />
          <span>Broadcasts</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
