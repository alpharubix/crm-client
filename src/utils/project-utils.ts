import type { FormErrors, ProjectFormData } from '@/types/project-types'

export const emptyForm = (): ProjectFormData => ({
  name: '',
  description: '',
  priority: '',
  status: '',
  assignees: [],
  startDate: '',
  endDate: '',
  projectType: '',
  project_module: '',
  approver_id: '',
  created_by: '',
})

export function validate(form: ProjectFormData): FormErrors {
  const e: FormErrors = {}
  if (!form.name.trim()) e.name = 'Required'
  if (!form.priority) e.priority = 'Required'
  if (!form.projectType) e.projectType = 'Required'
  if (!form.project_module) e.project_module = 'Required'
  if (form.assignees.length === 0) e.assignees = 'Select at least one member'
  if (!form.approver_id) e.approver_id = 'Required'
  if (!form.startDate) e.startDate = 'Required'
  if (!form.endDate) e.endDate = 'Required'
  if (form.startDate && form.endDate && form.endDate < form.startDate)
    e.endDate = 'Must be after start date'
  return e
}

export function toDatetimeLocal(dateStr?: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  const year = d.getFullYear()
  const month = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  const hours = pad(d.getHours())
  const minutes = pad(d.getMinutes())
  return `${year}-${month}-${day}T${hours}:${minutes}`
}
