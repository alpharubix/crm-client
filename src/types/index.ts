export type Lead = {
  // --- System Fields ---
  id: number
  created_at: string // ISO String from Backend
  updated_at: string

  // --- Core Identity (The Big 5) ---
  full_name: string
  email: string
  phone_number: string
  pan: string
  gstin: string

  // --- Business Details (Nullable/Optional) ---
  company?: string | null
  annual_revenue?: number | null // Backend sends Numeric/Decimal
  business_status: 'New' | 'Contacted' | 'Qualified' | 'Lost' | 'Converted'

  // --- Address & Extra ---
  address?: string | null
  city?: string | null
  country?: string | null
  industry?: string | null
  description?: string | null
  distributor_code?: string | null
}

export type Deal = {
  id: number
  account_name: string
  stage: string
  amount: string
  lender: string
  closing_date: string
  deal_owner: string
  last_activity_time: string
}
