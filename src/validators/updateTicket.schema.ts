import { z } from 'zod'

export const updateTicketSchema = z.object({
  // Required fields (NOT NULL / critical business fields)
  lenderName: z.string().min(1, 'Lender name is required'),
  loanType: z.string().min(1, 'Type of loan is required'),
  ticketStatus: z.string().min(1, 'Ticket status is required'),
  ticketStage: z.string().min(1, 'Ticket stage is required'),
  lenderLoginType: z.string().min(1, 'Lender login type is required'),
  lenderLoginDate: z.string().min(1, 'Lender login date is required'),
  ticketLogin: z.string().min(1, 'Ticket login is required'),

  // Optional fields
  potential: z.string().optional(),
  approvedAmount: z.string().optional(),
  sanctionAmount: z.string().optional(),
  disbursedAmount: z.string().optional(),
  processingFees: z.string().optional(),
  pfPercentage: z.string().optional(),
  insuranceAmount: z.string().optional(),
  rateOfInterest: z.string().optional(),
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
})

export type UpdateTicketFormValues = z.infer<typeof updateTicketSchema>
