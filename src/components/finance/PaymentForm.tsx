import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { 
  CreditCard, 
  Calendar, 
  ArrowLeft, 
  Save
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '../ui/form';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '../ui/popover';
import { useToast } from '../ui/use-toast';
import { formatCurrency } from '../../lib/utils';
import { getInvoiceById, recordPayment, syncOrderInvoiceStatuses } from '../../lib/services/financeService';
import { Invoice } from '../../lib/interfaces/finance';
import { cn } from '../../lib/utils';
import { CalendarIcon } from 'lucide-react';
import { Calendar as CalendarComponent } from '../ui/calendar';

const formSchema = z.object({
  amount: z.coerce.number().positive('Amount must be a positive number'),
  payment_method: z.enum(['cash', 'credit_card', 'bank_transfer', 'eft', 'other'], {
    required_error: 'Please select a payment method'
  }),
  payment_date: z.date({
    required_error: 'Payment date is required'
  }),
  reference_number: z.string().optional(),
  notes: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

// Helper function to ensure outstanding amount is never negative
const formatOutstandingAmount = (amount: number) => {
  // Ensure the outstanding amount is never negative
  const displayAmount = Math.max(0, amount);
  return formatCurrency(displayAmount);
};

export default function PaymentForm() {
  const navigate = useNavigate();
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      payment_method: 'bank_transfer',
      payment_date: new Date(),
      reference_number: '',
      notes: ''
    }
  });
  
  useEffect(() => {
    const fetchInvoice = async () => {
      if (!invoiceId) return;
      
      try {
        setIsLoading(true);
        const invoiceData = await getInvoiceById(invoiceId);
        
        if (invoiceData) {
          setInvoice(invoiceData);
          form.setValue('amount', invoiceData.outstanding_amount);
        }
      } catch (error) {
        console.error('Error fetching invoice:', error);
        toast({
          title: 'Error',
          description: 'Failed to load invoice details',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInvoice();
  }, [invoiceId, form]);
  
  const onSubmit = async (data: FormValues) => {
    if (!invoiceId || !invoice) return;
    
    try {
      setIsLoading(true);
      
      // Format payment data
      const paymentData = {
        invoice_id: invoiceId,
        customer_id: invoice.customer_id,
        payment_number: `PAY-${Date.now().toString().slice(-8)}`,
        payment_date: data.payment_date.toISOString(),
        amount: data.amount,
        payment_method: data.payment_method,
        reference_number: data.reference_number || '',
        status: 'completed' as 'completed' | 'pending' | 'failed' | 'refunded',
        notes: data.notes || ''
      };
      
      // Record payment
      const paymentId = await recordPayment(paymentData);
      
      if (paymentId) {
        toast({
          title: 'Success',
          description: 'Payment recorded successfully'
        });
        
        // Sync order invoice statuses
        await syncOrderInvoiceStatuses();
        
        // Navigate back to invoice
        navigate(`/finance/invoices/${invoiceId}`);
      } else {
        throw new Error('Failed to record payment');
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to record payment. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate(`/finance/invoices/${invoiceId}`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Record Payment</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>
                Record a new payment for Invoice #{invoice?.invoice_number || ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-muted-foreground">R</span>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="pl-8"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Outstanding: {invoice ? formatOutstandingAmount(invoice.outstanding_amount) : 'Loading...'}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="payment_method"
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
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                              <SelectItem value="eft">EFT</SelectItem>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="credit_card">Credit Card</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="payment_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Payment Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PP")
                                  ) : (
                                    <span>Select date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="reference_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reference Number</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Transaction ID, Check #" {...field} />
                          </FormControl>
                          <FormDescription>
                            Optional reference for this payment
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any additional information about this payment"
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/finance/invoices/${invoiceId}`)}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={isLoading || !invoice}
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                          Processing...
                        </div>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Payment
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {invoice ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Invoice #:</span>
                    <span className="font-medium">{invoice.invoice_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Issue Date:</span>
                    <span>{format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Due Date:</span>
                    <span>{format(new Date(invoice.due_date), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Amount:</span>
                      <span className="font-medium">{formatCurrency(invoice.total_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Already Paid:</span>
                      <span className="text-green-600">{formatCurrency(invoice.paid_amount)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Outstanding:</span>
                      <span className="text-destructive">{formatOutstandingAmount(invoice.outstanding_amount)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-4 text-center text-muted-foreground">
                  Loading invoice details...
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Payment Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex gap-2">
                <div className="bg-primary/10 p-2 rounded-full h-8 w-8 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Record all transactions</p>
                  <p className="text-muted-foreground">Even small partial payments help track customer history</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <div className="bg-primary/10 p-2 rounded-full h-8 w-8 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Use actual payment date</p>
                  <p className="text-muted-foreground">This ensures your financial reports are accurate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 