// This is a script to create invoices for existing orders
// You can run this in your browser console

async function createInvoiceForOrder(orderId) {
  try {
    console.log(`Creating invoice for order ${orderId}`);

    // First fetch the order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error('Error fetching order:', orderError);
      return { success: false, error: orderError };
    }

    if (!order) {
      console.error('Order not found');
      return { success: false, error: 'Order not found' };
    }

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;
    
    // Set due date 30 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    // Create invoice data
    const invoiceData = {
      customer_id: order.customer_id,
      order_id: orderId,
      invoice_number: invoiceNumber,
      invoice_date: new Date().toISOString(),
      due_date: dueDate.toISOString(),
      total_amount: order.total_amount,
      outstanding_amount: order.total_amount,
      payment_status: 'unpaid',
      notes: `Invoice for order ${orderId}`
    };

    // Try to insert with default invoice_status
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single();

    if (invoiceError) {
      console.error('Error creating invoice with default status:', invoiceError);
      
      // Try with explicit draft status
      invoiceData.invoice_status = 'draft';
      const { data: draftInvoice, error: draftError } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single();
        
      if (draftError) {
        console.error('Error creating invoice with draft status:', draftError);
        return { success: false, error: draftError };
      }
      
      console.log('Successfully created invoice with draft status:', draftInvoice);
      return { success: true, invoiceId: draftInvoice.id };
    }

    console.log('Successfully created invoice:', invoice);
    return { success: true, invoiceId: invoice.id };
  } catch (error) {
    console.error('Exception in createInvoiceForOrder:', error);
    return { success: false, error };
  }
}

// Function to create invoices for specific order IDs
async function createInvoicesForOrderIds(orderIds) {
  console.log(`Creating invoices for ${orderIds.length} orders...`);
  
  const results = [];
  for (const orderId of orderIds) {
    console.log(`Processing order ${orderId}...`);
    const result = await createInvoiceForOrder(orderId);
    results.push({ orderId, ...result });
  }
  
  console.log('Results:', results);
  return results;
}

// Example usage:
// Copy this file content to your browser console and then run:
// 
// const unpaidOrderIds = [
//   '482e1b99-fe55-40a8-97fc-4538e146acb6', 
//   '48a8e940-b1a2-4717-bfe0-f37fdb80b86c'
// ];
// createInvoicesForOrderIds(unpaidOrderIds).then(console.log); 