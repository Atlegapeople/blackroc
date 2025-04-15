import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  Home, 
  Users, 
  ChevronRight, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2,
  ArrowUpDown,
  Building,
  Mail,
  Phone,
  MoreHorizontal,
  RefreshCw,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from '../ui/label';

// Define customer type
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  user_id: string;
  created_at: string;
}

// Customer form interface
interface CustomerFormData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  company: string;
}

export default function CustomerList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
  });
  const [isEditMode, setIsEditMode] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const pageSize = 10;
  
  // Refresh customers list
  const refreshCustomers = () => {
    setIsRefreshing(true);
    setRefreshKey(prev => prev + 1);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    fetchCustomers();
  }, [sortField, sortDirection, currentPage, refreshKey]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // First get the count of all customers
      const { count, error: countError } = await supabase
        .from('customers')
        .select('id', { count: 'exact' });
      
      if (countError) throw countError;
      setTotalCustomers(count || 0);
      
      // Then fetch the actual customers for the current page
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order(sortField, { ascending: sortDirection === 'asc' })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (error) throw error;
      setCustomers(data || []);
      
      // Reset selection when data changes
      setSelectedCustomers([]);
      setIsAllSelected(false);
    } catch (err) {
      console.error('Error fetching customers:', err);
      toast({
        title: "Failed to load customers",
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

  // Filter customers by search query
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = 
        (customer.name && customer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (customer.company && customer.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (customer.phone && customer.phone.includes(searchQuery));
      
      return matchesSearch;
    });
  }, [customers, searchQuery]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Handle customer selection
  const toggleSelectCustomer = (customerId: string) => {
    setSelectedCustomers(prev => {
      if (prev.includes(customerId)) {
        return prev.filter(id => id !== customerId);
      } else {
        return [...prev, customerId];
      }
    });
  };
  
  // Handle select all customers
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map(customer => customer.id));
    }
    setIsAllSelected(!isAllSelected);
  };
  
  // Calculate total pages
  const totalPages = Math.ceil(totalCustomers / pageSize);
  
  // Handle page change
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };
  
  // Delete a customer
  const deleteCustomer = async (customerId: string | null) => {
    if (!customerId) return;
    
    try {
      // Check if customer has quotes
      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select('id')
        .eq('customer_id', customerId);
        
      if (quotesError) throw quotesError;
      
      if (quotesData && quotesData.length > 0) {
        toast({
          title: "Cannot delete customer",
          description: "This customer has associated quotes and cannot be deleted.",
          variant: "destructive"
        });
        return;
      }
      
      // Delete the customer
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);
        
      if (error) throw error;
      
      toast({
        title: "Customer deleted",
        description: "The customer has been successfully deleted",
        className: "bg-green-50 border-green-200 text-green-800",
      });
      
      // Refresh customers
      refreshCustomers();
    } catch (err) {
      console.error('Error deleting customer:', err);
      toast({
        title: "Failed to delete customer",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };
  
  // Delete selected customers
  const deleteSelectedCustomers = async () => {
    if (selectedCustomers.length === 0) return;
    
    try {
      for (const customerId of selectedCustomers) {
        // Check if customer has quotes
        const { data: quotesData, error: quotesError } = await supabase
          .from('quotes')
          .select('id')
          .eq('customer_id', customerId);
          
        if (quotesError) throw quotesError;
        
        if (quotesData && quotesData.length > 0) {
          continue; // Skip deleting this customer
        }
        
        // Delete the customer
        await supabase
          .from('customers')
          .delete()
          .eq('id', customerId);
      }
      
      toast({
        title: "Customers deleted",
        description: `Selected customers have been deleted successfully`,
        className: "bg-green-50 border-green-200 text-green-800",
      });
      
      // Refresh customers
      refreshCustomers();
      setSelectedCustomers([]);
    } catch (err) {
      console.error('Error deleting customers:', err);
      toast({
        title: "Failed to delete customers",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
    });
    setFormErrors({});
    setIsEditMode(false);
  };

  // Open form to add new customer
  const openAddCustomerForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  // Open form to edit customer
  const openEditCustomerForm = (customer: Customer) => {
    setFormData({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company || '',
    });
    setIsEditMode(true);
    setIsFormOpen(true);
  };

  // Form field change handler
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is modified
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit customer form
  const handleSubmitCustomer = async () => {
    if (!validateForm()) return;
    
    try {
      if (isEditMode && formData.id) {
        // Update existing customer
        const { error } = await supabase
          .from('customers')
          .update({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            company: formData.company,
          })
          .eq('id', formData.id);
          
        if (error) throw error;
        
        toast({
          title: "Customer updated",
          description: "Customer information has been updated successfully",
          className: "bg-green-50 border-green-200 text-green-800",
        });
      } else {
        // Create new customer
        const { data: authData } = await supabase.auth.getUser();
        
        if (!authData.user) {
          toast({
            title: "Authentication required",
            description: "Please sign in to add a customer",
            variant: "destructive"
          });
          return;
        }
        
        const { error } = await supabase
          .from('customers')
          .insert({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            company: formData.company,
            user_id: authData.user.id
          });
          
        if (error) throw error;
        
        toast({
          title: "Customer added",
          description: "New customer has been added successfully",
          className: "bg-green-50 border-green-200 text-green-800",
        });
      }
      
      // Close form and refresh list
      setIsFormOpen(false);
      resetForm();
      refreshCustomers();
    } catch (err) {
      console.error('Error saving customer:', err);
      toast({
        title: "Failed to save customer",
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
            <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
            <nav className="flex items-center space-x-1 text-sm text-gray-500 mt-1">
              <Link to="/dashboard" className="hover:text-gray-700 flex items-center">
                <Home className="w-3.5 h-3.5 mr-1" />
                Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-gray-700 flex items-center">
                <Users className="w-3.5 h-3.5 mr-1" />
                Customers
              </span>
            </nav>
          </div>
          
          <Button 
            onClick={openAddCustomerForm}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Customer
          </Button>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search customers..."
                className="pl-10 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                onClick={refreshCustomers}
                variant="outline" 
                size="sm"
                className="flex items-center"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              {selectedCustomers.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={deleteSelectedCustomers}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Delete Selected
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Customers Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox 
                      checked={isAllSelected} 
                      onCheckedChange={toggleSelectAll} 
                      aria-label="Select all customers" 
                    />
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                    <div className="flex items-center">
                      Name
                      {sortField === 'name' && (
                        <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('email')}>
                    <div className="flex items-center">
                      Email
                      {sortField === 'email' && (
                        <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('phone')}>
                    <div className="flex items-center">
                      Phone
                      {sortField === 'phone' && (
                        <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('company')}>
                    <div className="flex items-center">
                      Company
                      {sortField === 'company' && (
                        <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort('created_at')}>
                    <div className="flex items-center">
                      Added On
                      {sortField === 'created_at' && (
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
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <span className="ml-2">Loading customers...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Users className="w-10 h-10 text-gray-400" />
                        <div className="text-gray-500">No customers found</div>
                        <Button 
                          onClick={openAddCustomerForm}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add Customer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} className={selectedCustomers.includes(customer.id) ? "bg-blue-50" : ""}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedCustomers.includes(customer.id)} 
                          onCheckedChange={() => toggleSelectCustomer(customer.id)} 
                          aria-label={`Select ${customer.name}`} 
                        />
                      </TableCell>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-500" />
                          {customer.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-500" />
                          {customer.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.company ? (
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-2 text-gray-500" />
                            {customer.company}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(customer.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditCustomerForm(customer)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Customer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => {
                                setCustomerToDelete(customer.id);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                              Delete Customer
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
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t border-gray-100">
              <div className="text-sm text-gray-500">
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCustomers)} of {totalCustomers} customers
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
                <span className="text-sm font-medium">
                  Page {currentPage} of {totalPages}
                </span>
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
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this customer and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCustomer(customerToDelete)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Customer Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={(open) => {
        setIsFormOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? 'Update customer information' 
                : 'Fill in the details below to add a new customer'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name*
              </Label>
              <div className="col-span-3">
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className={formErrors.name ? "border-red-300" : ""}
                />
                {formErrors.name && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.name}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email*
              </Label>
              <div className="col-span-3">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className={formErrors.email ? "border-red-300" : ""}
                />
                {formErrors.email && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.email}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone*
              </Label>
              <div className="col-span-3">
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  className={formErrors.phone ? "border-red-300" : ""}
                />
                {formErrors.phone && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.phone}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="company" className="text-right">
                Company
              </Label>
              <Input
                id="company"
                name="company"
                value={formData.company}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSubmitCustomer}>
              {isEditMode ? 'Update Customer' : 'Add Customer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 