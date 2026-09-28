export type Lead = {
  id: number
  created_at: string
  updated_at: string

  full_name: string
  email: string
  phone_number: string
  pan: string
  gstin: string

  company?: string | null
  annual_revenue?: number | null
  business_status: 'New' | 'Contacted' | 'Qualified' | 'Lost' | 'Converted'

  address?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  industry?: string | null
  description?: string | null
  distributor_code?: string | null
  designation?: string | null
}

export type Deal = {
  deal_name: string
  deal_status: string
  deal_stage: string
  loan_type: string
  approved_amount: string
  deal_call_back_datetime: string
  lender_code: string
  product: string
  updated_at: string
  type_of_login: string
  amount_required: string
  disbursement_date: string
  lender_name: string
  assignee_id: string
  deal_owner_id: string
  type_of_case_login: string
  processing_fees: string
  lender_login_date: string
  customer_rejection_reason: string
  created_by: string
  ticket_login: string
  mm_charges: string
  loan_start_date: string
  customer_rejection_status_explanation: string
  modified_by: string
  ticket_id: string
  case_stage: string
  insurance_amount: string
  loan_end_date: string
  lender_rejection_reason: string
  account_id: string
  id: string
  case_status: string
  pf_percentage: string
  lender_rejection_status_explanation: string
  payment_receipt: string
  account_name: string
  ticket_number: string
  disbursed_amount: string
  rate_of_interest: string
  targeted_disbursement_date: string
  sanction_letter: string
  created_at: string
  deal_type: string
  sanction_amount: string
  interest_type: string
  tenure: string
  potential: string
  partner_code: string
  partner_name?: string
  deal_approval?: string
  deal_description?: string
  type_of_loan?: string
  deal_expected_closing?: string
  deal_status_closing?: string
  modified_time?: string
  deal_owner?: string
}

export type UpdateAccountFormValues = {
  assignmentDate?: Date
  source: string
  distributorCode: string
  wabaInterested: boolean
  callBackDate?: Date
  accountStatus: string
  accountStage: string
  businessStatus: string

  firstName: string
  residentialOwnership: string
  residentialLocation: string
  noOfYears: string
  createdBy: string

  lastName: string
  mothersName: string
  preferredLanguage: string
  premiseLocation: string
  premiseOwnership: string

  street: string
  state: string
  code: string
  city: string
  country: string

  ref1Name: string
  ref1Phone: string
  ref1Email: string
  ref2Name: string
  ref2Phone: string
  ref2Email: string

  businessRegistrationType?: string
  parentAccount?: string
  businessVintage?: number
  typeOfBusiness?: string
  suppliers?: string
  industry?: string
  description?: string
}

export type Contact = {
  id: string
  first_name: string | null
  last_name: string | null
  designation: string | null
  email: string | null
  mobile: string | null
  phone: string | null
  city: string | null
  state: string | null
  created_time: string
  modified_time: string
}
