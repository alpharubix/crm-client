export type Priority = 'Low' | 'Medium' | 'High' | 'Critical'

export type Status =
  | 'Planning'
  | 'Active'
  | 'On Hold'
  | 'Completed'
  | 'Cancelled'
  | 'Pending Approve'
  | 'Pending Review'
  | 'Rejected'

export type ProjectType = 'New' | 'Upgradation' | 'Modification' | 'Bug'

export type ProjectModule = 'CRM' | 'Invoice Portal' | 'Underwriting Tool'

export interface ProjectUser {
  id: string
  name: string
  email: string
}

export interface ProjectFormData {
  name: string
  description: string
  priority: Priority | ''
  status: Status | ''
  projectType: ProjectType | ''
  project_module: ProjectModule | ''
  approver_id: string
  assignees: ProjectUser[]
  startDate: string
  endDate: string
  created_by: string
}

export interface Project extends ProjectFormData {
  id: string
  createdAt: string
  project_type?: string
  actioner_ids?: string[]
}

export type FormErrors = Partial<Record<keyof ProjectFormData, string>>
