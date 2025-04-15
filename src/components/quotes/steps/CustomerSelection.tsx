import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Search } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
}

interface CustomerSelectionProps {
  quoteData: {
    customer_id: string | null;
    [key: string]: any;
  };
  updateQuoteData: (data: any) => void;
}

export default function CustomerSelection({ quoteData, updateQuoteData }: CustomerSelectionProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Fetch customers from Supabase
  useEffect(() => {
    async function fetchCustomers() {
      try {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .order('name');
          
        if (error) throw error;
        
        setCustomers(data || []);
        setFilteredCustomers(data || []);
        setIsLoading(false);
        
        // If quote already has a customer_id, find and select that customer
        if (quoteData.customer_id && data) {
          const selected = data.find(c => c.id === quoteData.customer_id);
          if (selected) {
            setSelectedCustomer(selected);
          }
        }
      } catch (err) {
        console.error('Error fetching customers:', err);
        setIsLoading(false);
      }
    }
    
    fetchCustomers();
  }, [quoteData.customer_id]);
  
  // Filter customers based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCustomers(customers);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = customers.filter(customer => 
      customer.name.toLowerCase().includes(query) || 
      customer.company?.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query) ||
      customer.phone.includes(query)
    );
    
    setFilteredCustomers(filtered);
  }, [searchQuery, customers]);
  
  // Update parent component when customer is selected
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    updateQuoteData({ customer_id: customer.id });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-jet-600">Select Customer</h2>
      
      {/* Search input */}
      <div className="relative">
        <Input
          type="text"
          placeholder="Search by name, company, email or phone"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
      </div>
      
      {/* Customer list */}
      <div className="mt-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-buff-500"></div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No customers found. Try a different search.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredCustomers.map((customer) => (
              <div 
                key={customer.id}
                onClick={() => handleSelectCustomer(customer)}
                className={`
                  p-4 rounded-lg border cursor-pointer transition-all
                  ${selectedCustomer?.id === customer.id 
                    ? 'border-buff-500 bg-buff-50 shadow-sm' 
                    : 'border-gray-200 hover:border-buff-300 hover:bg-buff-50/30'}
                `}
              >
                <div className="font-medium text-jet-700">{customer.name}</div>
                {customer.company && (
                  <div className="text-sm text-jet-600">{customer.company}</div>
                )}
                <div className="text-sm text-muted-foreground mt-1">{customer.email}</div>
                <div className="text-sm text-muted-foreground">{customer.phone}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 