import React, { useEffect, useState } from 'react';
import { Button } from '../../ui/button';
import { formatCurrency, calculateQuoteTotal } from '../utils/calculateTotals';
import { FileText, Calendar, MapPin, Truck, ShoppingBag, User } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../ui/use-toast';

interface QuoteItem {
  product_id: string;
  product_name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface QuoteService {
  service_id: string;
  name: string;
  rate: number;
}

interface QuoteSummaryProps {
  quoteData: {
    customer_id: string | null;
    delivery_address: string;
    delivery_date: string | null;
    transport_cost: number;
    items: QuoteItem[];
    services: QuoteService[];
  };
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export default function QuoteSummary({ 
  quoteData, 
  onSubmit, 
  onBack, 
  isSubmitting 
}: QuoteSummaryProps) {
  const [customer, setCustomer] = useState<any>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const { toast } = useToast();

  const totalAmount = calculateQuoteTotal(
    quoteData.items,
    quoteData.services,
    quoteData.transport_cost
  );

  useEffect(() => {
    if (quoteData.customer_id) {
      fetchCustomerDetails(quoteData.customer_id);
    }
  }, [quoteData.customer_id]);

  const fetchCustomerDetails = async (customerId: string) => {
    setLoadingCustomer(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (error) throw error;
      setCustomer(data);
    } catch (err) {
      console.error('Error fetching customer details:', err);
      toast({
        title: "Error",
        description: "Failed to load customer details",
        variant: "destructive",
      });
    } finally {
      setLoadingCustomer(false);
    }
  };

  const validateQuote = () => {
    const issues = [];
    
    if (!quoteData.customer_id) {
      issues.push("No customer selected");
    }
    
    if (quoteData.items.length === 0) {
      issues.push("No products added to quote");
    }
    
    if (!quoteData.delivery_address) {
      issues.push("Delivery address is missing");
    }
    
    if (!quoteData.delivery_date) {
      issues.push("Delivery date is not specified");
    }
    
    return issues;
  };

  const handleSubmit = () => {
    const issues = validateQuote();
    
    if (issues.length > 0) {
      toast({
        title: "Cannot Submit Quote",
        description: (
          <ul className="list-disc pl-4 mt-2">
            {issues.map((issue, index) => (
              <li key={index}>{issue}</li>
            ))}
          </ul>
        ),
        variant: "destructive",
      });
      return;
    }
    
    onSubmit();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Quote Summary</h3>
      
        {/* Customer Section */}
        <div className="bg-white border rounded-md p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <User className="h-5 w-5 text-buff-500" />
            <h4 className="font-medium">Customer</h4>
          </div>
          
          {loadingCustomer ? (
            <div className="p-2 text-center text-sm">Loading customer details...</div>
          ) : customer ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <p className="text-gray-500">Name</p>
                <p className="font-medium">{customer.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium">{customer.email}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone</p>
                <p className="font-medium">{customer.phone}</p>
              </div>
              <div>
                <p className="text-gray-500">Company</p>
                <p className="font-medium">{customer.company || 'N/A'}</p>
              </div>
            </div>
          ) : (
            <div className="p-2 text-center text-sm text-red-500">
              No customer selected. Please go back and select a customer.
            </div>
          )}
        </div>
        
        {/* Items Section */}
        <div className="bg-white border rounded-md p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <ShoppingBag className="h-5 w-5 text-buff-500" />
            <h4 className="font-medium">Products</h4>
          </div>
          
          {quoteData.items.length === 0 ? (
            <div className="p-2 text-center text-sm text-red-500">
              No products added. Please go back and add products.
            </div>
          ) : (
            <div className="divide-y">
              {quoteData.items.map((item, index) => (
                <div key={index} className="py-2 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-xs text-gray-500">
                      {item.quantity} {item.unit} x {formatCurrency(item.unit_price)}
                    </p>
                  </div>
                  <div className="font-medium">
                    {formatCurrency(item.line_total)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Delivery Section */}
        <div className="bg-white border rounded-md p-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Truck className="h-5 w-5 text-buff-500" />
            <h4 className="font-medium">Delivery Details</h4>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-500 text-sm">Delivery Address</p>
                  {quoteData.delivery_address ? (
                    <p className="whitespace-pre-line">{quoteData.delivery_address}</p>
                  ) : (
                    <p className="text-red-500 text-sm">No delivery address specified</p>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <div className="flex items-start space-x-2">
                <Calendar className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-gray-500 text-sm">Delivery Date</p>
                  {quoteData.delivery_date ? (
                    <p>{new Date(quoteData.delivery_date).toLocaleDateString()}</p>
                  ) : (
                    <p className="text-red-500 text-sm">No delivery date specified</p>
                  )}
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-gray-500 text-sm">Transport Cost</p>
              <p className="font-medium">{formatCurrency(quoteData.transport_cost)}</p>
            </div>
          </div>
        </div>
        
        {/* Additional Services */}
        {quoteData.services.length > 0 && (
          <div className="bg-white border rounded-md p-4 mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <FileText className="h-5 w-5 text-buff-500" />
              <h4 className="font-medium">Additional Services</h4>
            </div>
            
            <div className="divide-y">
              {quoteData.services.map((service, index) => (
                <div key={index} className="py-2 flex justify-between items-center">
                  <div>
                    <p>{service.name}</p>
                  </div>
                  <div className="font-medium">
                    {formatCurrency(service.rate)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Total Section */}
        <div className="bg-buff-50 border border-buff-200 rounded-md p-4">
          <div className="flex justify-between items-center">
            <h4 className="font-medium">Total Quote Amount</h4>
            <span className="text-xl font-bold">{formatCurrency(totalAmount)}</span>
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            <p>This is an estimate and may be subject to change based on final delivery details.</p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="mt-8 flex justify-between">
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
          >
            Back to Delivery Details
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-buff-500 hover:bg-buff-600"
          >
            {isSubmitting ? "Creating Quote..." : "Create Quote"}
          </Button>
        </div>
      </div>
    </div>
  );
} 