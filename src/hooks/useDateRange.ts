import { useQuery } from '@tanstack/react-query';
import { ENV } from '@/conf';

export interface DateRange {
  from_date: string;
  to_date: string;
}

export interface UseDateRangeOptions {
  acc_id?: string | number;
  custId?: string | number;
  accountNumber?: string;
  enabled?: boolean;
}

export function useDateRange(
  optionsOrAccId?: string | number | UseDateRangeOptions
) {
  let acc_id: string | number | undefined;
  let accountNumber: string | undefined;
  let isEnabled = true;

  if (typeof optionsOrAccId === 'object' && optionsOrAccId !== null) {
    acc_id = optionsOrAccId.acc_id || optionsOrAccId.custId;
    accountNumber = optionsOrAccId.accountNumber;
    if (optionsOrAccId.enabled !== undefined) {
      isEnabled = optionsOrAccId.enabled;
    }
  } else {
    acc_id = optionsOrAccId;
  }

  if (!accountNumber && typeof window !== 'undefined') {
    accountNumber =
      sessionStorage.getItem('selected_bsa_account_number') || undefined;
  }

  return useQuery<DateRange>({
    queryKey: ['report-date-range', acc_id, accountNumber],
    queryFn: async () => {
      const response = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/accounts/r1xcrm-report-date-range/${acc_id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            accountNumber ? { account_number: accountNumber } : {}
          ),
          credentials: 'include',
        }
      );
      if (!response.ok) {
        throw new Error('Failed to fetch date range');
      }
      const data = await response.json();
      return data.data as DateRange;
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled: isEnabled && !!acc_id,
  });
}
