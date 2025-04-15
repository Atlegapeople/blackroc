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
  CreditCard,
  CheckCircle,
  XCircle,
  TruckIcon,
  User,
  FileEdit,
  RefreshCw
} from 'lucide-react';
import { Button } from '../ui/button';
import { formatCurrency } from '../../lib/utils';
import { Separator } from '../ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { useToast } from '../ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';

// Status badge component for delivery status
const DeliveryStatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = () => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-500 text-white border-green-600';
      case 'dispatched':
        return 'bg-blue-500 text-white border-blue-600';
      case 'pending':
        return 'bg-amber-500 text-white border-amber-600';
      case 'cancelled':
        return 'bg-red-500 text-white border-red-600';
      default:
        return 'bg-gray-500 text-white border-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <CheckCircle className="w-3.5 h-3.5 mr-1.5 font-bold" />;
      case 'dispatched':
        return <Truck className="w-3.5 h-3.5 mr-1.5 font-bold" />;
      case 'pending':
        return <Clock className="w-3.5 h-3.5 mr-1.5 font-bold" />;
      case 'cancelled':
        return <XCircle className="w-3.5 h-3.5 mr-1.5 font-bold" />;
      default:
        return <ShoppingBag className="w-3.5 h-3.5 mr-1.5 font-bold" />;
    }
  };

  return (
    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center w-fit border ${getStatusColor()}`}>
      {getStatusIcon()}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Status badge component for payment status
const PaymentStatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = () => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-500 text-white border-green-600';
      case 'unpaid':
        return 'bg-amber-500 text-white border-amber-600';
      case 'overdue':
        return 'bg-red-500 text-white border-red-600';
      default:
        return 'bg-gray-500 text-white border-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <CheckCircle className="w-3.5 h-3.5 mr-1.5 font-bold" />;
      case 'unpaid':
        return <CreditCard className="w-3.5 h-3.5 mr-1.5 font-bold" />;
      case 'overdue':
        return <XCircle className="w-3.5 h-3.5 mr-1.5 font-bold" />;
      default:
        return <CreditCard className="w-3.5 h-3.5 mr-1.5 font-bold" />;
    }
  };

  return (
    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center w-fit border ${getStatusColor()}`}>
      {getStatusIcon()}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

