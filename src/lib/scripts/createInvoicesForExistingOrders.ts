import { supabase } from '../supabase';
import { createInvoiceFromOrder } from '../services/financeService';

/**
 * This script creates invoices for all existing orders that don't have invoices yet
 * Run this script once to populate the invoices table
 */
export async function createInvoicesForExistingOrders() {
  try {
    console.log('Starting to create invoices for existing orders...');
    
    // First check the database schema to understand constraint issues
    console.log('Checking database schema constraints...');
    
    try {
      // Try to fetch table constraints
      const { data: tableInfo, error: tableInfoError } = await supabase
        .rpc('get_table_info', { table_name: 'invoices' })
        .single();
        
      if (tableInfoError) {
        console.error('Error fetching table info:', tableInfoError);
      } else {
        console.log('Table info:', tableInfo);
      }
    } catch (schemaError) {
      console.error('Error fetching schema info:', schemaError);
    }
    
    // Try to run a simple select to see if table exists
    try {
      const { data: sampleInvoice, error: sampleError } = await supabase
        .from('invoices')
        .select('invoice_status, payment_status')
        .limit(1);
        
      console.log('Sample invoice data:', sampleInvoice, 'Error:', sampleError);
    } catch (sampleError) {
      console.error('Error fetching sample invoice:', sampleError);
    }
    
    // Get all orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .order('created_at', { ascending: false });
    
    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return { success: false, error: ordersError.message };
    }
    
    if (!orders || orders.length === 0) {
      console.log('No orders found in the database');
      return { success: true, message: 'No orders found to process' };
    }
    
    console.log(`Found ${orders.length} orders, checking which ones need invoices...`);
    
    // Get existing invoices to avoid duplicates
    const { data: existingInvoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('order_id');
    
    if (invoicesError) {
      console.error('Error fetching existing invoices:', invoicesError);
      return { success: false, error: invoicesError.message };
    }
    
    // Create a Set of order IDs that already have invoices
    const orderIdsWithInvoices = new Set(
      (existingInvoices || []).map(invoice => invoice.order_id)
    );
    
    // Filter orders that don't have invoices yet
    const ordersNeedingInvoices = orders.filter(
      order => !orderIdsWithInvoices.has(order.id)
    );
    
    console.log(`${ordersNeedingInvoices.length} orders need invoices created`);
    
    // Create invoices for each order
    const results = [];
    for (const order of ordersNeedingInvoices) {
      console.log(`Creating invoice for order ${order.id}...`);
      
      const invoiceId = await createInvoiceFromOrder(order.id);
      
      if (invoiceId) {
        console.log(`Successfully created invoice ${invoiceId} for order ${order.id}`);
        results.push({ orderId: order.id, invoiceId, success: true });
      } else {
        console.error(`Failed to create invoice for order ${order.id}`);
        results.push({ orderId: order.id, success: false });
      }
    }
    
    return {
      success: true,
      processed: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  } catch (error) {
    console.error('Error in createInvoicesForExistingOrders:', error);
    return { success: false, error: String(error) };
  }
}

// Uncomment to run this script directly
// createInvoicesForExistingOrders().then(console.log); 