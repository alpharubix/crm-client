import { useQuery } from '@tanstack/react-query'
import {
  renderYearlyTable,
  renderDataTable,
} from '@/components/itr/ItrTableHelper'
import { Loader2 } from 'lucide-react'
import { getItrTaxCalculation } from './utils'
import CustomerProfile from './CustomerProfile'
import React from 'react'

interface TaxCalculationProps {
  acc_id: string
}

export default function TaxCalculation({ acc_id }: TaxCalculationProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['itrTaxCalculation', acc_id],
    queryFn: () => getItrTaxCalculation(acc_id),
  })

  if (isLoading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='h-10 w-10 animate-spin text-[#000080]' />
      </div>
    )
  }
  console.log(data)
  if (isError || !data){
    return (
      <div className='p-8 text-center text-red-500 bg-white rounded-lg shadow-sm border border-gray-100 mt-6 max-w-7xl mx-auto'>
        No Data to load Tax Calculation.
      </div>
    )
  }

  const { customer_profile, tax_calculation } = data

  return (
    <div className='p-6 space-y-6'>
      <CustomerProfile profile={customer_profile} />

      {tax_calculation['Tax Calculation'] &&
        renderYearlyTable(
          'Tax Calculation',
          tax_calculation['Tax Calculation'],
        )}
      {tax_calculation['Computation of Tax Liability on Total Income'] &&
        renderYearlyTable(
          'Computation of Tax Liability on Total Income',
          tax_calculation['Computation of Tax Liability on Total Income'],
        )}

      {tax_calculation['Tax Deducted At Source'] &&
        Object.keys(tax_calculation['Tax Deducted At Source']).length > 0 && (
          <div className='bg-white rounded-md shadow-sm border border-gray-200 mb-6 overflow-hidden animate-in fade-in duration-500'>
            <div className='bg-[#e67e22] text-white px-4 py-2 text-center rounded-t-md font-semibold'>
              Tax Deducted At Source
            </div>
            <div className='p-0'>
              {Object.entries(tax_calculation['Tax Deducted At Source']).map(
                ([key, val]) => (
                  <React.Fragment key={key}>
                    {renderDataTable(key, val as any[])}
                  </React.Fragment>
                ),
              )}
            </div>
          </div>
        )}

      {tax_calculation['Tax Collected at Source'] &&
        tax_calculation['Tax Collected at Source'].length > 0 && (
          <div className='bg-white rounded-md shadow-sm border border-gray-200 mb-6 overflow-hidden animate-in fade-in duration-500'>
            <div className='bg-[#e67e22] text-white px-4 py-2 text-center rounded-t-md font-semibold'>
              Tax Collected at Source
            </div>
            <div className='p-0'>
              {renderDataTable(
                'Tax Collected at Source',
                tax_calculation['Tax Collected at Source'],
              )}
            </div>
          </div>
        )}
    </div>
  )
}
