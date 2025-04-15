import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  CreditCard, 
  Calendar, 
  ArrowLeft, 
  Save,
  Search,
  CalendarIcon,
  Eye
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
import { 
  getInvoiceById, 
  recordPayment, 
  getOrderInvoices, 
  getInvoicesForCustomer,
  syncOrderInvoiceStatuses 
} from '../../lib/services/financeService';
import { Invoice as BaseInvoice } from '../../lib/interfaces/finance';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from '../ui/calendar';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { supabase } from '../../lib/supabase';
import { PostgrestSingleResponse } from '@supabase/supabase-js';

// Extend the Invoice interface to include customers field from the join with more detailed structure
interface Invoice extends BaseInvoice {
  customers?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
  };
  // Also add direct customer fields that might be embedded in the invoice
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_company?: string;
}

const formSchema = z.object({
  invoice_id: z.string().uuid(),
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

// Add this helper function before the component
const formatOutstandingAmount = (amount: number) => {
  // Ensure the outstanding amount is never negative
  const displayAmount = Math.max(0, amount);
  return formatCurrency(displayAmount);
};

// Helper function to format order IDs consistently
const formatOrderId = (orderId: string) => {
  if (!orderId) return '';
  // Display just the first 8 characters, which is the standard in the order screen
  return orderId.substring(0, 8);
};

export default function PaymentCapture() {
  const navigate = useNavigate();
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [orderNumber, setOrderNumber] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [paymentSaved, setPaymentSaved] = useState(false);
  const [isLoadingOutstandingInvoices, setIsLoadingOutstandingInvoices] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invoice_id: invoiceId || '',
      amount: 0,
      payment_method: 'bank_transfer',
      payment_date: new Date(),
      reference_number: '',
      notes: ''
    }
  });
  
  // Fetch current user on component mount
  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching user:', error);
        return;
      }
      
      if (data?.user) {
        console.log('Current user:', data.user);
        setCurrentUser(data.user);
      }
    };
    
    getUser();
  }, []);
  
  // Fetch invoice if invoiceId is provided in the URL
  useEffect(() => {
    if (invoiceId) {
      fetchInvoice(invoiceId);
    } else {
      // Only fetch outstanding invoices after we have the current user
      if (currentUser) {
        fetchOutstandingInvoices();
      }
    }
  }, [invoiceId, currentUser]);
  
  const fetchOutstandingInvoices = async () => {
    try {
      setIsLoadingOutstandingInvoices(true);
      
      if (!currentUser) {
        console.log('No current user, skipping invoice fetch');
        setIsLoadingOutstandingInvoices(false);
        return;
      }
      
      console.log('Fetching outstanding invoices for user:', currentUser.id);
      
      // Default to restrictive behavior - assume not admin unless explicitly proven otherwise
      let isAdmin = false;
      let customerIdFilter = null;
      
      try {
        // Get user profile to determine if admin/staff or regular customer
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role, customer_id')
          .eq('user_id', currentUser.id)
          .single();
          
        console.log('User profile:', userProfile, 'Profile Error:', profileError);
        
        // If the user_profiles table exists and we got data
        if (!profileError && userProfile) {
          if (userProfile.role === 'admin' || userProfile.role === 'staff') {
            console.log('User has admin/staff role:', userProfile.role);
            isAdmin = true;
          } else if (userProfile.customer_id) {
            // Regular user with a customer_id
            console.log('Regular user with customer_id:', userProfile.customer_id);
            customerIdFilter = userProfile.customer_id;
          }
        } else if (profileError && profileError.code === '42P01') {
          // Table doesn't exist, try fallback to customers table
          console.log('user_profiles table does not exist, trying fallback to customers table');
          await tryCustomerFallback();
        } else {
          console.warn('Error fetching user profile:', profileError);
        }
      } catch (profileLookupError) {
        console.error('Exception during profile lookup:', profileLookupError);
        // Try fallback approach
        await tryCustomerFallback();
      }
      
      // Fallback function to check if user is linked to a customer directly
      async function tryCustomerFallback() {
        try {
          // Try to find the user's email in the customers table
          const userEmail = currentUser.email;
          if (!userEmail) {
            console.warn('No user email available for customer lookup');
            return;
          }
          
          console.log('Trying to find customer by email:', userEmail);
          const { data: customerData, error: customerError } = await supabase
            .from('customers')
            .select('id, name, email')
            .ilike('email', userEmail)
            .maybeSingle();
            
          console.log('Customer lookup result:', customerData, 'Error:', customerError);
          
          if (!customerError && customerData) {
            console.log('Found matching customer:', customerData);
            customerIdFilter = customerData.id;
          } else {
            // Last resort: Check if the user's email contains a domain that matches a company in customers
            const emailDomain = userEmail.split('@')[1];
            if (emailDomain) {
              console.log('Trying to find company by domain:', emailDomain);
              const { data: companyCustomers, error: companyError } = await supabase
                .from('customers')
                .select('id')
                .like('email', `%@${emailDomain}`)
                .limit(1);
                
              if (!companyError && companyCustomers && companyCustomers.length > 0) {
                console.log('Found company customer by domain:', companyCustomers[0]);
                customerIdFilter = companyCustomers[0].id;
              }
            }
          }
        } catch (fallbackError) {
          console.error('Error in customer fallback:', fallbackError);
        }
      }
      
      // If the email contains @blackroc.co.za, treat as admin
      if (!isAdmin && currentUser.email && currentUser.email.includes('@blackroc.co.za')) {
        console.log('User has blackroc.co.za email domain, treating as admin');
        isAdmin = true;
      }
      
      // If not admin and no customerIdFilter, show empty results
      if (!isAdmin && !customerIdFilter) {
        console.warn('User has no permissions to view invoices');
        setInvoices([]);
        setIsLoadingOutstandingInvoices(false);
        return;
      }
      
      // DEBUG: Get all distinct payment statuses to understand what values exist in the database
      const { data: paymentStatuses, error: statusError } = await supabase
        .from('invoices')
        .select('payment_status')
        .not('payment_status', 'is', null)
        .order('payment_status')
        .limit(20);
        
      console.log('Available payment statuses in database:', 
        paymentStatuses?.map(ps => ps.payment_status), 
        'Status Error:', statusError
      );
      
      // Build the query
      let query = supabase
        .from('invoices')
        .select(`
          *,
          customers:customer_id (
            id, 
            name, 
            email, 
            phone, 
            company
          )
        `);
      
      // Apply status filter if specified
      if (statusFilter === 'unpaid') {
        query = query.or('payment_status.is.null,payment_status.eq.unpaid,payment_status.eq.partial,payment_status.eq.Unpaid,payment_status.eq.Partial');
      } else if (statusFilter === 'paid') {
        query = query.eq('payment_status', 'paid');
      }
      // If 'all' is selected, no payment status filter is applied

      // If not admin, ALWAYS filter by customer_id
      if (!isAdmin && customerIdFilter) {
        console.log('Filtering invoices by customer ID:', customerIdFilter);
        query = query.eq('customer_id', customerIdFilter);
      } else if (isAdmin) {
        console.log('Admin user - showing all invoices');
      } else {
        console.warn('Unexpected condition reached in permission check');
        setInvoices([]);
        setIsLoadingOutstandingInvoices(false);
        return;
      }
      
      // Complete the query
      const { data, error } = await query
        .order('invoice_date', { ascending: false })
        .limit(20);
        
      console.log('Outstanding invoices query result:', { 
        count: data?.length || 0, 
        firstFew: data?.slice(0, 3), 
        error 
      });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        console.log('Found invoices with customer data:', data);
        setInvoices(data);
        setIsLoadingOutstandingInvoices(false);
        return;
      } else {
        console.log('No outstanding invoices found, trying another approach');
        
        // Try a different approach - get all invoices for this customer
        let fallbackQuery = supabase
          .from('invoices')
          .select(`
            *,
            customers:customer_id (
              id, 
              name, 
              email, 
              phone, 
              company
            )
          `);
          
        // Apply status filter if specified
        if (statusFilter === 'unpaid') {
          fallbackQuery = fallbackQuery.or('payment_status.is.null,payment_status.eq.unpaid,payment_status.eq.pending');
        } else if (statusFilter === 'paid') {
          fallbackQuery = fallbackQuery.eq('payment_status', 'paid');
        }
        
        // If user is not staff/admin, filter by their customer_id  
        if (!isAdmin && customerIdFilter) {
          fallbackQuery = fallbackQuery.eq('customer_id', customerIdFilter);
        }
        
        const { data: allData, error: allError } = await fallbackQuery
          .order('invoice_date', { ascending: false })
          .limit(10);
          
        console.log('All invoices query result:', { data: allData, error: allError });
        
        if (!allError && allData && allData.length > 0) {
          console.log('Payment statuses in database:', allData.map(inv => inv.payment_status));
          setInvoices(allData);
          setIsLoadingOutstandingInvoices(false);
          return;
        } else {
          toast({
            title: 'No Invoices Found',
            description: 'No invoices were found for your account.',
            duration: 5000
          });
          setIsLoadingOutstandingInvoices(false);
          return;
        }
      }
      
      // Final check - if we still couldn't determine permissions, but have an authenticated user,
      // allow them to see all public invoices as a fallback
      if (!isAdmin && !customerIdFilter && currentUser) {
        console.log('Granting basic access to authenticated user:', currentUser.id);
        // Set isAdmin to false and proceed with public invoices
        isAdmin = false;
        
        // Create a public invoice query without customer filtering
        const publicInvoiceQuery = supabase
          .from('invoices')
          .select(`
            *,
            customers:customer_id (
              id, 
              name, 
              email, 
              phone, 
              company
            )
          `)
          .order('invoice_date', { ascending: false })
          .limit(20);
          
        // Allow the query to run without customer filtering, but only show public invoices
        const { data: invoices, error } = await publicInvoiceQuery;
        
        if (error) {
          console.error('Error fetching invoices:', error);
          setInvoices([]);
          setIsLoadingOutstandingInvoices(false);
          return;
        }
        
        console.log('Fallback invoices found:', invoices?.length || 0);
        setInvoices(invoices || []);
        setIsLoadingOutstandingInvoices(false);
        return;
      }
      
      // If we get here and still don't have permissions, deny access
      console.log('User has no permissions to view invoices');
      setInvoices([]);
    } catch (error) {
      console.error('Error fetching outstanding invoices:', error);
      toast({
        title: 'Error',
        description: 'Failed to load outstanding invoices',
        duration: 5000
      });
    } finally {
      setIsLoadingOutstandingInvoices(false);
    }
  };
  
  const fetchInvoice = async (id: string) => {
    try {
      setIsLoading(true);
      
      if (!currentUser) {
        console.log('No current user, skipping invoice fetch');
        setIsLoading(false);
        return;
      }
      
      // Default to restrictive behavior - assume not admin unless explicitly proven otherwise
      let isAdmin = false;
      let customerIdFilter = null;
      
      try {
        // Get user profile to determine if admin/staff or regular customer
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role, customer_id')
          .eq('user_id', currentUser.id)
          .single();
          
        console.log('User profile for invoice fetch:', userProfile, 'Error:', profileError);
        
        // If the user_profiles table exists and we got data
        if (!profileError && userProfile) {
          if (userProfile.role === 'admin' || userProfile.role === 'staff') {
            console.log('User has admin/staff role:', userProfile.role);
            isAdmin = true;
          } else if (userProfile.customer_id) {
            // Regular user with a customer_id
            console.log('Regular user with customer_id:', userProfile.customer_id);
            customerIdFilter = userProfile.customer_id;
          }
        } else if (profileError && profileError.code === '42P01') {
          // Table doesn't exist, use email domain as fallback
          if (currentUser.email && currentUser.email.includes('@blackroc.co.za')) {
            console.log('User has blackroc.co.za email domain, treating as admin');
            isAdmin = true;
          }
        }
      } catch (profileLookupError) {
        console.error('Exception during profile lookup:', profileLookupError);
        // Use email domain as fallback
        if (currentUser.email && currentUser.email.includes('@blackroc.co.za')) {
          console.log('User has blackroc.co.za email domain, treating as admin');
          isAdmin = true;
        }
      }
      
      // Fetch invoice with customer data
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select(`
          *,
          customers:customer_id (
            id, 
            name, 
            email, 
            phone, 
            company
          )
        `)
        .eq('id', id)
        .single();
      
      if (invoiceError || !invoiceData) {
        console.error('Error fetching invoice:', invoiceError);
        toast({
          title: 'Error',
          description: 'Failed to load invoice details',
          duration: 5000
        });
        setIsLoading(false);
        return;
      }
      
      // Check if this invoice belongs to the current user's email
      if (!isAdmin && currentUser.email && invoiceData.customers?.email === currentUser.email) {
        console.log('Invoice belongs to current user email, granting access');
        customerIdFilter = invoiceData.customer_id;
      }
      
      // If not admin, verify the invoice belongs to them
      if (!isAdmin && customerIdFilter && invoiceData.customer_id !== customerIdFilter) {
        console.error('Access denied: Invoice does not belong to current user');
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to view this invoice',
          duration: 5000
        });
        navigate('/dashboard/payments/capture');
        setIsLoading(false);
        return;
      }
      
      // All checks passed, set the invoice
      setInvoice(invoiceData);
      form.setValue('invoice_id', invoiceData.id);
      form.setValue('amount', invoiceData.outstanding_amount);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to load invoice details',
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getOrderInvoices = async (orderId: string): Promise<Invoice[]> => {
    try {
      console.log('Getting invoices for order:', orderId);
      
      // First try exact match
      const { data: exactMatch, error: exactError } = await supabase
        .from('invoices')
        .select('*, customers:customer_id(name)')
        .eq('order_id', orderId)
        .order('invoice_date', { ascending: false });
        
      if (exactMatch && exactMatch.length > 0) {
        console.log('Found exact match for order ID:', exactMatch);
        return exactMatch;
      }
      
      // If no exact match, try order_id that starts with the search term
      const { data: startsWith, error: startsWithError } = await supabase
        .from('invoices')
        .select('*, customers:customer_id(name)')
        .ilike('order_id', `${orderId}%`)
        .order('invoice_date', { ascending: false });
        
      if (startsWith && startsWith.length > 0) {
        console.log('Found order ID starting with search term:', startsWith);
        return startsWith;
      }
      
      // If still no results, check if any order_id contains this fragment
      const { data: contains, error: containsError } = await supabase
        .from('invoices')
        .select('*, customers:customer_id(name)')
        .ilike('order_id', `%${orderId}%`)
        .order('invoice_date', { ascending: false });
      
      console.log('Results for order ID search:', { exactMatch, startsWith, contains });
      
      if (contains && contains.length > 0) {
        return contains;
      }
      
      return [];
    } catch (error) {
      console.error('Exception fetching invoices:', error);
      return [];
    }
  };
  
  const searchInvoicesByOrder = async (orderNumber: string) => {
    try {
      if (!orderNumber.trim()) {
        console.log('Empty order number, skipping search');
        return;
      }
      
      if (!currentUser) {
        console.log('No current user, skipping invoice search');
        toast({
          title: "Authentication Required",
          description: "Please login to search for invoices",
          duration: 3000
        });
        return;
      }
      
      setIsSearching(true);
      setSearchQuery(orderNumber);
      
      console.log('Searching for invoices with order ID:', orderNumber);
      
      // Default to restrictive behavior - assume not admin unless explicitly proven otherwise
      let isAdmin = false;
      let customerIdFilter = null;
      
      try {
        // Get user profile to determine if admin/staff or regular customer
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role, customer_id')
          .eq('user_id', currentUser.id)
          .single();
          
        console.log('User profile for search:', userProfile, 'Error:', profileError);
        
        // If the user_profiles table exists and we got data
        if (!profileError && userProfile) {
          if (userProfile.role === 'admin' || userProfile.role === 'staff') {
            console.log('User has admin/staff role:', userProfile.role);
            isAdmin = true;
          } else if (userProfile.customer_id) {
            // Regular user with a customer_id
            console.log('Regular user with customer_id:', userProfile.customer_id);
            customerIdFilter = userProfile.customer_id;
          }
        } else if (profileError && profileError.code === '42P01') {
          // Table doesn't exist, use email domain as fallback
          if (currentUser.email && currentUser.email.includes('@blackroc.co.za')) {
            console.log('User has blackroc.co.za email domain, treating as admin');
            isAdmin = true;
          } else {
            // Try to find user email in customers
            const { data: customerData, error: customerError } = await supabase
              .from('customers')
              .select('id')
              .ilike('email', currentUser.email || '')
              .maybeSingle();
              
            if (!customerError && customerData) {
              customerIdFilter = customerData.id;
            }
          }
        }
      } catch (profileLookupError) {
        console.error('Exception during profile lookup:', profileLookupError);
        // Use email domain as fallback
        if (currentUser.email && currentUser.email.includes('@blackroc.co.za')) {
          console.log('User has blackroc.co.za email domain, treating as admin');
          isAdmin = true;
        }
      }
      
      // If not admin and no customerIdFilter, show no results
      if (!isAdmin && !customerIdFilter) {
        console.warn('User has no permissions to search invoices');
        setInvoices([]);
        setIsSearching(false);
        return;
      }
      
      let query = supabase
        .from('invoices')
        .select(`
          *,
          customers:customer_id (
            id, 
            name, 
            email, 
            phone, 
            company
          )
        `)
        .ilike('order_id', `%${orderNumber}%`);
        
      // If not admin, always filter by customer_id
      if (!isAdmin && customerIdFilter) {
        console.log('Adding customer filter to query:', customerIdFilter);
        query = query.eq('customer_id', customerIdFilter);
      }
        
      const { data, error } = await query;
        
      console.log('Search results:', data, 'Error:', error);
            
      if (error) {
        console.error('Error searching for invoices:', error);
        toast({
          title: "Search Error",
          description: "An error occurred while searching for invoices.",
          duration: 3000
        });
      } else if (data && data.length > 0) {
        setInvoices(data);
        console.log('Found invoices:', data);
      } else {
        console.log('No invoices found, trying fallback search');
        // If the primary search fails, try our fallback approaches
        fallbackSearch();
      }
    } catch (err) {
      console.error('Error in searchInvoicesByOrder:', err);
      toast({
        title: "Search Error",
        description: "An unexpected error occurred.",
        duration: 3000
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  // Fallback to a more general search when the specific order search doesn't yield results
  const fallbackSearch = async () => {
    try {
      if (!currentUser) {
        console.log('No current user, skipping fallback search');
        setIsSearching(false);
        setSearchQuery('');
        return;
      }
      
      console.log('Executing fallback search for:', orderNumber);
      
      // Get user profile to determine if admin/staff or regular customer
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role, customer_id')
        .eq('user_id', currentUser.id)
        .single();
      
      console.log('User profile for fallback search:', userProfile, 'Error:', profileError);
      
      // Default to restrictive behavior
      let isAdmin = false;
      let customerIdFilter = null;
      
      if (profileError || !userProfile) {
        console.warn('Error or missing user profile in fallback search, defaulting to restricted access');
        toast({
          title: "Access Error",
          description: "Unable to verify your account permissions. Please contact support.",
          duration: 5000
        });
        setIsSearching(false);
        setSearchQuery('');
        return;
      } else {
        // Check if user is admin/staff
        if (userProfile.role === 'admin' || userProfile.role === 'staff') {
          isAdmin = true;
          console.log('User is admin/staff, showing all outstanding invoices');
        } else if (userProfile.customer_id) {
          customerIdFilter = userProfile.customer_id;
          console.log('Regular user, filtering by customer ID:', customerIdFilter);
        } else {
          console.warn('User has neither admin privileges nor a customer_id in fallback search, restricting access');
          toast({
            title: "Access Restricted",
            description: "Your account is not associated with any customer. Please contact support.",
            duration: 5000
          });
          setIsSearching(false);
          setSearchQuery('');
          return;
        }
      }
      
      // If not admin and no customerIdFilter, restrict access
      if (!isAdmin && !customerIdFilter) {
        console.warn('User has no permissions to search invoices in fallback search');
        toast({
          title: "Access Restricted",
          description: "You don't have permission to search for invoices.",
          duration: 3000
        });
        setIsSearching(false);
        setSearchQuery('');
        return;
      }
      
      // For admin, fetch all outstanding invoices
      if (isAdmin) {
        console.log('Admin user in fallback search, fetching all outstanding invoices');
        fetchOutstandingInvoices();
        toast({
          title: "No Specific Matches",
          description: "Showing all outstanding invoices instead.",
          duration: 3000
        });
        setIsSearching(false);
        setSearchQuery('');
      } else {
        // For regular users with customer ID, show a message
        console.log('No matching invoices found for regular user');
        setInvoices([]);
        toast({
          title: "No Invoices Found",
          description: "No invoices were found matching your search criteria.",
          duration: 3000
        });
        setIsSearching(false);
        setSearchQuery('');
      }
    } catch (err) {
      console.error('Error in fallback search:', err);
      setInvoices([]);
      toast({
        title: "Search Error",
        description: "An unexpected error occurred during the fallback search.",
        duration: 3000
      });
      setIsSearching(false);
      setSearchQuery('');
    }
  };
  
  const selectInvoice = async (selectedInvoice: Invoice) => {
    // If user is not admin/staff, verify the invoice belongs to them
    if (currentUser) {
      let isAdmin = false;
      let customerIdFilter = null;
      
      try {
        // Get user profile to determine if admin/staff or regular customer
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role, customer_id')
          .eq('user_id', currentUser.id)
          .single();
        
        // If the user_profiles table exists and we got data  
        if (!profileError && userProfile) {
          if (userProfile.role === 'admin' || userProfile.role === 'staff') {
            isAdmin = true;
          } else if (userProfile.customer_id) {
            customerIdFilter = userProfile.customer_id;
          }
        } else if (profileError && profileError.code === '42P01') {
          // Table doesn't exist, use email domain as fallback
          if (currentUser.email && currentUser.email.includes('@blackroc.co.za')) {
            isAdmin = true;
          } else if (currentUser.email && selectedInvoice.customers?.email === currentUser.email) {
            // If the invoice customer email matches the current user's email
            customerIdFilter = selectedInvoice.customer_id;
          }
        }
      } catch (error) {
        console.error('Error checking user permissions:', error);
        // Fallback to email domain
        if (currentUser.email && currentUser.email.includes('@blackroc.co.za')) {
          isAdmin = true;
        }
      }
      
      // If not admin and we have customer filter, verify invoice belongs to customer
      if (!isAdmin && customerIdFilter && selectedInvoice.customer_id !== customerIdFilter) {
        console.error('Access denied: Selected invoice does not belong to current user');
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to view this invoice',
          duration: 5000
        });
        return;
      }
    }
    
    // Set the validated invoice
    setInvoice(selectedInvoice);
    form.setValue('invoice_id', selectedInvoice.id);
    form.setValue('amount', selectedInvoice.outstanding_amount);
  };
  
  const onSubmit = async (data: FormValues) => {
    if (!data.invoice_id || !invoice) return;
    
    try {
      setIsLoading(true);
      
      // Format payment data
      const paymentData = {
        invoice_id: data.invoice_id,
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
          title: "Payment Recorded",
          description: "The payment has been successfully recorded.",
        });
        
        // Reset form
        form.reset();
        setInvoice(null);
        setOrderNumber('');
        
        // Refresh outstanding invoices and navigate to dashboard
        await fetchOutstandingInvoices();
        
        // Navigate to dashboard with refresh flag
        navigate('/dashboard?refresh=true');

        // Sync order invoice statuses
        await syncOrderInvoiceStatuses();
      } else {
        toast({
          title: "Error",
          description: "Failed to record payment. Please try again.",
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to record payment. Please try again.',
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Replace getSpecificUnpaidInvoices with empty function since it was showing hardcoded orders
  const getSpecificUnpaidInvoices = async () => {
    return []; // Don't fetch hardcoded orders anymore
  };
  
  // Helper to get customer display name from invoice
  const getCustomerName = (inv: Invoice): string => {
    // Try all possible locations for customer name
    return inv.customers?.name || 
      inv.customer_name || 
      'Customer';
  };
  
  // Helper to get customer company from invoice
  const getCustomerCompany = (inv: Invoice): string | null => {
    return inv.customers?.company || 
      inv.customer_company || 
      null;
  };
  
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Payment Capture</h1>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search Section */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Find Invoice</CardTitle>
            <CardDescription>
              Search for an invoice to record a payment against
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Order Number</label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Enter order number"
                    value={orderNumber}
                    onChange={e => setOrderNumber(e.target.value)}
                  />
                  <Button 
                    type="button" 
                    variant="secondary"
                    onClick={() => searchInvoicesByOrder(orderNumber)}
                    disabled={searchLoading}
                  >
                    {searchLoading ? (
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the order number or ID (full or partial). The search will find orders that start with or contain what you enter.
                </p>
              </div>
              
              {/* Status Filter */}
              <div className="space-y-2 mt-4">
                <label className="text-sm font-medium">Invoice Status</label>
                <Select value={statusFilter} onValueChange={(value) => {
                  setStatusFilter(value);
                  fetchOutstandingInvoices(); // Refresh invoices when filter changes
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Invoices</SelectItem>
                    <SelectItem value="unpaid">Unpaid Only</SelectItem>
                    <SelectItem value="paid">Paid Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Outstanding Invoices Section */}
              <div className="space-y-2 mt-4">
                <h3 className="text-sm font-medium">{orderNumber ? 'Search Results' : 'Outstanding Invoices'}</h3>
                
                {isLoadingOutstandingInvoices ? (
                  <div className="flex justify-center p-4">
                    <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    {orderNumber 
                      ? 'No invoices found for this order number' 
                      : 'No outstanding invoices found'}
                  </div>
                ) : (
                  <div className="border rounded-md divide-y">
                    {invoices.map(inv => (
                      <div 
                        key={inv.id} 
                        className={cn(
                          "p-2 text-sm cursor-pointer hover:bg-muted flex justify-between items-center",
                          invoice?.id === inv.id && "bg-muted"
                        )}
                      >
                        <div className="flex-1" onClick={() => selectInvoice(inv)}>
                          <p className="font-medium">{inv.invoice_number}</p>
                          <p className="text-muted-foreground text-xs">
                            {format(new Date(inv.invoice_date), 'dd MMM yyyy')}
                          </p>
                          <div className="mt-1 mb-1">
                            <p className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-sm inline-block">
                              {getCustomerName(inv)}
                              {getCustomerCompany(inv) && <span className="ml-1 text-blue-500">({getCustomerCompany(inv)})</span>}
                            </p>
                          </div>
                          {inv.order_id && (
                            <p className="text-muted-foreground text-xs">
                              Order: {formatOrderId(inv.order_id)}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-1" onClick={() => selectInvoice(inv)}>
                          <p className="font-medium">{formatCurrency(inv.total_amount)}</p>
                          <p className={cn(
                            "text-xs",
                            inv.payment_status === 'paid' ? "text-green-600" :
                            inv.payment_status === 'partial' ? "text-amber-600" : 
                            "text-red-600"
                          )}>
                            {inv.payment_status.charAt(0).toUpperCase() + inv.payment_status.slice(1)}
                          </p>
                          <p className="text-xs font-semibold">
                            {formatOutstandingAmount(inv.outstanding_amount)}
                          </p>
                        </div>
                        <div className="ml-2 flex items-center">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8" 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(inv.order_id ? 
                                `/dashboard/orders/${inv.order_id}/invoice` : 
                                `/dashboard`);
                            }}
                            title="View Invoice"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Payment Form */}
        <Card className={cn("lg:col-span-2", !invoice && "opacity-50 pointer-events-none")}>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
            <CardDescription>
              {invoice 
                ? `Record a payment for invoice #${invoice.invoice_number}`
                : "Select an invoice first to proceed"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {invoice && (
                  <div className="p-3 bg-muted rounded-md mb-6">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Invoice:</p>
                        <p className="font-medium">{invoice.invoice_number}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Date:</p>
                        <p className="font-medium">{format(new Date(invoice.invoice_date), 'dd MMM yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total:</p>
                        <p className="font-medium">{formatCurrency(invoice.total_amount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Outstanding:</p>
                        <p className="font-medium">{formatOutstandingAmount(invoice.outstanding_amount)}</p>
                      </div>
                      {/* Customer information section */}
                      <div className="col-span-2 mt-2 border-t pt-2">
                        <p className="text-muted-foreground text-xs uppercase font-medium">Customer</p>
                        <div className="mt-1">
                          <p className="font-medium">{getCustomerName(invoice)}</p>
                          {getCustomerCompany(invoice) && (
                            <p className="text-sm">{getCustomerCompany(invoice)}</p>
                          )}
                          {(invoice.customers?.email || invoice.customer_email) && (
                            <p className="text-xs text-muted-foreground">
                              {invoice.customers?.email || invoice.customer_email}
                            </p>
                          )}
                          {(invoice.customers?.phone || invoice.customer_phone) && (
                            <p className="text-xs text-muted-foreground">
                              {invoice.customers?.phone || invoice.customer_phone}
                            </p>
                          )}
                        </div>
                      </div>
                      {invoice.order_id && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground">Order ID:</p>
                          <p className="font-medium flex items-center">
                            <span>{formatOrderId(invoice.order_id)}</span>
                            <span className="text-xs text-muted-foreground ml-2">(Full: {invoice.order_id})</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
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
                        {invoice && (
                          <FormDescription>
                            Outstanding: {formatOutstandingAmount(invoice.outstanding_amount)}
                          </FormDescription>
                        )}
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
                            <Button
                              type="button"
                              variant={"outline"}
                              className={cn("w-full pl-3 text-left font-normal")}
                              onClick={(e) => {
                                e.preventDefault();
                              }}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
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
                          <Input 
                            placeholder="e.g. Transaction ID, Check #" 
                            {...field}
                            value={field.value || ''}
                          />
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
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                    disabled={isLoading}
                    type="button"
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
                        Record Payment
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 