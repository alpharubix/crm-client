import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import SummeryOfDebitAndCredit from '../components/bsa/summary-of-debit-and-credit/SummeryOfDebitAndCredit'
import CashFlow from '../components/bsa/cashFlow/CashFlow'
import OverviewMonthlyWise from '../components/bsa/overview-monthly-wise/OverviewMonthlyWise'

type TabType = 'summary' | 'cashflow' | 'overview'

export default function BsaAnalysisPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('summary')

  if (!id) return null

  return (
    <div className=' max-w-[1400px] mx-auto w-full animate-in fade-in zoom-in duration-300'>
      <div className='flex items-center gap-4 mb-6'>
        <Button variant='ghost' size='icon' onClick={() => navigate(-1)}>
          <ArrowLeft className='h-5 w-5' />
        </Button>
        <h1 className='text-2xl font-bold tracking-tight'>
          Bank Statement Analysis
        </h1>
      </div>

      <div className='flex gap-2 border-b pb-2 mb-6 overflow-x-auto'>
        <Button
          variant={activeTab === 'summary' ? 'default' : 'outline'}
          onClick={() => setActiveTab('summary')}
          className='whitespace-nowrap'
        >
          Summary of Debit and Credit
        </Button>
        <Button
          variant={activeTab === 'cashflow' ? 'default' : 'outline'}
          onClick={() => setActiveTab('cashflow')}
          className='whitespace-nowrap'
        >
          Cash Flow
        </Button>
        <Button
          variant={activeTab === 'overview' ? 'default' : 'outline'}
          onClick={() => setActiveTab('overview')}
          className='whitespace-nowrap'
        >
          Month-Wise Overview
        </Button>
      </div>

      <div className='bg-white rounded-lg shadow-sm border border-slate-200 min-h-[500px]'>
        {activeTab === 'summary' && <SummeryOfDebitAndCredit acc_id={id} />}
        {activeTab === 'cashflow' && <CashFlow acc_id={id} />}
        {activeTab === 'overview' && <OverviewMonthlyWise acc_id={id} />}
      </div>
    </div>
  )
}
