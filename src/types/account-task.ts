export type TaskType = 'Call' | 'Update Record' | 'Email' | 'Move Status';

export type TaskStatus =
  | ''
  | 'Unassigned'
  | 'Assigned'
  | 'Pending'
  | 'In Progress'
  | 'Completed'
  | 'Verified'
  | 'Overdue';

export type CallBackDateStatus =
  | 'Blank'
  | 'Overdue'
  | 'Due Today'
  | 'Due Tomorrow'
  | 'Due This Week'
  | 'Due Next Week'
  | 'Due Dates';

export type TargetAccountStatus =
  | ''
  | 'Yet to be dialed'
  | 'Wrong Number'
  | 'Contact Established'
  | 'Contact Not Established'
  | 'Awareness'
  | 'Attention'
  | 'Assessment'
  | 'Lender Review'
  | 'On Hold'
  | 'Not Interested'
  | 'Location Unserviceable'
  | 'Business Closed'
  | 'N/A';

export interface AccountTask {
  id: string;
  module_name: string; // default 'Account'
  account_id: string;
  account_name?: string;
  account_owner?: string;
  account_owner_id?: string;
  account_status?: string;
  account_stage?: string;
  target_account_status?: string;
  target_call_back_date_time?: string | Date;
  call_back_date_status?: CallBackDateStatus;
  call_back_date_time?: string;
  account_assigned_date_time?: string;
  task_type: TaskType;
  task_description?: string;
  task_assigned_date_time?: string;
  task_due_date_time?: string;
  task_status: TaskStatus;
  assigned_to_id?: string;
  assigned_to_name?: string;
  created_by_id?: string;
  created_by_name?: string;
  modified_by_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAccountTaskPayload {
  module_name?: string;
  account_id: string | number;
  task_type: TaskType;
  task_description?: string;
  task_assigned_date_time?: string;
  task_due_date_time?: string;
  task_status?: TaskStatus;
  assigned_to_id?: string | number;
}

export interface UpdateAccountTaskPayload {
  account_id?: string | number;
  task_type?: TaskType;
  task_description?: string;
  task_assigned_date_time?: string;
  task_due_date_time?: string;
  task_status?: TaskStatus;
  assigned_to_id?: string | number;
}
