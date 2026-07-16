import { ENV } from '@/conf'

export type CibilGender = 'M' | 'F' | 'T'
export type CibilWebhookStatus = 'IN_PROGRESS' | 'SUCCESS' | 'FAILED'

export interface CibilApiResponse<T> {
  message: string
  data: T | null
  responseCode?: string
  responsecode?: string
}

export interface CibilResponse<T> {
  message: string
  data: T
  responseCode?: string
}

export interface GenerateCibilOtpRequest {
  first_name: string
  middle_name: string
  last_name: string
  date_of_birth: string
  gender: CibilGender
  mobile_number: string
  address: string
  state: string
  pincode: string
  identity: string
}

export interface GenerateCibilOtpData {
  otp_flow_id: string
}

export type GenerateCibilOtpResponse = CibilApiResponse<GenerateCibilOtpData>

export interface VerifyCibilOtpRequest {
  otp_flow_id: string
  otp: string
}

export interface VerifyCibilOtpData {
  otp_flow_id: string
}

export type VerifyCibilOtpResponse = CibilApiResponse<VerifyCibilOtpData>

export interface ResendCibilOtpRequest {
  otp_flow_id: string
}

export interface ResendCibilOtpData {
  otp_flow_id: string
}

export type ResendCibilOtpResponse = CibilApiResponse<ResendCibilOtpData>

export interface CibilReportListItem {
  reference_id: string
  cibil_pulled_date: string
}

export type ListCibilReportsResponse = CibilApiResponse<CibilReportListItem[]>

export interface CibilWebhookStatusData {
  webhook_status: CibilWebhookStatus
}

export type CibilWebhookStatusResponse =
  CibilApiResponse<CibilWebhookStatusData>

export interface CibilRetailOverview {
  BureauAnalysis?: unknown
  generalInfo?: unknown
  [key: string]: unknown
}

export interface CibilOverviewReport {
  EquifaxRetail?: CibilRetailOverview
  [key: string]: unknown
}

export interface CibilOverviewData {
  reference_id: string
  cibil_pulled_date: string
  cibil_report?: CibilOverviewReport
}

export type CibilOverviewResponse = CibilApiResponse<CibilOverviewData>

export interface CibilAccountSummaryRetail {
  accountSummary?: unknown
  [key: string]: unknown
}

export interface CibilAccountSummaryReport {
  EquifaxRetail?: CibilAccountSummaryRetail
  [key: string]: unknown
}

export interface CibilAccountSummaryData {
  reference_id: string
  cibil_report?: CibilAccountSummaryReport
}

export type CibilAccountSummaryResponse =
  CibilApiResponse<CibilAccountSummaryData>

export interface CibilPaymentHistoryRetail {
  activeAccountRepaymentTrack?: unknown
  closedAccountRepaymentTrack?: unknown
  [key: string]: unknown
}

export interface CibilPaymentHistoryReport {
  EquifaxRetail?: CibilPaymentHistoryRetail
  [key: string]: unknown
}

export interface CibilPaymentHistoryData {
  reference_id: string
  cibil_report?: CibilPaymentHistoryReport
}

export type CibilPaymentHistoryResponse =
  CibilApiResponse<CibilPaymentHistoryData>

export interface CibilAnalysisRetail {
  ScoremeAnalysis?: unknown
  [key: string]: unknown
}

export interface CibilAnalysisReport {
  EquifaxRetail?: CibilAnalysisRetail
  [key: string]: unknown
}

export interface CibilAnalysisData {
  reference_id: string
  cibil_report?: CibilAnalysisReport
}

export type CibilAnalysisResponse = CibilApiResponse<CibilAnalysisData>

export async function listCibilReports(acc_id: string) {
  const response = await fetch(
    `${ENV.VITE_BACKEND_BASE_URL}/accounts/r1xcrm-list-reports/${acc_id}`,
    { credentials: 'include' },
  )
  if (!response.ok) {
    throw new Error('Failed to fetch date range')
  }
  const data = await response.json()
  return data
}

export async function getCibilOverview(referenceId: string) {
  const response = await fetch(
    `${ENV.VITE_BACKEND_BASE_URL}/accounts/r1xcrm-overview/${encodeURIComponent(referenceId)}`,
    { credentials: 'include' },
  )
  if (!response.ok) {
    throw new Error('Failed to fetch date range')
  }
  const data = await response.json()
  return data
}

export async function getCibilAccountSummary(referenceId: string) {
  const response = await fetch(
    `${ENV.VITE_BACKEND_BASE_URL}/accounts/r1xcrm-account-summary/${encodeURIComponent(referenceId)}`,
    { credentials: 'include' },
  )
  if (!response.ok) {
    throw new Error('Failed to fetch date range')
  }
  const data = await response.json()
  return data
}

export async function getCibilPaymentHistory(referenceId: string) {
  const response = await fetch(
    `${ENV.VITE_BACKEND_BASE_URL}/accounts/r1xcrm-payment-history/${encodeURIComponent(referenceId)}`,
    { credentials: 'include' },
  )
  if (!response.ok) {
    throw new Error('Failed to fetch date range')
  }
  const data = await response.json()
  return data
}

export async function getCibilAnalysis(referenceId: string) {
  const response = await fetch(
    `${ENV.VITE_BACKEND_BASE_URL}/accounts/r1xcrm-analysis/${encodeURIComponent(referenceId)}`,
    { credentials: 'include' },
  )
  if (!response.ok) {
    throw new Error('Failed to fetch date range')
  }
  const data = await response.json()
  return data
}

export async function getCibilWebhookStatus(otpFlowId: string) {
  const response = await fetch(
    `${ENV.VITE_BACKEND_BASE_URL}/accounts/r1xcrm-webhook-status/${encodeURIComponent(otpFlowId)}`,
    { credentials: 'include' },
  )
  if (!response.ok) {
    throw new Error('Failed to fetch date range')
  }
  const data = await response.json()
  return data
}
