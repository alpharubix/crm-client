import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '../ui/card'
import { Link, useNavigate } from 'react-router-dom'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import { ENV } from '@/conf'
import users from '@/utils/users.json'

export interface KanbanFilters {
  account_name?: string
  deal_status?: string
  loan_type?: string | string[]
  created_from?: string
  created_to?: string
  expected_from: string
  expected_to: string
  status_closing_from: string
  status_closing_to: string
}

export interface DealData {
  id: string
  dealName: string
  dealId: string
  dealOwner: string
  lenderName: string
  status: string
}

const COLUMNS = [
  'Deal Created',
  'Lender Review',
  'Lender Rejected',
  'Approved',
  'Yet to Lender Login',
  'Disbursed',
  'Achievement',
  'Not Interested',
  'Active',
  'No Status',
]

const COLUMN_STYLES: Record<string, { header: string; dot: string }> = {
  'Deal Created': {
    header: 'text-zinc-500 border-zinc-300',
    dot: 'bg-zinc-400',
  },
  'Lender Review': {
    header: 'text-blue-600 border-blue-300',
    dot: 'bg-blue-500',
  },
  'Lender Rejected': {
    header: 'text-emerald-600 border-emerald-300',
    dot: 'bg-emerald-500',
  },
  Achievement: {
    header: 'text-orange-700 border-orange-300',
    dot: 'bg-orange-500',
  },
  'Not Interested': {
    header: 'text-purple-600 border-purple-300',
    dot: 'bg-purple-500',
  },
}

function DraggableTicketCard({ deal }: { deal: DealData }) {
  const navigate = useNavigate()
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: deal.id,
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={isDragging ? 'opacity-50' : ''}
    >
      <Link to={`/deals/${deal.id}`} target='_blank'>
        <Card
          className='transition-colors py-0 gap-0 overflow-hidden hover:bg-muted/30'
          // onClick={() => navigate(`/deals/${deal.id}`)}
        >
          <CardContent className='p-3 text-sm grid gap-1'>
            <p className='font-semibold text-base leading-tight'>
              {deal.dealName}
            </p>
            <div className='grid grid-cols-[110px_1fr] gap-x-2 gap-y-1 mt-2 items-start text-xs'>
              <span className='text-muted-foreground font-medium'>Deal ID</span>
              <span className='font-medium line-clamp-1'>
                {deal.dealId || '-'}
              </span>
              <span className='text-muted-foreground font-medium'>
                Deal Owner
              </span>
              <span className='font-medium'>
                {(users as Record<string, string>)[deal.dealOwner] ||
                  `#${deal.dealOwner}`}
              </span>
              <span className='text-muted-foreground font-medium'>
                Lender Name
              </span>
              <span className='font-medium'>{deal.lenderName || '-'}</span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}

