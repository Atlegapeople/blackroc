import * as z from "zod";

// Define the payment method options to match what's expected in the Payment interface
const paymentMethodOptions = ['cash', 'credit_card', 'bank_transfer', 'eft', 'other'] as const;

// Create the schema for payment form validation
export const paymentFormSchema = z.object({
  invoice_id: z.string().uuid(),
  amount: z.number().positive(),
  method: z.enum(['cash', 'credit_card', 'eft', 'other']), // UI-friendly options
  reference: z.string().optional(),
  notes: z.string().optional(),
}); 