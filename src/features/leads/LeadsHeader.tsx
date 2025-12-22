import { Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  loading: boolean
  onRefresh: () => void
  onAdd: () => void
}

export default function LeadsHeader({ loading, onRefresh, onAdd }: Props) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leads Database</h1>
        <p className="text-muted-foreground">
          Manage your potential leads here.
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" size="icon" onClick={onRefresh}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>

        <Button className="rounded-full gap-2" onClick={onAdd}>
          <Plus className="h-4 w-4" /> Add Lead
        </Button>
      </div>
    </div>
  )
}
