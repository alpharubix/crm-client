import * as React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ResponsiveContainer,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  Activity,
  CheckCircle2,
  TrendingUp,
  FolderGit2,
  PieChart as PieIcon,
  Users,
} from 'lucide-react'

// Chart Configurations with shadcn design system
const userActivityChartConfig = {
  created: {
    label: 'Created',
    color: '#10b981', // emerald
  },
  updated: {
    label: 'Updated',
    color: '#3b82f6', // blue
  },
  commented: {
    label: 'Commented',
    color: '#8b5cf6', // purple
  },
} satisfies ChartConfig

const taskWorkloadChartConfig = {
  done: {
    label: 'Done',
    color: '#10b981', // emerald
  },
  in_progress: {
    label: 'In Progress',
    color: '#0284c7', // sky
  },
  review: {
    label: 'In Review',
    color: '#8b5cf6', // purple
  },
  todo: {
    label: 'To Do',
    color: '#94a3b8', // slate
  },
} satisfies ChartConfig

const activityTrendChartConfig = {
  total: {
    label: 'Total Logs',
    color: '#3b82f6',
  },
  created: {
    label: 'Created',
    color: '#10b981',
  },
  updated: {
    label: 'Updated',
    color: '#6366f1',
  },
} satisfies ChartConfig

const projectWorkloadChartConfig = {
  done_tasks: {
    label: 'Completed Tasks',
    color: '#10b981',
  },
  in_progress_tasks: {
    label: 'In Progress',
    color: '#0284c7',
  },
  members_count: {
    label: 'Members',
    color: '#f59e0b',
  },
} satisfies ChartConfig

const taskStatusChartConfig = {
  done: {
    label: 'Done',
    color: '#10b981',
  },
  in_progress: {
    label: 'In Progress',
    color: '#0284c7',
  },
  review: {
    label: 'In Review',
    color: '#8b5cf6',
  },
  todo: {
    label: 'To Do',
    color: '#94a3b8',
  },
} satisfies ChartConfig

interface AnalyticsChartsProps {
  chartsData: {
    activity_by_user?: any[]
    tasks_by_user?: any[]
    task_status_distribution?: any[]
    activity_timeline?: any[]
    project_workload?: any[]
    action_type_distribution?: any[]
  }
  kpis?: {
    total_logs: number
    total_tasks: number
    completed_tasks: number
    completion_rate: number
  }
}

