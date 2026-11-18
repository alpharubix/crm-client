import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';
import { Users, ExternalLink } from 'lucide-react';
import { ENV } from '@/conf';

export const PHONE_STATUS_OPTIONS = [
  { value: 'valid_phone', label: 'Valid Phone' },
  { value: 'duplicate_phone', label: 'Duplicate Phone' },
  { value: 'duplicate_phone_email', label: 'Same Phone & Email' },
  { value: 'duplicate_phone_different_email', label: 'Same Phone, Diff Email' },
  { value: 'duplicate_email_different_phone', label: 'Same Email, Diff Phone' },
  { value: 'invalid_phone', label: 'Invalid Phone' },
  { value: 'missing_phone', label: 'Missing Phone' },
  { value: 'missing_phone_email', label: 'Missing Phone & Email' },
];

export const DUPLICATE_STATUS_KEYS = new Set([
  'duplicate_phone',
  'duplicate_phone_email',
  'duplicate_phone_different_email',
  'duplicate_email_different_phone',
]);

export const getPhoneStatusBadgeStyle = (status: string) => {
  switch (status) {
    case 'valid_phone':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
    case 'invalid_phone':
      return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800';
    case 'missing_phone':
    case 'missing_phone_email':
      return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    case 'duplicate_phone':
    case 'duplicate_phone_email':
    case 'duplicate_phone_different_email':
    case 'duplicate_email_different_phone':
      return 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 cursor-pointer dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-200';
  }
};

export function DuplicateAccountsBadge({
  accountId,
  status,
  label,
  onNavigateAccount,
}: {
  accountId: string | number;
  status: string;
  label: string;
  onNavigateAccount?: (id: string | number) => void;
}) {
  const [open, setOpen] = useState(false);
  const isDuplicate = DUPLICATE_STATUS_KEYS.has(status);

  const { data: duplicates, isLoading, isError } = useQuery({
    queryKey: ['duplicate-accounts', accountId, status],
    queryFn: async () => {
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/accounts/${accountId}/duplicates?type=${status}`,
        { credentials: 'include' }
      );
      if (!res.ok) throw new Error('Failed to fetch duplicates');
      return res.json();
    },
    enabled: open && isDuplicate,
  });

  const badgeStyle = getPhoneStatusBadgeStyle(status);

  if (!isDuplicate) {
    return (
      <Badge
        variant='outline'
        className={`text-[10px] px-1.5 py-0.5 border ${badgeStyle}`}
      >
        {label}
      </Badge>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type='button'
          onClick={(e) => {
            e.stopPropagation();
            setOpen((prev) => !prev);
          }}
          onMouseEnter={() => setOpen(true)}
          className='inline-flex items-center text-left focus:outline-hidden'
        >
          <Badge
            variant='outline'
            className={`text-[10px] px-1.5 py-0.5 border transition-colors ${badgeStyle} flex items-center gap-1 font-medium`}
          >
            <span>{label}</span>
            <Users className='h-2.5 w-2.5 opacity-70' />
          </Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align='start'
        side='bottom'
        sideOffset={6}
        className='w-80 p-3 bg-popover text-popover-foreground shadow-lg border rounded-md z-50 text-xs'
        onClick={(e) => e.stopPropagation()}
        onMouseLeave={() => setOpen(false)}
      >
        <div className='flex items-center justify-between pb-2 mb-2 border-b border-border/60'>
          <div className='font-semibold text-foreground flex items-center gap-1.5'>
            <Users className='h-3.5 w-3.5 text-amber-600' />
            <span>Matching Accounts</span>
          </div>
          <span className='text-[10px] text-muted-foreground'>
            {label}
          </span>
        </div>

        {isLoading ? (
          <div className='flex items-center justify-center py-4 text-muted-foreground gap-2'>
            <Spinner className='h-4 w-4' />
            <span>Loading matching accounts...</span>
          </div>
        ) : isError ? (
          <div className='text-red-500 py-2 text-center text-[11px]'>
            Failed to load matching accounts.
          </div>
        ) : !duplicates || duplicates.length === 0 ? (
          <div className='text-muted-foreground py-2 text-center text-[11px]'>
            No other matching accounts found.
          </div>
        ) : (
          <div className='space-y-2 max-h-56 overflow-y-auto pr-1'>
            {duplicates.map((item: any) => (
              <div
                key={item.id}
                onClick={() => {
                  setOpen(false);
                  if (onNavigateAccount) {
                    onNavigateAccount(item.id);
                  } else {
                    window.open(`/accounts/${item.id}`, '_blank');
                  }
                }}
                className='p-2 rounded-md border border-border/50 bg-muted/30 hover:bg-muted/70 cursor-pointer transition-colors space-y-1'
              >
                <div className='flex items-center justify-between'>
                  <span className='font-semibold text-foreground hover:text-blue-600 truncate max-w-[190px]'>
                    {item.account_name}
                  </span>
                  <ExternalLink className='h-3 w-3 text-muted-foreground shrink-0' />
                </div>
                <div className='flex items-center justify-between text-[11px] text-muted-foreground'>
                  <span>📞 {item.phone || '—'}</span>
                  <span className='truncate max-w-[110px]'>✉️ {item.email || '—'}</span>
                </div>
                <div className='flex items-center justify-between text-[10px] text-muted-foreground pt-0.5'>
                  <span>Owner: <strong className='text-foreground'>{item.account_owner}</strong></span>
                  <span className='italic'>{item.account_stage || item.account_status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
