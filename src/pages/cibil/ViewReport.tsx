import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import CibilReportTabs from '@/components/cibil/CibilReportTabs'

type ViewReportProps = {
  reference_id?: string
  onBack?: () => void
  onStartNew?: () => void
}

export default function ViewReport() {
  const { cibilRefId } = useParams()
  // const { cibilRefId: routeReferenceId } = useParams<{ reference_id: string }>();
  const navigate = useNavigate()
  // const referenceId = propReferenceId || cibilRefId;

  useEffect(() => {
    document.title = 'View CIBIL Report'
  }, [])

  // const handleBack = () => {
  //   if (onBack) {
  //     onBack()
  //     return
  //   }

  //   navigate('/cibil/reports')
  // }

  // const handleStartNew = () => {
  //   if (onStartNew) {
  //     onStartNew()
  //     return
  //   }

  //   navigate('/cibil')
  // }

  if (!cibilRefId) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-10 flex items-center justify-center'>
        <div className='mx-auto max-w-3xl rounded-2xl border border-red-200 bg-white p-6 text-red-700 shadow-sm'>
          Reference ID is missing.
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-10 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-7xl mx-auto space-y-6'>
        <div className='flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between'>
          <div>
            <span className='text-xs font-semibold uppercase tracking-wide text-slate-500'>
              CIBIL Report
            </span>
            <h1 className='mt-1 text-3xl font-bold text-slate-900 tracking-tight sm:text-4xl'>
              Report Sections
            </h1>
            <p className='mt-2 max-w-3xl break-all text-sm text-slate-600'>
              Reference ID:{' '}
              <span className='font-semibold text-slate-900'>{cibilRefId}</span>
            </p>
          </div>

          <div className='flex flex-wrap gap-3'>
            <button
              type='button'
              onClick={() => { navigate(-1) }}
              className='rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50'
            >
              Back
            </button>
            {/* <button
              type='button'
              onClick={handleStartNew}
              className='rounded-xl bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-black/80'
            >
              Start New CIBIL Flow
            </button> */}
          </div>
        </div>

        <CibilReportTabs referenceId={cibilRefId} />
      </div>
    </div>
  )
}
