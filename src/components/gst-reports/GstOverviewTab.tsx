import { useQuery } from '@tanstack/react-query'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import React from 'react'
import { ENV } from '@/conf'

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#a28bfe',
  '#ff7675',
  '#74b9ff',
]
export interface GstReportPayload {
  gst_reference_id: string
}

export interface GstOverviewResponse {
  message: string
  data: any[]
}

export const getGstOverview = async (
  gstReferenceId: string,
): Promise<GstOverviewResponse> => {
  const response = await fetch(
    `${ENV.VITE_BACKEND_BASE_URL}/accounts/r1xcrm-overview`,
    {
      credentials: 'include',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gst_reference_id: gstReferenceId }),
    },
  )
  if (!response.ok) {
    throw new Error('Failed to fetch date range')
  }
  const data = await response.json()
  return data
}

export default function GstOverviewTab({
  gstReferenceId,
}: {
  gstReferenceId: string
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['gstOverview', gstReferenceId],
    queryFn: () => getGstOverview(gstReferenceId),
    enabled: !!gstReferenceId,
  })

  if (isLoading) {
    return (
      <div className='flex justify-center items-center py-20'>
        <span className='h-10 w-10 rounded-full border-4 border-[#000080]/20 border-t-[#000080] animate-spin' />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className='bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center text-red-500'>
        Failed to load GST Overview Data.
      </div>
    )
  }

  const accountDetails = data.data.find(
    (item: any) => item['Account Details'],
  )?.['Account Details']
  const overview = data.data.find((item: any) => item['Overview'])?.['Overview']
  const snapshot = data.data.find((item: any) => item['Snapshot'])?.['Snapshot']

  const overviewOfReturns = overview?.find(
    (item: any) => item['Overview of GST Returns'],
  )?.['Overview of GST Returns']
  const comparisonGstr3b = overview?.find(
    (item: any) => item['Comparison with GSTR 3B'],
  )?.['Comparison with GSTR 3B']
  const businessBreakup = overview?.find(
    (item: any) => item['Business Breakup '],
  )?.['Business Breakup ']
  const businessBreakupGstr1 = overview?.find(
    (item: any) => item['Business BreakUp - GSTR1'],
  )?.['Business BreakUp - GSTR1']
  const averages = snapshot?.find((item: any) => item['Averages'])?.['Averages']

  // Process pie chart data
  const pieData = businessBreakupGstr1
    ? Object.entries(businessBreakupGstr1)
        .map(([name, value]) => ({ name, value: Number(value) }))
        .filter((item) => item.value !== 0)
    : []

  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <h3 className='text-lg font-semibold text-white bg-[#e67e22] px-4 py-2 rounded-t-md'>
      {children}
    </h3>
  )

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

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Overview of GST Returns */}
        {overviewOfReturns && (
          <div className='bg-white rounded-md shadow-sm border border-gray-200 h-fit'>
            <SectionTitle>Overview of GST Returns</SectionTitle>
            <div className='p-0'>
              <table className='w-full text-sm text-left'>
                <thead className='bg-[#000080] text-white'>
                  <tr>
                    <th className='px-4 py-2 border border-[#000080]'>
                      Particulars
                    </th>
                    <th className='px-4 py-2 border border-[#000080] text-right'>
                      Values
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {overviewOfReturns.map((section: any, idx: number) => {
                    const sectionName = Object.keys(section)[0]
                    const sectionData = section[sectionName]
                    return (
                      <React.Fragment key={idx}>
                        <tr className='bg-gray-100 font-semibold'>
                          <td
                            colSpan={2}
                            className='px-4 py-2 border border-gray-200'
                          >
                            {sectionName}
                          </td>
                        </tr>
                        {Object.entries(sectionData).map(([key, value], i) => {
                          const rawVal = value
                          const isNegative =
                            typeof rawVal === 'number'
                              ? rawVal < 0
                              : typeof rawVal === 'string' &&
                                rawVal.trim().startsWith('-')
                          return (
                            <tr key={i} className='hover:bg-gray-50'>
                              <td
                                className={`px-4 py-2 border border-gray-200 ${key.startsWith('Gross') || key.startsWith('Profit') || key.includes('Liability') || key.includes('Available') ? 'font-semibold text-[#000080]' : 'text-gray-700'}`}
                              >
                                {key}
                              </td>
                              <td
                                className={`px-4 py-2 border border-gray-200 text-right font-medium ${isNegative ? 'text-red-600' : ''}`}
                              >
                                {value as string}
                              </td>
                            </tr>
                          )
                        })}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className='space-y-6'>
          {/* Comparison with GSTR 3B */}
          {comparisonGstr3b && (
            <div className='bg-white rounded-md shadow-sm border border-gray-200'>
              <SectionTitle>Comparison with GSTR 3B</SectionTitle>
              <div className='p-0'>
                <table className='w-full text-sm text-left'>
                  <thead className='bg-[#000080] text-white'>
                    <tr>
                      <th className='px-4 py-2 border border-[#000080] w-2/3'>
                        Particulars
                      </th>
                      <th className='px-4 py-2 border border-[#000080] text-right'>
                        Taxable Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonGstr3b.map((section: any, idx: number) => {
                      const sectionName = Object.keys(section)[0]
                      const sectionData = section[sectionName]
                      return (
                        <React.Fragment key={idx}>
                          <tr className='bg-[#000080] text-white opacity-90 font-semibold'>
                            <td
                              colSpan={2}
                              className='px-4 py-1 text-center border border-[#000080]'
                            >
                              {sectionName}
                            </td>
                          </tr>
                          {Object.entries(sectionData).map(
                            ([key, value], i) => {
                              const rawVal = value
                              const isNegative =
                                typeof rawVal === 'number'
                                  ? rawVal < 0
                                  : typeof rawVal === 'string' &&
                                    rawVal.trim().startsWith('-')
                              return (
                                <tr key={i} className='hover:bg-gray-50'>
                                  <td className='px-4 py-2 border border-gray-200 text-gray-700'>
                                    {key}
                                  </td>
                                  <td
                                    className={`px-4 py-2 border border-gray-200 text-right font-medium ${isNegative ? 'text-red-600' : ''}`}
                                  >
                                    {value as string}
                                  </td>
                                </tr>
                              )
                            },
                          )}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Averages */}
          {averages && (
            <div className='bg-white rounded-md shadow-sm border border-gray-200'>
              <table className='w-full text-sm text-left'>
                <thead className='bg-[#000080] text-white'>
                  <tr>
                    <th className='px-4 py-2 border border-[#000080] text-center'>
                      Averages
                    </th>
                    <th className='px-4 py-2 border border-[#000080] text-right'>
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(averages).map(([key, value], idx) => {
                    const rawVal = value
                    const isNegative =
                      typeof rawVal === 'number'
                        ? rawVal < 0
                        : typeof rawVal === 'string' &&
                          rawVal.trim().startsWith('-')
                    return (
                      <tr key={idx} className='hover:bg-gray-50'>
                        <td className='px-4 py-2 border border-gray-200 text-gray-700 font-medium'>
                          {key}
                        </td>
                        <td
                          className={`px-4 py-2 border border-gray-200 text-right font-semibold ${isNegative ? 'text-red-600' : ''}`}
                        >
                          {value as string}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Business Breakup */}
        {businessBreakup && (
          <div className='bg-white rounded-md shadow-sm border border-gray-200 h-fit'>
            <div className='flex bg-[#e67e22] text-white rounded-t-md'>
              <h3 className='text-lg font-semibold px-4 py-2 w-2/3 border-r border-[#d35400] text-center'>
                Business Breakup
              </h3>
              <h3 className='text-lg font-semibold px-4 py-2 w-1/3 text-center'>
                Total Value
              </h3>
            </div>
            <div className='p-0'>
              <table className='w-full text-sm text-left'>
                <tbody>
                  {businessBreakup.map((section: any, idx: number) => {
                    const sectionName = Object.keys(section)[0]
                    const sectionData = section[sectionName]
                    const cleanTitle = sectionName.split(' (')[0] // E.g., Sales
                    return (
                      <React.Fragment key={idx}>
                        <tr className='bg-[#000080] text-white font-semibold'>
                          <td
                            colSpan={2}
                            className='px-4 py-1 text-center border border-[#000080]'
                          >
                            {cleanTitle}
                          </td>
                        </tr>
                        {Object.entries(sectionData).map(([key, value], i) => {
                          const rawVal = value
                          const isNegative =
                            typeof rawVal === 'number'
                              ? rawVal < 0
                              : typeof rawVal === 'string' &&
                                rawVal.trim().startsWith('-')
                          return (
                            <tr key={i} className='hover:bg-gray-50'>
                              <td className='px-4 py-2 border border-gray-200 text-gray-700 w-2/3'>
                                {key}
                              </td>
                              <td
                                className={`px-4 py-2 border border-gray-200 text-right font-medium w-1/3 ${isNegative ? 'text-red-600' : ''}`}
                              >
                                {value as string}
                              </td>
                            </tr>
                          )
                        })}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pie Chart */}
        {pieData.length > 0 && (
          <div className='bg-white rounded-md shadow-sm border border-gray-200 p-4 flex flex-col justify-center'>
            <h3 className='text-lg font-bold text-center text-gray-900 mb-6'>
              Business Breakup - GSTR 1
            </h3>
            <div className='h-[300px] w-full'>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx='50%'
                    cy='50%'
                    labelLine={false}
                    outerRadius={100}
                    fill='#8884d8'
                    dataKey='value'
                    label={({
                      cx,
                      cy,
                      midAngle,
                      innerRadius,
                      outerRadius,
                      percent,
                    }) => {
                      const RADIAN = Math.PI / 180
                      const radius =
                        innerRadius + (outerRadius - innerRadius) * 0.5
                      const x = cx + radius * Math.cos(-midAngle * RADIAN)
                      const y = cy + radius * Math.sin(-midAngle * RADIAN)
                      return (
                        <text
                          x={x}
                          y={y}
                          fill='white'
                          textAnchor={x > cx ? 'start' : 'end'}
                          dominantBaseline='central'
                          className='text-xs font-bold'
                        >
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      )
                    }}
                  >
                    {pieData.map((_: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `₹ ${Number(value).toFixed(2)}`}
                  />
                  <Legend
                    layout='horizontal'
                    verticalAlign='bottom'
                    align='center'
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
