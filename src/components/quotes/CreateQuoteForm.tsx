import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '../ui/tabs';
import { Button } from '../ui/button';
import { supabase } from '../../lib/supabase';
import { useToast } from '../ui/use-toast';
import { calculateQuoteTotal } from './utils/calculateTotals';
import { ArrowLeft, Home, FileText, ChevronRight, Check } from 'lucide-react';

// Step components
import CustomerSelection from './steps/CustomerSelection';
import ProductSelection from './steps/ProductSelection';
import DeliveryDetails from './steps/DeliveryDetails';
import QuoteSummary from './steps/QuoteSummary';

// Define the steps in order
const steps = ['customer', 'products', 'delivery', 'summary'];

export default function CreateQuoteForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeStep, setActiveStep] = useState('customer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Quote data state
  const [quoteData, setQuoteData] = useState({
    customer_id: null as string | null,
    delivery_address: '',
    delivery_date: null as string | null,
    transport_cost: 0,
    items: [] as {
      product_id: string;
      product_name: string;
      unit: string;
      quantity: number;
      unit_price: number;
      line_total: number;
    }[],
    services: [] as {
      service_id: string;
      name: string;
      rate: number;
    }[]
  });

  // Navigation functions
  const nextStep = () => {
    const currentIndex = steps.indexOf(activeStep);
    if (currentIndex < steps.length - 1) {
      setActiveStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const currentIndex = steps.indexOf(activeStep);
    if (currentIndex > 0) {
      setActiveStep(steps[currentIndex - 1]);
    }
  };

  // Update quote data
  const updateQuoteData = useCallback((data: Partial<typeof quoteData>) => {
    setQuoteData(prev => ({ ...prev, ...data }));
  }, []);

  // Submit quote to database
  const handleSubmitQuote = async () => {
    setIsSubmitting(true);
    
    try {
      // Calculate total amount
      const totalAmount = calculateQuoteTotal(
        quoteData.items,
        quoteData.services,
        quoteData.transport_cost
      );
      
      // 1. Insert the quote first
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          customer_id: quoteData.customer_id,
          delivery_address: quoteData.delivery_address,
          delivery_date: quoteData.delivery_date,
          transport_cost: quoteData.transport_cost,
          total_amount: totalAmount,
          status: 'draft'
        })
        .select()
        .single();
        
      if (quoteError) {
        console.error('Error inserting quote:', quoteError);
        throw new Error(`Failed to create quote: ${quoteError.message || 'Database error'}`);
      }
      
      if (!quote || !quote.id) {
        throw new Error('Quote was created but no ID was returned');
      }
      
      // 2. Insert quote items
      if (quoteData.items.length > 0) {
        const quoteItems = quoteData.items.map(item => ({
          quote_id: quote.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_total: item.line_total
        }));
        
        const { error: itemsError } = await supabase
          .from('quote_items')
          .insert(quoteItems);
          
        if (itemsError) {
          console.error('Error inserting quote items:', itemsError);
          throw new Error(`Failed to add products to quote: ${itemsError.message || 'Database error'}`);
        }
      }
      
      // 3. Insert quote services
      if (quoteData.services && quoteData.services.length > 0) {
        const quoteServices = quoteData.services.map(service => ({
          quote_id: quote.id,
          service_id: service.service_id,
          rate: service.rate
        }));
        
        const { error: servicesError } = await supabase
          .from('quote_services')
          .insert(quoteServices);
          
        if (servicesError) {
          console.error('Error inserting quote services:', servicesError);
          throw new Error(`Failed to add services to quote: ${servicesError.message || 'Database error'}`);
        }
      }
      
      // Show success message
      toast({
        title: 'Quote Created',
        description: `Quote #${quote.id.slice(0, 8)} has been created successfully.`,
        className: "bg-green-50 border-green-200 text-green-800",
      });
      
      // Navigate to quotes list or quote detail
      navigate('/dashboard/quotes');
    } catch (err: any) {
      console.error('Error creating quote:', err);
      toast({
        title: 'Error Creating Quote',
        description: err.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validation before proceeding to next step
  const validateStep = () => {
    switch (activeStep) {
      case 'customer':
        if (!quoteData.customer_id) {
          toast({
            title: 'Customer Required',
            description: 'Please select a customer before proceeding',
            variant: 'destructive',
          });
          return false;
        }
        return true;
        
      case 'products':
        if (quoteData.items.length === 0) {
          toast({
            title: 'Products Required',
            description: 'Please add at least one product to the quote',
            variant: 'destructive',
          });
          return false;
        }
        return true;
        
      case 'delivery':
        if (!quoteData.delivery_address) {
          toast({
            title: 'Delivery Address Required',
            description: 'Please enter a delivery address',
            variant: 'destructive',
          });
          return false;
        }
        if (!quoteData.delivery_date) {
          toast({
            title: 'Delivery Date Required',
            description: 'Please select a delivery date',
            variant: 'destructive',
          });
          return false;
        }
        return true;
        
      default:
        return true;
    }
  };

  const handleContinue = () => {
    if (validateStep()) {
      nextStep();
    }
  };

  // Check if step is completed
  const isStepCompleted = (step: string) => {
    switch(step) {
      case 'customer':
        return !!quoteData.customer_id;
      case 'products':
        return quoteData.items.length > 0;
      case 'delivery':
        return !!quoteData.delivery_address && !!quoteData.delivery_date;
      default:
        return false;
    }
  };

  // Get current step index (0-based)
  const currentStepIndex = steps.indexOf(activeStep);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-jet-600">Create Quote</h1>
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
              <span className="text-jet-600">Create Quote</span>
            </nav>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/dashboard/quotes')}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Quotes
          </Button>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Progress Indicator */}
        <div className="mb-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step} className="flex flex-col items-center relative w-full">
                {/* Connector line */}
                {index > 0 && (
                  <div 
                    className={`absolute top-4 h-0.5 w-full -left-1/2 ${
                      currentStepIndex >= index ? 'bg-buff-500' : 'bg-gray-200'
                    }`}
                  />
                )}
                
                {/* Step circle */}
                <button
                  onClick={() => {
                    // Allow navigation to completed steps
                    if (isStepCompleted(steps[index - 1]) || index === 0) {
                      setActiveStep(step);
                    }
                  }}
                  disabled={index > 0 && !isStepCompleted(steps[index - 1])}
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 z-10 text-sm font-medium ${
                    currentStepIndex === index
                      ? 'border-buff-500 bg-buff-500 text-white'
                      : currentStepIndex > index || isStepCompleted(step)
                      ? 'border-buff-500 bg-white text-buff-500'
                      : 'border-gray-300 bg-white text-gray-400'
                  }`}
                >
                  {isStepCompleted(step) ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </button>
                
                {/* Step label */}
                <div className={`mt-2 text-sm font-medium ${
                  currentStepIndex === index
                    ? 'text-buff-500'
                    : 'text-gray-500'
                }`}>
                  {step.charAt(0).toUpperCase() + step.slice(1)}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-8 max-w-4xl mx-auto">
          <Tabs value={activeStep} onValueChange={setActiveStep} className="space-y-8">
            <TabsContent value="customer" className="mt-0 pt-2">
              <CustomerSelection 
                quoteData={quoteData} 
                updateQuoteData={updateQuoteData} 
              />
              <div className="mt-8 flex justify-end">
                <Button 
                  onClick={handleContinue}
                  className="bg-buff-500 hover:bg-buff-600 text-white font-medium px-6"
                >
                  Continue to Products
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="products" className="mt-0 pt-2">
              <ProductSelection 
                quoteData={quoteData} 
                updateQuoteData={updateQuoteData} 
              />
              <div className="mt-8 flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={prevStep}
                  className="font-medium"
                >
                  Back to Customer
                </Button>
                <Button 
                  onClick={handleContinue}
                  className="bg-buff-500 hover:bg-buff-600 text-white font-medium px-6"
                >
                  Continue to Delivery
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="delivery" className="mt-0 pt-2">
              <DeliveryDetails 
                quoteData={quoteData} 
                updateQuoteData={updateQuoteData} 
              />
              <div className="mt-8 flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={prevStep}
                  className="font-medium"
                >
                  Back to Products
                </Button>
                <Button 
                  onClick={handleContinue}
                  className="bg-buff-500 hover:bg-buff-600 text-white font-medium px-6"
                >
                  Continue to Summary
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="summary" className="mt-0 pt-2">
              <QuoteSummary 
                quoteData={quoteData}
                onSubmit={handleSubmitQuote}
                onBack={prevStep}
                isSubmitting={isSubmitting}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
} 