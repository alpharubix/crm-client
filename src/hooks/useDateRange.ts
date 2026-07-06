import { useQuery } from '@tanstack/react-query'
import { ENV } from '@/conf'

export interface DateRange {
  from_date: string
  to_date: string
}

export function useDateRange(acc_id: string | number) {
  return useQuery<DateRange>({
    queryKey: ['report-date-range', acc_id],
    queryFn: async () => {
      const response = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/accounts/r1xcrm-report-date-range/${acc_id}`,
        { credentials: 'include' }
      )
      if (!response.ok) {
        throw new Error('Failed to fetch date range')
      }
      const data = await response.json()
      return data.data as DateRange
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled: !!acc_id,
  })
}
