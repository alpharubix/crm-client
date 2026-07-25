import { z } from 'zod'

export const createTicketSchema = z.object({
  accountId: z.string().min(1, 'Account ID is required'),
  lenderName: z.string().min(1, 'Lender name is required'),
  typeOfLoan: z.string().min(1, 'Type of loan is required'),
  ticketStatus: z.string().min(1, 'Ticket status is required'),
  ticketStage: z.string().min(1, 'Ticket stage is required'),
  lenderLoginType: z.string().min(1, 'Lender login type is required'),
  lenderLoginDate: z.string().min(1, 'Lender login date is required'),
  ticketLogin: z.string().min(1, 'Ticket login is required'),
  potential: z
    .string()
    .optional()
    .refine((v) => !v || parseFloat(v) <= 9_999_999_999_999, {
      message: 'Value exceeds maximum allowed amount',
    }),
  approvedAmount: z
    .string()
    .optional()
    .refine((v) => !v || parseFloat(v) <= 9_999_999_999_999, {
      message: 'Value exceeds maximum allowed amount',
    }),
  sanctionAmount: z
    .string()
    .optional()
    .refine((v) => !v || parseFloat(v) <= 9_999_999_999_999, {
      message: 'Value exceeds maximum allowed amount',
    }),
  disbursedAmount: z
    .string()
    .optional()
    .refine((v) => !v || parseFloat(v) <= 9_999_999_999_999, {
      message: 'Value exceeds maximum allowed amount',
    }),
  processingFees: z
    .string()
    .optional()
    .refine((v) => !v || parseFloat(v) <= 9_999_999_999_999, {
      message: 'Value exceeds maximum allowed amount',
    }),
  pfPercentage: z
    .string()
    .optional()
    .refine((v) => !v || parseFloat(v) <= 100, {
      message: 'PF Percentage cannot exceed 100%',
    }),
  insuranceAmount: z
    .string()
    .optional()
    .refine((v) => !v || parseFloat(v) <= 9_999_999_999_999, {
      message: 'Value exceeds maximum allowed amount',
    }),
  rateOfInterest: z
    .string()
    .optional()
    .refine((v) => !v || parseFloat(v) <= 999.99, {
      message: 'Rate of Interest must be less than 1000',
    }),
  interestType: z.string().optional(),
  tenure: z.string().optional(),
  loanStartDate: z.string().optional(),
  loanEndDate: z.string().optional(),
  targetedDisbursementDate: z.string().optional(),
  disbursementDate: z.string().optional(),
  loanAccountStatus: z.string().optional(),
  lenderRejectionReason: z.string().optional(),
  lenderRejectionStatusExplanation: z.string().optional(),
  partnerCode: z.string().optional(),
  customerRejectionReason: z.string().optional(),
  customerRejectionStatusExplanation: z.string().optional(),
  partnerName: z.string().min(1, 'Partner name is required'),
})

export type CreateTicketFormValues = z.infer<typeof createTicketSchema>
