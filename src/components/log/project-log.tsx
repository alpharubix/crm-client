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
import { ChevronLeft, ChevronRight, Layers, CheckCircle2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ENV, USERS_MAP } from '@/conf'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Spinner } from '@/components/ui/spinner'

const ITEMS_PER_PAGE = 20

export default function ProjectLogs() {
  const [currentPage, setCurrentPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['project-logs', currentPage],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('page', currentPage.toString())

      const res = await fetch(
        `${ENV.VITE_BACKEND_BASE_URL}/project-logs?${params.toString()}`,
        { credentials: 'include' },
      )

      if (!res.ok) throw new Error('Failed to fetch project logs')
      return res.json()
    },
    placeholderData: keepPreviousData,
  })

  const logs = data?.data || []
  const pageInfo = data?.page_info || { page: 1, total: 1 }
  const totalPages = Math.ceil(pageInfo.total / ITEMS_PER_PAGE) || 1

  const getActionBadge = (action: string) => {
    const normalizedAction = action.toUpperCase()
    switch (normalizedAction) {
      case 'CREATED':
      case 'CREATE':
        return (
          <Badge
            variant='outline'
            className='bg-emerald-50 text-emerald-700 border-emerald-200'
          >
            Create
          </Badge>
        )
      case 'UPDATED':
      case 'UPDATE':
        return (
          <Badge
            variant='outline'
            className='bg-blue-50 text-blue-700 border-blue-200'
          >
            Update
          </Badge>
        )
      case 'COMMENTED':
        return (
          <Badge
            variant='outline'
            className='bg-purple-50 text-purple-700 border-purple-200'
          >
            Comment
          </Badge>
        )
      default:
        return <Badge variant='outline'>{action}</Badge>
    }
  }

  const getEntityBadge = (log: any) => {
    const isTask = log.entity_type === 'TASK' || !!log.task_id
    if (isTask) {
      return (
        <Badge
          variant='outline'
          className='bg-sky-50 text-sky-700 border-sky-200 font-medium'
        >
          Task
        </Badge>
      )
    }
    return (
      <Badge
        variant='outline'
        className='bg-indigo-50 text-indigo-700 border-indigo-200 font-medium'
      >
        Project
      </Badge>
    )
  }

  const getChangesDisplay = (changes: any) => {
    if (!changes || Object.keys(changes).length === 0) {
      return <span className='text-muted-foreground text-xs italic'>No change details</span>
    }

    const jsonString = JSON.stringify(changes)
    const isLong = jsonString.length > 50

    const displayContent = (
      <code className='text-xs bg-muted px-1.5 py-0.5 rounded text-foreground font-mono'>
        {isLong ? `${jsonString.substring(0, 50)}...` : jsonString}
      </code>
    )

    if (isLong) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className='cursor-help font-mono'>{displayContent}</div>
            </TooltipTrigger>
            <TooltipContent className='max-w-[400px] break-all p-2.5 bg-popover text-popover-foreground border shadow-md'>
              <pre className='text-xs whitespace-pre-wrap font-mono'>
                {JSON.stringify(changes, null, 2)}
              </pre>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }

    return displayContent
  }

  return (
    <div className='flex flex-1 flex-col gap-4 p-4 max-w-[1240px] mx-auto w-full'>
      <div className='flex items-center justify-between space-y-2'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight flex items-center gap-2'>
            <Layers className='w-6 h-6 text-primary' /> Project Logs
          </h2>
          <p className='text-xs text-muted-foreground mt-1'>
            View and track all project and task activities across the system.
          </p>
        </div>
      </div>

      <div>
        <div className='rounded-md border shadow-sm max-h-[calc(100vh-220px)] overflow-y-auto bg-card'>
          <Table>
            <TableHeader className='sticky top-0 z-10 bg-background shadow-xs'>
              <TableRow className='hover:bg-transparent'>
                <TableHead className='w-[160px]'>User</TableHead>
                <TableHead className='w-[100px]'>Action</TableHead>
                <TableHead className='w-[100px]'>Entity</TableHead>
                <TableHead className='w-[220px]'>Context / Item</TableHead>
                <TableHead>Changes / Payload</TableHead>
                <TableHead className='text-right w-[180px]'>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className='h-32 text-center'>
                    <div className='flex justify-center flex-col items-center gap-2'>
                      <Spinner className='h-6 w-6' />
                      <span className='text-xs text-muted-foreground'>
                        Loading project logs...
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className='h-32 text-center text-xs text-muted-foreground'
                  >
                    No project logs found.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log: any) => {
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
                          <div className='w-5 h-5 rounded-full bg-zinc-200 text-zinc-700 font-bold flex items-center justify-center text-[10px] shrink-0 uppercase'>
                            {userName[0]}
                          </div>
                          <span className='truncate max-w-[130px]' title={userName}>
                            {userName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>{getEntityBadge(log)}</TableCell>
                      <TableCell className='font-medium text-foreground truncate max-w-[200px]' title={targetName}>
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
        <div className='flex items-center justify-between px-2 py-3 border-t mt-2 text-xs'>
          <p className='text-muted-foreground text-xs'>
            Page <span className='font-medium text-foreground'>{currentPage}</span> of{' '}
            <span className='font-medium text-foreground'>{totalPages}</span> ({pageInfo.total} total logs)
          </p>

          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              disabled={currentPage <= 1 || isLoading}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className='h-8 px-2.5'
            >
              <ChevronLeft className='h-4 w-4 mr-1' /> Previous
            </Button>
            <Button
              variant='outline'
              size='sm'
              disabled={currentPage >= totalPages || isLoading}
              onClick={() => setCurrentPage((p) => p + 1)}
              className='h-8 px-2.5'
            >
              Next <ChevronRight className='h-4 w-4 ml-1' />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
