import { useState } from 'react'
import type { Priority, Project, Status } from '@/types/project-types'
import { Button } from '../ui/button'
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { PRIORITY_STYLES, STATUS_STYLES } from '@/conf'
import { Copy, Check, Hash } from 'lucide-react'
import { toast } from 'sonner'

export default function ProjectDetail({
  project,
  onClose,
}: {
  project: Project
  onClose: () => void
}) {
  const p = project.priority as Priority
  const s = project.status as Status
  const [copiedId, setCopiedId] = useState(false)
  const [copiedBoth, setCopiedBoth] = useState(false)

  const handleCopyIdOnly = () => {
    const textToCopy = String(project.id)
    navigator.clipboard.writeText(textToCopy)
    toast.success(`Copied Project ID "${textToCopy}" to clipboard!`)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  const handleCopyBoth = () => {
    const textToCopy = `ID: #${project.id} - ${project.name}`
    navigator.clipboard.writeText(textToCopy)
    toast.success(`Copied "${textToCopy}" to clipboard!`)
    setCopiedBoth(true)
    setTimeout(() => setCopiedBoth(false), 2000)
  }

  return (
    <DialogContent className='max-w-md'>
      <DialogHeader>
        <div className='flex items-center justify-between gap-2 pr-4'>
          <button
            onClick={handleCopyIdOnly}
            className='text-[11px] font-mono text-zinc-500 hover:text-foreground flex items-center gap-1 cursor-pointer bg-zinc-100 hover:bg-zinc-200 px-1.5 py-0.5 rounded transition-colors border border-transparent'
            title='Click to copy Project ID only'
          >
            <span>ID: #{project.id}</span>
            {copiedId ? (
              <Check className='w-3 h-3 text-green-600' />
            ) : (
              <Hash className='w-3 h-3 text-zinc-400' />
            )}
          </button>

          <Button
            variant='ghost'
            size='sm'
            className='h-7 text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer'
            onClick={handleCopyBoth}
            title='Copy Project ID & Name'
          >
            {copiedBoth ? (
              <>
                <Check className='w-3.5 h-3.5 text-green-600' />
                <span className='text-green-600'>Copied Both</span>
              </>
            ) : (
              <>
                <Copy className='w-3.5 h-3.5' />
                <span>Copy Both</span>
              </>
            )}
          </Button>
        </div>
        <DialogTitle className='text-base font-semibold leading-tight'>
          {project.name}
        </DialogTitle>
      </DialogHeader>

      <div className='space-y-4 py-1'>
        {/* Badges */}
        <div className='flex gap-2'>
          {p && (
            <span
              className={`text-xs px-2 py-0.5 rounded border font-medium ${PRIORITY_STYLES[p]}`}
            >
              {p}
            </span>
          )}
          {s && (
            <span
              className={`text-xs px-2 py-0.5 rounded border font-medium ${STATUS_STYLES[s]}`}
            >
              {s}
            </span>
          )}
        </div>

        {/* Description */}
        {project.description && (
          <p className='text-sm text-zinc-500 leading-relaxed'>
            {project.description}
          </p>
        )}

        {/* Dates */}
        <div className='grid grid-cols-2 gap-4 pt-2 border-t border-zinc-100'>
          <div>
            <p className='text-[11px] text-zinc-400 mb-0.5'>Start Date</p>
            <p className='text-sm font-medium'>{project.startDate}</p>
          </div>
          <div>
            <p className='text-[11px] text-zinc-400 mb-0.5'>End Date</p>
            <p className='text-sm font-medium'>{project.endDate}</p>
          </div>
        </div>

        {/* Team */}
        <div className='pt-2 border-t border-zinc-100'>
          <p className='text-[11px] text-zinc-400 mb-2'>Team</p>
          <div className='space-y-2'>
            {project.assignees.map((u) => (
              <div key={u.id} className='flex items-center gap-2'>
                <div className='w-6 h-6 rounded-full bg-zinc-200 text-zinc-600 flex items-center justify-center text-xs font-semibold shrink-0'>
                  {u.name[0]}
                </div>
                <div>
                  <p className='text-sm leading-none'>{u.name}</p>
                  <p className='text-xs text-zinc-400 mt-0.5'>{u.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant='outline' size='sm' onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
