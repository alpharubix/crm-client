import { useState } from 'react'
import { type DateRange } from 'react-day-picker'
import LeadsHeader from '../components/leads/leads-header'
import AddLeadDialog from '../components/leads/add-lead-dialog'
import LeadsFilters from '../components/leads/leads-filters'
import LeadsTable from '../components/leads/leads-table'
import { useLeads } from '../hooks/use-leads'

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
