import type {
  Priority,
  Project,
  ProjectUser,
  Status,
} from '@/types/project-types'

export const ENV = {
  VITE_BACKEND_BASE_URL: import.meta.env.VITE_BACKEND_BASE_URL,
}

export const USERS: ProjectUser[] = [
  { id: '1', name: 'Anslem Prathap', email: 'anslem@r1xchange.com' },
  { id: '2', name: 'Namrata Srivastava', email: 'namrata@r1xchange.com' },
  { id: '3', name: 'Ravi Kumar', email: 'ravi@r1xchange.com' },
  { id: '4', name: 'Priya Sharma', email: 'priya@r1xchange.com' },
]

export const PRIORITIES: Priority[] = ['Low', 'Medium', 'High', 'Critical']

export const STATUSES: Status[] = [
  'Planning',
  'Active',
  'On Hold',
  'Completed',
  'Cancelled',
  'Pending Approve',
  'Pending Review',
  'Rejected',
]

export const API_TO_STATUS: Record<string, Status> = {
  planning: 'Planning',
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled',
  pending_for_approve: 'Pending Approve',
  pending_for_review: 'Pending Review',
  rejected: 'Rejected',
}

export const PROJECT_TYPES: string[] = [
  'New',
  'Upgradation',
  'Modification',
  'Bug',
]

export const PROJECT_MODULES: string[] = [
  'CRM',
  'Invoice Portal',
  'Underwriting Tool',
]

export const PRIORITY_STYLES: Record<Priority, string> = {
  Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  High: 'bg-orange-50 text-orange-700 border-orange-200',
  Critical: 'bg-red-50 text-red-700 border-red-200',
}

export const STATUS_STYLES: Record<Status, string> = {
  Planning: 'bg-violet-50 text-violet-700 border-violet-200',
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'On Hold': 'bg-amber-50 text-amber-700 border-amber-200',
  Completed: 'bg-sky-50 text-sky-700 border-sky-200',
  Cancelled: 'bg-zinc-100 text-zinc-500 border-zinc-200',
  'Pending Approve': '',
  'Pending Review': '',
  Rejected: '',
}

export const USERS_MAP: Record<string, string> = {
  '3899927000000615348': 'Ashok M',
  '3899927000000964875': 'Suraj Gupta',
  '3899927000000882594': 'Myisa Beiucy',
  '3899927000000201013': 'Anslem Prathap',
  '3899927000005965002': 'Subhasini TS',
  '3899927000000503894': 'Saran D',
  '3899927000000135140': 'Prathamesh Prakash',
}

// Users who always have full approver-level access on every project,
// regardless of who is stored as the project's approver_id.
export const SUPER_APPROVER_IDS: string[] = [
  '3899927000000201013', // Anslem Prathap
  '3899927000005965002', // Subhasini TS
]

// HR Team User ID Registry constants
export const HR_USER_IDS = [
  '3899927000000318361', // Namrata
  '3899927000000221552', // Sarada
  '3899927000000527649', // Ambika
]

// Manager Registry mapped directly from your MANAGER_EXECUTIVES_MAP keys
export const MANAGER_USER_IDS = [
  '3899927000000318361', // Namrata
  '3899927000000319812', // Ashwini R
  '3899927000005114050', // Sutapa Roy
  '3899927000005114004', // Manjunath
  '3899927000000851906', // Prathap
  '3899927000000488938', // Nagaraj
  '3899927000000979220', // Nandini
  '3899927000000350987', // Anushree
]
