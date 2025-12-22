import { useState } from 'react'
import { type DateRange } from 'react-day-picker'
import LeadsHeader from './LeadsHeader'
import AddLeadDialog from './AddLeadDialog'
import LeadsFilters from './LeadsFilters'
import LeadsTable from './LeadsTable'
import { useLeads } from './useLeads'

export default function LeadsPage() {
  const { leads, loading, fetchLeads } = useLeads()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>()

  return (
    <div className="p-4">
      <LeadsHeader
        loading={loading}
        onRefresh={fetchLeads}
        onAdd={() => setIsDialogOpen(true)}
      />

      <AddLeadDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={fetchLeads}
      />

      <LeadsFilters dateRange={dateRange} onDateChange={setDateRange} />

      <LeadsTable leads={leads} loading={loading} />
    </div>
  )
}
