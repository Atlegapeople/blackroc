import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PaymentFormData } from '../../lib/interfaces/finance';
import { recordPayment } from '../../lib/services/financeService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { useToast } from '../ui/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { formatCurrency } from '../../lib/utils';

const paymentFormSchema = z.object({
  invoice_id: z.string().uuid(),
  amount: z.number().positive(),
  method: z.enum(['eft', 'cash', 'card', 'other']),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

interface PaymentFormProps {
  invoiceId: string;
  invoiceTotal: number;
  remainingAmount: number;
  onPaymentComplete: () => void;
  onCancel: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  invoiceId,
  invoiceTotal,
  remainingAmount,
  onPaymentComplete,
  onCancel,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      invoice_id: invoiceId,
      amount: remainingAmount,
      method: 'eft',
      reference: '',
      notes: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof paymentFormSchema>) => {
    try {
      setIsSubmitting(true);
      
      const paymentData: PaymentFormData = {
        invoice_id: data.invoice_id,
        amount: data.amount,
        method: data.method,
        reference: data.reference,
        notes: data.notes,
      };
      
      const payment = await recordPayment(paymentData);
      
      if (payment) {
        toast({
          title: 'Payment recorded successfully',
          description: `${formatCurrency(data.amount)} has been recorded for the invoice.`,
          className: 'bg-green-50 border-green-200 text-green-800',
        });
        onPaymentComplete();
      } else {
        toast({
          title: 'Payment failed',
          description: 'There was an error recording the payment.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast({
        title: 'Payment failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="mb-4">
          <h3 className="text-lg font-medium">Record Payment</h3>
          <p className="text-sm text-gray-500">
            Invoice Total: {formatCurrency(invoiceTotal)}
            {remainingAmount < invoiceTotal && (
              <span> | Remaining: {formatCurrency(remainingAmount)}</span>
            )}
          </p>
        </div>

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={remainingAmount}
                  placeholder="0.00"
                  {...field}
                  onChange={e => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payment Method</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="eft">EFT / Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="reference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reference Number</FormLabel>
              <FormControl>
                <Input
                  placeholder="Payment reference or transaction ID"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional information about this payment"
                  className="resize-none"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-buff-500 hover:bg-buff-600 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Processing...
              </>
            ) : (
              'Record Payment'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PaymentForm; 