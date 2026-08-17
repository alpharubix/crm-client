import { useState } from 'react'
import { Button } from '../ui/button'
import { Dialog } from '../ui/dialog'
import CreateProjectForm from './create-project'
import type { Project } from '@/types/project-types'
import ProjectList from './project-list'
import ProjectKanban, { type ProjectFilters } from './project-kanban'
import {
  FilterX,
  Search,
  Layers,
  Hash,
  User,
  UserCheck,
  Tag,
  Activity,
  AlertCircle,
  Calendar,
  RotateCcw,
  Filter,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { PROJECT_MODULES, PROJECT_TYPES, USERS_MAP } from '@/conf'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

const defaultFilters: ProjectFilters = {
  search: '',
  project_id: '',
  assignee_id: 'all',
  created_by: 'all',
  priority: 'all',
  start_date: '',
  end_date: '',
  project_type: 'all',
  project_module: 'all',
  status: 'all',
}

const MODULE_OPTIONS = [
  { label: 'All Modules', value: 'all' },
  ...PROJECT_MODULES.map((m) => ({ label: m, value: m })),
]

const PRIORITY_OPTIONS = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' },
]

const STATUS_OPTIONS = [
  { label: 'Planning', value: 'planning' },
  { label: 'Active', value: 'active' },
  { label: 'On Hold', value: 'on_hold' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Pending Approve', value: 'pending_for_approve' },
  { label: 'Pending Review', value: 'pending_for_review' },
  { label: 'Rejected', value: 'rejected' },
]

export default function Project() {
  const [projects, setProjects] = useState<Project[]>([])
  const [modalState, setModalState] = useState<'closed' | 'create' | 'detail'>(
    'closed',
  )
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [selectedModule, setSelectedModule] = useState<string>('all')

  const [localFilters, setLocalFilters] =
    useState<ProjectFilters>(defaultFilters)

  const [appliedFilters, setAppliedFilters] =
    useState<ProjectFilters>(defaultFilters)

  const activeFilterCount = [
    localFilters.search,
    localFilters.project_id,
    localFilters.assignee_id !== 'all' ? localFilters.assignee_id : null,
    localFilters.created_by && localFilters.created_by !== 'all'
      ? localFilters.created_by
      : null,
    localFilters.priority && localFilters.priority !== 'all'
      ? localFilters.priority
      : null,
    localFilters.project_type !== 'all' ? localFilters.project_type : null,
    localFilters.status !== 'all' ? localFilters.status : null,
    localFilters.start_date,
    localFilters.end_date,
  ].filter(Boolean).length

  function handleModuleSelect(moduleValue: string) {
    setSelectedModule(moduleValue)
    setLocalFilters((prev) => ({ ...prev, project_module: moduleValue }))
    setAppliedFilters((prev) => ({ ...prev, project_module: moduleValue }))
  }

  function setFilter(key: keyof ProjectFilters, value: string) {
    setLocalFilters((prev) => ({ ...prev, [key]: value }))
  }

  function applyFilters() {
    setAppliedFilters(localFilters)
  }

  function clearFilters() {
    const reset = { ...defaultFilters, project_module: selectedModule }
    setLocalFilters(reset)
    setAppliedFilters(reset)
  }

  function openCreate() {
    setSelectedProject(null)
    setModalState('create')
  }

  function handleCreated(project: Project) {
    setProjects((prev) => [project, ...prev])
    setSelectedProject(project)
    setModalState('detail')
  }

  function handleClose() {
    setModalState('closed')
    setSelectedProject(null)
  }

  return (
    <div className='w-full h-full p-4 flex flex-col max-w-[1240px] mx-auto'>
      <div className='flex flex-col flex-1 min-h-0'>
        {/* TOP MODULE SELECTOR BAR */}
        <div className='flex flex-wrap items-center justify-between gap-4 mb-4 shrink-0'>
          <div>
            <h1 className='text-lg font-semibold flex items-center gap-2'>
              <Layers className='w-5 h-5 text-primary' /> Projects
            </h1>
            <p className='text-xs text-muted-foreground mt-0.5'>
              Select a module to view its projects in Kanban board
            </p>
          </div>
          <div className='flex items-center gap-3'>
            <Button size='sm' onClick={openCreate}>
              + New Project
            </Button>
          </div>
        </div>

        {/* PROJECT MODULE TABS / SELECTOR */}
        <div className='flex items-center gap-2 mb-4 p-1.5 bg-muted/60 rounded-lg border shrink-0 overflow-x-auto'>
          {MODULE_OPTIONS.map((m) => {
            const active = selectedModule === m.value
            return (
              <button
                key={m.value}
                onClick={() => handleModuleSelect(m.value)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-background text-foreground shadow-xs border border-border'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                {m.label}
              </button>
            )
          })}
        </div>

        {/* REFINED FILTER BAR */}
        <div className='flex flex-wrap items-center justify-between gap-3 mb-6 p-2.5 bg-card border rounded-xl shadow-xs transition-all'>
          <div className='flex flex-wrap items-center gap-2.5 flex-1 min-w-0'>
            {/* Search */}
            <div className='relative w-full sm:w-44 lg:w-48'>
              <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/70 pointer-events-none' />
              <Input
                placeholder='Search by name...'
                className='pl-8 h-9 text-xs bg-muted/30 border-muted hover:border-border focus-visible:border-primary transition-colors shadow-none rounded-md'
                value={localFilters.search}
                onChange={(e) => setFilter('search', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              />
            </div>

            {/* Project ID Filter */}
            <div className='relative w-24 sm:w-28'>
              <Hash className='absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/70 pointer-events-none' />
              <Input
                placeholder='ID'
                className='pl-8 h-9 text-xs font-mono bg-muted/30 border-muted hover:border-border focus-visible:border-primary transition-colors shadow-none rounded-md'
                value={localFilters.project_id || ''}
                onChange={(e) => setFilter('project_id', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              />
            </div>

            <div className='h-5 w-px bg-border/60 mx-0.5 hidden sm:block' />

            {/* Assignee / Actioner */}
            <Select
              value={localFilters.assignee_id}
              onValueChange={(v) => setFilter('assignee_id', v)}
            >
              <SelectTrigger className='h-9 w-[130px] text-xs bg-muted/30 border-muted hover:border-border transition-colors shadow-none rounded-md'>
                <div className='flex items-center gap-1.5 truncate'>
                  <User className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
                  <SelectValue placeholder='Actioner' />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Actioners</SelectItem>
                {Object.entries(USERS_MAP).map(([id, name]) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Initiator */}
            <Select
              value={localFilters.created_by || 'all'}
              onValueChange={(v) => setFilter('created_by', v)}
            >
              <SelectTrigger className='h-9 w-[130px] text-xs bg-muted/30 border-muted hover:border-border transition-colors shadow-none rounded-md'>
                <div className='flex items-center gap-1.5 truncate'>
                  <UserCheck className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
                  <SelectValue placeholder='Initiator' />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Initiators</SelectItem>
                {Object.entries(USERS_MAP).map(([id, name]) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type */}
            <Select
              value={localFilters.project_type}
              onValueChange={(v) => setFilter('project_type', v)}
            >
              <SelectTrigger className='h-9 w-[120px] text-xs bg-muted/30 border-muted hover:border-border transition-colors shadow-none rounded-md'>
                <div className='flex items-center gap-1.5 truncate'>
                  <Tag className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
                  <SelectValue placeholder='Type' />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Types</SelectItem>
                {PROJECT_TYPES.map((t) => (
                  <SelectItem key={t} value={t.toLowerCase()}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Priority */}
            <Select
              value={localFilters.priority || 'all'}
              onValueChange={(v) => setFilter('priority', v)}
            >
              <SelectTrigger className='h-9 w-[125px] text-xs bg-muted/30 border-muted hover:border-border transition-colors shadow-none rounded-md'>
                <div className='flex items-center gap-1.5 truncate'>
                  <AlertCircle className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
                  <SelectValue placeholder='Priority' />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Priorities</SelectItem>
                {PRIORITY_OPTIONS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status */}
            <Select
              value={localFilters.status}
              onValueChange={(v) => setFilter('status', v)}
            >
              <SelectTrigger className='h-9 w-[130px] text-xs bg-muted/30 border-muted hover:border-border transition-colors shadow-none rounded-md'>
                <div className='flex items-center gap-1.5 truncate'>
                  <Activity className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
                  <SelectValue placeholder='Status' />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Statuses</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className='h-5 w-px bg-border/60 mx-0.5 hidden lg:block' />

            {/* Date Range Filter (Schedule Start & End Date) */}
            <div className='flex items-center gap-1.5 bg-muted/30 border border-muted rounded-md px-2.5 h-9'>
              <Calendar className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
              <span className='text-[11px] font-semibold text-muted-foreground shrink-0'>Schedule:</span>
              <Input
                type='datetime-local'
                title='Schedule Start Date'
                className='h-6 text-[11px] w-[135px] border-0 bg-transparent p-0 focus-visible:ring-0 shadow-none text-muted-foreground hover:text-foreground transition-colors'
                value={localFilters.start_date}
                onChange={(e) => setFilter('start_date', e.target.value)}
              />
              <span className='text-muted-foreground/60 text-xs font-medium'>→</span>
              <Input
                type='datetime-local'
                title='Schedule End Date'
                className='h-6 text-[11px] w-[135px] border-0 bg-transparent p-0 focus-visible:ring-0 shadow-none text-muted-foreground hover:text-foreground transition-colors'
                value={localFilters.end_date}
                onChange={(e) => setFilter('end_date', e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className='flex items-center gap-2 shrink-0 border-l border-border/40 pl-2.5 sm:pl-3'>
            {activeFilterCount > 0 && (
              <Button
                variant='ghost'
                size='sm'
                onClick={clearFilters}
                className='h-9 px-2.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors gap-1.5'
              >
                <RotateCcw className='h-3.5 w-3.5' /> Clear
              </Button>
            )}
            <Button
              size='sm'
              onClick={applyFilters}
              className='h-9 px-3.5 text-xs font-medium shadow-xs gap-1.5 cursor-pointer'
            >
              <Filter className='h-3.5 w-3.5' />
              Apply
              {activeFilterCount > 0 && (
                <span className='ml-1 px-1.5 py-0.2 rounded-full bg-primary-foreground/20 text-[10px] font-bold'>
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
        </div>
        <div className='flex-1 overflow-hidden'>
          <ProjectKanban filters={appliedFilters} />
        </div>
      </div>
      <Dialog
        open={modalState !== 'closed'}
        onOpenChange={(o) => {
          if (!o) handleClose()
        }}
      >
        {modalState === 'create' && (
          <CreateProjectForm onCreated={handleCreated} onCancel={handleClose} />
        )}
        {/* {modalState === 'detail' && selectedProject && (
          <ProjectDetail project={selectedProject} onClose={handleClose} />
        )} */}
      </Dialog>
    </div>
  )
}
