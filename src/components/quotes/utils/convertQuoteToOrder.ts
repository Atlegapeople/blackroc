import { supabase } from '../../../lib/supabase';
import { formatCurrency } from '../../../lib/utils';
import { useToast } from '../../ui/use-toast';
import { createInvoiceFromOrder } from '../../../lib/services/financeService';

/**
 * Converts a quote to an order in the database
 * @param quoteId The ID of the quote to convert
 * @param customNotes Optional notes to add to the order
 * @returns The newly created order ID if successful
 * @throws Error if the conversion fails
 */
export async function convertQuoteToOrder(quoteId: string, customNotes?: string): Promise<string> {
  try {
    // 1. Get the quote data
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select(`
        *,
        customers:customer_id (
          name,
          email,
          phone,
          company
        )
      `)
      .eq('id', quoteId)
      .single();
    
    if (quoteError) throw new Error(`Failed to fetch quote: ${quoteError.message}`);
    if (!quote) throw new Error('Quote not found');
    
    // Check if quote is in a state that can be converted to an order
    if (quote.status !== 'approved') {
      throw new Error('Only approved quotes can be converted to orders');
    }
    
    // 2. Prepare the order data
    const orderData = {
      quote_id: quoteId,
      customer_id: quote.customer_id,
      delivery_address: quote.delivery_address || '',
      delivery_date: quote.delivery_date,
      total_amount: quote.total_amount,
      notes: customNotes || `Order created from Quote #${quoteId.substring(0, 8)}`,
      delivery_status: 'pending',
      payment_status: 'unpaid'
    };
    
    // 3. Insert the order into the database
    let insertResult;
    
    try {
      insertResult = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();
    } catch (insertErr) {
      console.error('Initial insert error:', insertErr);
      throw new Error(`Failed to create order: ${insertErr instanceof Error ? insertErr.message : 'Unknown error'}`);
    }
    
    // Check for RLS error
    if (insertResult.error) {
      console.error('Insert error with RLS:', insertResult.error);
      
      // If it's an RLS error, try to get the user session
      if (insertResult.error.message.includes('row-level security') || 
          insertResult.error.message.includes('violates row-level security policy')) {
        
        console.log('Detected RLS error, attempting with auth context');
        
        // Get the current session
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (!sessionData?.session) {
          throw new Error('Authentication required: Please sign in to create an order');
        }
        
        // Try again with explicit auth context
        const { data: order, error: retryError } = await supabase
          .from('orders')
          .insert(orderData)
          .select()
          .single();
        
        if (retryError) {
          console.error('Second attempt failed:', retryError);
          throw new Error(`RLS policy violation: ${retryError.message}. Make sure you are signed in as the customer who owns this quote.`);
        }
        
        if (!order) {
          throw new Error('Order was not created after retry');
        }
        
        // 4. Update the quote status since we succeeded
        await supabase
          .from('quotes')
          .update({ status: 'ordered' })
          .eq('id', quoteId);
        
        // 5. Create an invoice for this order
        try {
          console.log('Creating invoice for new order:', order.id);
          const invoiceId = await createInvoiceFromOrder(order.id);
          if (invoiceId) {
            console.log('Successfully created invoice:', invoiceId);
          } else {
            console.error('Failed to create invoice for order:', order.id);
          }
        } catch (invoiceError) {
          console.error('Error creating invoice for order:', invoiceError);
          // Don't throw here, as we still want to return the order ID
        }
        
        return order.id;
      } else {
        // Not an RLS error, just throw normally
        throw new Error(`Failed to create order: ${insertResult.error.message}`);
      }
    }
    
    const order = insertResult.data;
    
    if (!order) {
      throw new Error('Order was created but no data was returned');
    }
    
    // 4. Update the quote status to indicate it has been converted to an order
    const { error: updateError } = await supabase
      .from('quotes')
      .update({ status: 'ordered' })
      .eq('id', quoteId);
    
    if (updateError) {
      console.error('Failed to update quote status:', updateError);
      // We don't throw here as the order was already created successfully
    }

    // 5. Create an invoice for this order
    try {
      console.log('Creating invoice for new order:', order.id);
      const invoiceId = await createInvoiceFromOrder(order.id);
      if (invoiceId) {
        console.log('Successfully created invoice:', invoiceId);
      } else {
        console.error('Failed to create invoice for order:', order.id);
      }
    } catch (invoiceError) {
      console.error('Error creating invoice for order:', invoiceError);
      // Don't throw here, as we still want to return the order ID
    }
    
    return order.id;
  } catch (error) {
    console.error('Error converting quote to order:', error);
    throw error;
  }
}

/**
 * React hook to convert a quote to an order with toast notifications
 * @returns A function to convert a quote to an order with toast notifications
 */
export function useConvertQuoteToOrder() {
  const { toast } = useToast();
  
  const convertWithToast = async (quoteId: string, customNotes?: string) => {
    try {
      const orderId = await convertQuoteToOrder(quoteId, customNotes);
      
      toast({
        title: "Order created successfully",
        description: "The quote has been converted to an order",
        className: "bg-green-50 border-green-200 text-green-800",
      });
      
      return orderId;
    } catch (error) {
      let errorMessage = 'An unknown error occurred';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Failed to create order",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    }
  };
  
  return convertWithToast;
} 