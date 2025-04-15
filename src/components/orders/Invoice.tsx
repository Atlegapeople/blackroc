import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils';
import { useReactToPrint } from 'react-to-print';
import { 
  Home, 
  Package, 
  ChevronRight, 
  Printer, 
  Download, 
  ArrowLeft,
  Calendar,
  FileText,
  Building,
  Phone,
  Mail,
  User,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../ui/button';
import logo from '../../images/logo.png';
import { Skeleton } from '../ui/skeleton';
import { format } from 'date-fns';

interface InvoiceItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface InvoiceService {
  id: string;
  name: string;
  rate: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_company?: string;
  customer_address?: string;
  date_created: string;
  date_paid: string;
  items: InvoiceItem[];
  services: InvoiceService[];
  transport_cost: number;
  subtotal: number;
  vat: number;
  total: number;
  payment_method: string;
  payment_status: string;
}

const InvoiceView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  // React-to-print hook setup
  const handlePrint = useCallback(() => {
    if (invoiceRef.current) {
      useReactToPrint({
        content: () => invoiceRef.current,
        documentTitle: `Invoice-${invoice?.invoice_number || 'BlackRoc'}`,
      } as any)();
    }
  }, [invoice]);
  
  useEffect(() => {
    const fetchInvoiceData = async () => {
      try {
        setLoading(true);
        
        // Fetch order details
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .select("*")
          .eq("id", id)
          .single();

        if (orderError) throw orderError;
        
        // Check if order is paid
        if (order.payment_status !== "paid") {
          setError("Invoice is only available for paid orders");
          setLoading(false);
          return;
        }

        // Fetch associated quote for items and services
        const { data: quote, error: quoteError } = await supabase
          .from("quotes")
          .select("*")
          .eq("id", order.quote_id)
          .single();

        if (quoteError) throw quoteError;

        // Fetch customer details
        const { data: customer, error: customerError } = await supabase
          .from("customers")
          .select("*")
          .eq("id", order.customer_id)
          .single();

        if (customerError) throw customerError;

        // Fetch quote items
        const { data: items, error: itemsError } = await supabase
          .from("quote_items")
          .select(`
            *,
            product:product_id (
              name,
              unit
            )
          `)
          .eq("quote_id", quote.id);

        if (itemsError) throw itemsError;

        // Fetch quote services
        const { data: services, error: servicesError } = await supabase
          .from("quote_services")
          .select(`
            *,
            service:service_id (
              name
            )
          `)
          .eq("quote_id", quote.id);

        if (servicesError) throw servicesError;

        // Calculate totals from items and services
        const itemsTotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unit_price), 0);
        const servicesTotal = services.reduce((sum: number, service: any) => sum + service.rate, 0);
        const transportCost = order.transport_cost || 0;
        const calculatedSubtotal = itemsTotal + servicesTotal + transportCost;
        const calculatedVat = calculatedSubtotal * 0.15; // 15% VAT

        // Create invoice object
        const invoiceData: Invoice = {
          id: `inv-${order.id}`,
          invoice_number: `INV-${order.id.substring(0, 8).toUpperCase()}`,
          order_id: order.id,
          customer_id: customer.id,
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: customer.phone,
          customer_company: customer.company,
          customer_address: customer.address,
          date_created: order.created_at,
          date_paid: order.updated_at, // Using updated_at as payment date
          items: items.map((item: any) => ({
            id: item.id,
            name: item.product?.name || item.product_name || 'Product',
            description: item.description || "",
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.quantity * item.unit_price,
          })),
          services: services.map((service: any) => ({
            id: service.id,
            name: service.service?.name || service.service_name || 'Service',
            rate: service.rate,
          })),
          transport_cost: transportCost,
          subtotal: isNaN(quote.subtotal) ? calculatedSubtotal : quote.subtotal,
          vat: isNaN(quote.vat_amount) ? calculatedVat : quote.vat_amount,
          total: isNaN(quote.total_amount) ? calculatedSubtotal + calculatedVat : quote.total_amount,
          payment_method: order.payment_method || "Bank Transfer",
          payment_status: order.payment_status,
        };

        setInvoice(invoiceData);
      } catch (error: any) {
        console.error("Error fetching invoice data:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchInvoiceData();
    }
  }, [id]);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <div className="text-red-500 text-5xl mb-4">
            <FileText className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Invoice Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => navigate(-1)} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }
  
  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <div className="text-gray-400 text-5xl mb-4">
            <FileText className="h-16 w-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Invoice Not Found</h2>
          <p className="text-gray-600 mb-6">The requested invoice could not be found.</p>
          <Button onClick={() => navigate(-1)} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Invoice</h1>
            <nav className="flex items-center space-x-1 text-sm text-gray-500 mt-1">
              <Link to="/dashboard" className="hover:text-gray-700 flex items-center">
                <Home className="w-3.5 h-3.5 mr-1" />
                Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link to="/dashboard/orders" className="hover:text-gray-700 flex items-center">
                <Package className="w-3.5 h-3.5 mr-1" />
                Orders
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <Link to={`/dashboard/orders/${id}`} className="hover:text-gray-700">
                Order #{id?.substring(0, 8)}
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-gray-700">Invoice</span>
            </nav>
          </div>
          
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button 
              variant="outline" 
              onClick={handlePrint}
              className="flex items-center"
              disabled={loading || !!error}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 flex items-center"
              onClick={handlePrint}
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </header>
      
      {/* Invoice Content */}
      <main className="py-8">
        <div className="max-w-5xl mx-auto px-6">
          {/* Print Preview */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
            <div ref={invoiceRef} className="p-8">
              {/* Invoice Header */}
              <div className="flex justify-between pb-8 border-b border-gray-200">
                <div>
                  <img src={logo} alt="BlackRoc Logo" className="h-12 mb-4" />
                  <div className="text-gray-700">
                    <h3 className="font-bold">BlackRoc Construction Materials</h3>
                    <p>123 Construction Way</p>
                    <p>Cape Town, South Africa, 8001</p>
                    <p className="flex items-center mt-2">
                      <Phone className="h-4 w-4 mr-1" /> +27 21 123 4567
                    </p>
                    <p className="flex items-center">
                      <Mail className="h-4 w-4 mr-1" /> billing@blackroc.co.za
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">INVOICE</h1>
                  <p className="font-medium text-gray-600">#{invoice.invoice_number}</p>
                  <div className="mt-4 flex flex-col items-end">
                    <div className="flex items-center mb-1">
                      <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                      <span className="text-sm text-gray-600 mr-1">Date:</span>
                      <span className="font-medium">{formatDate(invoice.date_created)}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                      <span className="text-sm text-gray-600 mr-1">Due Date:</span>
                      <span className="font-medium">{formatDate(invoice.date_paid)}</span>
                    </div>
                    <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                      Paid
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Bill To Section */}
              <div className="mt-8 mb-10">
                <h2 className="text-lg font-bold text-gray-800 mb-2">Bill To:</h2>
                <div className="text-gray-700">
                  <div className="flex items-start">
                    <User className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                    <div>
                      <p className="font-medium">{invoice.customer_name}</p>
                      {invoice.customer_company && (
                        <p className="flex items-center">
                          <Building className="h-4 w-4 mr-1 text-gray-500" />
                          {invoice.customer_company}
                        </p>
                      )}
                      <p className="flex items-center">
                        <Mail className="h-4 w-4 mr-1 text-gray-500" />
                        {invoice.customer_email}
                      </p>
                      <p className="flex items-center">
                        <Phone className="h-4 w-4 mr-1 text-gray-500" />
                        {invoice.customer_phone}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Invoice Items */}
              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Items</h2>
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="py-3 px-4 font-semibold text-gray-600">Description</th>
                      <th className="py-3 px-4 font-semibold text-gray-600 text-right">Quantity</th>
                      <th className="py-3 px-4 font-semibold text-gray-600 text-right">Unit Price</th>
                      <th className="py-3 px-4 font-semibold text-gray-600 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoice.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-4 px-4">{item.name}</td>
                        <td className="py-4 px-4 text-right">{item.quantity}</td>
                        <td className="py-4 px-4 text-right">{formatCurrency(item.unit_price)}</td>
                        <td className="py-4 px-4 text-right font-medium">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                    
                    {invoice.services.map((service) => (
                      <tr key={service.id}>
                        <td className="py-4 px-4">{service.name} (Service)</td>
                        <td className="py-4 px-4 text-right">1</td>
                        <td className="py-4 px-4 text-right">{formatCurrency(service.rate)}</td>
                        <td className="py-4 px-4 text-right font-medium">{formatCurrency(service.rate)}</td>
                      </tr>
                    ))}
                    
                    {invoice.transport_cost > 0 && (
                      <tr>
                        <td className="py-4 px-4">Transport</td>
                        <td className="py-4 px-4 text-right">1</td>
                        <td className="py-4 px-4 text-right">{formatCurrency(invoice.transport_cost)}</td>
                        <td className="py-4 px-4 text-right font-medium">{formatCurrency(invoice.transport_cost)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Totals */}
              <div className="border-t border-gray-200 pt-6 mt-6">
                <div className="flex justify-end">
                  <div className="w-72">
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Tax (15%):</span>
                      <span className="font-medium">{formatCurrency(invoice.vat)}</span>
                    </div>
                    <div className="flex justify-between pt-4 border-t border-gray-200 text-lg font-bold">
                      <span>Total:</span>
                      <span>{formatCurrency(invoice.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Payment Info & Notes */}
              <div className="mt-10 pt-6 border-t border-gray-200 grid grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3">Payment Information</h3>
                  <div className="text-gray-700">
                    <p><span className="font-medium">Bank:</span> South African National Bank</p>
                    <p><span className="font-medium">Account Name:</span> BlackRoc Construction Materials</p>
                    <p><span className="font-medium">Account Number:</span> 1234567890</p>
                    <p><span className="font-medium">Branch Code:</span> 123456</p>
                    <p><span className="font-medium">Reference:</span> {invoice.invoice_number}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3">Notes</h3>
                  <p className="text-gray-700">Thank you for your business. Payment has been received. This invoice serves as a record of your purchase.</p>
                  <p className="text-gray-700 mt-2">For any inquiries, please contact our accounting department at accounting@blackroc.co.za.</p>
                </div>
              </div>
              
              {/* Footer */}
              <div className="mt-12 pt-6 border-t border-gray-200 text-center text-gray-500 text-sm">
                <p>&copy; {new Date().getFullYear()} BlackRoc Construction Materials. All rights reserved.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InvoiceView; 