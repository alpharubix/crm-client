import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { ENV } from '@/conf'
import { useAuth } from '@/context/auth-context'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  LifeBuoy,
  Send,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Search,
  Filter,
  RefreshCw,
  Eye,
  ShieldCheck,
  Tag,
  Layers,
  FileText,
  UserCheck,
  Check,
} from 'lucide-react'

interface SupportTicket {
  ticket_id: string
  title: string
  service: string
  priority: string
  description: string
  status: string
  created_at: string
  user_id: number
}

const SERVICES = [
  'General Technical Issue',
  'Accounts',
  'Contacts',
  'Deals',
  'Projects',
  'Revenue',
  'Exports',
  'Audit Logs',
]

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']
const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']

export default function SupportTicketsPage() {
  const { user } = useAuth()
  const userRole = String(user?.role || '').toLowerCase().replace(/\s+/g, '_')
  const isAdmin = ['admin', 'superadmin', 'super_admin'].includes(userRole)

  // Form State
  const [title, setTitle] = useState('')
  const [service, setService] = useState('General Technical Issue')
  const [priority, setPriority] = useState('Medium')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Data & Table State
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [isLoadingTickets, setIsLoadingTickets] = useState(false)
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null)

  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')

  // Selected Ticket for Detail Dialog
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)

  const fetchTickets = async () => {
    setIsLoadingTickets(true)
    try {
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/v1/support-ticket/history`, {
        credentials: 'include',
      })
      if (!res.ok) {
        throw new Error('Failed to fetch support tickets')
      }
      const data = await res.json()
      if (data && Array.isArray(data.data)) {
        setTickets(data.data)
      } else {
        setTickets([])
      }
    } catch (error: any) {
      console.error('Error fetching tickets:', error)
      toast.error('Failed to load support ticket history')
    } finally {
      setIsLoadingTickets(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error('Please enter a ticket title')
      return
    }
    if (!description.trim()) {
      toast.error('Please provide a description of the issue')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/v1/support-ticket/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title,
          service,
          priority,
          description,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || data.message || 'Failed to submit ticket')
      }

      toast.success(`Support Ticket ${data?.data?.ticket_id || ''} created successfully!`)
      setTitle('')
      setDescription('')
      setService('General Technical Issue')
      setPriority('Medium')

      fetchTickets()
    } catch (error: any) {
      console.error('Error submitting ticket:', error)
      toast.error(error.message || 'Failed to submit ticket')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    setUpdatingTicketId(ticketId)
    try {
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/v1/support-ticket/${ticketId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || data.message || 'Failed to update ticket status')
      }

      toast.success(`Ticket ${ticketId} status updated to ${newStatus}`)
      setTickets((prev) =>
        prev.map((t) => (t.ticket_id === ticketId ? { ...t, status: newStatus } : t))
      )
      if (selectedTicket && selectedTicket.ticket_id === ticketId) {
        setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus } : null))
      }
    } catch (error: any) {
      console.error('Error updating status:', error)
      toast.error(error.message || 'Failed to update ticket status')
    } finally {
      setUpdatingTicketId(null)
    }
  }

  // Filtered Tickets Computation
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesSearch =
        t.ticket_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.service.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'ALL' || t.status.toUpperCase() === statusFilter.toUpperCase()
      const matchesPriority = priorityFilter === 'ALL' || t.priority.toLowerCase() === priorityFilter.toLowerCase()

      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [tickets, searchQuery, statusFilter, priorityFilter])

  // Metric Stats Computation
  const stats = useMemo(() => {
    const total = tickets.length
    const open = tickets.filter((t) => t.status.toUpperCase() === 'OPEN').length
    const inProgress = tickets.filter((t) => t.status.toUpperCase() === 'IN_PROGRESS').length
    const resolved = tickets.filter(
      (t) => t.status.toUpperCase() === 'RESOLVED' || t.status.toUpperCase() === 'CLOSED'
    ).length
    return { total, open, inProgress, resolved }
  }, [tickets])

  const getPriorityBadge = (p: string) => {
    switch (p.toLowerCase()) {
      case 'urgent':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-200 font-semibold px-2.5 py-0.5 shadow-none">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 mr-1.5 animate-pulse" /> Urgent
          </Badge>
        )
      case 'high':
        return (
          <Badge className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200 font-semibold px-2.5 py-0.5 shadow-none">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-600 mr-1.5" /> High
          </Badge>
        )
      case 'medium':
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 font-semibold px-2.5 py-0.5 shadow-none">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-1.5" /> Medium
          </Badge>
        )
      case 'low':
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 font-semibold px-2.5 py-0.5 shadow-none">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5" /> Low
          </Badge>
        )
    }
  }

  const getStatusBadge = (s: string) => {
    switch (s.toUpperCase()) {
      case 'RESOLVED':
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium px-2.5 py-1 flex items-center gap-1 w-fit shadow-none">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Resolved
          </Badge>
        )
      case 'CLOSED':
        return (
          <Badge className="bg-zinc-100 text-zinc-700 border-zinc-300 font-medium px-2.5 py-1 flex items-center gap-1 w-fit shadow-none">
            <Check className="w-3.5 h-3.5 text-zinc-500" /> Closed
          </Badge>
        )
      case 'IN_PROGRESS':
        return (
          <Badge className="bg-amber-50 text-amber-700 border-amber-200 font-medium px-2.5 py-1 flex items-center gap-1 w-fit shadow-none">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" style={{ animationDuration: '4s' }} /> In Progress
          </Badge>
        )
      case 'OPEN':
      default:
        return (
          <Badge className="bg-sky-50 text-sky-700 border-sky-200 font-medium px-2.5 py-1 flex items-center gap-1 w-fit shadow-none">
            <AlertCircle className="w-3.5 h-3.5 text-sky-600" /> Open
          </Badge>
        )
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xlZ mx-auto min-h-screen bg-slate-50/40">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-1.5 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-md">
              System Support Desk
            </span>
            {isAdmin && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-400/30 backdrop-blur-md flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-purple-300" /> Super Admin Access
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Software Support & Bug Tickets
          </h1>
          <p className="text-slate-300 text-sm max-w-xl">
            Raise software issues, submit bug reports for technical modules, and track status resolution in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <Button
            onClick={fetchTickets}
            disabled={isLoadingTickets}
            variant="outline"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 hover:border-white/30 backdrop-blur-md transition-all rounded-xl shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingTickets ? 'animate-spin' : ''}`} />
            Refresh Desk
          </Button>
        </div>
      </div>

      {/* 2. Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200/80 shadow-sm hover:shadow-md transition-all rounded-xl bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Tickets</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <LifeBuoy className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-sm hover:shadow-md transition-all rounded-xl bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Open Issues</p>
              <p className="text-2xl font-bold text-sky-600">{stats.open}</p>
            </div>
            <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
              <AlertCircle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-sm hover:shadow-md transition-all rounded-xl bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">In Progress</p>
              <p className="text-2xl font-bold text-amber-600">{stats.inProgress}</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-sm hover:shadow-md transition-all rounded-xl bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Resolved / Closed</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.resolved}</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left Column: Form (4 Cols) */}
        <Card className="lg:col-span-4 border border-slate-200/80 shadow-sm hover:shadow-md transition-all rounded-2xl bg-white overflow-hidden sticky top-6">
          <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" /> Raise New Ticket
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Submit details of the technical bug or software issue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="title" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  Issue Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g. Export CSV fails on deals page"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isSubmitting}
                  className="rounded-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="service" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-slate-400" /> Affected Module
                </Label>
                <Select value={service} onValueChange={setService} disabled={isSubmitting}>
                  <SelectTrigger id="service" className="rounded-lg border-slate-200 text-sm">
                    <SelectValue placeholder="Select module" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICES.map((s) => (
                      <SelectItem key={s} value={s} className="text-sm">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="priority" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" /> Priority Level
                </Label>
                <Select value={priority} onValueChange={setPriority} disabled={isSubmitting}>
                  <SelectTrigger id="priority" className="rounded-lg border-slate-200 text-sm">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p} className="text-sm font-medium">
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" /> Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  rows={4}
                  placeholder="Describe the bug, steps to reproduce, or issue context..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSubmitting}
                  className="rounded-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-sm leading-relaxed"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md shadow-blue-500/20 active:scale-[0.99] transition-all py-2.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" /> Create Support Ticket
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Right Column: History Table & Filters (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Controls Bar: Search & Filter dropdowns */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search ticket ID or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 text-xs rounded-xl w-32 border-slate-200 bg-slate-50/50">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL" className="text-xs">All Statuses</SelectItem>
                    {STATUS_OPTIONS.map((st) => (
                      <SelectItem key={st} value={st} className="text-xs font-medium">
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="h-9 text-xs rounded-xl w-32 border-slate-200 bg-slate-50/50">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">All Priorities</SelectItem>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p} className="text-xs font-medium">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ticket History Card Table */}
          <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardHeader className="py-4 px-6 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-800">Support Desk Tickets</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Showing {filteredTickets.length} of {tickets.length} total tickets
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingTickets && tickets.length === 0 ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : filteredTickets.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  <LifeBuoy className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="font-semibold text-slate-700 text-base">No support tickets found</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    {searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
                      ? 'No tickets match the selected filters or search query.'
                      : 'Tickets submitted by users will appear here.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/70">
                      <TableRow className="border-b border-slate-200/60">
                        <TableHead className="font-bold text-xs text-slate-600 uppercase tracking-wider py-3.5 pl-6">
                          Ticket ID
                        </TableHead>
                        <TableHead className="font-bold text-xs text-slate-600 uppercase tracking-wider py-3.5">
                          Title
                        </TableHead>
                        <TableHead className="font-bold text-xs text-slate-600 uppercase tracking-wider py-3.5">
                          Module
                        </TableHead>
                        <TableHead className="font-bold text-xs text-slate-600 uppercase tracking-wider py-3.5">
                          Priority
                        </TableHead>
                        <TableHead className="font-bold text-xs text-slate-600 uppercase tracking-wider py-3.5">
                          Status
                        </TableHead>
                        <TableHead className="font-bold text-xs text-slate-600 uppercase tracking-wider py-3.5 pr-6 text-right">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTickets.map((t) => {
                        const canManage = isAdmin
                        const isUpdatingThis = updatingTicketId === t.ticket_id

                        return (
                          <TableRow
                            key={t.ticket_id}
                            className="hover:bg-slate-50/80 transition-colors border-b border-slate-100"
                          >
                            <TableCell className="font-mono text-xs font-bold text-blue-700 py-3.5 pl-6">
                              {t.ticket_id}
                            </TableCell>
                            <TableCell className="py-3.5 max-w-xs">
                              <span
                                className="font-semibold text-slate-800 text-sm truncate block cursor-pointer hover:text-blue-600 transition-colors"
                                onClick={() => setSelectedTicket(t)}
                                title={t.title}
                              >
                                {t.title}
                              </span>
                              <span className="text-xs text-slate-400 block mt-0.5">
                                {t.created_at ? t.created_at.split(' ')[0] : 'N/A'}
                              </span>
                            </TableCell>
                            <TableCell className="text-slate-600 text-xs py-3.5 font-medium">
                              {t.service}
                            </TableCell>
                            <TableCell className="py-3.5">{getPriorityBadge(t.priority)}</TableCell>
                            <TableCell className="py-3.5">
                              {canManage ? (
                                <Select
                                  value={t.status.toUpperCase()}
                                  onValueChange={(newSt) => handleStatusChange(t.ticket_id, newSt)}
                                  disabled={isUpdatingThis}
                                >
                                  <SelectTrigger className="h-8 text-xs font-semibold w-32 border-slate-200 rounded-lg shadow-2xs">
                                    {isUpdatingThis ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" />
                                    ) : (
                                      <SelectValue>{t.status.toUpperCase()}</SelectValue>
                                    )}
                                  </SelectTrigger>
                                  <SelectContent>
                                    {STATUS_OPTIONS.map((st) => (
                                      <SelectItem key={st} value={st} className="text-xs font-medium">
                                        {st}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                getStatusBadge(t.status)
                              )}
                            </TableCell>
                            <TableCell className="py-3.5 pr-6 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedTicket(t)}
                                className="h-8 px-2.5 text-xs text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="View Details"
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" /> View
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

      {/* 4. Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        {selectedTicket && (
          <DialogContent className="max-w-xl rounded-2xl p-6 bg-white border border-slate-200">
            <DialogHeader className="space-y-1">
              <div className="flex items-center justify-between gap-2 pr-6">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200/60">
                  {selectedTicket.ticket_id}
                </span>
                {getPriorityBadge(selectedTicket.priority)}
              </div>
              <DialogTitle className="text-xl font-bold text-slate-900 pt-2">
                {selectedTicket.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Created on {selectedTicket.created_at || 'N/A'} • User ID: {selectedTicket.user_id}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 pt-4 border-t border-slate-100">
              <div className="grid grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Affected Module</span>
                  <span className="font-semibold text-slate-800">{selectedTicket.service}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Current Status</span>
                  <div>{getStatusBadge(selectedTicket.status)}</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                  Issue Description
                </span>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {selectedTicket.description}
                </div>
              </div>

              {isAdmin && (
                <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-purple-900 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-600" /> Update Status (Admin)
                    </span>
                    <p className="text-[11px] text-purple-700">Change resolution status for this issue ticket.</p>
                  </div>

                  <Select
                    value={selectedTicket.status.toUpperCase()}
                    onValueChange={(newSt) => handleStatusChange(selectedTicket.ticket_id, newSt)}
                    disabled={updatingTicketId === selectedTicket.ticket_id}
                  >
                    <SelectTrigger className="h-9 text-xs font-bold w-36 bg-white border-purple-200 text-purple-900 rounded-lg">
                      <SelectValue>{selectedTicket.status.toUpperCase()}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((st) => (
                        <SelectItem key={st} value={st} className="text-xs font-medium">
                          {st}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>

    </div>
  )
}
