import type { TaskType, TaskStatus, CallBackDateStatus } from './account-task'

export type { TaskType, TaskStatus, CallBackDateStatus }

export interface DealTask {
  id: string
  module_name: string // default 'Deal'
  deal_id: string
  deal_name?: string
  account_id?: string
  account_name?: string
  account_owner?: string
  account_owner_id?: string
  deal_owner?: string
  deal_owner_id?: string
  deal_status?: string
  deal_stage?: string
  loan_type?: string
  lender_name?: string
  target_deal_status?: string
  call_back_date_status?: CallBackDateStatus
  call_back_date_time?: string
  deal_assigned_date_time?: string
  task_type: TaskType
  task_description?: string
  task_assigned_date_time?: string
  task_due_date_time?: string
  task_status: TaskStatus
  completed_at?: string
  assigned_to_id?: string
  assigned_to_name?: string
  created_by_id?: string
  created_by_name?: string
  modified_by_id?: string
  created_at: string
  updated_at: string
}

export interface CreateDealTaskPayload {
  module_name?: string
  deal_id: string | number
  task_type: TaskType
  task_description?: string
  task_assigned_date_time?: string
  task_due_date_time?: string
  task_status?: TaskStatus
  assigned_to_id?: string | number
  target_deal_status?: string
}

export interface UpdateDealTaskPayload {
  deal_id?: string | number
  task_type?: TaskType
  task_description?: string
  task_assigned_date_time?: string
  task_due_date_time?: string
  task_status?: TaskStatus
  assigned_to_id?: string | number
  target_deal_status?: string
  completed_at?: string
}
