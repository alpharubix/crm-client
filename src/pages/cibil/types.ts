import type {
  CibilGender as ApiCibilGender,
  CibilReportListItem as ApiCibilReportListItem,
  CibilWebhookStatus as ApiCibilWebhookStatus,
  GenerateCibilOtpRequest,
} from '@/pages/cibil/api'

export type CibilStep = 1 | 2 | 3 | 4

export type CibilGender = ApiCibilGender
export type CibilIdentityPayload = GenerateCibilOtpRequest
export type CibilReportListItem = ApiCibilReportListItem
export type CibilWebhookStatus = ApiCibilWebhookStatus

export type CibilGenerateOtpField =
  | keyof GenerateCibilOtpRequest
  | 'identityType'

export type CibilFieldErrors = Partial<Record<CibilGenerateOtpField, string>>

export interface CibilReportStatus {
  has_received: boolean
  webhook_status: CibilWebhookStatus
  reference_id?: string
  message?: string
}
