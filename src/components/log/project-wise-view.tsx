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
  FolderGit2,
  Search,
  Users,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  ListTodo,
  Activity,
  Layers,
  ArrowUpRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'

interface ProjectMember {
  user_id: string
  user_name: string
  is_actioner: boolean
  is_creator: boolean
  tasks_count: number
  done_count: number
}

interface ProjectTask {
  id: string
  title: string
  assignee_id: string | null
  assignee_name: string
  status: string
  priority: string
  created_at: string | null
  actual_completion_date: string | null
}

interface ProjectActivity {
  id: string
  user_id: string
  user_name: string
  action: string
  entity_type: string
  task_id: string | null
  task_title: string | null
  changes: any
  created_at: string | null
}

interface ProjectData {
  project_id: string
  project_name: string
  status: string
  priority: string
  created_at: string | null
  progress_pct: number
  task_counts: {
    total: number
    done: number
    in_progress: number
    review: number
    todo: number
  }
  members: ProjectMember[]
  tasks: ProjectTask[]
  recent_activities: ProjectActivity[]
}

interface ProjectWiseViewProps {
  projects: ProjectData[]
  selectedProjectId?: string
  onSelectProject?: (projectId: string) => void
}

export function ProjectWiseView({
  projects,
  selectedProjectId: externalSelectedProjectId,
  onSelectProject,
}: ProjectWiseViewProps) {
  const [internalSelectedId, setInternalSelectedId] = useState<string>('')
  const [searchProject, setSearchProject] = useState<string>('')
  const [taskFilter, setTaskFilter] = useState<'all' | 'done' | 'in_progress' | 'review' | 'todo'>('all')
  const [taskSearch, setTaskSearch] = useState<string>('')

  const activeProjectId =
    externalSelectedProjectId ||
    internalSelectedId ||
    (projects.length > 0 ? projects[0].project_id : '')

  const handleSelectProject = (id: string) => {
    setInternalSelectedId(id)
    if (onSelectProject) onSelectProject(id)
  }

  // Filter projects by search query
  const filteredProjects = useMemo(() => {
    if (!searchProject.trim()) return projects
    const q = searchProject.toLowerCase()
    return projects.filter(
      (p) =>
        p.project_name.toLowerCase().includes(q) ||
        p.project_id.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q)
    )
  }, [projects, searchProject])

  // Current selected project
  const currentProject = useMemo(() => {
    return projects.find((p) => p.project_id === activeProjectId) || projects[0]
  }, [projects, activeProjectId])

  // Filtered tasks for current project
  const filteredTasks = useMemo(() => {
    if (!currentProject) return []
    let list = currentProject.tasks || []

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
          t.assignee_name.toLowerCase().includes(q)
      )
    }

    return list
  }, [currentProject, taskFilter, taskSearch])

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

  if (projects.length === 0) {
    return (
      <Card className='p-8 text-center'>
        <p className='text-sm text-muted-foreground'>No projects found in the system.</p>
      </Card>
    )
  }

  return (
    <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-start'>
      {/* Left Sidebar: Projects List (4 cols) */}
      <Card className='lg:col-span-4 shadow-sm border overflow-hidden'>
        <CardHeader className='pb-3 border-b bg-muted/20'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-sm font-semibold flex items-center gap-2'>
              <FolderGit2 className='w-4 h-4 text-primary' /> Projects Directory
            </CardTitle>
            <Badge variant='secondary' className='text-xs'>
              {projects.length} Projects
            </Badge>
          </div>
          <div className='relative mt-2'>
            <Search className='w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground' />
            <Input
              placeholder='Search project by name, status...'
              value={searchProject}
              onChange={(e) => setSearchProject(e.target.value)}
              className='h-8 pl-8 text-xs bg-background'
            />
          </div>
        </CardHeader>
        <CardContent className='p-2 max-h-[calc(100vh-280px)] overflow-y-auto space-y-1.5'>
          {filteredProjects.map((proj) => {
            const isSelected = proj.project_id === activeProjectId
            return (
              <div
                key={proj.project_id}
                onClick={() => handleSelectProject(proj.project_id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-primary/5 border-primary shadow-xs'
                    : 'bg-card border-border/60 hover:bg-muted/40 hover:border-border'
                }`}
              >
                <div className='flex items-start justify-between gap-2'>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center gap-1.5'>
                      <p className='text-xs font-bold text-foreground truncate'>
                        {proj.project_name}
                      </p>
                    </div>
                    <p className='text-[10px] text-muted-foreground font-mono mt-0.5'>
                      ID #{proj.project_id} • {proj.members.length} Members
                    </p>
                  </div>
                  <Badge variant='outline' className='text-[10px] uppercase font-semibold shrink-0'>
                    {proj.status}
                  </Badge>
                </div>

                {/* Progress bar */}
                <div className='mt-2.5 space-y-1'>
                  <div className='flex items-center justify-between text-[10px]'>
                    <span className='text-muted-foreground'>
                      {proj.task_counts.done}/{proj.task_counts.total} Tasks Done
                    </span>
                    <span className='font-bold text-emerald-600 font-mono'>
                      {proj.progress_pct}%
                    </span>
                  </div>
                  <div className='w-full h-1.5 bg-muted rounded-full overflow-hidden'>
                    <div
                      className='h-full bg-emerald-500 rounded-full transition-all duration-300'
                      style={{ width: `${proj.progress_pct}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Right Content: Selected Project Detail (8 cols) */}
      <div className='lg:col-span-8 flex flex-col gap-6'>
        {currentProject ? (
          <>
            {/* Project Header Banner */}
            <Card className='shadow-sm border overflow-hidden'>
              <div className='bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5 border-b'>
                <div className='flex flex-wrap items-center justify-between gap-4'>
                  <div>
                    <div className='flex items-center gap-2 flex-wrap'>
                      <h3 className='text-lg font-bold text-foreground'>
                        {currentProject.project_name}
                      </h3>
                      <Link
                        to={`/projects/${currentProject.project_id}`}
                        className='text-xs text-primary flex items-center gap-1 hover:underline font-medium'
                      >
                        Open Workspace <ArrowUpRight className='w-3.5 h-3.5' />
                      </Link>
                    </div>
                    <p className='text-xs text-muted-foreground font-mono mt-1'>
                      Project ID: #{currentProject.project_id}
                      {currentProject.created_at && ` • Created: ${currentProject.created_at}`}
                    </p>
                  </div>

                  <div className='flex items-center gap-2'>
                    {getPriorityBadge(currentProject.priority)}
                    <Badge variant='outline' className='text-xs uppercase font-semibold'>
                      {currentProject.status}
                    </Badge>
                  </div>
                </div>

                {/* 4 KPI tiles */}
                <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4'>
                  <div className='bg-background p-3 rounded-lg border shadow-2xs'>
                    <span className='text-[10px] text-muted-foreground uppercase font-semibold flex items-center gap-1'>
                      <CheckCircle2 className='w-3 h-3 text-emerald-600' /> Completed Tasks
                    </span>
                    <span className='text-xl font-bold text-emerald-600 font-mono mt-0.5 block'>
                      {currentProject.task_counts.done}
                    </span>
                    <span className='text-[10px] text-muted-foreground'>
                      out of {currentProject.task_counts.total} total
                    </span>
                  </div>

                  <div className='bg-background p-3 rounded-lg border shadow-2xs'>
                    <span className='text-[10px] text-muted-foreground uppercase font-semibold flex items-center gap-1'>
                      <Clock className='w-3 h-3 text-sky-600' /> In Progress
                    </span>
                    <span className='text-xl font-bold text-sky-600 font-mono mt-0.5 block'>
                      {currentProject.task_counts.in_progress}
                    </span>
                    <span className='text-[10px] text-muted-foreground'>
                      tasks underway
                    </span>
                  </div>

                  <div className='bg-background p-3 rounded-lg border shadow-2xs'>
                    <span className='text-[10px] text-muted-foreground uppercase font-semibold flex items-center gap-1'>
                      <Users className='w-3 h-3 text-indigo-600' /> Team Size
                    </span>
                    <span className='text-xl font-bold text-indigo-600 font-mono mt-0.5 block'>
                      {currentProject.members.length}
                    </span>
                    <span className='text-[10px] text-muted-foreground'>
                      contributors
                    </span>
                  </div>

                  <div className='bg-background p-3 rounded-lg border shadow-2xs'>
                    <span className='text-[10px] text-muted-foreground uppercase font-semibold flex items-center gap-1'>
                      <Activity className='w-3 h-3 text-primary' /> Health Progress
                    </span>
                    <span className='text-xl font-bold text-primary font-mono mt-0.5 block'>
                      {currentProject.progress_pct}%
                    </span>
                    <span className='text-[10px] text-muted-foreground'>
                      task completion rate
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Section 1: Who is Working on Which Project (Team Members) */}
            <Card className='shadow-sm border'>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <div className='space-y-0.5'>
                    <CardTitle className='text-base font-semibold flex items-center gap-2'>
                      <Users className='w-4 h-4 text-primary' /> Contributors Working on this Project
                    </CardTitle>
                    <CardDescription className='text-xs'>
                      Actioners, creators, and team members with assigned tasks on {currentProject.project_name}
                    </CardDescription>
                  </div>
                  <Badge variant='outline' className='text-xs font-mono'>
                    {currentProject.members.length} Members
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className='pt-0'>
                {currentProject.members.length === 0 ? (
                  <p className='text-xs text-muted-foreground italic py-3'>
                    No members assigned to this project yet.
                  </p>
                ) : (
                  <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3'>
                    {currentProject.members.map((member) => {
                      const pct = member.tasks_count > 0 ? Math.round((member.done_count / member.tasks_count) * 100) : 0
                      return (
                        <div
                          key={member.user_id}
                          className='p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors flex flex-col justify-between gap-2.5'
                        >
                          <div className='flex items-center gap-2.5'>
                            <div className='w-8 h-8 rounded-full bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 font-bold text-xs flex items-center justify-center uppercase shrink-0'>
                              {member.user_name ? member.user_name[0] : 'U'}
                            </div>
                            <div className='min-w-0'>
                              <p className='text-xs font-bold text-foreground truncate'>
                                {member.user_name}
                              </p>
                              <div className='flex items-center gap-1 mt-0.5 flex-wrap'>
                                {member.is_actioner && (
                                  <span className='text-[9px] bg-indigo-50 text-indigo-700 px-1 py-0.2 rounded font-medium'>
                                    Actioner
                                  </span>
                                )}
                                {member.is_creator && (
                                  <span className='text-[9px] bg-amber-50 text-amber-700 px-1 py-0.2 rounded font-medium'>
                                    Owner
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className='space-y-1 pt-1.5 border-t border-border/50 text-[11px]'>
                            <div className='flex items-center justify-between'>
                              <span className='text-muted-foreground'>
                                Tasks: <span className='font-semibold text-foreground'>{member.done_count}/{member.tasks_count} Done</span>
                              </span>
                              <span className='font-bold text-emerald-600 font-mono'>{pct}%</span>
                            </div>
                            <div className='w-full h-1 bg-muted rounded-full overflow-hidden'>
                              <div
                                className='h-full bg-emerald-500 rounded-full'
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

            {/* Section 2: Tasks List in this Project */}
            <Card className='shadow-sm border'>
              <CardHeader className='pb-3'>
                <div className='flex flex-wrap items-center justify-between gap-3'>
                  <div className='space-y-0.5'>
                    <CardTitle className='text-base font-semibold flex items-center gap-2'>
                      <ListTodo className='w-4 h-4 text-emerald-600' /> Project Tasks Pipeline
                    </CardTitle>
                    <CardDescription className='text-xs'>
                      Who is working on what task in this project
                    </CardDescription>
                  </div>

                  <div className='flex items-center gap-1.5 flex-wrap'>
                    <Button
                      variant={taskFilter === 'all' ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => setTaskFilter('all')}
                      className='h-7 text-xs px-2.5'
                    >
                      All ({currentProject.task_counts.total})
                    </Button>
                    <Button
                      variant={taskFilter === 'done' ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => setTaskFilter('done')}
                      className='h-7 text-xs px-2.5 text-emerald-700'
                    >
                      Done ({currentProject.task_counts.done})
                    </Button>
                    <Button
                      variant={taskFilter === 'in_progress' ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => setTaskFilter('in_progress')}
                      className='h-7 text-xs px-2.5 text-sky-700'
                    >
                      In Progress ({currentProject.task_counts.in_progress})
                    </Button>
                    <Button
                      variant={taskFilter === 'review' ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => setTaskFilter('review')}
                      className='h-7 text-xs px-2.5 text-purple-700'
                    >
                      Review ({currentProject.task_counts.review})
                    </Button>
                    <Button
                      variant={taskFilter === 'todo' ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => setTaskFilter('todo')}
                      className='h-7 text-xs px-2.5 text-slate-700'
                    >
                      To Do ({currentProject.task_counts.todo})
                    </Button>
                  </div>
                </div>

                <div className='relative mt-3'>
                  <Search className='w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground' />
                  <Input
                    placeholder='Filter tasks by title or assignee...'
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    className='h-8 pl-8 text-xs bg-background'
                  />
                </div>
              </CardHeader>
              <CardContent className='pt-0'>
                {filteredTasks.length === 0 ? (
                  <div className='py-8 text-center text-xs text-muted-foreground italic border rounded-lg bg-muted/20'>
                    No tasks found matching criteria.
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
                            <p className='font-semibold text-foreground truncate'>
                              {t.title}
                            </p>
                            <div className='flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap'>
                              <span className='flex items-center gap-1 font-medium text-foreground/80'>
                                <Users className='w-3 h-3 text-primary' /> {t.assignee_name}
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

            {/* Section 3: Project Activity History */}
            <Card className='shadow-sm border'>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <div className='space-y-0.5'>
                    <CardTitle className='text-base font-semibold flex items-center gap-2'>
                      <Activity className='w-4 h-4 text-primary' /> Recent Project Activity
                    </CardTitle>
                    <CardDescription className='text-xs'>
                      Modifications and events recorded on {currentProject.project_name}
                    </CardDescription>
                  </div>
                  <Badge variant='outline' className='text-xs font-mono'>
                    {currentProject.recent_activities.length} Recent Logs
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className='pt-0'>
                {currentProject.recent_activities.length === 0 ? (
                  <p className='text-xs text-muted-foreground italic py-3'>
                    No activity logs recorded for this project yet.
                  </p>
                ) : (
                  <div className='space-y-2.5'>
                    {currentProject.recent_activities.map((act) => {
                      const contextTitle = act.task_title ? `Task: ${act.task_title}` : 'Project Settings'
                      const hasChanges = act.changes && Object.keys(act.changes).length > 0

                      return (
                        <div
                          key={act.id}
                          className='p-3 rounded-lg border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs'
                        >
                          <div className='min-w-0 space-y-1 flex-1'>
                            <div className='flex items-center gap-2 flex-wrap'>
                              <div className='w-5 h-5 rounded-full bg-zinc-200 text-zinc-700 font-bold flex items-center justify-center text-[10px] shrink-0 uppercase'>
                                {act.user_name ? act.user_name[0] : 'U'}
                              </div>
                              <span className='font-semibold text-foreground'>{act.user_name}</span>
                              {getActionBadge(act.action)}
                              <Badge variant='outline' className='text-[10px] text-muted-foreground font-mono'>
                                {act.entity_type}
                              </Badge>
                              <span className='text-muted-foreground truncate max-w-[200px]'>
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
