export type TaskType = 'Call' | 'Update Record' | 'Email' | 'Move Status'

export type TaskStatus =
  | 'Unassigned'
  | 'Assigned'
  | 'Pending'
  | 'In Progress'
  | 'Completed'
  | 'Verified'
  | 'Overdue'

export type CallBackDateStatus =
  | 'Blank'
  | 'Overdue'
  | 'Due Today'
  | 'Due Tomorrow'
  | 'Due This Week'
  | 'Due Next Week'

export interface AccountTask {
  id: string | number
  module_name: string // default 'Account'
  account_id: string | number
  account_name?: string
  account_owner?: string
  account_owner_id?: string | number
  account_status?: string
  account_stage?: string
  call_back_date_status?: CallBackDateStatus
  task_type: TaskType
  task_description?: string
  task_assigned_date_time?: string
  task_due_date_time?: string
  task_status: TaskStatus
  assigned_to_id?: string | number
  assigned_to_name?: string
  created_by_id?: string | number
  modified_by_id?: string | number
  created_at: string
  updated_at: string
}

export interface CreateAccountTaskPayload {
  module_name?: string
  account_id: string | number
  task_type: TaskType
  task_description?: string
  task_assigned_date_time?: string
  task_due_date_time?: string
  task_status?: TaskStatus
  assigned_to_id?: string | number
}

export interface UpdateAccountTaskPayload {
  account_id?: string | number
  task_type?: TaskType
  task_description?: string
  task_assigned_date_time?: string
  task_due_date_time?: string
  task_status?: TaskStatus
  assigned_to_id?: string | number
}
