import { ENV, PRIORITY_STYLES, STATUS_STYLES } from '@/conf'
import type { Priority, Project, Status } from '@/types/project-types'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import EditProjectModal from './edit-project'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'

export default function ProjectList() {
  const [editProject, setEditProject] = useState<Project | null>(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/projects`, {
        credentials: 'include',
      })
      if (res.status === 403) {
        return { forbidden: true }
      }

      if (!res.ok) throw new Error('Failed')

      return res.json()
    },
  })

  return (
    <>
      <div className='border  rounded-md overflow-hidden'>
        <div className='grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr]  px-4 py-2.5'>
          {['Order', 'Project Name', 'Status', 'Priority', 'Dates', 'Edit'].map((h) => (
            <p
              key={h}
              className='text-xs font-medium  uppercase tracking-wide'
            >
              {h}
            </p>
          ))}
        </div>
        {projects?.data?.map((p: any, i: number) => (
          <div
            key={p.id}
            onClick={() => navigate(`/projects/${p.id}`)}
            className={`grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr] px-4 py-3 cursor-pointer  transition-colors items-center ${i !== projects.length - 1 ? 'border-b ' : ''}`}
          >
            <div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigator.clipboard.writeText(String(p.id))
                  toast.success(`Copied Project ID "${p.id}" to clipboard!`)
                }}
                className='text-xs font-medium font-mono uppercase tracking-wide hover:text-foreground hover:bg-muted/80 px-1.5 py-0.5 rounded cursor-pointer transition-colors'
                title='Click to copy ID only'
              >
                #{p.id}
              </button>
            </div>
            <div className=''>
              <p className='text-sm font-medium  leading-none'>
                {p.name}
              </p>
            </div>
            <div>
              {p.status && (
                <span
                  className={`text-xs px-2 py-0.5 rounded border font-medium ${STATUS_STYLES[p.status as Status]}`}
                >
                  {p.status.charAt(0).toUpperCase() +
                    p.status.replace('_', ' ').slice(1)}
                </span>
              )}
            </div>
            <div>
              {p.priority && (
                <span
                  className={`text-xs px-2 py-0.5 rounded border font-medium ${PRIORITY_STYLES[p.priority as Priority]}`}
                >
                  {p.priority.charAt(0).toUpperCase() + p.priority.slice(1)}
                </span>
              )}
            </div>
            <div>
              <p className='text-xs '>{p.startDate}</p>
              <p className='text-xs '>→ {p.endDate}</p>
            </div>
            <div className='flex items-center gap-2'>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  const textToCopy = `ID: #${p.id} - ${p.name}`
                  navigator.clipboard.writeText(textToCopy)
                  toast.success(`Copied "${textToCopy}" to clipboard!`)
                }}
                className='text-xs text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-muted/80'
                title='Copy Project ID & Name'
              >
                <Copy className='w-3.5 h-3.5' />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setEditProject(p)
                }}
                className='text-xs transition-colors'
              >
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>
      <EditProjectModal
        open={!!editProject}
        onClose={() => setEditProject(null)}
        project={editProject}
        onUpdated={() => {
          queryClient.invalidateQueries({ queryKey: ['projects'] })
          setEditProject(null)
        }}
      />
    </>
  )
}
