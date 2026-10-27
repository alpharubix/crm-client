import * as React from 'react'
import { useState, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Users,
  Search,
  CheckCircle2,
  Clock,
  FolderGit2,
  Calendar,
  Activity,
  Layers,
  ListTodo,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'
import { Link } from 'react-router-dom'

interface PersonData {
  user_id: string
  user_name: string
  email: string
  role: string
  total_activities: number
  activity_breakdown: {
    total: number
    created: number
    updated: number
    commented: number
  }
  task_counts: {
    total: number
    done: number
    in_progress: number
    review: number
    todo: number
  }
  projects: Array<{
    project_id: string
    project_name: string
    status: string
    priority: string
    tasks_count: number
    done_count: number
    is_actioner: boolean
    is_creator: boolean
  }>
  tasks: Array<{
    id: string
    title: string
    project_id: string
    project_name: string
    status: string
    priority: string
    type: string
    created_at: string | null
    actual_completion_date: string | null
  }>
  recent_activities: Array<{
    id: string
    action: string
    entity_type: string
    project_id: string | null
    project_name: string | null
    task_id: string | null
    task_title: string | null
    changes: any
    created_at: string | null
  }>
}

interface ProjectPeopleViewProps {
  people: PersonData[]
  selectedUserId?: string
  onSelectUser?: (userId: string) => void
}

export function ProjectPeopleView({
  people,
  selectedUserId: externalSelectedUserId,
  onSelectUser,
}: ProjectPeopleViewProps) {
  const [internalSelectedId, setInternalSelectedId] = useState<string>('')
  const [searchUser, setSearchUser] = useState<string>('')
  const [taskFilter, setTaskFilter] = useState<'all' | 'done' | 'in_progress' | 'review' | 'todo'>('all')
  const [taskSearch, setTaskSearch] = useState<string>('')

  // Determine currently selected user ID
  const activeUserId = externalSelectedUserId || internalSelectedId || (people.length > 0 ? people[0].user_id : '')

  const handleSelectUser = (id: string) => {
    setInternalSelectedId(id)
    if (onSelectUser) onSelectUser(id)
  }

  // Filter people list by search
  const filteredPeople = useMemo(() => {
    if (!searchUser.trim()) return people
    const q = searchUser.toLowerCase()
    return people.filter(
      (p) =>
        p.user_name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.role.toLowerCase().includes(q)
    )
  }, [people, searchUser])

  // Current selected person
  const currentPerson = useMemo(() => {
    return people.find((p) => p.user_id === activeUserId) || people[0]
  }, [people, activeUserId])

  // Filter tasks for current person
  const filteredTasks = useMemo(() => {
    if (!currentPerson) return []
    let list = currentPerson.tasks || []

    if (taskFilter !== 'all') {
      list = list.filter((t) => {
        const s = (t.status || '').toLowerCase()
        if (taskFilter === 'done') return s === 'done' || s.includes('complete')
        if (taskFilter === 'in_progress') return s.includes('progress')
        if (taskFilter === 'review') return s.includes('review')
        if (taskFilter === 'todo') return s.includes('todo') || !s
        return true
      })
    }

    if (taskSearch.trim()) {
      const q = taskSearch.toLowerCase()
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.project_name.toLowerCase().includes(q)
      )
    }

    return list
  }, [currentPerson, taskFilter, taskSearch])

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase()
    if (s === 'done' || s.includes('complete')) {
      return (
        <Badge variant='outline' className='bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 text-[11px] font-medium'>
          <CheckCircle2 className='w-3 h-3 text-emerald-600' /> Done
        </Badge>
      )
    }
    if (s.includes('progress')) {
      return (
        <Badge variant='outline' className='bg-sky-50 text-sky-700 border-sky-200 gap-1 text-[11px] font-medium'>
          <Clock className='w-3 h-3 text-sky-600' /> In Progress
        </Badge>
      )
    }
    if (s.includes('review')) {
      return (
        <Badge variant='outline' className='bg-purple-50 text-purple-700 border-purple-200 gap-1 text-[11px] font-medium'>
          In Review
        </Badge>
      )
    }
    return (
      <Badge variant='outline' className='bg-slate-50 text-slate-700 border-slate-200 gap-1 text-[11px] font-medium'>
        To Do
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const p = (priority || '').toLowerCase()
    if (p === 'critical' || p === 'high') {
      return (
        <Badge variant='outline' className='bg-red-50 text-red-700 border-red-200 text-[10px] uppercase font-bold'>
          {priority}
        </Badge>
      )
    }
    if (p === 'medium') {
      return (
        <Badge variant='outline' className='bg-amber-50 text-amber-700 border-amber-200 text-[10px] uppercase font-bold'>
          {priority}
        </Badge>
      )
    }
    return (
      <Badge variant='outline' className='bg-slate-50 text-slate-600 border-slate-200 text-[10px] uppercase font-bold'>
        {priority || 'Low'}
      </Badge>
    )
  }

  const getActionBadge = (action: string) => {
    const act = (action || '').toUpperCase()
    if (act.includes('CREATE')) {
      return <Badge variant='outline' className='bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold'>Created</Badge>
    }
    if (act.includes('UPDATE')) {
      return <Badge variant='outline' className='bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-semibold'>Updated</Badge>
    }
    if (act.includes('COMMENT')) {
      return <Badge variant='outline' className='bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-semibold'>Commented</Badge>
    }
    return <Badge variant='outline' className='text-[10px] font-semibold'>{action}</Badge>
  }

  if (people.length === 0) {
    return (
      <Card className='p-8 text-center'>
        <p className='text-sm text-muted-foreground'>No user activity or project assignments found.</p>
      </Card>
    )
  }

  return (
    <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
      {/* Left Sidebar: Team Directory (4 cols) */}
      <Card className='lg:col-span-4 shadow-sm border overflow-hidden'>
        <CardHeader className='pb-3 border-b bg-muted/20'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-sm font-semibold flex items-center gap-2'>
              <Users className='w-4 h-4 text-primary' /> Team Members
            </CardTitle>
            <Badge variant='secondary' className='text-xs'>
              {people.length} People
            </Badge>
          </div>
          <div className='relative mt-2'>
            <Search className='w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground' />
            <Input
              placeholder='Search by name, role...'
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              className='h-8 pl-8 text-xs bg-background'
            />
          </div>
        </CardHeader>
        <CardContent className='p-2 max-h-[calc(100vh-280px)] overflow-y-auto space-y-1.5'>
          {filteredPeople.map((person) => {
            const isSelected = person.user_id === activeUserId
            const doneTasks = person.task_counts.done
            const totalTasks = person.task_counts.total
            const completionPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

            return (
              <div
                key={person.user_id}
                onClick={() => handleSelectUser(person.user_id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-primary/5 border-primary shadow-xs'
                    : 'bg-card border-border/60 hover:bg-muted/40 hover:border-border'
                }`}
              >
                <div className='flex items-center justify-between gap-2'>
                  <div className='flex items-center gap-2.5 min-w-0'>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0 ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}>
                      {person.user_name ? person.user_name[0] : 'U'}
                    </div>
                    <div className='min-w-0'>
                      <p className='text-xs font-semibold text-foreground truncate'>
                        {person.user_name}
                      </p>
                      <p className='text-[10px] text-muted-foreground capitalize truncate'>
                        {person.role || 'Member'} • {person.projects.length} Projects
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-primary translate-x-0.5' : 'text-muted-foreground/40'}`} />
                </div>

                {/* Quick stats pills */}
                <div className='grid grid-cols-2 gap-2 mt-2.5 pt-2 border-t border-border/40 text-[11px]'>
                  <div className='flex items-center justify-between bg-background/60 px-2 py-0.5 rounded'>
                    <span className='text-muted-foreground'>Tasks:</span>
                    <span className='font-semibold text-foreground font-mono'>
                      {doneTasks}/{totalTasks}
                    </span>
                  </div>
                  <div className='flex items-center justify-between bg-background/60 px-2 py-0.5 rounded'>
                    <span className='text-muted-foreground'>Actions:</span>
                    <span className='font-semibold text-primary font-mono'>
                      {person.total_activities}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Right Content: Selected Person Deep Dive (8 cols) */}
      <div className='lg:col-span-8 flex flex-col gap-6'>
        {currentPerson ? (
          <>
            {/* Person Profile Header & Metric Cards */}
            <Card className='shadow-sm border overflow-hidden'>
              <div className='bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 border-b'>
                <div className='flex flex-wrap items-center justify-between gap-4'>
                  <div className='flex items-center gap-3.5'>
                    <div className='w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center uppercase shadow-md'>
                      {currentPerson.user_name ? currentPerson.user_name[0] : 'U'}
                    </div>
                    <div>
                      <h3 className='text-lg font-bold text-foreground flex items-center gap-2'>
                        {currentPerson.user_name}
                        <Badge variant='outline' className='text-[10px] capitalize font-medium'>
                          {currentPerson.role || 'Team Member'}
                        </Badge>
                      </h3>
                      <p className='text-xs text-muted-foreground font-mono'>
                        {currentPerson.email || `User ID: ${currentPerson.user_id}`}
                      </p>
                    </div>
                  </div>

                  {/* Completion Rate Pill */}
                  <div className='flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border shadow-xs'>
                    <CheckCircle2 className='w-4 h-4 text-emerald-600' />
                    <div>
                      <span className='text-[10px] text-muted-foreground uppercase font-semibold block'>
                        Completion Rate
                      </span>
                      <span className='text-sm font-bold text-emerald-600'>
                        {currentPerson.task_counts.total > 0
                          ? Math.round(
                              (currentPerson.task_counts.done /
                                currentPerson.task_counts.total) *
                                100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4 KPI tiles */}
                <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4'>
                  <div className='bg-background p-3 rounded-lg border shadow-2xs'>
                    <span className='text-[10px] text-muted-foreground uppercase font-semibold flex items-center gap-1'>
                      <CheckCircle2 className='w-3 h-3 text-emerald-600' /> Tasks Done
                    </span>
                    <span className='text-xl font-bold text-emerald-600 font-mono mt-0.5 block'>
                      {currentPerson.task_counts.done}
                    </span>
                    <span className='text-[10px] text-muted-foreground'>
                      out of {currentPerson.task_counts.total} assigned
                    </span>
                  </div>

                  <div className='bg-background p-3 rounded-lg border shadow-2xs'>
                    <span className='text-[10px] text-muted-foreground uppercase font-semibold flex items-center gap-1'>
                      <Clock className='w-3 h-3 text-sky-600' /> In Progress
                    </span>
                    <span className='text-xl font-bold text-sky-600 font-mono mt-0.5 block'>
                      {currentPerson.task_counts.in_progress}
                    </span>
                    <span className='text-[10px] text-muted-foreground'>
                      actively working
                    </span>
                  </div>

                  <div className='bg-background p-3 rounded-lg border shadow-2xs'>
                    <span className='text-[10px] text-muted-foreground uppercase font-semibold flex items-center gap-1'>
                      <FolderGit2 className='w-3 h-3 text-indigo-600' /> Projects
                    </span>
                    <span className='text-xl font-bold text-indigo-600 font-mono mt-0.5 block'>
                      {currentPerson.projects.length}
                    </span>
                    <span className='text-[10px] text-muted-foreground'>
                      active involvements
                    </span>
                  </div>

                  <div className='bg-background p-3 rounded-lg border shadow-2xs'>
                    <span className='text-[10px] text-muted-foreground uppercase font-semibold flex items-center gap-1'>
                      <Activity className='w-3 h-3 text-primary' /> Total Logs
                    </span>
                    <span className='text-xl font-bold text-primary font-mono mt-0.5 block'>
                      {currentPerson.total_activities}
                    </span>
                    <span className='text-[10px] text-muted-foreground'>
                      system actions
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Section 1: Which Projects This Person Is Working On */}
            <Card className='shadow-sm border'>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <div className='space-y-0.5'>
                    <CardTitle className='text-base font-semibold flex items-center gap-2'>
                      <FolderGit2 className='w-4 h-4 text-primary' /> Projects Involved
                    </CardTitle>
                    <CardDescription className='text-xs'>
                      Projects where {currentPerson.user_name} is an actioner, creator, or assigned tasks
                    </CardDescription>
                  </div>
                  <Badge variant='outline' className='text-xs font-mono'>
                    {currentPerson.projects.length} Projects
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className='pt-0'>
                {currentPerson.projects.length === 0 ? (
                  <p className='text-xs text-muted-foreground italic py-3'>
                    This user is not currently linked to any projects.
                  </p>
                ) : (
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                    {currentPerson.projects.map((proj) => {
                      const pct = proj.tasks_count > 0 ? Math.round((proj.done_count / proj.tasks_count) * 100) : 0
                      return (
                        <div
                          key={proj.project_id}
                          className='p-3.5 rounded-lg border bg-card hover:bg-muted/30 transition-colors flex flex-col justify-between gap-3'
                        >
                          <div>
                            <div className='flex items-start justify-between gap-2'>
                              <div className='min-w-0'>
                                <Link
                                  to={`/projects/${proj.project_id}`}
                                  className='text-xs font-bold text-foreground hover:text-primary transition-colors hover:underline flex items-center gap-1 truncate'
                                >
                                  {proj.project_name}
                                  <ExternalLink className='w-3 h-3 shrink-0 text-muted-foreground' />
                                </Link>
                                <span className='text-[10px] text-muted-foreground font-mono'>
                                  ID #{proj.project_id}
                                </span>
                              </div>
                              <Badge variant='outline' className='text-[10px] uppercase font-semibold shrink-0'>
                                {proj.status}
                              </Badge>
                            </div>

                            <div className='flex items-center gap-1.5 mt-2 flex-wrap'>
                              {proj.is_actioner && (
                                <Badge variant='secondary' className='text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200'>
                                  Project Actioner
                                </Badge>
                              )}
                              {proj.is_creator && (
                                <Badge variant='secondary' className='text-[10px] bg-amber-50 text-amber-700 border-amber-200'>
                                  Owner / Creator
                                </Badge>
                              )}
                              {getPriorityBadge(proj.priority)}
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className='space-y-1.5 pt-2 border-t border-border/50'>
                            <div className='flex items-center justify-between text-[11px]'>
                              <span className='text-muted-foreground'>
                                My Tasks: <span className='font-semibold text-foreground'>{proj.done_count}/{proj.tasks_count} Done</span>
                              </span>
                              <span className='font-bold text-emerald-600 font-mono'>{pct}%</span>
                            </div>
                            <div className='w-full h-1.5 bg-muted rounded-full overflow-hidden'>
                              <div
                                className='h-full bg-emerald-500 rounded-full transition-all duration-300'
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section 2: What Tasks They Have Done & How Many Tasks */}
            <Card className='shadow-sm border'>
              <CardHeader className='pb-3'>
                <div className='flex flex-wrap items-center justify-between gap-3'>
                  <div className='space-y-0.5'>
                    <CardTitle className='text-base font-semibold flex items-center gap-2'>
                      <ListTodo className='w-4 h-4 text-emerald-600' /> Tasks & Deliverables
                    </CardTitle>
                    <CardDescription className='text-xs'>
                      Full list of tasks assigned to {currentPerson.user_name} with completion status
                    </CardDescription>
                  </div>

                  {/* Filter Pills */}
                  <div className='flex items-center gap-1.5 flex-wrap'>
                    <Button
                      variant={taskFilter === 'all' ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => setTaskFilter('all')}
                      className='h-7 text-xs px-2.5'
                    >
                      All ({currentPerson.task_counts.total})
                    </Button>
                    <Button
                      variant={taskFilter === 'done' ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => setTaskFilter('done')}
                      className='h-7 text-xs px-2.5 text-emerald-700'
                    >
                      Done ({currentPerson.task_counts.done})
                    </Button>
                    <Button
                      variant={taskFilter === 'in_progress' ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => setTaskFilter('in_progress')}
                      className='h-7 text-xs px-2.5 text-sky-700'
                    >
                      In Progress ({currentPerson.task_counts.in_progress})
                    </Button>
                    <Button
                      variant={taskFilter === 'review' ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => setTaskFilter('review')}
                      className='h-7 text-xs px-2.5 text-purple-700'
                    >
                      Review ({currentPerson.task_counts.review})
                    </Button>
                    <Button
                      variant={taskFilter === 'todo' ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => setTaskFilter('todo')}
                      className='h-7 text-xs px-2.5 text-slate-700'
                    >
                      To Do ({currentPerson.task_counts.todo})
                    </Button>
                  </div>
                </div>

                {/* Task Search Bar */}
                <div className='relative mt-3'>
                  <Search className='w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground' />
                  <Input
                    placeholder='Filter tasks by title or project...'
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    className='h-8 pl-8 text-xs bg-background'
                  />
                </div>
              </CardHeader>
              <CardContent className='pt-0'>
                {filteredTasks.length === 0 ? (
                  <div className='py-8 text-center text-xs text-muted-foreground italic border rounded-lg bg-muted/20'>
                    No tasks matching criteria.
                  </div>
                ) : (
                  <div className='border rounded-lg overflow-hidden bg-card'>
                    <div className='divide-y'>
                      {filteredTasks.map((t) => (
                        <div
                          key={t.id}
                          className='p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-muted/30 transition-colors text-xs'
                        >
                          <div className='min-w-0 flex-1 space-y-1'>
                            <div className='flex items-center gap-2'>
                              <span className='font-semibold text-foreground truncate'>
                                {t.title}
                              </span>
                              <Badge variant='outline' className='text-[9px] uppercase px-1 py-0'>
                                {t.type || 'task'}
                              </Badge>
                            </div>
                            <div className='flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap'>
                              <span className='flex items-center gap-1 font-medium text-foreground/80'>
                                <FolderGit2 className='w-3 h-3 text-primary' /> {t.project_name}
                              </span>
                              {t.created_at && (
                                <span>• Created: {t.created_at}</span>
                              )}
                              {t.actual_completion_date && (
                                <span className='text-emerald-600 font-medium'>
                                  • Completed: {t.actual_completion_date}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className='flex items-center gap-2 shrink-0 self-end sm:self-center'>
                            {getPriorityBadge(t.priority)}
                            {getStatusBadge(t.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section 3: User Activity Stream */}
            <Card className='shadow-sm border'>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <div className='space-y-0.5'>
                    <CardTitle className='text-base font-semibold flex items-center gap-2'>
                      <Activity className='w-4 h-4 text-primary' /> Activity History
                    </CardTitle>
                    <CardDescription className='text-xs'>
                      Recent actions, edits, and comments logged by {currentPerson.user_name}
                    </CardDescription>
                  </div>
                  <Badge variant='outline' className='text-xs font-mono'>
                    {currentPerson.recent_activities.length} Recent Logs
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className='pt-0'>
                {currentPerson.recent_activities.length === 0 ? (
                  <p className='text-xs text-muted-foreground italic py-3'>
                    No recent activity logs recorded for this user.
                  </p>
                ) : (
                  <div className='space-y-2.5'>
                    {currentPerson.recent_activities.map((act) => {
                      const contextTitle = act.task_title
                        ? `Task: ${act.task_title}`
                        : act.project_name
                        ? `Project: ${act.project_name}`
                        : '-'
                      const hasChanges = act.changes && Object.keys(act.changes).length > 0

                      return (
                        <div
                          key={act.id}
                          className='p-3 rounded-lg border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs'
                        >
                          <div className='min-w-0 space-y-1 flex-1'>
                            <div className='flex items-center gap-2 flex-wrap'>
                              {getActionBadge(act.action)}
                              <Badge variant='outline' className='text-[10px] text-muted-foreground font-mono'>
                                {act.entity_type}
                              </Badge>
                              <span className='font-medium text-foreground truncate max-w-[280px]'>
                                {contextTitle}
                              </span>
                            </div>

                            {hasChanges && (
                              <div className='mt-1 text-[11px] font-mono text-muted-foreground bg-background/80 px-2 py-1 rounded border inline-block max-w-full truncate'>
                                {JSON.stringify(act.changes)}
                              </div>
                            )}
                          </div>

                          <div className='text-right text-[11px] text-muted-foreground font-mono shrink-0'>
                            {act.created_at || '-'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </div>
  )
}
