import { useQuery } from '@tanstack/react-query'
import { renderYearlyTable } from '@/components/itr/ItrTableHelper'
import { Loader2 } from 'lucide-react'
import { getItrProfitAndLoss } from './utils'
import CustomerProfile from './CustomerProfile'

interface ProfitAndLossStatementProps {
  acc_id: string 
}


export default function ProfitAndLossStatement({acc_id}: ProfitAndLossStatementProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['itrProfitAndLoss', acc_id],
    queryFn: () => getItrProfitAndLoss(acc_id),
  })

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
        No Data to load Profit and Loss Statement.
      </div>
    )
  }

  const { customer_profile, profit_and_loss_statement } = data

  return (
    <div className='p-6 space-y-6'>
      <CustomerProfile profile={customer_profile} />

      {profit_and_loss_statement['Profit and Loss Statement'] &&
        renderYearlyTable(
          'Profit and Loss Statement',
          profit_and_loss_statement['Profit and Loss Statement'],
        )}
    </div>
  )
}
