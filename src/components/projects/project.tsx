import { useState } from 'react'
import { Button } from '../ui/button'
import { Dialog } from '../ui/dialog'
import CreateProjectForm from './create-project'
import type { Project } from '@/types/project-types'
import ProjectList from './project-list'
import ProjectKanban, { type ProjectFilters } from './project-kanban'
import { FilterX, Search, Layers } from 'lucide-react'
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
  assignee_id: 'all',
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
                    ? 'bg-background text-foreground shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                {m.label}
              </button>
            )
          })}
        </div>

        {/* FILTER BAR */}
        <div className='flex flex-wrap items-center justify-between gap-3 mb-6 p-2 bg-card border rounded-lg shadow-sm'>
          <div className='flex flex-wrap items-center gap-2 flex-1'>
            {/* Search */}
            <div className='relative w-full max-w-60'>
              <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search projects...'
                className='pl-8 h-9 bg-muted/40 border-transparent hover:border-border focus-visible:border-primary focus-visible:ring-1 transition-colors shadow-none'
                value={localFilters.search}
                onChange={(e) => setFilter('search', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              />
            </div>

            <div className='h-5 w-px bg-border mx-1 hidden sm:block' />

            {/* Selects */}
            <Select
              value={localFilters.assignee_id}
              onValueChange={(v) => setFilter('assignee_id', v)}
            >
              <SelectTrigger className='h-9 w-[140px] bg-muted/40 border-transparent hover:border-border transition-colors shadow-none'>
                <SelectValue placeholder='Assignee' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Assignees</SelectItem>
                {Object.entries(USERS_MAP).map(([id, name]) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={localFilters.project_type}
              onValueChange={(v) => setFilter('project_type', v)}
            >
              <SelectTrigger className='h-9 w-[130px] bg-muted/40 border-transparent hover:border-border transition-colors shadow-none'>
                <SelectValue placeholder='Type' />
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

            <Select
              value={localFilters.status}
              onValueChange={(v) => setFilter('status', v)}
            >
              <SelectTrigger className='h-9 w-[140px] bg-muted/40 border-transparent hover:border-border transition-colors shadow-none'>
                <SelectValue placeholder='Status' />
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

            <div className='h-5 w-px bg-border mx-1 hidden lg:block' />

            {/* Date Range */}
            <div className='flex items-center gap-1 rounded-md px-1.5 h-8 shadow-sm'>
              <Input
                type='datetime-local'
                className='h-6 text-[11px] w-[140px] border-0 bg-transparent p-0 focus-visible:ring-0 shadow-none'
                value={localFilters.start_date}
                onChange={(e) => setFilter('start_date', e.target.value)}
              />
              <span className='text-zinc-300 text-xs'>→</span>
              <Input
                type='datetime-local'
                className='h-6 text-[11px] w-[140px] border-0 bg-transparent p-0 focus-visible:ring-0 shadow-none'
                value={localFilters.end_date}
                onChange={(e) => setFilter('end_date', e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className='flex items-center gap-2 shrink-0'>
            {(localFilters.search ||
              localFilters.assignee_id !== 'all' ||
              localFilters.project_type !== 'all' ||
              localFilters.status !== 'all' ||
              localFilters.start_date ||
              localFilters.end_date) && (
              <Button
                variant='ghost'
                size='sm'
                onClick={clearFilters}
                className='h-9 px-3 text-muted-foreground hover:text-foreground'
              >
                Clear
              </Button>
            )}
            <Button
              size='sm'
              onClick={applyFilters}
              className='h-9 px-4 shadow-sm'
            >
              Apply Filters
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
