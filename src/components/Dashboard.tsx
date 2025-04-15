import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Separator } from "./ui/separator";
import {
  BarChart3,
  Calendar,
  FileText,
  Clock,
  Package,
  Users,
  AlertCircle,
  Mail,
  ArrowUpRight,
  CircleDollarSign,
  TrendingUp
} from "lucide-react";
import { Button } from "./ui/button";
import { supabase } from "../lib/supabase";
import { formatCurrency } from "../lib/utils";

// Import Dialog components for modal
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

// Import toast components
import { useToast } from "./ui/use-toast";
import { Toaster } from "./ui/toaster";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentQuotes, setRecentQuotes] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalQuotes: 0,
    totalOrders: 0,
    pendingOrders: 0,
    pendingDeliveries: 0,
    totalRevenue: 0
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      setLoading(true);
      
      // Check for refresh parameter in URL
      const searchParams = new URLSearchParams(location.search);
      const shouldRefresh = searchParams.get('refresh') === 'true';
      
      // Remove the refresh parameter from URL if present
      if (shouldRefresh) {
        navigate('/dashboard', { replace: true });
      }
      
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          navigate('/login');
          return;
        }

        setUser(user);
        
        // Always fetch data when component mounts or refresh is requested
        await fetchDashboardData(user.id);
        
      } catch (error) {
        console.error('Error checking auth:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadData();
  }, [navigate, location.search]); // Add location.search to dependency array

  const fetchDashboardData = async (userId: string) => {
    try {
      // Fetch recent quotes - no user filtering
      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (quotesError) throw quotesError;
      setRecentQuotes(quotes || []);
      
      // Fetch recent orders - no user filtering
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (ordersError) throw ordersError;
      setRecentOrders(orders || []);
      
      // Fetch stats - no user filtering
      const { data: quotesCount, error: quotesCountError } = await supabase
        .from('quotes')
        .select('count')
        .single();
      
      const { data: ordersCount, error: ordersCountError } = await supabase
        .from('orders')
        .select('count')
        .single();
        
      const { data: pendingOrders, error: pendingOrdersError } = await supabase
        .from('orders')
        .select('count')
        .eq('payment_status', 'pending')
        .single();
        
      const { data: pendingDeliveries, error: pendingDeliveriesError } = await supabase
        .from('orders')
        .select('count')
        .eq('delivery_status', 'pending')
        .single();
        
      // Calculate outstanding balance using the SQL query that correctly joins user accounts to customers
      const { data: outstandingData, error: outstandingError } = await supabase
        .from('invoices')
        .select(`
          outstanding_amount,
          customers!inner (
            id,
            name,
            user_id
          )
        `)
        .gt('outstanding_amount', 0)
        .eq('customers.user_id', userId);
        
      console.log('Outstanding query result:', outstandingData, outstandingError);
      
      // Calculate total outstanding from invoices
      const outstandingBalance = outstandingData 
        ? outstandingData.reduce((sum, invoice) => {
            return sum + (parseFloat(invoice.outstanding_amount) || 0);
          }, 0) 
        : 0;
      
      setStats({
        totalQuotes: quotesCount?.count || 0,
        totalOrders: ordersCount?.count || 0,
        pendingOrders: pendingOrders?.count || 0,
        pendingDeliveries: pendingDeliveries?.count || 0,
        totalRevenue: outstandingBalance
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        variant: "destructive",
        title: "Error loading dashboard data",
        description: "Please try refreshing the page."
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Dashboard Content */}
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Quotes</p>
                <p className="text-3xl font-bold">{stats.totalQuotes}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-full">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="mt-4">
              <Link to="/dashboard/quotes">
                <Button variant="ghost" size="sm" className="text-blue-600 p-0 h-auto font-medium">
                  View all quotes
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                <p className="text-3xl font-bold">{stats.totalOrders}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-full">
                <Package className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="mt-4">
              <Link to="/dashboard/orders">
                <Button variant="ghost" size="sm" className="text-green-600 p-0 h-auto font-medium">
                  View all orders
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Deliveries</p>
                <p className="text-3xl font-bold">{stats.pendingDeliveries}</p>
              </div>
              <div className="bg-amber-50 p-3 rounded-full">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
            </div>
            <div className="mt-4">
              <Link to="/dashboard/orders">
                <Button variant="ghost" size="sm" className="text-amber-600 p-0 h-auto font-medium">
                  View pending deliveries
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-sm p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Outstanding Balance</p>
                <p className="text-3xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded-full">
                <CircleDollarSign className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            <div className="mt-4">
              <Link to="/dashboard/payments/capture">
                <Button variant="ghost" size="sm" className="text-purple-600 p-0 h-auto font-medium">
                  Capture payments
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    to={`/dashboard/orders/${order.id}`}
                    className="flex items-center justify-between p-6 hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <div className="bg-green-100 p-2 rounded-full mr-4">
                        <Package className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Order #{order.order_number || order.id.substring(0, 8)}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div>
                      <span className={`px-3 py-1 text-xs rounded-full ${
                        order.payment_status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500">No orders yet</div>
              )}
            </div>
            {recentOrders.length > 0 && (
              <div className="p-4 border-t border-gray-100">
                <Link to="/dashboard/orders">
                  <Button variant="outline" className="w-full">View All Orders</Button>
                </Link>
              </div>
            )}
          </motion.div>

          {/* Recent Quotes */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Recent Quotes</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {recentQuotes.length > 0 ? (
                recentQuotes.map((quote) => (
                  <Link
                    key={quote.id}
                    to={`/dashboard/quotes/${quote.id}`}
                    className="flex items-center justify-between p-6 hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-2 rounded-full mr-4">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Quote #{quote.quote_number || quote.id.substring(0, 8)}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(quote.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div>
                      <span className={`px-3 py-1 text-xs rounded-full ${
                        quote.status === 'approved' 
                          ? 'bg-green-100 text-green-800' 
                          : quote.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {quote.status ? quote.status.charAt(0).toUpperCase() + quote.status.slice(1) : 'Draft'}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500">No quotes yet</div>
              )}
            </div>
            {recentQuotes.length > 0 && (
              <div className="p-4 border-t border-gray-100">
                <Link to="/dashboard/quotes">
                  <Button variant="outline" className="w-full">View All Quotes</Button>
                </Link>
              </div>
            )}
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-lg shadow-sm p-6 border border-gray-100"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/dashboard/quotes/create">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <FileText className="mr-2 h-4 w-4" />
                Create New Quote
              </Button>
            </Link>
            <Link to="/dashboard/quotes">
              <Button variant="outline" className="w-full">
                <FileText className="mr-2 h-4 w-4" />
                View All Quotes
              </Button>
            </Link>
            <Link to="/dashboard/orders">
              <Button variant="outline" className="w-full">
                <Package className="mr-2 h-4 w-4" />
                View All Orders
              </Button>
            </Link>
            <Link to="/dashboard/payments/capture">
              <Button variant="outline" className="w-full">
                <CircleDollarSign className="mr-2 h-4 w-4" />
                Capture Payments
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard; 