export function ProjectAnalyticsCharts({ chartsData, kpis }: AnalyticsChartsProps) {
  const activityByUser = chartsData?.activity_by_user || []
  const tasksByUser = chartsData?.tasks_by_user || []
  const taskStatusDist = chartsData?.task_status_distribution || []
  const activityTimeline = chartsData?.activity_timeline || []
  const projectWorkload = chartsData?.project_workload || []

  // Calculate total tasks for center pie
  const totalTasksCount = kpis?.total_tasks || taskStatusDist.reduce((acc, curr) => acc + (curr.count || 0), 0)
  const completionRate = kpis?.completion_rate || 0

  return (
    <div className='flex flex-col gap-6'>
      {/* Row 1: User Activity Breakdown & Task Status Distribution */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* User Activity Breakdown Bar Chart (2 cols) */}
        <Card className='lg:col-span-2 shadow-sm border'>
          <CardHeader className='pb-2'>
            <div className='flex items-center justify-between'>
              <div className='space-y-1'>
                <CardTitle className='text-base font-semibold flex items-center gap-2'>
                  <Activity className='w-4 h-4 text-primary' /> User Activity by Action Type
                </CardTitle>
                <CardDescription className='text-xs'>
                  Breakdown of creates, updates, and comments performed by each user
                </CardDescription>
              </div>
              <span className='text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary'>
                {activityByUser.length} Active Contributors
              </span>
            </div>
          </CardHeader>
          <CardContent className='pt-2'>
            {activityByUser.length === 0 ? (
              <div className='h-[280px] flex items-center justify-center text-xs text-muted-foreground'>
                No user activity logs found for the selected time range.
              </div>
            ) : (
              <ChartContainer config={userActivityChartConfig} className='h-[280px] w-full'>
                <BarChart
                  data={activityByUser.slice(0, 8)}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray='3 3' vertical={false} opacity={0.3} />
                  <XAxis
                    dataKey='user_name'
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(val) => (val.length > 10 ? `${val.substring(0, 9)}…` : val)}
                  />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent indicator='dot' />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey='created' fill='var(--color-created)' radius={[4, 4, 0, 0]} />
                  <Bar dataKey='updated' fill='var(--color-updated)' radius={[4, 4, 0, 0]} />
                  <Bar dataKey='commented' fill='var(--color-commented)' radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Task Status Donut Chart (1 col) */}
        <Card className='shadow-sm border'>
          <CardHeader className='pb-2'>
            <div className='space-y-1'>
              <CardTitle className='text-base font-semibold flex items-center gap-2'>
                <PieIcon className='w-4 h-4 text-emerald-600' /> Task Status Breakdown
              </CardTitle>
              <CardDescription className='text-xs'>
                Overall progress health across all projects
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className='pt-2 flex flex-col items-center justify-center'>
            {totalTasksCount === 0 ? (
              <div className='h-[280px] flex items-center justify-center text-xs text-muted-foreground'>
                No tasks available.
              </div>
            ) : (
              <div className='relative w-full flex flex-col items-center'>
                <ChartContainer config={taskStatusChartConfig} className='h-[230px] w-full max-w-[280px]'>
                  <PieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          nameKey='name'
                          formatter={(value, name) => (
                            <div className='flex items-center justify-between w-full gap-4 text-xs'>
                              <span>{name}:</span>
                              <span className='font-bold'>{value} tasks</span>
                            </div>
                          )}
                        />
                      }
                    />
                    <Pie
                      data={taskStatusDist}
                      dataKey='count'
                      nameKey='name'
                      innerRadius={62}
                      outerRadius={88}
                      paddingAngle={3}
                      strokeWidth={2}
                    >
                      {taskStatusDist.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                {/* Center Stats */}
                <div className='absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none'>
                  <span className='text-2xl font-bold tracking-tight text-foreground'>
                    {completionRate}%
                  </span>
                  <span className='block text-[11px] text-muted-foreground font-medium'>
                    Completed
                  </span>
                </div>
                {/* Legend badges below */}
                <div className='grid grid-cols-2 gap-2 w-full mt-2 pt-2 border-t text-xs'>
                  {taskStatusDist.map((st) => (
                    <div key={st.status} className='flex items-center justify-between px-2 py-1 rounded bg-muted/40'>
                      <div className='flex items-center gap-1.5'>
                        <span
                          className='w-2.5 h-2.5 rounded-full shrink-0'
                          style={{ backgroundColor: st.fill }}
                        />
                        <span className='text-muted-foreground truncate max-w-[70px]'>{st.name}</span>
                      </div>
                      <span className='font-semibold text-foreground font-mono'>{st.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Tasks Done vs In Progress by Person & Daily Activity Trend */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Task Completion per Person (Stacked Bar Chart) */}
        <Card className='shadow-sm border'>
          <CardHeader className='pb-2'>
            <div className='flex items-center justify-between'>
              <div className='space-y-1'>
                <CardTitle className='text-base font-semibold flex items-center gap-2'>
                  <CheckCircle2 className='w-4 h-4 text-emerald-600' /> Tasks Completed vs In-Progress by Person
                </CardTitle>
                <CardDescription className='text-xs'>
                  Who has done what task and current workload volume
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='pt-2'>
            {tasksByUser.length === 0 ? (
              <div className='h-[280px] flex items-center justify-center text-xs text-muted-foreground'>
                No user task assignments found.
              </div>
            ) : (
              <ChartContainer config={taskWorkloadChartConfig} className='h-[280px] w-full'>
                <BarChart
                  data={tasksByUser.slice(0, 8)}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray='3 3' vertical={false} opacity={0.3} />
                  <XAxis
                    dataKey='user_name'
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(val) => (val.length > 10 ? `${val.substring(0, 9)}…` : val)}
                  />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent indicator='dot' />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey='done' fill='var(--color-done)' stackId='tasks' radius={[0, 0, 0, 0]} />
                  <Bar dataKey='in_progress' fill='var(--color-in_progress)' stackId='tasks' radius={[0, 0, 0, 0]} />
                  <Bar dataKey='review' fill='var(--color-review)' stackId='tasks' radius={[0, 0, 0, 0]} />
                  <Bar dataKey='todo' fill='var(--color-todo)' stackId='tasks' radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Daily Activity Momentum (Area Chart) */}
        <Card className='shadow-sm border'>
          <CardHeader className='pb-2'>
            <div className='flex items-center justify-between'>
              <div className='space-y-1'>
                <CardTitle className='text-base font-semibold flex items-center gap-2'>
                  <TrendingUp className='w-4 h-4 text-blue-600' /> Daily Activity Momentum Trend
                </CardTitle>
                <CardDescription className='text-xs'>
                  Volume of project logs and events over time
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='pt-2'>
            {activityTimeline.length === 0 ? (
              <div className='h-[280px] flex items-center justify-center text-xs text-muted-foreground'>
                No trend data available.
              </div>
            ) : (
              <ChartContainer config={activityTrendChartConfig} className='h-[280px] w-full'>
                <AreaChart
                  data={activityTimeline}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id='totalTrendGradient' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor='#3b82f6' stopOpacity={0.4} />
                      <stop offset='95%' stopColor='#3b82f6' stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id='createdTrendGradient' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor='#10b981' stopOpacity={0.4} />
                      <stop offset='95%' stopColor='#10b981' stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray='3 3' vertical={false} opacity={0.3} />
                  <XAxis
                    dataKey='display_date'
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                  />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent indicator='line' />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area
                    type='monotone'
                    dataKey='total'
                    stroke='#3b82f6'
                    strokeWidth={2}
                    fillOpacity={1}
                    fill='url(#totalTrendGradient)'
                  />
                  <Area
                    type='monotone'
                    dataKey='created'
                    stroke='#10b981'
                    strokeWidth={2}
                    fillOpacity={1}
                    fill='url(#createdTrendGradient)'
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Project Resource Allocation & Workload Bar Chart */}
      <Card className='shadow-sm border'>
        <CardHeader className='pb-2'>
          <div className='flex items-center justify-between'>
            <div className='space-y-1'>
              <CardTitle className='text-base font-semibold flex items-center gap-2'>
                <FolderGit2 className='w-4 h-4 text-indigo-600' /> Project Workload & Allocation
              </CardTitle>
              <CardDescription className='text-xs'>
                Tasks completed, tasks in progress, and team size per project
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className='pt-2'>
          {projectWorkload.length === 0 ? (
            <div className='h-[260px] flex items-center justify-center text-xs text-muted-foreground'>
              No projects available.
            </div>
          ) : (
            <ChartContainer config={projectWorkloadChartConfig} className='h-[260px] w-full'>
              <BarChart
                data={projectWorkload.slice(0, 10)}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray='3 3' vertical={false} opacity={0.3} />
                <XAxis
                  dataKey='project_name'
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(val) => (val.length > 14 ? `${val.substring(0, 13)}…` : val)}
                />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent indicator='dot' />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey='done_tasks' fill='var(--color-done_tasks)' radius={[4, 4, 0, 0]} />
                <Bar dataKey='in_progress_tasks' fill='var(--color-in_progress_tasks)' radius={[4, 4, 0, 0]} />
                <Bar dataKey='members_count' fill='var(--color-members_count)' radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
