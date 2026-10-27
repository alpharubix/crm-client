import * as React from 'react'
import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Spinner } from '@/components/ui/spinner'
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Download,
  RotateCcw,
  Layers,
  FileCode,
} from 'lucide-react'
import { USERS_MAP } from '@/conf'

interface LogItem {
  id: string
  project_id: string | null
  project_name: string | null
  task_id: string | null
  task_title: string | null
  user_id: string
  user_role: string
  action: string
  entity_type: string
  changes: any
  created_at: string | null
}

interface ProjectLogTableProps {
  logs: LogItem[]
  isLoading: boolean
  page: number
  totalPages: number
  totalCount: number
  onPageChange: (newPage: number) => void
  userFilter: string
  onUserFilterChange: (uid: string) => void
  projectFilter: string
  onProjectFilterChange: (pid: string) => void
  actionFilter: string
  onActionFilterChange: (action: string) => void
  entityFilter: string
  onEntityFilterChange: (entity: string) => void
  search: string
  onSearchChange: (search: string) => void
  onResetFilters: () => void
  userOptions?: Array<{ id: string; name: string }>
  projectOptions?: Array<{ id: string; name: string }>
}

export function ProjectLogTable({
  logs,
  isLoading,
  page,
  totalPages,
  totalCount,
  onPageChange,
  userFilter,
  onUserFilterChange,
  projectFilter,
  onProjectFilterChange,
  actionFilter,
  onActionFilterChange,
  entityFilter,
  onEntityFilterChange,
  search,
  onSearchChange,
  onResetFilters,
  userOptions = [],
  projectOptions = [],
}: ProjectLogTableProps) {
  const getActionBadge = (action: string) => {
    const normalized = (action || '').toUpperCase()
    if (normalized.includes('CREATE')) {
      return (
        <Badge variant='outline' className='bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px] font-semibold'>
          Create
        </Badge>
      )
    }
    if (normalized.includes('UPDATE')) {
      return (
        <Badge variant='outline' className='bg-blue-50 text-blue-700 border-blue-200 text-[11px] font-semibold'>
          Update
        </Badge>
      )
    }
    if (normalized.includes('COMMENT')) {
      return (
        <Badge variant='outline' className='bg-purple-50 text-purple-700 border-purple-200 text-[11px] font-semibold'>
          Comment
        </Badge>
      )
    }
    return <Badge variant='outline' className='text-[11px] font-semibold'>{action}</Badge>
  }

  const getEntityBadge = (log: LogItem) => {
    const isTask = log.entity_type === 'TASK' || !!log.task_id
    if (isTask) {
      return (
        <Badge variant='outline' className='bg-sky-50 text-sky-700 border-sky-200 font-medium text-[11px]'>
          Task
        </Badge>
      )
    }
    return (
      <Badge variant='outline' className='bg-indigo-50 text-indigo-700 border-indigo-200 font-medium text-[11px]'>
        Project
      </Badge>
    )
  }

  const getChangesDisplay = (changes: any) => {
    if (!changes || Object.keys(changes).length === 0) {
      return <span className='text-muted-foreground text-xs italic'>No change details</span>
    }

    const jsonString = JSON.stringify(changes)
    const isLong = jsonString.length > 45

    const displayContent = (
      <code className='text-[11px] bg-muted px-1.5 py-0.5 rounded text-foreground font-mono'>
        {isLong ? `${jsonString.substring(0, 45)}…` : jsonString}
      </code>
    )

    if (isLong) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className='cursor-help font-mono'>{displayContent}</div>
            </TooltipTrigger>
            <TooltipContent className='max-w-[420px] break-all p-3 bg-popover text-popover-foreground border shadow-lg rounded-lg'>
              <div className='text-[10px] font-bold text-muted-foreground uppercase mb-1.5 flex items-center gap-1'>
                <FileCode className='w-3 h-3 text-primary' /> Change Payload
              </div>
              <pre className='text-xs whitespace-pre-wrap font-mono bg-muted/50 p-2 rounded'>
                {JSON.stringify(changes, null, 2)}
              </pre>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return displayContent
  }

  // Export current view to CSV
  const handleExportCSV = () => {
    if (!logs.length) return
    const headers = ['ID', 'User', 'Action', 'Entity', 'Context', 'Changes', 'Timestamp']
    const rows = logs.map((l) => [
      l.id,
      USERS_MAP[String(l.user_id)] || `User #${l.user_id}`,
      l.action,
      l.entity_type,
      l.task_title ? `Task: ${l.task_title}` : l.project_name ? `Project: ${l.project_name}` : '',
      JSON.stringify(l.changes || {}).replace(/"/g, '""'),
      l.created_at || '',
    ])

    const csvContent = [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `project_logs_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className='space-y-4'>
      {/* Filter and Search Bar */}
      <div className='flex flex-wrap items-center justify-between gap-3 p-3 bg-card border rounded-lg shadow-2xs'>
        <div className='flex flex-wrap items-center gap-2.5 flex-1'>
          {/* Keyword Search */}
          <div className='relative min-w-[200px] flex-1 max-w-sm'>
            <Search className='w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground' />
            <Input
              placeholder='Search actions, tasks, projects...'
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className='h-8 pl-8 text-xs bg-background'
            />
          </div>

          {/* User Filter */}
          <Select value={userFilter || 'all'} onValueChange={(val) => onUserFilterChange(val === 'all' ? '' : val)}>
            <SelectTrigger className='h-8 text-xs w-[140px]'>
              <SelectValue placeholder='All Users' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Users</SelectItem>
              {userOptions.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Project Filter */}
          <Select value={projectFilter || 'all'} onValueChange={(val) => onProjectFilterChange(val === 'all' ? '' : val)}>
            <SelectTrigger className='h-8 text-xs w-[150px]'>
              <SelectValue placeholder='All Projects' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Projects</SelectItem>
              {projectOptions.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Action Filter */}
          <Select value={actionFilter || 'all'} onValueChange={(val) => onActionFilterChange(val === 'all' ? '' : val)}>
            <SelectTrigger className='h-8 text-xs w-[120px]'>
              <SelectValue placeholder='All Actions' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Actions</SelectItem>
              <SelectItem value='CREATE'>Created</SelectItem>
              <SelectItem value='UPDATE'>Updated</SelectItem>
              <SelectItem value='COMMENT'>Commented</SelectItem>
            </SelectContent>
          </Select>

          {/* Reset button */}
          {(userFilter || projectFilter || actionFilter || entityFilter || search) && (
            <Button
              variant='ghost'
              size='sm'
              onClick={onResetFilters}
              className='h-8 px-2 text-xs text-muted-foreground hover:text-foreground'
            >
              <RotateCcw className='w-3 h-3 mr-1' /> Clear
            </Button>
          )}
        </div>

        {/* Export CSV */}
        <Button
          variant='outline'
          size='sm'
          onClick={handleExportCSV}
          disabled={logs.length === 0}
          className='h-8 text-xs gap-1.5'
        >
          <Download className='w-3.5 h-3.5 text-muted-foreground' /> Export CSV
        </Button>
      </div>

      {/* Main Table */}
      <div className='rounded-md border shadow-xs overflow-hidden bg-card'>
        <Table>
          <TableHeader className='bg-muted/40'>
            <TableRow className='hover:bg-transparent text-xs'>
              <TableHead className='w-[170px]'>User</TableHead>
              <TableHead className='w-[100px]'>Action</TableHead>
              <TableHead className='w-[90px]'>Entity</TableHead>
              <TableHead className='w-[240px]'>Context / Item</TableHead>
              <TableHead>Changes / Payload</TableHead>
              <TableHead className='text-right w-[170px]'>Timestamp (IST)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className='h-36 text-center'>
                  <div className='flex justify-center flex-col items-center gap-2'>
                    <Spinner className='h-6 w-6' />
                    <span className='text-xs text-muted-foreground'>
                      Fetching project activity logs...
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className='h-36 text-center text-xs text-muted-foreground italic'
                >
                  No project logs found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const userName = USERS_MAP[String(log.user_id)] || `User #${log.user_id}`
                const targetName = log.task_title
                  ? `Task: ${log.task_title}`
                  : log.project_name
                  ? `Project: ${log.project_name}`
                  : log.project_id
                  ? `Project #${log.project_id}`
                  : '-'

                return (
                  <TableRow key={log.id} className='hover:bg-muted/40 text-xs'>
                    <TableCell className='font-medium'>
                      <div className='flex items-center gap-2'>
                        <div className='w-6 h-6 rounded-full bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 font-bold flex items-center justify-center text-[10px] shrink-0 uppercase'>
                          {userName[0]}
                        </div>
                        <span className='truncate max-w-[130px] font-medium' title={userName}>
                          {userName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>{getEntityBadge(log)}</TableCell>
                    <TableCell className='font-medium text-foreground truncate max-w-[220px]' title={targetName}>
                      {targetName}
                    </TableCell>
                    <TableCell>{getChangesDisplay(log.changes)}</TableCell>
                    <TableCell className='text-right font-mono text-[11px] text-muted-foreground'>
                      {log.created_at || '-'}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className='flex items-center justify-between px-2 py-2 text-xs'>
        <p className='text-muted-foreground text-xs'>
          Page <span className='font-semibold text-foreground'>{page}</span> of{' '}
          <span className='font-semibold text-foreground'>{totalPages}</span> ({totalCount} total logs)
        </p>

        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            disabled={page <= 1 || isLoading}
            onClick={() => onPageChange(Math.max(page - 1, 1))}
            className='h-8 px-2.5 text-xs'
          >
            <ChevronLeft className='h-3.5 w-3.5 mr-1' /> Previous
          </Button>
          <Button
            variant='outline'
            size='sm'
            disabled={page >= totalPages || isLoading}
            onClick={() => onPageChange(page + 1)}
            className='h-8 px-2.5 text-xs'
          >
            Next <ChevronRight className='h-3.5 w-3.5 ml-1' />
          </Button>
        </div>
      </div>
    </div>
  )
}
