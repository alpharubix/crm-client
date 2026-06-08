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
  ticket_status?: string
  type_of_loan?: string | string[]
  created_from?: string
  created_to?: string
  lender_login_from?: string
  lender_login_to?: string
  deal_owner_id?: string | string[]
  targeted_disbursement_from: string
  targeted_disbursement_to: string
  disbursement_from: string
  disbursement_to: string
}

export interface TicketData {
  id: string
  dealName: string
  ticketId: string
  dealOwner: string
  lenderName: string
  status: string
}

// Adjust these to match your actual Ticket statuses
const COLUMNS = [
  'Yet to Lender Login',
  'Lender Review',
  'In Credit',
  'Approved',
  'Disbursed',
  'Rejected',
  'Not Interested',
]

const COLUMN_STYLES: Record<string, { header: string; dot: string }> = {
  'Yet to Lender Login': {
    header: 'text-zinc-500 border-zinc-300',
    dot: 'bg-zinc-400',
  },
  'Lender Review': {
    header: 'text-blue-600 border-blue-300',
    dot: 'bg-blue-500',
  },
  'In Credit': {
    header: 'text-indigo-600 border-indigo-300',
    dot: 'bg-indigo-500',
  },
  Approved: {
    header: 'text-emerald-600 border-emerald-300',
    dot: 'bg-emerald-500',
  },
  Disbursed: {
    header: 'text-green-700 border-green-300',
    dot: 'bg-green-600',
  },
  Rejected: {
    header: 'text-red-600 border-red-300',
    dot: 'bg-red-500',
  },
  'Not Interested': {
    header: 'text-purple-600 border-purple-300',
    dot: 'bg-purple-500',
  },
}

function DraggableTicketCard({ ticket }: { ticket: TicketData }) {
  const navigate = useNavigate()
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: ticket.id,
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={isDragging ? 'opacity-50' : ''}
    >
      <Link to={`/tickets/${ticket.id}`} target='_blank'>
        <Card
          className='transition-colors py-0 gap-0 overflow-hidden hover:bg-muted/30'
          // onClick={() => navigate(`/tickets/${ticket.id}`)}
        >
          <CardContent className='p-3 text-sm grid gap-1'>
            <p className='font-semibold text-base leading-tight'>
              {ticket.dealName}
            </p>
            <div className='grid grid-cols-[110px_1fr] gap-x-2 gap-y-1 mt-2 items-start text-xs'>
              <span className='text-muted-foreground font-medium'>
                Ticket ID
              </span>
              <span className='font-medium line-clamp-1'>
                {ticket.ticketId || '-'}
              </span>
              <span className='text-muted-foreground font-medium'>
                Deal Owner
              </span>
              <span className='font-medium'>
                {(users as Record<string, string>)[ticket.dealOwner] ||
                  `#${ticket.dealOwner}`}
              </span>
              <span className='text-muted-foreground font-medium'>
                Lender Name
              </span>
              <span className='font-medium'>{ticket.lenderName || '-'}</span>
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
  tickets: TicketData[]
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
          <DraggableTicketCard key={t.id} ticket={t} />
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

export default function TicketsKanbanView({
  filters,
  enabled,
  onTotalFetched,
}: {
  filters: KanbanFilters
  enabled: boolean
  onTotalFetched?: (total: number) => void
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )
  const [totalTickets, setTotalTickets] = useState(0)
  const [ticketsList, setTicketsList] = useState<TicketData[]>([])
  const [activeTicket, setActiveTicket] = useState<TicketData | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['tickets-kanban', filters],
    queryFn: async () => {
      const params = new URLSearchParams({ kanban: 'true' })
      Object.entries(filters).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          v.forEach((val) => params.append(k, val))
        } else if (v) {
          params.set(k, v as string)
        }
      })
      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/tickets?${params}`,
        { credentials: 'include' },
      )
      if (!res.ok) throw new Error('Failed')
      return await res.json() // RETURN FULL JSON
    },
    enabled,
    retry: false,
  })
  const grouped = data?.data ?? {}
  console.log({ grouped })
  // useEffect(() => {
  //   if (data?.page_info?.total !== undefined) {
  //     onTotalFetched?.(data.page_info.total)
  //   }
  // }, [data?.page_info?.total, onTotalFetched])

  useEffect(() => {
    const flat: TicketData[] = Object.entries(grouped).flatMap(
      ([status, tickets]) =>
        tickets.map((t: any) => ({
          id: String(t.id),
          dealName: t.account_name ?? '-',
          ticketId: String(t.id),
          dealOwner: String(t.deal_owner_id ?? '-'),
          lenderName: t.lender_name ?? '-',
          status: t.ticket_status ?? status,
        })),
    )
    setTicketsList(flat)
  }, [grouped])

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
        Apply filters to load tickets
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
      <span className='text-sm font-bold text-indigo-600'>
        {/* If you have the data from the hook: */}
        Total - {data?.page_info?.total || 0}
      </span>
      {data?.page_info?.total > 200 && (
        <span className='text-[11px] text-amber-600 font-medium italic'>
          * Limit reached (200). Filter by date or owner to see specific
          tickets.
        </span>
      )}
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
