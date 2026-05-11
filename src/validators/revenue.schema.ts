import { z } from 'zod'

export const revenueSchema = z.object({
  dealId: z.union([z.string(), z.number()]),
  accountName: z.string().min(1, 'Account name is required'),
  lenderName: z.string().min(1, 'Lender name is required'),
  referenceNumber: z.string().min(1, 'Reference number is required'),
  incomeBookingDate: z.string().min(1, 'Income booking date is required'),
  typeOfRevenue: z.string().min(1, 'Type of revenue is required'),
  amount: z.coerce.number().min(1, 'Amount must be positive'),
  gstAmount: z.coerce.number().min(1, 'GST amount must be positive'),
})

export type RevenueFormValues = z.infer<typeof revenueSchema>