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
import { cn } from '@/lib/utils'
import { Calendar } from 'lucide-react'

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
  ticketId: string
  accountName: string
  dealName?: string
  dealOwner: string
  lenderName: string
  status: string
  loanType?: string
  loanAmount?: number | string
  targetDisbursementDate?: string
  disbursementDate?: string
  createdTime?: string
}

const formatCurrency = (val?: number | string | null) => {
  if (!val) return null
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.]/g, ''))
  if (isNaN(num) || num === 0) return null
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num)
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
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: ticket.id,
  })

  const ownerName = (users as Record<string, string>)[ticket.dealOwner] || ticket.dealOwner || 'Unassigned'
  const initial = ownerName.charAt(0).toUpperCase()
  const formattedAmount = formatCurrency(ticket.loanAmount)

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn('cursor-grab active:cursor-grabbing transition-transform', isDragging && 'opacity-40 scale-95')}
    >
      <Link to={`/tickets/${ticket.id}`} target='_blank' className='block'>
        <Card className='transition-all duration-200 border border-border/70 hover:border-blue-500/60 shadow-2xs hover:shadow-md rounded-xl overflow-hidden bg-card group'>
          <CardContent className='p-4 space-y-3'>
            {/* Header Row: ID badge & Loan Type */}
            <div className='flex items-center justify-between gap-2'>
              <span className='font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-muted text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-border/40'>
                #{ticket.id}
              </span>
              {ticket.loanType && ticket.loanType !== '-' && (
                <span className='text-[10px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-md border border-purple-200/50 dark:border-purple-800/40 truncate max-w-[120px]'>
                  {ticket.loanType}
                </span>
              )}
            </div>

            {/* Title & Deal Name */}
            <div className='space-y-0.5'>
              <h4 className='font-bold text-sm text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1 leading-snug tracking-tight'>
                {ticket.accountName || ticket.dealName || `Ticket #${ticket.id}`}
              </h4>
              {ticket.dealName && ticket.accountName && ticket.dealName !== ticket.accountName && (
                <p className='text-xs text-muted-foreground line-clamp-1 font-medium'>
                  {ticket.dealName}
                </p>
              )}
            </div>

            {/* Middle Section: Key Metrics */}
            {(formattedAmount || ticket.targetDisbursementDate || ticket.disbursementDate) && (
              <div className='flex flex-col gap-1.5 pt-2 border-t border-border/40'>
                {formattedAmount && (
                  <div className='flex items-center justify-between'>
                    <span className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wider'>Loan Amount</span>
                    <span className='font-extrabold text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/40'>
                      {formattedAmount}
                    </span>
                  </div>
                )}
                {(ticket.disbursementDate || ticket.targetDisbursementDate) && (
                  <div className='flex items-center justify-between text-xs text-muted-foreground'>
                    <span className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wider'>
                      {ticket.disbursementDate ? 'Disbursed' : 'Target Disb'}
                    </span>
                    <div className='flex items-center gap-1.5 text-xs font-medium text-foreground/90 bg-slate-100/80 dark:bg-muted/60 px-2 py-0.5 rounded-md border border-border/40'>
                      <Calendar className='h-3 w-3 text-emerald-500 shrink-0' />
                      <span>{ticket.disbursementDate || ticket.targetDisbursementDate}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer Row: Owner Avatar & Lender Badge */}
            <div className='flex items-center justify-between pt-2.5 border-t border-border/50 text-xs text-muted-foreground'>
              <div className='flex items-center gap-1.5 min-w-0'>
                <div className='h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 font-bold text-[10px] flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800'>
                  {initial}
                </div>
                <span className='truncate font-semibold text-xs text-foreground/90'>{ownerName}</span>
              </div>
              {ticket.lenderName && ticket.lenderName !== '-' && (
                <span className='bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-md text-[11px] font-bold shrink-0 truncate max-w-[110px] border border-indigo-200/60 dark:border-indigo-800/40'>
                  {ticket.lenderName}
                </span>
              )}
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
    header: 'text-foreground',
    dot: 'bg-blue-500',
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-w-[290px] w-[290px] flex flex-col gap-3 h-full p-3 rounded-2xl bg-slate-100/70 dark:bg-muted/20 border border-border/50 transition-colors shrink-0',
        isOver && 'border-blue-500/60 bg-blue-500/5'
      )}
    >
      <div className='flex items-center justify-between pb-2 border-b border-border/50'>
        <div className='flex items-center gap-2 min-w-0'>
          <span className={`h-2 w-2 rounded-full shrink-0 ${style.dot}`} />
          <span className='text-xs font-bold text-foreground truncate tracking-tight'>
            {status}
          </span>
        </div>
        <span className='text-[11px] font-semibold text-muted-foreground bg-background px-2.5 py-0.5 rounded-full border border-border/50 shadow-2xs'>
          {tickets.length}
        </span>
      </div>

      <div className='flex flex-col gap-2.5 flex-1 overflow-y-auto pr-0.5 pb-2'>
        {tickets.map((t) => (
          <DraggableTicketCard key={t.id} ticket={t} />
        ))}
        {tickets.length === 0 && (
          <div
            className={cn(
              'border border-dashed rounded-xl p-6 text-center text-xs text-muted-foreground/60 transition-colors flex items-center justify-center min-h-[100px]',
              isOver ? 'border-blue-500 text-blue-500 bg-blue-500/5' : 'border-border/60'
            )}
          >
            Drop tickets here
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

  const [ticketsList, setTicketsList] = useState<TicketData[]>([])
  const [activeTicket, setActiveTicket] = useState<TicketData | null>(null)

  const { data: kanbanPayload, isLoading } = useQuery({
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
        `${ENV.VITE_BACKEND_BASE_URL}/tickets?${params.toString()}`,
        {
          credentials: 'include',
        },
      )
      if (!res.ok) throw new Error('Failed to fetch kanban data')
      return res.json()
    },
    enabled,
    retry: false,
  })

  const grouped = kanbanPayload?.data ?? {}

  useEffect(() => {
    const flat: TicketData[] = Object.entries(grouped).flatMap(
      ([status, tickets]) =>
        (tickets as any[]).map((t: any) => ({
          id: String(t.id),
          ticketId: String(t.id),
          accountName: t.account_name ?? t.account?.account_name ?? '-',
          dealName: t.deal_name ?? t.deal?.deal_name ?? '',
          dealOwner: String(t.deal_owner_id ?? t.deal_owner ?? '-'),
          lenderName: t.lender_name ?? t.lender ?? '-',
          status: t.ticket_status ?? status,
          loanType: t.type_of_loan ?? t.loan_type ?? '',
          loanAmount: t.loan_amount ?? t.amount ?? t.disbursement_amount ?? null,
          targetDisbursementDate: t.targeted_disbursement_date ?? t.target_disbursed_date ?? '',
          disbursementDate: t.disbursement_date ?? t.disbursed_date ?? '',
          createdTime: t.ticket_created_time ?? t.created_at ?? '',
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
        Total - {kanbanPayload?.page_info?.total || 0}
      </span>
      {kanbanPayload?.page_info?.total > 200 && (
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
