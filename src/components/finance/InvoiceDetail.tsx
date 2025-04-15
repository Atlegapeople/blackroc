import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  CreditCard,
  Printer,
  Edit,
  Trash2,
  Clock,
  Calendar,
  CreditCard as CreditCardIcon,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ReceiptText,
  Building,
  Mail,
  Phone,
  User,
  Package
} from 'lucide-react';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { useToast } from '../ui/use-toast';

import { getInvoiceById, getPaymentsForInvoice, deleteInvoice } from '../../lib/services/financeService';
import { Invoice, Payment } from '../../lib/interfaces/finance';
import { formatCurrency } from '../../lib/utils';
import { format, parseISO, addDays, isAfter } from 'date-fns';

// Helper function to ensure outstanding amount is never negative
const formatOutstandingAmount = (amount: number) => {
  // Ensure the outstanding amount is never negative
  const displayAmount = Math.max(0, amount);
  return formatCurrency(displayAmount);
};

export default function InvoiceDetail() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (invoiceId) {
      fetchInvoiceData(invoiceId);
    }
  }, [invoiceId]);

  const fetchInvoiceData = async (id: string) => {
    setIsLoading(true);
    try {
      // Fetch invoice details
      const invoiceData = await getInvoiceById(id);
      if (!invoiceData) {
        toast({
          title: 'Error',
          description: 'Invoice not found',
          variant: 'destructive',
        });
        navigate('/finance/invoices');
        return;
      }
      setInvoice(invoiceData);

      // Fetch payments for this invoice
      const paymentsData = await getPaymentsForInvoice(id);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error fetching invoice data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load invoice details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!invoiceId) return;
    
    try {
      await deleteInvoice(invoiceId);
      toast({
        title: 'Success',
        description: 'Invoice deleted successfully',
      });
      navigate('/finance/invoices');
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete invoice',
        variant: 'destructive',
      });
    }
    setDeleteDialogOpen(false);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'partial':
        return 'warning';
      case 'unpaid':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getInvoiceStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'sent':
        return 'info';
      case 'draft':
        return 'outline';
      case 'overdue':
        return 'destructive';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'partial':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'unpaid':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getDaysOverdue = (dueDate: string) => {
    const today = new Date();
    const due = parseISO(dueDate);
    
    if (isAfter(today, due)) {
      const diffTime = Math.abs(today.getTime() - due.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    
    return 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-2">Invoice Not Found</h2>
        <p className="text-muted-foreground mb-4">The invoice you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => navigate('/finance/invoices')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Invoices
        </Button>
      </div>
    );
  }

  const isOverdue = invoice.payment_status !== 'paid' && 
    getDaysOverdue(invoice.due_date) > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate('/finance/invoices')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Invoice #{invoice.invoice_number}</h1>
          <Badge variant={getStatusBadgeVariant(invoice.payment_status) as any} className="ml-2">
            {invoice.payment_status.charAt(0).toUpperCase() + invoice.payment_status.slice(1)}
          </Badge>
          <Badge variant={getInvoiceStatusBadgeVariant(invoice.invoice_status) as any} className="ml-2">
            {invoice.invoice_status.charAt(0).toUpperCase() + invoice.invoice_status.slice(1)}
          </Badge>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate(`/finance/invoices/${invoiceId}/pdf`)}>
            <FileText className="h-4 w-4 mr-2" />
            View PDF
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          {invoice.payment_status !== 'paid' && (
            <Button onClick={() => navigate(`/finance/invoices/${invoiceId}/payment/new`)}>
              <CreditCard className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate(`/finance/invoices/${invoiceId}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Invoice Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Issue Date:</span>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(parseISO(invoice.invoice_date), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Due Date:</span>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(parseISO(invoice.due_date), 'MMM dd, yyyy')}</span>
                  </div>
                </div>
                {isOverdue && (
                  <div className="flex justify-between items-center text-destructive">
                    <span>Overdue:</span>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{getDaysOverdue(invoice.due_date)} days</span>
                    </div>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between items-center font-medium">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(invoice.total_amount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Paid:</span>
                  <span className="text-green-600">{formatCurrency(invoice.paid_amount)}</span>
                </div>
                <div className="flex justify-between items-center font-medium">
                  <span>Outstanding:</span>
                  <span className={invoice.outstanding_amount > 0 ? 'text-destructive' : ''}>
                    {formatOutstandingAmount(invoice.outstanding_amount)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Payment Status:</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(invoice.payment_status)}
                    <span>{invoice.payment_status.charAt(0).toUpperCase() + invoice.payment_status.slice(1)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Customer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">Customer Name</p>
                    <Link to={`/customers/123`} className="text-sm text-primary hover:underline">
                      View Customer Profile
                    </Link>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>Company Name</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>customer@example.com</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>+27 123 456 7890</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Order Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {invoice.order_id ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Package className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Order #{invoice.order_id.substring(0, 8)}</p>
                        <Link to={`/orders/${invoice.order_id}`} className="text-sm text-primary hover:underline">
                          View Order Details
                        </Link>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Order Date:</span>
                        <span>Jun 15, 2023</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Items:</span>
                        <span>5 products</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Delivery Status:</span>
                        <Badge>Delivered</Badge>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-[120px] text-center">
                    <div>
                      <p className="text-muted-foreground">No order linked to this invoice</p>
                      <p className="text-sm text-muted-foreground">This may be a standalone invoice</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Invoice Items</CardTitle>
              <CardDescription>Products and services included in this invoice</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Description</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Quantity</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Unit Price</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {/* Mock data - would be replaced with actual invoice items */}
                    <tr>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">Cement - 42.5N (50kg)</p>
                          <p className="text-sm text-muted-foreground">High-strength Portland cement</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">10</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(95.00)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(950.00)}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">Building Sand (1 cubic meter)</p>
                          <p className="text-sm text-muted-foreground">Fine sand for plastering</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">2</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(420.00)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(840.00)}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">Delivery Fee</p>
                          <p className="text-sm text-muted-foreground">Delivery to Sandton, 25km</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">1</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(350.00)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(350.00)}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2} className="px-4 py-3"></td>
                      <td className="px-4 py-3 text-right font-medium">Subtotal</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(2140.00)}</td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="px-4 py-3"></td>
                      <td className="px-4 py-3 text-right font-medium">VAT (15%)</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(321.00)}</td>
                    </tr>
                    <tr className="bg-muted/50">
                      <td colSpan={2} className="px-4 py-3"></td>
                      <td className="px-4 py-3 text-right font-bold">Total</td>
                      <td className="px-4 py-3 text-right font-bold">{formatCurrency(2461.00)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-line">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>All payments recorded for this invoice</CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-8">
                  <ReceiptText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Payments Yet</h3>
                  <p className="text-muted-foreground mb-4">No payments have been recorded for this invoice.</p>
                  {invoice.payment_status !== 'paid' && (
                    <Button onClick={() => navigate(`/finance/invoices/${invoiceId}/payment/new`)}>
                      <CreditCardIcon className="h-4 w-4 mr-2" />
                      Record a Payment
                    </Button>
                  )}
                </div>
              ) : (
                <div className="rounded-md border">
                  <table className="min-w-full divide-y divide-border">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Payment #</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Method</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Reference</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Amount</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {payments.map(payment => (
                        <tr key={payment.id}>
                          <td className="px-4 py-3 font-medium">{payment.payment_number}</td>
                          <td className="px-4 py-3">{format(parseISO(payment.payment_date), 'MMM dd, yyyy')}</td>
                          <td className="px-4 py-3 capitalize">{payment.payment_method.replace('_', ' ')}</td>
                          <td className="px-4 py-3">{payment.reference_number || '-'}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(payment.amount)}</td>
                          <td className="px-4 py-3 text-right">
                            <Badge 
                              variant={payment.status === 'completed' ? 'success' : (
                                payment.status === 'pending' ? 'warning' : 'destructive'
                              ) as any}
                            >
                              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/50">
                        <td colSpan={4} className="px-4 py-3 text-right font-bold">Total Paid</td>
                        <td className="px-4 py-3 text-right font-bold">{formatCurrency(invoice.paid_amount)}</td>
                        <td></td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-right font-medium">Outstanding</td>
                        <td className="px-4 py-3 text-right font-medium text-destructive">
                          {formatOutstandingAmount(invoice.outstanding_amount)}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {invoice.payment_status !== 'paid' && (
            <div className="flex justify-end">
              <Button onClick={() => navigate(`/finance/invoices/${invoiceId}/payment/new`)}>
                <CreditCardIcon className="h-4 w-4 mr-2" />
                Record a New Payment
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete Invoice #{invoice.invoice_number}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteInvoice}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 