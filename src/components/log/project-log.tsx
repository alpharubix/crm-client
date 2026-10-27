import { useState, useMemo } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import {
  Layers,
  Activity,
  Users,
  FolderGit2,
  CheckCircle2,
  Clock,
  RotateCw,
  BarChart3,
  Calendar,
  Filter,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { ENV, USERS_MAP } from '@/conf'

import { ProjectAnalyticsCharts } from './project-analytics-charts'
import { ProjectPeopleView } from './project-people-view'
import { ProjectWiseView } from './project-wise-view'
import { ProjectLogTable } from './project-log-table'

const ITEMS_PER_PAGE = 20

export default function ProjectLogs() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'people' | 'projects' | 'logs'>('analytics')
  const [timeRange, setTimeRange] = useState<string>('30d')
  const [userFilter, setUserFilter] = useState<string>('')
  const [projectFilter, setProjectFilter] = useState<string>('')
  const [actionFilter, setActionFilter] = useState<string>('')
  const [entityFilter, setEntityFilter] = useState<string>('')
  const [search, setSearch] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)

  // 1. Query Analytics Data from Backend
  const {
    data: analyticsData,
    isLoading: isAnalyticsLoading,
    refetch: refetchAnalytics,
    isFetching: isAnalyticsFetching,
  } = useQuery({
    queryKey: ['project-logs-analytics', timeRange, userFilter, projectFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (timeRange) params.set('time_range', timeRange)
      if (userFilter) params.set('user_id', userFilter)
      if (projectFilter) params.set('project_id', projectFilter)

      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/project-logs/analytics?${params.toString()}`,
        { credentials: 'include' }
      )

      if (!res.ok) {
        throw new Error('Failed to fetch project logs analytics')
      }
      return res.json()
    },
    placeholderData: keepPreviousData,
  })

  // 2. Query Paginated Logs for the Logs Table Tab
  const {
    data: logsData,
    isLoading: isLogsLoading,
    refetch: refetchLogs,
    isFetching: isLogsFetching,
  } = useQuery({
    queryKey: [
      'project-logs-table',
      currentPage,
      userFilter,
      projectFilter,
      actionFilter,
      entityFilter,
      search,
    ],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('page', currentPage.toString())
      params.set('limit', ITEMS_PER_PAGE.toString())
      if (userFilter) params.set('user_id', userFilter)
      if (projectFilter) params.set('project_id', projectFilter)
      if (actionFilter) params.set('action', actionFilter)
      if (entityFilter) params.set('entity_type', entityFilter)
      if (search.trim()) params.set('search', search.trim())

      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/project-logs?${params.toString()}`,
        { credentials: 'include' }
      )

      if (!res.ok) throw new Error('Failed to fetch project logs')
      return res.json()
    },
    placeholderData: keepPreviousData,
  })

  // Extract analytics payloads
  const kpis = analyticsData?.kpis || {
    total_logs: 0,
    active_users_count: 0,
    total_projects: 0,
    total_tasks: 0,
    completed_tasks: 0,
    in_progress_tasks: 0,
    review_tasks: 0,
    todo_tasks: 0,
    completion_rate: 0,
  }

  const chartsData = analyticsData?.charts || {}
  const people = analyticsData?.people || []
  const projects = analyticsData?.projects || []

  // Extract table logs
  const logs = logsData?.data || []
  const pageInfo = logsData?.page_info || { page: 1, total: 1 }
  const totalPages = Math.ceil(pageInfo.total / ITEMS_PER_PAGE) || 1

  // User and project options for quick select
  const userOptions = useMemo(() => {
    if (people.length > 0) {
      return people.map((p: any) => ({ id: p.user_id, name: p.user_name }))
    }
    return Object.entries(USERS_MAP).map(([id, name]) => ({ id, name }))
  }, [people])

  const projectOptions = useMemo(() => {
    if (projects.length > 0) {
      return projects.map((p: any) => ({ id: p.project_id, name: p.project_name }))
    }
    return []
  }, [projects])

  const handleRefreshAll = () => {
    refetchAnalytics()
    refetchLogs()
  }

  const handleResetFilters = () => {
    setUserFilter('')
    setProjectFilter('')
    setActionFilter('')
    setEntityFilter('')
    setSearch('')
    setCurrentPage(1)
  }

  const isRefreshing = isAnalyticsFetching || isLogsFetching

  return (
    <div className='flex flex-1 flex-col gap-5 p-4 md:p-6 mx-auto w-full'>
      {/* Top Header */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div>
          <div className='flex items-center gap-2.5'>
            <div className='p-2 rounded-lg bg-primary/10 text-primary'>
              <Layers className='w-6 h-6' />
            </div>
            <div>
              <h2 className='text-2xl font-bold tracking-tight text-foreground flex items-center gap-2'>
                Project Activity & Team Analytics
              </h2>
              <p className='text-xs text-muted-foreground mt-0.5'>
                Monitor live user activity, task completions, and project resource allocations.
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls: Time Range & Refresh */}
        <div className='flex items-center gap-2.5 flex-wrap self-start md:self-auto'>
          {/* Time range selector */}
          <div className='flex items-center gap-1.5 bg-card border rounded-lg p-1 shadow-2xs'>
            <Calendar className='w-3.5 h-3.5 text-muted-foreground ml-1.5' />
            <Select value={timeRange} onValueChange={(val) => setTimeRange(val)}>
              <SelectTrigger className='h-7 text-xs border-0 shadow-none focus:ring-0 gap-1 w-[125px]'>
                <SelectValue placeholder='Time Range' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='7d'>Last 7 Days</SelectItem>
                <SelectItem value='30d'>Last 30 Days</SelectItem>
                <SelectItem value='90d'>Last 90 Days</SelectItem>
                <SelectItem value='all'>All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Refresh Button */}
          <Button
            variant='outline'
            size='sm'
            onClick={handleRefreshAll}
            disabled={isRefreshing}
            className='h-9 text-xs gap-1.5'
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        {/* KPI 1: Total Activities */}
        <div className='p-4 rounded-xl border bg-card shadow-2xs flex flex-col justify-between'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold text-muted-foreground uppercase'>
              Total Activity Logs
            </span>
            <div className='p-1.5 rounded-md bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'>
              <Activity className='w-4 h-4' />
            </div>
          </div>
          <div className='mt-2'>
            <div className='text-2xl font-bold text-foreground font-mono'>
              {kpis.total_logs}
            </div>
            <p className='text-[11px] text-muted-foreground mt-0.5'>
              Events captured in selected window
            </p>
          </div>
        </div>

        {/* KPI 2: Active Contributors */}
        <div className='p-4 rounded-xl border bg-card shadow-2xs flex flex-col justify-between'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold text-muted-foreground uppercase'>
              Active Contributors
            </span>
            <div className='p-1.5 rounded-md bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400'>
              <Users className='w-4 h-4' />
            </div>
          </div>
          <div className='mt-2'>
            <div className='text-2xl font-bold text-foreground font-mono'>
              {kpis.active_users_count}
            </div>
            <p className='text-[11px] text-muted-foreground mt-0.5'>
              Team members working on projects
            </p>
          </div>
        </div>

        {/* KPI 3: Projects Tracked */}
        <div className='p-4 rounded-xl border bg-card shadow-2xs flex flex-col justify-between'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold text-muted-foreground uppercase'>
              Active Projects
            </span>
            <div className='p-1.5 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'>
              <FolderGit2 className='w-4 h-4' />
            </div>
          </div>
          <div className='mt-2'>
            <div className='text-2xl font-bold text-foreground font-mono'>
              {kpis.total_projects}
            </div>
            <p className='text-[11px] text-muted-foreground mt-0.5'>
              Managed across the workspace
            </p>
          </div>
        </div>

        {/* KPI 4: Task Completion Rate */}
        <div className='p-4 rounded-xl border bg-card shadow-2xs flex flex-col justify-between'>
          <div className='flex items-center justify-between'>
            <span className='text-xs font-semibold text-muted-foreground uppercase'>
              Tasks Completed
            </span>
            <div className='p-1.5 rounded-md bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'>
              <CheckCircle2 className='w-4 h-4' />
            </div>
          </div>
          <div className='mt-2'>
            <div className='flex items-baseline gap-2'>
              <span className='text-2xl font-bold text-emerald-600 font-mono'>
                {kpis.completed_tasks}
              </span>
              <span className='text-xs text-muted-foreground font-mono'>
                / {kpis.total_tasks} ({kpis.completion_rate}%)
              </span>
            </div>
            {/* Mini progress bar */}
            <div className='w-full h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden'>
              <div
                className='h-full bg-emerald-500 rounded-full transition-all duration-300'
                style={{ width: `${kpis.completion_rate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as any)}
        className='w-full space-y-5'
      >
        <div className='flex flex-wrap items-center justify-between gap-3 border-b pb-2.5'>
          <TabsList className='bg-muted/70 p-1 rounded-lg h-auto flex flex-wrap gap-1'>
            <TabsTrigger
              value='analytics'
              className='text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5'
            >
              <BarChart3 className='w-3.5 h-3.5' /> Charts & Trends
            </TabsTrigger>
            <TabsTrigger
              value='people'
              className='text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5'
            >
              <Users className='w-3.5 h-3.5' /> People-Wise View
            </TabsTrigger>
            <TabsTrigger
              value='projects'
              className='text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5'
            >
              <FolderGit2 className='w-3.5 h-3.5' /> Project-Wise View
            </TabsTrigger>
            <TabsTrigger
              value='logs'
              className='text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5'
            >
              <Layers className='w-3.5 h-3.5' /> Detailed Activity Logs
            </TabsTrigger>
          </TabsList>

          {/* Quick User & Project Filter indicators */}
          {(userFilter || projectFilter) && (
            <div className='flex items-center gap-2 text-xs'>
              <span className='text-muted-foreground font-medium flex items-center gap-1'>
                <Filter className='w-3 h-3' /> Active Filter:
              </span>
              {userFilter && (
                <Badge variant='secondary' className='gap-1 text-[11px]'>
                  User: {userOptions.find((u) => u.id === userFilter)?.name || userFilter}
                  <button
                    onClick={() => setUserFilter('')}
                    className='ml-1 hover:text-destructive'
                  >
                    ×
                  </button>
                </Badge>
              )}
              {projectFilter && (
                <Badge variant='secondary' className='gap-1 text-[11px]'>
                  Project: {projectOptions.find((p) => p.id === projectFilter)?.name || projectFilter}
                  <button
                    onClick={() => setProjectFilter('')}
                    className='ml-1 hover:text-destructive'
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Tab 1: Charts & Trends (shadcn charts) */}
        <TabsContent value='analytics' className='space-y-6 outline-none'>
          {isAnalyticsLoading && !analyticsData ? (
            <div className='h-80 flex flex-col items-center justify-center gap-2.5'>
              <Spinner className='h-8 w-8 text-primary' />
              <span className='text-xs text-muted-foreground'>
                Loading chart visualizations...
              </span>
            </div>
          ) : (
            <ProjectAnalyticsCharts chartsData={chartsData} kpis={kpis} />
          )}
        </TabsContent>

        {/* Tab 2: People-Wise View */}
        <TabsContent value='people' className='space-y-6 outline-none'>
          {isAnalyticsLoading && !analyticsData ? (
            <div className='h-80 flex flex-col items-center justify-center gap-2.5'>
              <Spinner className='h-8 w-8 text-primary' />
              <span className='text-xs text-muted-foreground'>
                Loading team workload & project assignments...
              </span>
            </div>
          ) : (
            <ProjectPeopleView
              people={people}
              selectedUserId={userFilter}
              onSelectUser={(uid) => setUserFilter(uid)}
            />
          )}
        </TabsContent>

        {/* Tab 3: Project-Wise View */}
        <TabsContent value='projects' className='space-y-6 outline-none'>
          {isAnalyticsLoading && !analyticsData ? (
            <div className='h-80 flex flex-col items-center justify-center gap-2.5'>
              <Spinner className='h-8 w-8 text-primary' />
              <span className='text-xs text-muted-foreground'>
                Loading projects directory & team members...
              </span>
            </div>
          ) : (
            <ProjectWiseView
              projects={projects}
              selectedProjectId={projectFilter}
              onSelectProject={(pid) => setProjectFilter(pid)}
            />
          )}
        </TabsContent>

        {/* Tab 4: Detailed Activity Logs Table */}
        <TabsContent value='logs' className='space-y-6 outline-none'>
          <ProjectLogTable
            logs={logs}
            isLoading={isLogsLoading}
            page={currentPage}
            totalPages={totalPages}
            totalCount={pageInfo.total}
            onPageChange={(p) => setCurrentPage(p)}
            userFilter={userFilter}
            onUserFilterChange={(uid) => {
              setUserFilter(uid)
              setCurrentPage(1)
            }}
            projectFilter={projectFilter}
            onProjectFilterChange={(pid) => {
              setProjectFilter(pid)
              setCurrentPage(1)
            }}
            actionFilter={actionFilter}
            onActionFilterChange={(act) => {
              setActionFilter(act)
              setCurrentPage(1)
            }}
            entityFilter={entityFilter}
            onEntityFilterChange={(ent) => {
              setEntityFilter(ent)
              setCurrentPage(1)
            }}
            search={search}
            onSearchChange={(s) => {
              setSearch(s)
              setCurrentPage(1)
            }}
            onResetFilters={handleResetFilters}
            userOptions={userOptions}
            projectOptions={projectOptions}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
