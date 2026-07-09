import { useQuery } from '@tanstack/react-query'
import CustomerProfile from '../itr/CustomerProfile'
import { renderYearlyTable } from '../itr/ItrTableHelper'
import { Loader2 } from 'lucide-react'
import { getItrBalanceSheet } from './utils'

interface BalanceSheetProps {
  acc_id: string
}

export default function BalanceSheet({ acc_id }: BalanceSheetProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['itrBalanceSheet', acc_id],
    queryFn: () => getItrBalanceSheet(acc_id),
  })

  console.log('BalanceSheetData', data)

  if (isLoading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='h-10 w-10 animate-spin text-[#000080]' />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className='p-8 text-center text-red-500 bg-white rounded-lg shadow-sm border border-gray-100 mt-6 max-w-7xl mx-auto'>
        No Data to load Balance Sheet.
      </div>
    )
  }

  const { customer_profile, balance_sheet } = data

  return (
    <div className='p-6 space-y-6'>
      <CustomerProfile profile={customer_profile} />

      {balance_sheet['Equity & Liabilities'] &&
        renderYearlyTable(
          'Equity & Liabilities',
          balance_sheet['Equity & Liabilities'],
        )}
      {balance_sheet['Assets'] &&
        renderYearlyTable('Assets', balance_sheet['Assets'])}
    </div>
  )
}
