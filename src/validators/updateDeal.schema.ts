import { z } from 'zod'

export const updateDealSchema = z.object({
  accountId: z.union([z.string(), z.number()]).optional(),
  accountName: z.string().optional(),
  dealName: z.string().optional(),
  ticketId: z.union([z.string(), z.number()]).optional(),
  ticketNumber: z.union([z.string(), z.number()]).optional(),
  dealType: z.string().optional(),
  loanType: z.string().optional(),
  typeOfLogin: z.string().optional(),
  typeOfCaseLogin: z.string().optional(),
  ticketLogin: z.string().optional(),
  dealStage: z.string().optional(),
  dealStatus: z.string().optional(),
  caseStage: z.string().optional(), // Add this
  caseStatus: z.string().optional(), // Add this
  disbursedAmount: z.union([z.string(), z.number()]).optional(),
  sanctionAmount: z.union([z.string(), z.number()]).optional(),
  approvedAmount: z.union([z.string(), z.number()]).optional(),
  amountRequired: z.union([z.string(), z.number()]).optional(),
  processingFees: z.union([z.string(), z.number()]).optional(),
  mmCharges: z.union([z.string(), z.number()]).optional(),
  insuranceAmount: z.union([z.string(), z.number()]).optional(),
  pfPercentage: z.union([z.string(), z.number()]).optional(),
  rateOfInterest: z.union([z.string(), z.number()]).optional(),
  interestType: z.string().optional(),

  dealCallBackDatetime: z.string().optional(),
  disbursementDate: z.string().optional(),
  lenderLoginDate: z.string().optional(),
  loanStartDate: z.string().optional(),
  loanEndDate: z.string().optional(),
  targetedDisbursementDate: z.string().optional(),
  tenure: z.union([z.string(), z.number()]).optional(),

  lenderCode: z.string().optional(),
  lenderName: z.string().optional(),
  lenderLoginType: z.string().optional(),
  customerRejectionReason: z.string().optional(),
  customerRejectionStatusExplanation: z.string().optional(),
  lenderRejectionReason: z.string().optional(),
  lenderRejectionStatusExplanation: z.string().optional(),
  dealExpectedClosing: z.string().min(1, 'Expected closing date is required'),
  dealStatusClosing: z.string().optional(),

  paymentReceipt: z.string().optional(),
  partnerCode: z.string().optional(),
  potential: z.union([z.string(), z.number()]).optional(),
  product: z.string().optional(),

  createdBy: z.string().optional(),
  createdAt: z.string().optional(),
  modifiedBy: z.string().optional(),
})

export type UpdateDealFormValues = z.infer<typeof updateDealSchema>
