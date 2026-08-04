import { DistributorMaster } from '@/components/invoicing/DistributorMaster'

export default function DistributorMasterPage() {
  return (
    <div className="mx-auto w-310 bg-slate-100 flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-950">Distributor Master</h2>
          <p className="text-sm text-slate-500">
            Manage your distributor records.
          </p>
        </div>
      </div>
      
      <div className="w-full">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden p-6 md:p-8 min-h-137.5">
          <DistributorMaster forcedTab="general" allowedTabs={['general', 'contact', 'sales'] as const} />
        </div>
      </div>
    </div>
  )
}
