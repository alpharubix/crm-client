import { useNavigate, Navigate, useParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChevronLeft } from 'lucide-react'
import GstOverviewTab from './GstOverviewTab'
import TopSuppliersCustomersTab from './TopSuppliersCustomersTab'
import MonthlySummaryTab from './MonthlySummaryTab'

export interface GstReportPayload {
  gst_reference_id: string
}

export interface GstOverviewResponse {
  message: string
  data: any[]
}

// const getGstOverview = async (
//   gstReferenceId: string,
// ): Promise<GstOverviewResponse> => {
//   const response = await fetch(
//     `${ENV.VITE_BACKEND_BASE_URL}/accounts/r1xcrm-overview`,
//     {
//       credentials: 'include',
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ gst_reference_id: gstReferenceId }),
//     },
//   )
//   if (!response.ok) {
//     throw new Error('Failed to fetch date range')
//   }
//   const data = await response.json()
//   return data
// }

export default function GstReportPage() {
  const { gstReferenceId } = useParams()
  const navigate = useNavigate()

  if (!gstReferenceId) {
    return <Navigate to='/gst/history' replace />
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8'>
      <div className='space-y-6'>
        <div className='flex items-center space-x-4 mb-8'>
          <button
            // onClick={() => navigate('/gst/history')}
            className='p-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors'
          >
            <ChevronLeft className='w-5 h-5 text-gray-600' />
          </button>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>GST Report</h1>
            <p className='text-gray-500 mt-1'>Ref ID: {gstReferenceId}</p>
          </div>
        </div>

        <Tabs defaultValue='overview' className='w-full'>
          <TabsList className='grid w-full grid-cols-3 mb-8 bg-white  border-gray-100 p-2 rounded-lg'>
            <TabsTrigger
              value='overview'
              className='py-4 data-[state=active]:bg-[#000080] data-[state=active]:text-white'
            >
              GST Overview
            </TabsTrigger>
            <TabsTrigger
              value='suppliers-customers'
              className='py-4 data-[state=active]:bg-[#000080] data-[state=active]:text-white'
            >
              Top Suppliers & Customers
            </TabsTrigger>
            <TabsTrigger
              value='monthly-summary'
              className='py-4 data-[state=active]:bg-[#000080] data-[state=active]:text-white'
            >
              Monthly Sales & Purchase Summary
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value='overview'
            className='outline-none focus:outline-none'
          >
            <GstOverviewTab gstReferenceId={gstReferenceId} />
          </TabsContent>
          <TabsContent
            value='suppliers-customers'
            className='outline-none focus:outline-none'
          >
            <TopSuppliersCustomersTab gstReferenceId={gstReferenceId} />
          </TabsContent>
          <TabsContent
            value='monthly-summary'
            className='outline-none focus:outline-none'
          >
            <MonthlySummaryTab gstReferenceId={gstReferenceId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
