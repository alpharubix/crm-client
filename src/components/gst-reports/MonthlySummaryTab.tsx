import { useQuery } from '@tanstack/react-query'
import { ENV } from '@/conf'
export interface GstReportPayload {
  gst_reference_id: string
}

export interface GstMonthlySummaryResponse {
  message: string
  data: any
}

export const getGstMonthlySummary = async (
  data: GstReportPayload,
): Promise<GstMonthlySummaryResponse> => {
  const response = await fetch(
    `${ENV.VITE_BACKEND_BASE_URL}/accounts/r1xcrm-monthly-sales-purchase-summary`,
    {
      credentials: 'include',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    },
  )
  if (!response.ok) {
    throw new Error('Failed to fetch Monthly Sales and Purchase Summary.')
  }
  return response.json()
}

export default function MonthlySummaryTab({
  gstReferenceId,
}: {
  gstReferenceId: string
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['gstMonthlySummary', gstReferenceId],
    queryFn: () => getGstMonthlySummary({ gst_reference_id: gstReferenceId }),
    enabled: !!gstReferenceId,
  })

  if (isLoading) {
    return (
      <div className='flex justify-center items-center py-20'>
        <span className='h-10 w-10 rounded-full border-4 border-[#000080]/20 border-t-[#000080] animate-spin' />
      </div>
    )
  }

  if (isError || !data || !data.data) {
    return (
      <div className='bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center text-red-500'>
        Failed to load Monthly Sales & Purchase Summary Data.
      </div>
    )
  }

  const summaryArray = data.data.monthly_sales_and_purchase_summary || []
  const accountDetails = summaryArray.find(
    (item: any) => item['Account Details'],
  )?.['Account Details']
  const salesPurchaseData = summaryArray.find(
    (item: any) => item['Monthly Sales&Purchase'],
  )?.['Monthly Sales&Purchase']

  const purchasesSummary = salesPurchaseData?.find(
    (item: any) => item['Monthly Purchases Summary'],
  )?.['Monthly Purchases Summary']
  const salesSummary = salesPurchaseData?.find(
    (item: any) => item['Monthly Sale Summary'],
  )?.['Monthly Sale Summary']

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className='text-lg font-semibold text-white bg-[#e67e22] px-4 py-2 rounded-t-md text-center'>
      {children}
    </h3>
  )

  const renderSummaryTable = (title: string, summary: any[]) => {
    if (!summary || summary.length === 0) return null

    const tableData = summary.find((item: any) => item.data)?.data || []
    const totalData = summary.find((item: any) => item.Total)?.Total

    return (
      <div className='bg-white rounded-md shadow-sm border border-gray-200'>
        <SectionTitle>{title}</SectionTitle>
        <div className='p-0'>
          <table className='w-full text-sm text-left whitespace-nowrap'>
            <thead className='bg-[#000080] text-white'>
              <tr>
                <th className='px-4 py-2 border border-[#000080] font-semibold text-center w-1/3'>
                  Month
                </th>
                <th className='px-4 py-2 border border-[#000080] font-semibold text-center w-1/3'>
                  Taxable Value
                </th>
                <th className='px-4 py-2 border border-[#000080] font-semibold text-center w-1/3'>
                  Tax
                </th>
              </tr>
            </thead>
            <tbody>
              {tableData.length > 0 ? (
                tableData.map((row: any, idx: number) => {
                  const taxableVal = Number(row['Taxable Value'] || 0)
                  const taxVal = Number(row['Tax'] || 0)
                  return (
                    <tr key={idx} className='hover:bg-gray-50'>
                      <td className='px-4 py-2 border border-gray-200 text-center font-medium'>
                        {row.Month}
                      </td>
                      <td
                        className={`px-4 py-2 border border-gray-200 text-right ${taxableVal < 0 ? 'text-red-600' : ''}`}
                      >
                        ₹{' '}
                        {taxableVal.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td
                        className={`px-4 py-2 border border-gray-200 text-right ${taxVal < 0 ? 'text-red-600' : ''}`}
                      >
                        ₹{' '}
                        {taxVal.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td
                    colSpan={3}
                    className='px-4 py-4 text-center text-gray-500'
                  >
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
            {totalData &&
              (() => {
                const totalTaxable = Number(totalData['Taxable Value'] || 0)
                const totalTax = Number(totalData['Tax'] || 0)
                return (
                  <tfoot className='bg-[#e67e22] text-white font-bold'>
                    <tr>
                      <td className='px-4 py-2 border border-[#d35400] text-center'>
                        Total
                      </td>
                      <td
                        className={`px-4 py-2 border border-[#d35400] text-right ${totalTaxable < 0 ? 'text-red-900 bg-white/20' : ''}`}
                      >
                        ₹{' '}
                        {totalTaxable.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td
                        className={`px-4 py-2 border border-[#d35400] text-right ${totalTax < 0 ? 'text-red-900 bg-white/20' : ''}`}
                      >
                        ₹{' '}
                        {totalTax.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  </tfoot>
                )
              })()}
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6 animate-in fade-in duration-500'>
      {/* Account Details */}
      {accountDetails && (
        <div className='bg-white rounded-md shadow-sm border border-gray-200'>
          <h3 className='text-lg font-semibold text-white bg-[#e67e22] px-4 py-2 rounded-t-md text-center'>
            Customer Profile
          </h3>
          <div className='p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-center'>
            <div className='border border-gray-200 rounded-md p-2'>
              <span className='font-semibold text-[#000080] block mb-1'>
                Company Name
              </span>
              <span className='text-gray-700'>
                {accountDetails['GSTR Analysis Report  - '] || 'N/A'}
              </span>
            </div>
            <div className='border border-gray-200 rounded-md p-2'>
              <span className='font-semibold text-[#000080] block mb-1'>
                GSTIN
              </span>
              <span className='text-gray-700'>{accountDetails['GSTIN']}</span>
            </div>
            <div className='border border-gray-200 rounded-md p-2'>
              <span className='font-semibold text-[#000080] block mb-1'>
                PAN
              </span>
              <span className='text-gray-700'>{accountDetails['PAN']}</span>
            </div>
            <div className='border border-gray-200 rounded-md p-2'>
              <span className='font-semibold text-[#000080] block mb-1'>
                State
              </span>
              <span className='text-gray-700'>
                {
                  accountDetails[
                    'State of Operations(based on max. gross sales)'
                  ]
                }
              </span>
            </div>
            <div className='border border-gray-200 rounded-md p-2'>
              <span className='font-semibold text-[#000080] block mb-1'>
                Period From
              </span>
              <span className='text-gray-700'>
                {accountDetails['periodFrom']}
              </span>
            </div>
            <div className='border border-gray-200 rounded-md p-2'>
              <span className='font-semibold text-[#000080] block mb-1'>
                Period To
              </span>
              <span className='text-gray-700'>
                {accountDetails['periodTo']}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tables */}
      <div className='grid grid-cols-1 gap-6'>
        {renderSummaryTable('Monthly Sales Summary', salesSummary)}
        {renderSummaryTable('Monthly Purchases Summary', purchasesSummary)}
      </div>
    </div>
  )
}