function DroppableTicketColumn({
  status,
  tickets,
}: {
  status: string
  tickets: DealData[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const style = COLUMN_STYLES[status] || {
    header: 'text-zinc-500',
    dot: 'bg-zinc-400',
  }

  return (
    <div
      ref={setNodeRef}
      className={`min-w-[280px] w-full flex flex-col gap-3 h-full p-2 rounded border transition-colors ${
        isOver ? 'border-zinc-300' : 'border-border'
      }`}
    >
      <div
        className={`flex items-center gap-2 pb-2 border-b mb-1 ${style.header}`}
      >
        <span className={`w-2 h-2 rounded shrink-0 ${style.dot}`} />
        <span className='text-xs font-semibold uppercase tracking-wide'>
          {status}
        </span>
        <span className='ml-auto text-xs font-mono'>{tickets.length}</span>
      </div>
      <div className='flex flex-col gap-3 flex-1 overflow-y-auto pr-1 pb-2'>
        {tickets.map((t) => (
          <DraggableTicketCard key={t.id} deal={t} />
        ))}
        {tickets.length === 0 && (
          <div
            className={`border border-dashed rounded p-4 text-center text-xs transition-colors ${
              isOver
                ? 'border-zinc-400 text-zinc-400'
                : 'border-zinc-200 text-zinc-300'
            }`}
          >
            Drop here
          </div>
        )}
      </div>
    </div>
  )
}

export default function DealsKanbanView({
  filters,
  enabled,
}: {
  filters: KanbanFilters
  enabled: boolean
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const [ticketsList, setTicketsList] = useState<DealData[]>([])
  const [activeTicket, setActiveTicket] = useState<DealData | null>(null)

  // const { data: grouped = {}, isLoading } = useQuery({
  //   queryKey: ['deals-kanban', filters],
  //   queryFn: async () => {
  //     const params = new URLSearchParams({ kanban: 'true' })
  //     Object.entries(filters).forEach(([k, v]) => {
  //       if (v) params.set(k, v)
  //     })
  //     const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/deals?${params}`, {
  //       credentials: 'include',
  //     })
  //     if (!res.ok) throw new Error('Failed')
  //     const json = await res.json()
  //     // return (json.data ?? {}) as Record<string, any[]>
  //     return res.json()
  //   },
  //   enabled,
  //   retry: false,
  // })
  // FIX: Fetch the complete payload object, not just .data
  const { data: kanbanPayload, isLoading } = useQuery({
    queryKey: ['deals-kanban', filters],
    queryFn: async () => {
      const params = new URLSearchParams({ kanban: 'true' })
      Object.entries(filters).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          v.forEach((val) => params.append(k, val))
        } else if (v) {
          params.set(k, v as string)
        }
      })
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/deals?${params}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed')
      const json = await res.json()
      return json // Returns both { data: ..., page_info: ... } safely
    },
    enabled,
    retry: false,
  })
  const groupedColumns = kanbanPayload?.data ?? {}
  const totalRecords = kanbanPayload?.page_info?.total ?? 0
  useEffect(() => {
    const flat: DealData[] = Object.entries(groupedColumns).flatMap(
      ([status, deals]) =>
        (deals as any[]).map((d: any) => ({
          id: String(d.id),
          dealName: d.account_name ?? '-',
          dealId: String(d.id),
          dealOwner: String(d.deal_owner_id ?? '-'),
          lenderName: d.lender_name ?? '-',
          status: d.case_status ?? status,
        })),
    )
    setTicketsList(flat)
  }, [kanbanPayload])

  function onDragStart(event: DragStartEvent) {
    const ticket = ticketsList.find((t) => t.id === event.active.id)
    if (ticket) setActiveTicket(ticket)
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveTicket(null)
    if (!over) return
    const newStatus = String(over.id)
    setTicketsList((prev) =>
      prev.map((t) => (t.id === active.id ? { ...t, status: newStatus } : t)),
    )
  }

  if (!enabled) {
    return (
      <div className='flex items-center justify-center h-full text-sm text-muted-foreground'>
        Apply filters to load deals
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-full text-sm text-muted-foreground'>
        Loading...
      </div>
    )
  }

  return (
    <div>
      {/* <DndContext
    sensors={sensors}
    onDragStart={onDragStart}
    onDragEnd={onDragEnd}
    > */}
      <div className='flex items-center gap-3'>
        <span className='text-sm font-bold text-indigo-600'>
          Total — {totalRecords}
        </span>
        {totalRecords > 200 && (
          <span className='text-[11px] text-amber-600 font-medium italic bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60'>
            * Limit reached (200). Filter by date or owner to see specific
            tickets.
          </span>
        )}
      </div>
      <div className='flex gap-5 pb-6 overflow-x-auto items-start h-[calc(92vh-140px)] min-h-0 px-1'>
        {COLUMNS.map((col) => (
          <DroppableTicketColumn
            key={col}
            status={col}
            tickets={ticketsList.filter((t) => t.status === col)}
          />
        ))}
      </div>
      {/* <DragOverlay> */}
      {activeTicket && (
        <Card className='cursor-grabbing shadow-lg opacity-90 border-l-4 border-l-primary/50 py-0'>
          <CardContent className='p-3 text-sm'>
            <p className='font-semibold'>{activeTicket.dealName}</p>
          </CardContent>
        </Card>
      )}
      {/* </DragOverlay> */}
      {/* </DndContext> */}
    </div>
  )
}
