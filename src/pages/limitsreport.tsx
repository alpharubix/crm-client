import { useState } from 'react'
import { KotakRawDataHWC } from '@/components/invoicing/KotakRawData(HWC)'
import { KotakRawDataCKPL } from '@/components/invoicing/KotakRawData(CKPL)'
import { TCPLRawData } from "@/components/invoicing/TCPLRawData";
import { HeroRawData } from '@/components/invoicing/HeroRawData';
import { MuthootRawData } from '@/components/invoicing/MuthootRawData';
import { ConsolitatedLimitData } from '@/components/invoicing/ConsolitatedLimitData';


export default function InvoicingPage() {
  const [activeTab, setActiveTab] = useState<'invoice' | 'distributor' | 'kotak-hwc' | 'kotak-ckpl' | 'tcpl' | 'hero' | 'muthoot' | 'consolidated'>('kotak-hwc')
  return (
    <div className="mx-auto w-310 bg-slate-100 flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-950">Limits Report</h2>
          <p className="text-sm text-slate-500">
            Manage your Limits raw data.
          </p>
        </div>
      </div>
      
      <div className="w-full">
        <div className="px-1 border-b border-slate-200 mb-6 bg-white">
          <div className="flex gap-2 overflow-x-auto flex-nowrap scrollbar-none">
           
            <button
              onClick={() => setActiveTab('kotak-hwc')}
              className={`rounded-none px-4 py-2.5 text-xs md:text-sm font-semibold transition-all duration-200 border-b-[3px] border-solid -mb-px ${
                activeTab === 'kotak-hwc'
                  ? 'bg-blue-50/75 text-blue-600 border-blue-600'
                  : 'text-slate-500 hover:text-slate-800 bg-transparent border-transparent'
              }`}
            >
              Kotak Raw Data (HWC)
            </button>
            <button
              onClick={() => setActiveTab('kotak-ckpl')}
              className={`rounded-none px-4 py-2.5 text-xs md:text-sm font-semibold transition-all duration-200 border-b-[3px] border-solid -mb-px ${
                activeTab === 'kotak-ckpl'
                  ? 'bg-blue-50/75 text-blue-600 border-blue-600'
                  : 'text-slate-500 hover:text-slate-800 bg-transparent border-transparent'
              }`}
            >
              Kotak Raw Data (CKPL)
            </button>
                        <button
              onClick={() => setActiveTab('tcpl')}
              className={`rounded-none px-4 py-2.5 text-xs md:text-sm font-semibold transition-all duration-200 border-b-[3px] border-solid -mb-px ${
                activeTab === 'tcpl'
                  ? 'bg-blue-50/75 text-blue-600 border-blue-600'
                  : 'text-slate-500 hover:text-slate-800 bg-transparent border-transparent'
              }`}
            >
              TCPL RAW DATA 
            </button>
            <button
              onClick={() => setActiveTab('hero')}
              className={`rounded-none px-4 py-2.5 text-xs md:text-sm font-semibold transition-all duration-200 border-b-[3px] border-solid -mb-px ${
                activeTab === 'hero'
                  ? 'bg-blue-50/75 text-blue-600 border-blue-600'
                  : 'text-slate-500 hover:text-slate-800 bg-transparent border-transparent'
              }`}
            >
              Hero Raw Data 
            </button>
            <button
              onClick={() => setActiveTab('muthoot')}
              className={`rounded-none px-4 py-2.5 text-xs md:text-sm font-semibold transition-all duration-200 border-b-[3px] border-solid -mb-px ${
                activeTab === 'muthoot'
                  ? 'bg-blue-50/75 text-blue-600 border-blue-600'
                  : 'text-slate-500 hover:text-slate-800 bg-transparent border-transparent'
              }`}
            >
              Muthoot Raw Data 
          </button>
         <button
            onClick={() => setActiveTab('consolidated')}
            className={`rounded-none px-4 py-2.5 text-xs md:text-sm font-semibold transition-all duration-200 border-b-[3px] border-solid -mb-px ${
              activeTab === 'consolidated'
                ? 'bg-blue-50/75 text-blue-600 border-blue-600'
                : 'text-slate-500 hover:text-slate-800 bg-transparent border-transparent'
            }`}
          >
            Consolidated Limit Report
          </button> 
            
           
           
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6 md:p-8 min-h-137.5">
          {activeTab === 'kotak-hwc' && <KotakRawDataHWC />}
          {activeTab === 'kotak-ckpl' && <KotakRawDataCKPL />}
          {activeTab === 'tcpl' && <TCPLRawData />}
          {activeTab === 'hero' && <HeroRawData />}
          {activeTab === 'muthoot' && <MuthootRawData />}
          {activeTab === 'consolidated' && <ConsolitatedLimitData />}

        </div>
      </div>
    </div>
  )
}
