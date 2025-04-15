import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Home, 
  FileText, 
  ChevronRight, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2,
  ArrowUpDown,
  CheckCircle, 
  Clock,
  XCircle,
  Download,
  Copy,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  MoreHorizontal,
  RefreshCw,
  CreditCard,
  Truck,
  ShoppingBag
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { formatCurrency } from '../../lib/utils';
import { Checkbox } from '../ui/checkbox';
import { useToast } from '../ui/use-toast';
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

// Define order type
interface Order {
  id: string;
  quote_id: string;
  customer_id: string;
  order_date: string;
  delivery_address: string;
  delivery_date: string | null;
  delivery_status: string;
  payment_status: string;
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customers: {
    name: string;
  };
}

export default function OrderList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDeliveryStatus, setFilterDeliveryStatus] = useState<string | null>(null);
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>('order_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const pageSize = 10;
  
  // Refresh orders list
  const refreshOrders = () => {
    setIsRefreshing(true);
    setRefreshKey(prev => prev + 1);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    fetchOrders();
  }, [sortField, sortDirection, filterDeliveryStatus, filterPaymentStatus, currentPage, refreshKey]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // First get the count of all orders matching our filter
      let countQuery = supabase
        .from('orders')
        .select('id', { count: 'exact' });
        
      if (filterDeliveryStatus) {
        countQuery = countQuery.eq('delivery_status', filterDeliveryStatus);
      }
      
      if (filterPaymentStatus) {
        countQuery = countQuery.eq('payment_status', filterPaymentStatus);
      }
      
      const { count, error: countError } = await countQuery;
      
      if (countError) throw countError;
      setTotalOrders(count || 0);
      
      // Then fetch the actual orders for the current page
      let query = supabase
        .from('orders')
        .select(`
          *,
          customers:customer_id (name)
        `)
        .order(sortField, { ascending: sortDirection === 'asc' })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (filterDeliveryStatus) {
        query = query.eq('delivery_status', filterDeliveryStatus);
      }
      
      if (filterPaymentStatus) {
        query = query.eq('payment_status', filterPaymentStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOrders(data || []);
      
      // Reset selection when data changes
      setSelectedOrders([]);
      setIsAllSelected(false);
    } catch (err) {
      console.error('Error fetching orders:', err);
      toast({
        title: "Failed to load orders",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter orders by search query
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        (order.id && order.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (order.customers?.name && order.customers.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (order.delivery_address && order.delivery_address.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesSearch;
    });
  }, [orders, searchQuery]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Handle order selection
  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };
  
  // Handle select all orders
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(order => order.id));
    }
    setIsAllSelected(!isAllSelected);
  };
  
  // Calculate total pages
  const totalPages = Math.ceil(totalOrders / pageSize);
  
  // Handle page change
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };
  
  // Delete an order
  const deleteOrder = async (orderId: string | null) => {
    if (!orderId) return;
    
    try {
      // Delete the order
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);
        
      if (error) throw error;
      
      toast({
        title: "Order deleted",
        description: "The order has been successfully deleted",
        className: "bg-green-50 border-green-200 text-green-800",
      });
      
      // Refresh orders
      refreshOrders();
    } catch (err) {
      console.error('Error deleting order:', err);
      toast({
        title: "Failed to delete order",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };
  
  // Delete selected orders
  const deleteSelectedOrders = async () => {
    if (selectedOrders.length === 0) return;
    
    try {
      for (const orderId of selectedOrders) {
        // Delete the order
        await supabase
          .from('orders')
          .delete()
          .eq('id', orderId);
      }
      
      toast({
        title: "Orders deleted",
        description: `${selectedOrders.length} order(s) have been successfully deleted`,
        className: "bg-green-50 border-green-200 text-green-800",
      });
      
      // Refresh orders
      refreshOrders();
      setSelectedOrders([]);
    } catch (err) {
      console.error('Error deleting orders:', err);
      toast({
        title: "Failed to delete orders",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-jet-600">Orders</h1>
            <nav className="flex items-center space-x-1 text-sm text-gray-500 mt-1">
              <Link to="/dashboard" className="hover:text-jet-600 flex items-center">
                <Home className="w-3.5 h-3.5 mr-1" />
                Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-jet-600 flex items-center">
                <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                Orders
              </span>
            </nav>
          </div>
          
          <Button 
            onClick={() => navigate('/dashboard/quotes')}
            className="bg-buff-500 hover:bg-buff-600 text-white font-medium px-4"
          >
            <FileText className="h-4 w-4 mr-2 stroke-[2.5px]" /> View Quotes
          </Button>
          
          <Button 
            onClick={() => navigate('/dashboard/create-invoices')}
            className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 ml-2"
          >
            <FileText className="h-4 w-4 mr-2 stroke-[2.5px]" /> Create Invoices
          </Button>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100">
          {/* Filters */}
          <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Search orders by ID, customer, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={refreshOrders}
                disabled={isRefreshing}
                className="h-10 w-10 border-gray-300"
              >
                <RefreshCw className={`h-4 w-4 stroke-[2.5px] ${isRefreshing ? 'animate-spin text-buff-500' : 'text-gray-600'}`} />
              </Button>
            
              {/* Delivery Status Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center border-gray-300">
                    <Truck className="h-4 w-4 mr-2 stroke-[2.5px]" />
                    {filterDeliveryStatus ? (
                      <div className="flex items-center">
                        Delivery: <span className="ml-1 font-medium">{filterDeliveryStatus.charAt(0).toUpperCase() + filterDeliveryStatus.slice(1)}</span>
                      </div>
                    ) : 'All Deliveries'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterDeliveryStatus(null)}>
                    All Delivery Statuses
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterDeliveryStatus('pending')}>
                    <Clock className="h-4 w-4 mr-2 stroke-[2.5px] text-amber-500" /> Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterDeliveryStatus('dispatched')}>
                    <Truck className="h-4 w-4 mr-2 stroke-[2.5px] text-blue-500" /> Dispatched
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterDeliveryStatus('delivered')}>
                    <CheckCircle className="h-4 w-4 mr-2 stroke-[2.5px] text-green-500" /> Delivered
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterDeliveryStatus('cancelled')}>
                    <XCircle className="h-4 w-4 mr-2 stroke-[2.5px] text-red-500" /> Cancelled
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Payment Status Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center border-gray-300">
                    <CreditCard className="h-4 w-4 mr-2 stroke-[2.5px]" />
                    {filterPaymentStatus ? (
                      <div className="flex items-center">
                        Payment: <span className="ml-1 font-medium">{filterPaymentStatus.charAt(0).toUpperCase() + filterPaymentStatus.slice(1)}</span>
                      </div>
                    ) : 'All Payments'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterPaymentStatus(null)}>
                    All Payment Statuses
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterPaymentStatus('unpaid')}>
                    <CreditCard className="h-4 w-4 mr-2 stroke-[2.5px] text-amber-500" /> Unpaid
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterPaymentStatus('paid')}>
                    <CheckCircle className="h-4 w-4 mr-2 stroke-[2.5px] text-green-500" /> Paid
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterPaymentStatus('overdue')}>
                    <XCircle className="h-4 w-4 mr-2 stroke-[2.5px] text-red-500" /> Overdue
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {selectedOrders.length > 0 && (
                <Button 
                  variant="outline" 
                  className="text-red-600 border-red-200 hover:bg-red-50 font-medium"
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${selectedOrders.length} order(s)?`)) {
                      deleteSelectedOrders();
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2 stroke-[2.5px]" />
                  Delete {selectedOrders.length} selected
                </Button>
              )}
            </div>
          </div>
          
          {/* Orders Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox 
                      checked={isAllSelected} 
                      onCheckedChange={toggleSelectAll} 
                      aria-label="Select all orders" 
                    />
                  </TableHead>
                  <TableHead className="w-[100px] cursor-pointer" onClick={() => handleSort('id')}>
                    <div className="flex items-center">
                      Order ID
                      {sortField === 'id' && (
                        <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('customers.name')}>
                    <div className="flex items-center">
                      Customer
                      {sortField === 'customers.name' && (
                        <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('order_date')}>
                    <div className="flex items-center">
                      Order Date
                      {sortField === 'order_date' && (
                        <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('delivery_date')}>
                    <div className="flex items-center">
                      Delivery Date
                      {sortField === 'delivery_date' && (
                        <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('total_amount')}>
                    <div className="flex items-center">
                      Amount
                      {sortField === 'total_amount' && (
                        <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('delivery_status')}>
                    <div className="flex items-center">
                      Delivery
                      {sortField === 'delivery_status' && (
                        <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('payment_status')}>
                    <div className="flex items-center">
                      Payment
                      {sortField === 'payment_status' && (
                        <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <div className="w-6 h-6 border-2 border-buff-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <span className="ml-2">Loading orders...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <ShoppingBag className="w-10 h-10 text-gray-400" />
                        <div className="text-gray-500">No orders found</div>
                        <Button 
                          onClick={() => navigate('/dashboard/quotes')}
                          className="bg-buff-500 hover:bg-buff-600 text-white"
                        >
                          <FileText className="h-4 w-4 mr-1" /> Manage Quotes
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id} className={selectedOrders.includes(order.id) ? "bg-buff-50" : ""}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedOrders.includes(order.id)} 
                          onCheckedChange={() => toggleSelectOrder(order.id)} 
                          aria-label={`Select order ${order.id}`} 
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        #{order.id.substring(0, 8)}
                      </TableCell>
                      <TableCell>{order.customers?.name || 'Unknown'}</TableCell>
                      <TableCell>{formatDate(order.order_date)}</TableCell>
                      <TableCell>{formatDate(order.delivery_date)}</TableCell>
                      <TableCell>{formatCurrency(order.total_amount || 0)}</TableCell>
                      <TableCell>
                        <DeliveryStatusBadge status={order.delivery_status || 'pending'} />
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={order.payment_status || 'unpaid'} />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem onClick={() => navigate(`/dashboard/orders/${order.id}`)}>
                              <Eye className="h-4.5 w-4.5 mr-2 stroke-[2.5px] text-blue-600" />
                              View Order
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => navigate(`/dashboard/orders/${order.id}/edit`)}
                            >
                              <Edit className="h-4.5 w-4.5 mr-2 stroke-[2.5px] text-amber-600" />
                              Update Status
                            </DropdownMenuItem>
                            {order.quote_id && (
                              <DropdownMenuItem onClick={() => navigate(`/dashboard/quotes/${order.quote_id}`)}>
                                <FileText className="h-4.5 w-4.5 mr-2 stroke-[2.5px] text-green-600" />
                                View Quote
                              </DropdownMenuItem>
                            )}
                            {order.payment_status === "paid" && (
                              <DropdownMenuItem onClick={() => navigate(`/dashboard/orders/${order.id}/invoice`)}>
                                <FileText className="h-4.5 w-4.5 mr-2 stroke-[2.5px] text-purple-600" />
                                View Invoice
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => {
                                setOrderToDelete(order.id);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4.5 w-4.5 mr-2 stroke-[2.5px] text-red-600" />
                              Delete Order
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalOrders)} of {totalOrders} orders
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }).map((_, index) => {
                  let pageNumber;
                  
                  // Calculate which page numbers to show
                  if (totalPages <= 5) {
                    pageNumber = index + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = index + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + index;
                  } else {
                    pageNumber = currentPage - 2 + index;
                  }
                  
                  return (
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(pageNumber)}
                      className={currentPage === pageNumber ? "bg-buff-500 text-white" : ""}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Delete Order Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this order?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The order will be permanently deleted from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                deleteOrder(orderToDelete);
                setIsDeleteDialogOpen(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 