interface OrderItem {
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

interface OrderService {
  id: string;
  quote_id: string;
  service_id: string;
  rate: number;
  service: {
    name: string;
  };
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [order, setOrder] = useState<any | null>(null);
  const [quote, setQuote] = useState<any | null>(null);
  const [customer, setCustomer] = useState<any | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [services, setServices] = useState<OrderService[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [updatedDeliveryStatus, setUpdatedDeliveryStatus] = useState<string>('');
  const [updatedPaymentStatus, setUpdatedPaymentStatus] = useState<string>('');
  const [statusNotes, setStatusNotes] = useState('');

  useEffect(() => {
    if (id) {
      fetchOrderData(id);
    }
  }, [id]);

  const fetchOrderData = async (orderId: string) => {
    setLoading(true);
    try {
      // Fetch the order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          customers:customer_id (
            name,
            email,
            phone,
            company
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);
      
      // Set initial status values for the update dialog
      setUpdatedDeliveryStatus(orderData.delivery_status);
      setUpdatedPaymentStatus(orderData.payment_status);

      // Fetch customer data
      if (orderData.customer_id) {
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('id', orderData.customer_id)
          .single();

        if (customerError) throw customerError;
        setCustomer(customerData);
      }

      // If this order is linked to a quote, fetch the quote data
      if (orderData.quote_id) {
        const { data: quoteData, error: quoteError } = await supabase
          .from('quotes')
          .select('*')
          .eq('id', orderData.quote_id)
          .single();

        if (!quoteError && quoteData) {
          setQuote(quoteData);

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
            .eq('quote_id', orderData.quote_id);

          if (!itemsError) {
            setItems(itemsData || []);
          }

          // Fetch quote services with service details
          const { data: servicesData, error: servicesError } = await supabase
            .from('quote_services')
            .select(`
              *,
              service:service_id (
                name
              )
            `)
            .eq('quote_id', orderData.quote_id);

          if (!servicesError) {
            setServices(servicesData || []);
          }
        }
      }

    } catch (err) {
      console.error('Error fetching order data:', err);
      toast({
        title: "Failed to load order",
        description: "There was an error loading the order details.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async () => {
    if (!id) return;
    
    setUpdatingStatus(true);
    try {
      const updateData = {
        delivery_status: updatedDeliveryStatus,
        payment_status: updatedPaymentStatus,
        notes: order.notes ? `${order.notes}\n\n${new Date().toLocaleString()}: ${statusNotes}` : statusNotes
      };
      
      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      
      // Update the local state
      setOrder(prev => ({ 
        ...prev, 
        delivery_status: updatedDeliveryStatus,
        payment_status: updatedPaymentStatus,
        notes: updateData.notes
      }));
      
      // Show success toast
      toast({
        title: "Order status updated",
        description: `Order status has been successfully updated`,
        className: "bg-green-50 border-green-200 text-green-800",
      });
      
      // Close dialog
      setShowUpdateDialog(false);
      
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Failed to update status",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
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

  const refreshOrder = () => {
    if (id) {
      fetchOrderData(id);
      toast({
        title: "Refreshing order data",
        description: "The latest order information is being loaded",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-buff-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <ShoppingBag className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">The order you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={() => navigate('/dashboard/orders')} className="bg-buff-500 hover:bg-buff-600">
            <ArrowLeft className="w-4 h-4 mr-2" /> Return to Orders
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
            <h1 className="text-2xl font-bold text-jet-600">Order Details</h1>
            <nav className="flex items-center space-x-1 text-sm text-gray-500 mt-1">
              <Link to="/dashboard" className="hover:text-jet-600 flex items-center">
                <Home className="w-3.5 h-3.5 mr-1" />
                Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link to="/dashboard/orders" className="hover:text-jet-600 flex items-center">
                <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                Orders
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-jet-600">Order #{id?.substring(0, 8)}</span>
            </nav>
          </div>
          
          <div className="flex space-x-3">
            <Button 
              variant="outline"
              onClick={() => navigate('/dashboard/orders')}
              className="flex items-center border-gray-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2 stroke-[2px]" /> Back to Orders
            </Button>
            
            <Button
              variant="outline"
              onClick={refreshOrder}
              className="flex items-center border-gray-300"
            >
              <RefreshCw className="h-4 w-4 mr-2 stroke-[2px]" /> Refresh
            </Button>
            
            {order.payment_status === "paid" && (
              <Button
                variant="outline"
                onClick={() => navigate(`/dashboard/orders/${id}/invoice`)}
                className="flex items-center border-gray-300"
              >
                <FileText className="h-4 w-4 mr-2 stroke-[2px]" /> View Invoice
              </Button>
            )}
            
            <Button 
              onClick={() => setShowUpdateDialog(true)}
              className="bg-buff-500 hover:bg-buff-600 text-white"
            >
              <Edit className="h-4 w-4 mr-2 stroke-[2px]" /> Update Status
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Order Header Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold text-gray-800">Order #{id?.substring(0, 8)}</h2>
                {quote && (
                  <Link 
                    to={`/dashboard/quotes/${order.quote_id}`}
                    className="text-sm text-buff-600 hover:text-buff-700 flex items-center"
                  >
                    <FileText className="w-3.5 h-3.5 mr-1" />
                    View Quote
                  </Link>
                )}
              </div>
              <p className="text-gray-500">Created on {formatDate(order.created_at)}</p>
              
              <div className="flex flex-wrap gap-3 mt-3">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Delivery Status</p>
                  <DeliveryStatusBadge status={order.delivery_status} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Payment Status</p>
                  <PaymentStatusBadge status={order.payment_status} />
                </div>
                {order.payment_status === "paid" && (
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/dashboard/orders/${id}/invoice`)}
                      className="flex items-center text-xs border-gray-200 h-[30px]"
                    >
                      <FileText className="h-3.5 w-3.5 mr-1" />
                      Invoice
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-end">
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-2xl font-bold text-jet-600">{formatCurrency(order.total_amount)}</p>
            </div>
          </div>
          
          <Separator className="my-6" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Customer Info */}
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <User className="w-5 h-5 mr-2 text-buff-500" />
                Customer Information
              </h3>
              <Card>
                <CardContent className="p-4">
                  {customer ? (
                    <div className="space-y-2">
                      <p className="font-medium text-gray-800">{customer.name}</p>
                      {customer.email && <p className="text-gray-600">{customer.email}</p>}
                      {customer.phone && <p className="text-gray-600">{customer.phone}</p>}
                      {customer.company && <p className="text-gray-600">{customer.company}</p>}
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
                        <p className="font-medium">{formatDate(order.delivery_date)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 mr-2 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Delivery Address</p>
                        <p className="font-medium">{order.delivery_address || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        {/* Order Items */}
        {items.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2 text-buff-500" />
              Products
            </h3>
            
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
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Additional Services */}
          {services.length > 0 && (
            <div className="md:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-medium mb-4 flex items-center">
                  <Clipboard className="w-5 h-5 mr-2 text-buff-500" />
                  Additional Services
                </h3>
                
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
              </div>
            </div>
          )}
          
          {/* Order Notes */}
          <div className={services.length ? "md:col-span-1" : "md:col-span-3"}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-medium mb-4">Order Notes</h3>
              
              {order.notes ? (
                <div className="whitespace-pre-wrap text-gray-700 p-3 bg-gray-50 rounded-md border border-gray-100 min-h-[100px]">
                  {order.notes}
                </div>
              ) : (
                <div className="text-gray-500 italic p-3 bg-gray-50 rounded-md border border-gray-100 min-h-[100px]">
                  No notes for this order.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* Update Status Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Update the delivery and payment status for this order.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="delivery-status" className="text-sm font-medium">
                  Delivery Status
                </label>
                <Select
                  value={updatedDeliveryStatus}
                  onValueChange={setUpdatedDeliveryStatus}
                >
                  <SelectTrigger id="delivery-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="dispatched">Dispatched</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="payment-status" className="text-sm font-medium">
                  Payment Status
                </label>
                <Select
                  value={updatedPaymentStatus}
                  onValueChange={setUpdatedPaymentStatus}
                >
                  <SelectTrigger id="payment-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="status-notes" className="text-sm font-medium">
                Status Update Notes
              </label>
              <Textarea
                id="status-notes"
                placeholder="Add notes about this status update..."
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowUpdateDialog(false)}
              disabled={updatingStatus}
            >
              Cancel
            </Button>
            <Button 
              onClick={updateOrderStatus}
              className="bg-buff-500 hover:bg-buff-600 text-white"
              disabled={updatingStatus}
            >
              {updatingStatus ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" /> Update Status
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 