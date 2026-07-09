import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { renderYearlyTable } from '@/components/itr/ItrTableHelper'
import { Loader2 } from 'lucide-react'
import { getItrRatioAnalysis } from './utils'
import CustomerProfile from './CustomerProfile'

interface RatioAnalysisPops {
  acc_id: string
}

export default function RatioAnalysis({ acc_id }: RatioAnalysisPops) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['itrRatioAnalysis', acc_id],
    queryFn: () => getItrRatioAnalysis(acc_id),
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
        No Data to load Ratio Analysis.
      </div>
    )
  }

  const { customer_profile, ratio_analysis } = data

  // The order of sections based on the typical presentation or JSON structure
  const sections = [
    'Liquidity Analysis',
    'Asset Management',
    'Leverage Ratios',
    'Coverage Ratios',
    'Profitability Ratios',
    'Growth in Cashflow Margin',
  ]

  return (
    <div className='p-6 space-y-6'>
      <CustomerProfile profile={customer_profile} />

      {sections.map((section) => {
        if (ratio_analysis[section]) {
          return (
            <React.Fragment key={section}>
              {renderYearlyTable(section, ratio_analysis[section])}
            </React.Fragment>
          )
        }
        return null
      })}
    </div>
  )
}
