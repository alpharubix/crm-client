import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import TaxCalculation from '../components/itr/TaxCalculation'
import BalanceSheet from '@/components/itr/BalanceSheet'
import ProfitAndLossStatement from '@/components/itr/ProfitAndLossStatement'
import RatioAnalysis from '@/components/itr/RatioAnalysis'

type TabType =
  | 'TaxCalculation'
  | 'BalanceSheet'
  | 'ProfitAndLossStatement'
  | 'RatioAnalysis'

export default function ItrAnalysisPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('TaxCalculation')

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
          variant={activeTab === 'TaxCalculation' ? 'default' : 'outline'}
          onClick={() => setActiveTab('TaxCalculation')}
          className='whitespace-nowrap'
        >
          Tax Calculation
        </Button>
        <Button
          variant={activeTab === 'BalanceSheet' ? 'default' : 'outline'}
          onClick={() => setActiveTab('BalanceSheet')}
          className='whitespace-nowrap'
        >
          Balance Sheet
        </Button>
        <Button
          variant={
            activeTab === 'ProfitAndLossStatement' ? 'default' : 'outline'
          }
          onClick={() => setActiveTab('ProfitAndLossStatement')}
          className='whitespace-nowrap'
        >
          Profit & Loss Statement
        </Button>
        <Button
          variant={activeTab === 'RatioAnalysis' ? 'default' : 'outline'}
          onClick={() => setActiveTab('RatioAnalysis')}
          className='whitespace-nowrap'
        >
          Ratio Analysis
        </Button>
      </div>

      <div className='bg-white rounded-lg shadow-sm border border-slate-200 min-h-[500px]'>
        {activeTab === 'TaxCalculation' && <TaxCalculation acc_id={id} />}
        {activeTab === 'BalanceSheet' && <BalanceSheet acc_id={id} />}
        {activeTab === 'ProfitAndLossStatement' && (
          <ProfitAndLossStatement acc_id={id} />
        )}
        {activeTab === 'RatioAnalysis' && <RatioAnalysis acc_id={id} />}
      </div>
    </div>
  )
}
