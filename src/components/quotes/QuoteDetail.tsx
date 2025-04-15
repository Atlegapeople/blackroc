import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Home,
  ChevronRight,
  FileText,
  Edit,
  ArrowLeft,
  Clock,
  CalendarDays,
  MapPin,
  Truck,
  Package,
  Clipboard,
  ShoppingCart,
  ShoppingBag,
  CheckCircle,
  XCircle,
  FileEdit
} from 'lucide-react';
import { Button } from '../ui/button';
import { formatCurrency } from '../../lib/utils';
import { Separator } from '../ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { useToast } from '../ui/use-toast';
import { useConvertQuoteToOrder } from './utils/convertQuoteToOrder';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface QuoteItem {
  id: string;
  quote_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  product: {
    name: string;
    unit: string;
  };
}

interface QuoteService {
  id: string;
  quote_id: string;
  service_id: string;
  rate: number;
  service: {
    name: string;
  };
}

// Status badge component with appropriate colors
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = () => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-500 text-white border-green-600';
      case 'pending':
        return 'bg-amber-500 text-white border-amber-600';
      case 'draft':
        return 'bg-gray-500 text-white border-gray-600';
      case 'rejected':
        return 'bg-red-500 text-white border-red-600';
      default:
        return 'bg-gray-500 text-white border-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <FileText className="w-3.5 h-3.5 mr-1.5 font-bold" />;
      case 'pending':
        return <Clock className="w-3.5 h-3.5 mr-1.5 font-bold" />;
      case 'draft':
        return <FileText className="w-3.5 h-3.5 mr-1.5 font-bold" />;
      case 'rejected':
        return <FileText className="w-3.5 h-3.5 mr-1.5 font-bold" />;
      default:
        return <FileText className="w-3.5 h-3.5 mr-1.5 font-bold" />;
    }
  };

  return (
    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center w-fit border ${getStatusColor()}`}>
      {getStatusIcon()}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default function QuoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quote, setQuote] = useState<any | null>(null);
  const [customer, setCustomer] = useState<any | null>(null);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [services, setServices] = useState<QuoteService[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [orderNotes, setOrderNotes] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  
  const convertQuoteToOrder = useConvertQuoteToOrder();

  useEffect(() => {
    if (id) {
      fetchQuoteData(id);
    }
  }, [id]);

  const fetchQuoteData = async (quoteId: string) => {
    setLoading(true);
    try {
      // Fetch the quote
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single();

      if (quoteError) throw quoteError;
      setQuote(quoteData);

      // Fetch the customer
      if (quoteData.customer_id) {
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('id', quoteData.customer_id)
          .single();

        if (customerError) throw customerError;
        setCustomer(customerData);
      }

      // Fetch quote items with product details
      const { data: itemsData, error: itemsError } = await supabase
        .from('quote_items')
        .select(`
          *,
          product:product_id (
            name,
            unit
          )
        `)
        .eq('quote_id', quoteId);

      if (itemsError) throw itemsError;
      setItems(itemsData || []);

      // Fetch quote services with service details
      const { data: servicesData, error: servicesError } = await supabase
        .from('quote_services')
        .select(`
          *,
          service:service_id (
            name
          )
        `)
        .eq('quote_id', quoteId);

      if (servicesError) throw servicesError;
      setServices(servicesData || []);

    } catch (err) {
      console.error('Error fetching quote data:', err);
      toast({
        title: "Failed to load quote",
        description: "There was an error loading the quote details.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const updateQuoteStatus = async (newStatus: string, reason?: string) => {
    if (!id) return;
    
    setUpdatingStatus(true);
    try {
      const updateData: { status: string, rejection_reason?: string } = { 
        status: newStatus 
      };
      
      // If rejecting, add reason if provided
      if (newStatus === 'rejected' && reason) {
        updateData.rejection_reason = reason;
      }
      
      const { error } = await supabase
        .from('quotes')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      
      // Update the local state
      setQuote(prev => ({ ...prev, status: newStatus, rejection_reason: reason || prev.rejection_reason }));
      
      // Show success toast
      toast({
        title: "Quote status updated",
        description: `Quote is now ${newStatus}`,
        className: "bg-green-50 border-green-200 text-green-800",
      });
      
      // Close dialogs if open
      if (showRejectDialog) setShowRejectDialog(false);
      
    } catch (error) {
      console.error('Error updating quote status:', error);
      toast({
        title: "Failed to update status",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleConvertToOrder = async () => {
    if (!id) return;
    
    setIsConverting(true);
    try {
      const orderId = await convertQuoteToOrder(id, orderNotes || undefined);
      setShowOrderDialog(false);
      
      // Navigate to the order detail page
      navigate(`/dashboard/orders/${orderId}`);
    } catch (error) {
      // Error is already handled by the hook
      console.error('Error in component during convert:', error);
    } finally {
      setIsConverting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-buff-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500">Loading quote details...</p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Quote Not Found</h2>
          <p className="text-gray-600 mb-6">The quote you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={() => navigate('/dashboard/quotes')} className="bg-buff-500 hover:bg-buff-600">
            <ArrowLeft className="w-4 h-4 mr-2" /> Return to Quotes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-jet-600">Quote Details</h1>
            <nav className="flex items-center space-x-1 text-sm text-gray-500 mt-1">
              <Link to="/dashboard" className="hover:text-jet-600 flex items-center">
                <Home className="w-3.5 h-3.5 mr-1" />
                Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link to="/dashboard/quotes" className="hover:text-jet-600 flex items-center">
                <FileText className="w-3.5 h-3.5 mr-1" />
                Quotes
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-jet-600">Quote #{id?.substring(0, 8)}</span>
            </nav>
          </div>
          
          <div className="flex space-x-3">
            <Button 
              variant="outline"
              onClick={() => navigate('/dashboard/quotes')}
              className="flex items-center border-gray-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2 stroke-[2px]" /> Back to Quotes
            </Button>
            
            {/* Status actions based on current status */}
            {quote.status === 'draft' && (
              <Button
                onClick={() => updateQuoteStatus('pending')}
                disabled={updatingStatus}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                {updatingStatus ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : (
                  <Clock className="h-4 w-4 mr-2 stroke-[2px]" />
                )}
                Submit for Approval
              </Button>
            )}
            
            {quote.status === 'pending' && (
              <div className="flex space-x-2">
                <Button
                  onClick={() => updateQuoteStatus('approved')}
                  disabled={updatingStatus}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {updatingStatus ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2 stroke-[2px]" />
                  )}
                  Approve
                </Button>
                
                <Button
                  onClick={() => setShowRejectDialog(true)}
                  disabled={updatingStatus}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <XCircle className="h-4 w-4 mr-2 stroke-[2px]" /> 
                  Reject
                </Button>
              </div>
            )}
            
            {quote.status === 'approved' && (
              <Button 
                onClick={() => setShowOrderDialog(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <ShoppingBag className="h-4 w-4 mr-2 stroke-[2px]" /> Convert to Order
              </Button>
            )}
            
            {/* Edit button for draft/rejected quotes */}
            {(quote.status === 'draft' || quote.status === 'rejected') && (
              <Button 
                onClick={() => navigate(`/dashboard/quotes/${id}/edit`)}
                className="bg-buff-500 hover:bg-buff-600 text-white"
              >
                <Edit className="h-4 w-4 mr-2 stroke-[2px]" /> Edit Quote
              </Button>
            )}
            
            {/* Status Change Dropdown for non-draft quotes */}
            {quote.status !== 'draft' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center">
                    <FileEdit className="h-4 w-4 mr-2 stroke-[2px]" /> Change Status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {quote.status !== 'draft' && (
                    <DropdownMenuItem 
                      onClick={() => updateQuoteStatus('draft')}
                      disabled={updatingStatus}
                    >
                      <FileText className="h-4 w-4 mr-2 stroke-[2px] text-gray-600" /> Return to Draft
                    </DropdownMenuItem>
                  )}
                  {quote.status !== 'pending' && (
                    <DropdownMenuItem 
                      onClick={() => updateQuoteStatus('pending')}
                      disabled={updatingStatus}
                    >
                      <Clock className="h-4 w-4 mr-2 stroke-[2px] text-amber-500" /> Mark as Pending
                    </DropdownMenuItem>
                  )}
                  {quote.status !== 'approved' && (
                    <DropdownMenuItem 
                      onClick={() => updateQuoteStatus('approved')}
                      disabled={updatingStatus}
                    >
                      <CheckCircle className="h-4 w-4 mr-2 stroke-[2px] text-green-600" /> Approve Quote
                    </DropdownMenuItem>
                  )}
                  {quote.status !== 'rejected' && (
                    <DropdownMenuItem 
                      onClick={() => setShowRejectDialog(true)}
                      disabled={updatingStatus}
                    >
                      <XCircle className="h-4 w-4 mr-2 stroke-[2px] text-red-600" /> Reject Quote
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Quote Header Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-gray-800">Quote #{id?.substring(0, 8)}</h2>
                <StatusBadge status={quote.status} />
              </div>
              <p className="text-gray-500 mt-1">Created on {formatDate(quote.created_at)}</p>
            </div>
            
            <div className="flex flex-col items-end">
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-2xl font-bold text-jet-600">{formatCurrency(quote.total_amount)}</p>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Customer Info */}
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <Clipboard className="w-5 h-5 mr-2 text-buff-500" />
                Customer Information
              </h3>
              <Card>
                <CardContent className="p-4">
                  {customer ? (
                    <div className="space-y-2">
                      <p className="font-medium text-gray-800">{customer.name}</p>
                      {customer.email && <p className="text-gray-600">{customer.email}</p>}
                      {customer.phone && <p className="text-gray-600">{customer.phone}</p>}
                      {customer.address && <p className="text-gray-600">{customer.address}</p>}
                    </div>
                  ) : (
                    <p className="text-gray-500">No customer information available</p>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Delivery Info */}
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <Truck className="w-5 h-5 mr-2 text-buff-500" />
                Delivery Information
              </h3>
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <CalendarDays className="w-4 h-4 mr-2 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Delivery Date</p>
                        <p className="font-medium">{formatDate(quote.delivery_date)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 mr-2 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Delivery Address</p>
                        <p className="font-medium">{quote.delivery_address || 'Not specified'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Truck className="w-4 h-4 mr-2 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Transport Cost</p>
                        <p className="font-medium">{formatCurrency(quote.transport_cost || 0)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        {/* Quote Items */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2 text-buff-500" />
            Products
          </h3>
          
          {items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Product</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product?.name || 'Unknown Product'}</TableCell>
                    <TableCell>{item.product?.unit || 'N/A'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(item.line_total)}</TableCell>
                  </TableRow>
                ))}
                
                {/* Subtotal row */}
                <TableRow className="bg-gray-50">
                  <TableCell colSpan={4} className="text-right font-medium">
                    Products Subtotal
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(items.reduce((sum, item) => sum + item.line_total, 0))}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-md">
              <ShoppingCart className="w-10 h-10 mx-auto text-gray-400" />
              <p className="mt-2 text-gray-500">No products added to this quote</p>
            </div>
          )}
        </div>
        
        {/* Services and Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Additional Services */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-medium mb-4 flex items-center">
                <Clipboard className="w-5 h-5 mr-2 text-buff-500" />
                Additional Services
              </h3>
              
              {services.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[70%]">Service</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">{service.service?.name || 'Unknown Service'}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(service.rate)}</TableCell>
                      </TableRow>
                    ))}
                    
                    {/* Services Subtotal */}
                    <TableRow className="bg-gray-50">
                      <TableCell className="text-right font-medium">
                        Services Subtotal
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(services.reduce((sum, service) => sum + service.rate, 0))}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-md">
                  <Clipboard className="w-10 h-10 mx-auto text-gray-400" />
                  <p className="mt-2 text-gray-500">No additional services included</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Quote Summary */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-medium mb-4">Quote Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <p className="text-gray-600">Products Subtotal:</p>
                  <p className="font-medium">{formatCurrency(items.reduce((sum, item) => sum + item.line_total, 0))}</p>
                </div>
                
                <div className="flex justify-between">
                  <p className="text-gray-600">Services:</p>
                  <p className="font-medium">{formatCurrency(services.reduce((sum, service) => sum + service.rate, 0))}</p>
                </div>
                
                <div className="flex justify-between">
                  <p className="text-gray-600">Transport Cost:</p>
                  <p className="font-medium">{formatCurrency(quote.transport_cost || 0)}</p>
                </div>
                
                <Separator className="my-3" />
                
                <div className="flex justify-between text-lg">
                  <p className="font-bold text-gray-800">Total:</p>
                  <p className="font-bold text-jet-600">{formatCurrency(quote.total_amount)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Convert to Order Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Convert Quote to Order</DialogTitle>
            <DialogDescription>
              Create a new order based on this approved quote. You can add optional notes for this order.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="notes" className="text-sm font-medium">
                Order Notes (Optional)
              </label>
              <Textarea
                id="notes"
                placeholder="Add any special instructions or notes for this order..."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowOrderDialog(false)}
              disabled={isConverting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConvertToOrder}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={isConverting}
            >
              {isConverting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Converting...
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4 mr-2" /> Create Order
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reject Quote Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reject Quote</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this quote.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="rejection-reason" className="text-sm font-medium">
                Rejection Reason
              </label>
              <Textarea
                id="rejection-reason"
                placeholder="Provide feedback on why this quote is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowRejectDialog(false)}
              disabled={updatingStatus}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => updateQuoteStatus('rejected', rejectionReason)}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={updatingStatus || !rejectionReason.trim()}
            >
              {updatingStatus ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" /> Reject Quote
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 