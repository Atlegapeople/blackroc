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
  RefreshCw
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
        return <CheckCircle className="w-3.5 h-3.5 mr-1.5 font-bold" />;
      case 'pending':
        return <Clock className="w-3.5 h-3.5 mr-1.5 font-bold" />;
      case 'draft':
        return <FileText className="w-3.5 h-3.5 mr-1.5 font-bold" />;
      case 'rejected':
        return <XCircle className="w-3.5 h-3.5 mr-1.5 font-bold" />;
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

// Define quote type
interface Quote {
  id: string;
  customer_id: string;
  created_at: string;
  delivery_date: string | null;
  delivery_address: string | null;
  total_amount: number;
  status: string;
  customers: {
    name: string;
  };
}

export default function QuoteList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalQuotes, setTotalQuotes] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [quoteToDelete, setQuoteToDelete] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const pageSize = 10;
  
  // Refresh quotes list
  const refreshQuotes = () => {
    setIsRefreshing(true);
    setRefreshKey(prev => prev + 1);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    fetchQuotes();
  }, [sortField, sortDirection, filterStatus, currentPage, refreshKey]);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      // First get the count of all quotes matching our filter
      let countQuery = supabase
        .from('quotes')
        .select('id', { count: 'exact' });
        
      if (filterStatus) {
        countQuery = countQuery.eq('status', filterStatus);
      }
      
      const { count, error: countError } = await countQuery;
      
      if (countError) throw countError;
      setTotalQuotes(count || 0);
      
      // Then fetch the actual quotes for the current page
      let query = supabase
        .from('quotes')
        .select(`
          *,
          customers:customer_id (name)
        `)
        .order(sortField, { ascending: sortDirection === 'asc' })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (filterStatus) {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setQuotes(data || []);
      
      // Reset selection when data changes
      setSelectedQuotes([]);
      setIsAllSelected(false);
    } catch (err) {
      console.error('Error fetching quotes:', err);
      toast({
        title: "Failed to load quotes",
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

  // Filter quotes by search query
  const filteredQuotes = useMemo(() => {
    return quotes.filter(quote => {
      const matchesSearch = 
        (quote.id && quote.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (quote.customers?.name && quote.customers.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (quote.delivery_address && quote.delivery_address.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesSearch;
    });
  }, [quotes, searchQuery]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Handle quote selection
  const toggleSelectQuote = (quoteId: string) => {
    setSelectedQuotes(prev => {
      if (prev.includes(quoteId)) {
        return prev.filter(id => id !== quoteId);
      } else {
        return [...prev, quoteId];
      }
    });
  };
  
  // Handle select all quotes
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedQuotes([]);
    } else {
      setSelectedQuotes(filteredQuotes.map(quote => quote.id));
    }
    setIsAllSelected(!isAllSelected);
  };
  
  // Calculate total pages
  const totalPages = Math.ceil(totalQuotes / pageSize);
  
  // Handle page change
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };
  
  // Delete a quote
  const deleteQuote = async (quoteId: string | null) => {
    if (!quoteId) return;
    
    try {
      // Delete quote items
      const { error: itemsError } = await supabase
        .from('quote_items')
        .delete()
        .eq('quote_id', quoteId);
        
      if (itemsError) throw itemsError;
      
      // Delete quote services
      const { error: servicesError } = await supabase
        .from('quote_services')
        .delete()
        .eq('quote_id', quoteId);
        
      if (servicesError) throw servicesError;
      
      // Delete the quote
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', quoteId);
        
      if (error) throw error;
      
      toast({
        title: "Quote deleted",
        description: "The quote has been successfully deleted",
        className: "bg-green-50 border-green-200 text-green-800",
      });
      
      // Refresh quotes
      refreshQuotes();
    } catch (err) {
      console.error('Error deleting quote:', err);
      toast({
        title: "Failed to delete quote",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };
  
  // Delete selected quotes
  const deleteSelectedQuotes = async () => {
    if (selectedQuotes.length === 0) return;
    
    try {
      for (const quoteId of selectedQuotes) {
        // Delete quote items
        await supabase
          .from('quote_items')
          .delete()
          .eq('quote_id', quoteId);
        
        // Delete quote services
        await supabase
          .from('quote_services')
          .delete()
          .eq('quote_id', quoteId);
        
        // Delete the quote
        await supabase
          .from('quotes')
          .delete()
          .eq('id', quoteId);
      }
      
      toast({
        title: "Quotes deleted",
        description: `${selectedQuotes.length} quote(s) have been successfully deleted`,
        className: "bg-green-50 border-green-200 text-green-800",
      });
      
      // Refresh quotes
      refreshQuotes();
      setSelectedQuotes([]);
    } catch (err) {
      console.error('Error deleting quotes:', err);
      toast({
        title: "Failed to delete quotes",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };
  
  // Duplicate a quote
  const duplicateQuote = async (quoteId: string) => {
    try {
      // Get the quote to duplicate
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single();
        
      if (quoteError) throw quoteError;
      
      // Get the quote items
      const { data: items, error: itemsError } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', quoteId);
        
      if (itemsError) throw itemsError;
      
      // Get the quote services
      const { data: services, error: servicesError } = await supabase
        .from('quote_services')
        .select('*')
        .eq('quote_id', quoteId);
        
      if (servicesError) throw servicesError;
      
      // Create a new quote with the same data but status="draft"
      const { data: newQuote, error: newQuoteError } = await supabase
        .from('quotes')
        .insert({
          customer_id: quote.customer_id,
          delivery_address: quote.delivery_address,
          delivery_date: quote.delivery_date,
          transport_cost: quote.transport_cost,
          total_amount: quote.total_amount,
          status: 'draft'
        })
        .select()
        .single();
        
      if (newQuoteError) throw newQuoteError;
      
      // Create new quote items
      if (items && items.length > 0) {
        const newItems = items.map(item => ({
          quote_id: newQuote.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_total: item.line_total
        }));
        
        const { error: newItemsError } = await supabase
          .from('quote_items')
          .insert(newItems);
          
        if (newItemsError) throw newItemsError;
      }
      
      // Create new quote services
      if (services && services.length > 0) {
        const newServices = services.map(service => ({
          quote_id: newQuote.id,
          service_id: service.service_id,
          rate: service.rate
        }));
        
        const { error: newServicesError } = await supabase
          .from('quote_services')
          .insert(newServices);
          
        if (newServicesError) throw newServicesError;
      }
      
      toast({
        title: "Quote duplicated",
        description: "A new draft quote has been created",
        className: "bg-green-50 border-green-200 text-green-800",
      });
      
      // Refresh quotes
      refreshQuotes();
    } catch (err) {
      console.error('Error duplicating quote:', err);
      toast({
        title: "Failed to duplicate quote",
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
            <h1 className="text-2xl font-bold text-jet-600">Quotes</h1>
            <nav className="flex items-center space-x-1 text-sm text-gray-500 mt-1">
              <Link to="/dashboard" className="hover:text-jet-600 flex items-center">
                <Home className="w-3.5 h-3.5 mr-1" />
                Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-jet-600 flex items-center">
                <FileText className="w-3.5 h-3.5 mr-1" />
                Quotes
              </span>
            </nav>
          </div>
          
          <Button 
            onClick={() => navigate('/dashboard/quotes/create')}
            className="bg-buff-500 hover:bg-buff-600 text-white font-medium px-4"
          >
            <Plus className="h-4 w-4 mr-2 stroke-[2.5px]" /> New Quote
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
                placeholder="Search quotes by ID, customer, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={refreshQuotes}
                disabled={isRefreshing}
                className="h-10 w-10 border-gray-300"
              >
                <RefreshCw className={`h-4 w-4 stroke-[2.5px] ${isRefreshing ? 'animate-spin text-buff-500' : 'text-gray-600'}`} />
              </Button>
            
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center border-gray-300">
                    <Filter className="h-4 w-4 mr-2 stroke-[2.5px]" />
                    {filterStatus ? (
                      <div className="flex items-center">
                        Status: <span className="ml-1 font-medium">{filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}</span>
                      </div>
                    ) : 'All Statuses'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setFilterStatus(null)}>
                    All Statuses
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('draft')}>
                    <FileText className="h-4 w-4 mr-2 stroke-[2.5px] text-gray-500" /> Draft
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('pending')}>
                    <Clock className="h-4 w-4 mr-2 stroke-[2.5px] text-amber-500" /> Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('approved')}>
                    <CheckCircle className="h-4 w-4 mr-2 stroke-[2.5px] text-green-500" /> Approved
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterStatus('rejected')}>
                    <XCircle className="h-4 w-4 mr-2 stroke-[2.5px] text-red-500" /> Rejected
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {selectedQuotes.length > 0 && (
                <Button 
                  variant="outline" 
                  className="text-red-600 border-red-200 hover:bg-red-50 font-medium"
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${selectedQuotes.length} quote(s)?`)) {
                      deleteSelectedQuotes();
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2 stroke-[2.5px]" />
                  Delete {selectedQuotes.length} selected
                </Button>
              )}
            </div>
          </div>
          
          {/* Quotes Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox 
                      checked={isAllSelected} 
                      onCheckedChange={toggleSelectAll} 
                      aria-label="Select all quotes" 
                    />
                  </TableHead>
                  <TableHead className="w-[100px] cursor-pointer" onClick={() => handleSort('id')}>
                    <div className="flex items-center">
                      Quote ID
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
                  <TableHead className="cursor-pointer" onClick={() => handleSort('created_at')}>
                    <div className="flex items-center">
                      Date
                      {sortField === 'created_at' && (
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
                  <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                    <div className="flex items-center">
                      Status
                      {sortField === 'status' && (
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
                    <TableCell colSpan={8} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <div className="w-6 h-6 border-2 border-buff-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <span className="ml-2">Loading quotes...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredQuotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <FileText className="w-10 h-10 text-gray-400" />
                        <div className="text-gray-500">No quotes found</div>
                        <Button 
                          onClick={() => navigate('/dashboard/quotes/create')}
                          className="bg-buff-500 hover:bg-buff-600 text-white"
                        >
                          <Plus className="h-4 w-4 mr-1" /> Create Quote
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuotes.map((quote) => (
                    <TableRow key={quote.id} className={selectedQuotes.includes(quote.id) ? "bg-buff-50" : ""}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedQuotes.includes(quote.id)} 
                          onCheckedChange={() => toggleSelectQuote(quote.id)} 
                          aria-label={`Select quote ${quote.id}`} 
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        #{quote.id.substring(0, 8)}
                      </TableCell>
                      <TableCell>{quote.customers?.name || 'Unknown'}</TableCell>
                      <TableCell>{quote.created_at ? formatDate(quote.created_at) : 'N/A'}</TableCell>
                      <TableCell>{quote.delivery_date ? formatDate(quote.delivery_date) : 'Not set'}</TableCell>
                      <TableCell>{formatCurrency(quote.total_amount || 0)}</TableCell>
                      <TableCell>
                        <StatusBadge status={quote.status || 'draft'} />
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
                            <DropdownMenuItem onClick={() => navigate(`/dashboard/quotes/${quote.id}`)}>
                              <Eye className="h-4.5 w-4.5 mr-2 stroke-[2.5px] text-blue-600" />
                              View Quote
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => navigate(`/dashboard/quotes/${quote.id}/edit`)}
                              disabled={quote.status === 'approved'}
                            >
                              <Edit className="h-4.5 w-4.5 mr-2 stroke-[2.5px] text-amber-600" />
                              Edit Quote
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicateQuote(quote.id)}>
                              <Copy className="h-4.5 w-4.5 mr-2 stroke-[2.5px] text-green-600" />
                              Duplicate Quote
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => {
                                setQuoteToDelete(quote.id);
                                setIsDeleteDialogOpen(true);
                              }}
                              disabled={quote.status === 'approved'}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4.5 w-4.5 mr-2 stroke-[2.5px] text-red-600" />
                              Delete Quote
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
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalQuotes)} of {totalQuotes} quotes
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
      
      {/* Delete Quote Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this quote?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The quote and all its items will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                deleteQuote(quoteToDelete);
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