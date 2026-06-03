import { z } from 'zod';

export const updateTicketSchema = z.object({
  lenderName: z.string().optional(),
  typeOfLoan: z.string().optional(),
  ticketStatus: z.string().optional(),
  ticketStage: z.string().optional(),
  lenderLoginType: z.string().optional(),
  lenderLoginDate: z.string().optional(),
  ticketLogin: z.string().optional(),
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
});

export type UpdateTicketFormValues = z.infer<typeof updateTicketSchema>;
