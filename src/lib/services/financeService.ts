import { supabase } from '../supabase';
import {
  Invoice,
  Payment,
  LedgerEntry,
  CustomerStatement,
  PaymentFormData
} from '../interfaces/finance';
import { v4 as uuidv4 } from 'uuid';

/**
 * Fetch invoices for a customer
 */
export const getInvoicesForCustomer = async (customerId: string): Promise<Invoice[]> => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('customer_id', customerId)
      .is('deleted_at', null)
      .order('invoice_date', { ascending: false });

    if (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getInvoicesForCustomer:', error);
    return [];
  }
};

/**
 * Fetch a single invoice by ID
 */
export const getInvoiceById = async (invoiceId: string): Promise<Invoice | null> => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .is('deleted_at', null)
      .single();

    if (error) {
      console.error('Error fetching invoice:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getInvoiceById:', error);
    return null;
  }
};

/**
 * Create an invoice
 */
export const createInvoice = async (invoice: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'paid_amount' | 'outstanding_amount' | 'payment_status'>): Promise<string | null> => {
  try {
    // Calculate outstanding amount equal to total amount initially
    const completeInvoice = {
      ...invoice,
      id: uuidv4(),
      paid_amount: 0,
      outstanding_amount: invoice.total_amount,
      payment_status: 'unpaid' as const
    };

    const { data, error } = await supabase
      .from('invoices')
      .insert(completeInvoice)
      .select('id')
      .single();

    if (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }

    // Create a ledger entry for this invoice
    await createLedgerEntry({
      customer_id: invoice.customer_id,
      invoice_id: data.id,
      entry_date: invoice.invoice_date,
      entry_type: 'invoice',
      description: `Invoice #${invoice.invoice_number}`,
      amount: invoice.total_amount,
      running_balance: invoice.total_amount
    });

    return data.id;
  } catch (error) {
    console.error('Error in createInvoice:', error);
    return null;
  }
};

/**
 * Update an invoice
 */
export const updateInvoice = async (invoiceId: string, updates: Partial<Omit<Invoice, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', invoiceId);

    if (error) {
      console.error('Error updating invoice:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in updateInvoice:', error);
    return false;
  }
};

/**
 * Delete an invoice (soft delete)
 */
export const deleteInvoice = async (invoiceId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('invoices')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', invoiceId);

    if (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteInvoice:', error);
    return false;
  }
};

/**
 * Record a payment
 */
export const recordPayment = async (data: PaymentFormData): Promise<Payment | null> => {
  try {
    // Generate a payment number
    const paymentNumber = `PMT-${Date.now().toString().slice(-8)}`;
    
    // Get the customer ID from the invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('customer_id')
      .eq('id', data.invoice_id)
      .single();
      
    if (invoiceError || !invoice) {
      console.error('Error fetching invoice for payment:', invoiceError);
      throw new Error('Could not find invoice');
    }
    
    // Prepare the payment data
    const paymentData = {
      invoice_id: data.invoice_id,
      customer_id: invoice.customer_id,
      payment_number: paymentNumber,
      payment_date: data.payment_date,
      amount: data.amount,
      payment_method: data.payment_method,
      reference_number: data.reference_number,
      status: 'completed' as const,
      notes: data.notes
    };
    
    // Insert the payment
    const { data: payment, error } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();
      
    if (error) {
      console.error('Error recording payment:', error);
      throw error;
    }
    
    // Update the invoice paid amount and status
    await updateInvoiceAfterPayment(data.invoice_id, data.amount);
    
    // Create a ledger entry for the payment
    await createPaymentLedgerEntry(payment.id);
    
    return payment;
  } catch (error) {
    console.error('Error in recordPayment:', error);
    return null;
  }
};

/**
 * Get payments for an invoice
 */
export const getPaymentsForInvoice = async (invoiceId: string): Promise<Payment[]> => {
  console.log('getPaymentsForInvoice called with ID:', invoiceId);
  try {
    // Check if the payments table exists by trying to get its schema
    console.log('Checking if payments table exists...');
    const { error: schemaCheckError } = await supabase
      .from('payments')
      .select('id')
      .limit(1);
    
    // If there's a schema error (table doesn't exist), return empty array
    if (schemaCheckError && schemaCheckError.code === '42P01') {
      console.log('Payments table does not exist yet, returning empty array');
      return [];
    }

    console.log('Payments table exists, fetching payments for invoice:', invoiceId);
    // First try to fetch by invoice_id
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .is('deleted_at', null)
      .order('payment_date', { ascending: false });

    console.log('Payments query result:', { data, error });

    if (error) {
      console.error('Error fetching payments:', error);
      
      // If we couldn't find by invoice_id, let's check if it's an order_id
      try {
        console.log('Trying to find invoice by order_id:', invoiceId);
        // Find the invoice associated with this order
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('invoices')
          .select('id')
          .eq('order_id', invoiceId)
          .single();
        
        console.log('Invoice lookup result:', { invoiceData, invoiceError });
        
        if (invoiceError || !invoiceData) {
          // No invoice found for this order, return empty array
          console.log('No invoice found for order, returning empty array');
          return [];
        }
        
        console.log('Found invoice for order, fetching payments for invoice:', invoiceData.id);
        // Now fetch payments for this invoice
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select('*')
          .eq('invoice_id', invoiceData.id)
          .is('deleted_at', null)
          .order('payment_date', { ascending: false });
          
        console.log('Payments by order query result:', { paymentsData, paymentsError });
        
        if (paymentsError) {
          console.error('Error fetching payments by order:', paymentsError);
          throw paymentsError;
        }
        
        return paymentsData || [];
      } catch (innerError) {
        console.error('Error fetching payments by order_id:', innerError);
        return [];
      }
    }

    console.log('Successfully retrieved payments:', data);
    return data || [];
  } catch (error) {
    console.error('Error in getPaymentsForInvoice:', error);
    return [];
  }
};

/**
 * Create a ledger entry
 */
export const createLedgerEntry = async (entry: Omit<LedgerEntry, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> => {
  try {
    const completeEntry = {
      ...entry,
      id: uuidv4()
    };

    const { data, error } = await supabase
      .from('ledger_entries')
      .insert(completeEntry)
      .select('id')
      .single();

    if (error) {
      console.error('Error creating ledger entry:', error);
      throw error;
    }

    return data.id;
  } catch (error) {
    console.error('Error in createLedgerEntry:', error);
    return null;
  }
};

/**
 * Get ledger entries for a customer
 */
export const getLedgerForCustomer = async (customerId: string): Promise<LedgerEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('ledger_entries')
      .select('*')
      .eq('customer_id', customerId)
      .order('entry_date', { ascending: false });

    if (error) {
      console.error('Error fetching ledger:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getLedgerForCustomer:', error);
    return [];
  }
};

/**
 * Get customer statement with all financial transactions
 */
export const getCustomerStatement = async (customerId: string, startDate?: string, endDate?: string): Promise<CustomerStatement | null> => {
  try {
    // Fetch basic customer info
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerError) {
      console.error('Error fetching customer:', customerError);
      throw customerError;
    }

    // Fetch all ledger entries for date range
    let query = supabase
      .from('ledger_entries')
      .select('*')
      .eq('customer_id', customerId);

    if (startDate) {
      query = query.gte('entry_date', startDate);
    }

    if (endDate) {
      query = query.lte('entry_date', endDate);
    }

    const { data: entries, error: entriesError } = await query.order('entry_date', { ascending: true });

    if (entriesError) {
      console.error('Error fetching ledger entries:', entriesError);
      throw entriesError;
    }

    // Calculate opening balance (all entries before start date)
    let openingBalance = 0;
    if (startDate) {
      const { data: priorEntries, error: priorError } = await supabase
        .from('ledger_entries')
        .select('amount')
        .eq('customer_id', customerId)
        .lt('entry_date', startDate);

      if (priorError) {
        console.error('Error fetching prior entries:', priorError);
        throw priorError;
      }

      openingBalance = priorEntries.reduce((sum, entry) => sum + entry.amount, 0);
    }

    return {
      customer,
      startDate,
      endDate,
      openingBalance,
      entries,
      closingBalance: openingBalance + entries.reduce((sum, entry) => sum + entry.amount, 0)
    };
  } catch (error) {
    console.error('Error in getCustomerStatement:', error);
    return null;
  }
};

/**
 * Get an invoice by ID
 */
export const getInvoice = async (id: string): Promise<Invoice | null> => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching invoice:', error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error('Error in getInvoice:', err);
    return null;
  }
};

/**
 * Get invoices for a customer
 */
export const getCustomerInvoices = async (customerId: string): Promise<Invoice[]> => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching customer invoices:', error);
      throw error;
    }

    return data || [];
  } catch (err) {
    console.error('Error in getCustomerInvoices:', err);
    return [];
  }
};

/**
 * Get invoices for an order
 */
export const getOrderInvoices = async (orderId: string): Promise<Invoice[]> => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('order_id', orderId)
      .order('invoice_date', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching order invoices:', error);
    return [];
  }
};

/**
 * Update invoice status
 */
export const updateInvoiceStatus = async (
  invoiceId: string,
  status: 'unpaid' | 'paid' | 'overdue' | 'cancelled'
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('invoices')
      .update({ status })
      .eq('id', invoiceId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating invoice status:', error);
    return false;
  }
};

/**
 * Update invoice payment status
 */
export const updateInvoicePaymentStatus = async (
  invoiceId: string, 
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue'
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('invoices')
      .update({ payment_status: paymentStatus })
      .eq('id', invoiceId);

    if (error) {
      console.error('Error updating invoice payment status:', error);
      throw error;
    }

    return true;
  } catch (err) {
    console.error('Error in updateInvoicePaymentStatus:', err);
    return false;
  }
};

/**
 * Calculate the total payments made for an invoice
 */
export const getInvoicePaymentTotal = async (invoiceId: string): Promise<number> => {
  try {
    const payments = await getPaymentsForInvoice(invoiceId);
    return payments.reduce((total, payment) => total + payment.amount, 0);
  } catch (err) {
    console.error('Error in getInvoicePaymentTotal:', err);
    return 0;
  }
};

/**
 * Calculate the remaining balance for an invoice
 */
export const getInvoiceRemainingBalance = async (invoiceId: string): Promise<number> => {
  try {
    const invoice = await getInvoice(invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const totalPaid = await getInvoicePaymentTotal(invoiceId);
    return invoice.total_amount - totalPaid;
  } catch (err) {
    console.error('Error in getInvoiceRemainingBalance:', err);
    return 0;
  }
};

/**
 * Get customer's ledger entries
 */
export const getCustomerLedgerEntries = async (
  customerId: string,
  startDate?: string,
  endDate?: string
): Promise<LedgerEntry[]> => {
  try {
    let query = supabase
      .from('ledger_entries')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: true });
    
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    
    if (endDate) {
      // Add one day to include the end date fully
      const nextDay = new Date(endDate);
      nextDay.setDate(nextDay.getDate() + 1);
      query = query.lt('created_at', nextDay.toISOString().split('T')[0]);
    }
    
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching customer ledger entries:', error);
      throw error;
    }

    return data || [];
  } catch (err) {
    console.error('Error in getCustomerLedgerEntries:', err);
    return [];
  }
};

/**
 * Get a customer's current balance (positive = customer owes us, negative = we owe customer)
 */
export const getCustomerBalance = async (customerId: string): Promise<number> => {
  try {
    const entries = await getCustomerLedgerEntries(customerId);
    
    return entries.reduce((balance, entry) => {
      if (entry.entry_type === 'debit') {
        return balance + entry.amount;
      } else {
        return balance - entry.amount;
      }
    }, 0);
  } catch (err) {
    console.error('Error in getCustomerBalance:', err);
    return 0;
  }
};

/**
 * Generate a customer statement for a specific period
 */
export const generateCustomerStatement = async (
  customerId: string,
  startDate: string,
  endDate: string
): Promise<CustomerStatement | null> => {
  try {
    // Get customer details
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();
      
    if (customerError) {
      throw customerError;
    }
    
    // Get all ledger entries before the start date to calculate opening balance
    const beforeStartEntries = await getCustomerLedgerEntries(customerId, undefined, startDate);
    
    const openingBalance = beforeStartEntries.reduce((balance, entry) => {
      if (entry.entry_type === 'debit') {
        return balance + entry.amount;
      } else {
        return balance - entry.amount;
      }
    }, 0);
    
    // Get entries for the selected period
    const periodEntries = await getCustomerLedgerEntries(customerId, startDate, endDate);
    
    // Calculate totals
    const totalDebits = periodEntries
      .filter(entry => entry.entry_type === 'debit')
      .reduce((sum, entry) => sum + entry.amount, 0);
      
    const totalCredits = periodEntries
      .filter(entry => entry.entry_type === 'credit')
      .reduce((sum, entry) => sum + entry.amount, 0);
      
    const closingBalance = openingBalance + totalDebits - totalCredits;
    
    return {
      customer,
      startDate,
      endDate,
      openingBalance,
      entries: periodEntries,
      closingBalance
    };
  } catch (err) {
    console.error('Error in generateCustomerStatement:', err);
    return null;
  }
};

/**
 * Create an invoice from an order
 * This will generate an invoice based on order data
 */
export const createInvoiceFromOrder = async (orderId: string): Promise<string | null> => {
  try {
    console.log(`Creating invoice for order ${orderId}`);
    
    // First check if an invoice already exists for this order
    const { data: existingInvoice, error: checkError } = await supabase
      .from('invoices')
      .select('id')
      .eq('order_id', orderId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking for existing invoice:', checkError);
      throw checkError;
    }
    
    // If invoice already exists, return its ID
    if (existingInvoice) {
      console.log(`Invoice already exists for order ${orderId}:`, existingInvoice.id);
      return existingInvoice.id;
    }
    
    // Fetch order data
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    
    if (orderError) {
      console.error('Error fetching order data:', orderError);
      throw orderError;
    }
    
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    
    // Generate invoice number
    const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;
    
    // Set due date 30 days from now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    
    // Create the invoice record with the correct status values
    const baseInvoiceData = {
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
    
    // Try different valid values for invoice_status until one works
    const possibleStatusValues = ['draft', 'issued', 'sent', 'pending', 'paid', 'overdue', 'cancelled'];
    
    let createdInvoice = null;
    let lastError = null;
    
    // First try without specifying invoice_status to use the default value
    try {
      console.log('Trying to create invoice with default status value...');
      const { data, error } = await supabase
        .from('invoices')
        .insert(baseInvoiceData)
        .select('id')
        .single();
        
      if (!error) {
        createdInvoice = data;
        console.log(`Successfully created invoice with default status value. ID: ${data.id}`);
      } else {
        lastError = error;
        console.error('Error with default status value:', error);
      }
    } catch (error) {
      console.error('Exception with default status value:', error);
      lastError = error;
    }
    
    // If default didn't work, try each possible value
    if (!createdInvoice) {
      for (const status of possibleStatusValues) {
        try {
          console.log(`Trying to create invoice with status '${status}'...`);
          const invoiceData = {
            ...baseInvoiceData,
            invoice_status: status
          };
          
          const { data, error } = await supabase
            .from('invoices')
            .insert(invoiceData)
            .select('id')
            .single();
            
          if (!error) {
            createdInvoice = data;
            console.log(`Successfully created invoice with status '${status}'. ID: ${data.id}`);
            break; // Exit the loop if successful
          } else {
            lastError = error;
            console.error(`Error with status '${status}':`, error);
          }
        } catch (error) {
          console.error(`Exception with status '${status}':`, error);
          lastError = error;
        }
      }
    }
    
    if (createdInvoice) {
      console.log(`Successfully created invoice ${createdInvoice.id} for order ${orderId}`);
      return createdInvoice.id;
    } else {
      console.error('Failed to create invoice after trying all status values:', lastError);
      throw lastError || new Error('Could not create invoice with any status value');
    }
  } catch (error) {
    console.error('Error in createInvoiceFromOrder:', error);
    return null;
  }
};

/**
 * Sync payment statuses between orders and invoices
 * This can be called to ensure order statuses match their related invoices
 */
export const syncOrderInvoiceStatuses = async (): Promise<void> => {
  try {
    console.log('Syncing order and invoice payment statuses...');
    
    // Get all invoices with order_id that are paid
    const { data: paidInvoices, error: paidError } = await supabase
      .from('invoices')
      .select('order_id')
      .eq('payment_status', 'paid')
      .not('order_id', 'is', null);
      
    if (paidError) {
      console.error('Error fetching paid invoices:', paidError);
      return;
    }
    
    if (paidInvoices && paidInvoices.length > 0) {
      // Extract the order IDs
      const paidOrderIds = paidInvoices.map(inv => inv.order_id);
      
      // Update the corresponding orders to be paid
      if (paidOrderIds.length > 0) {
        const { error: updateError } = await supabase
          .from('orders')
          .update({ 
            payment_status: 'paid',
            updated_at: new Date().toISOString()
          })
          .in('id', paidOrderIds)
          .neq('payment_status', 'paid');
          
        if (updateError) {
          console.error('Error updating paid orders:', updateError);
        } else {
          console.log(`Updated ${paidOrderIds.length} orders to paid status`);
        }
      }
    }

    // Get all invoices with order_id that are partial
    const { data: partialInvoices, error: partialError } = await supabase
      .from('invoices')
      .select('order_id')
      .eq('payment_status', 'partial')
      .not('order_id', 'is', null);
      
    if (partialError) {
      console.error('Error fetching partial invoices:', partialError);
      return;
    }
    
    if (partialInvoices && partialInvoices.length > 0) {
      // Extract the order IDs
      const partialOrderIds = partialInvoices.map(inv => inv.order_id);
      
      // Update the corresponding orders to be partial
      if (partialOrderIds.length > 0) {
        const { error: updateError } = await supabase
          .from('orders')
          .update({ 
            payment_status: 'partial',
            updated_at: new Date().toISOString()
          })
          .in('id', partialOrderIds)
          .not('payment_status', 'in', '(paid,partial)');
          
        if (updateError) {
          console.error('Error updating partial orders:', updateError);
        } else {
          console.log(`Updated ${partialOrderIds.length} orders to partial status`);
        }
      }
    }
    
    console.log('Finished syncing order and invoice payment statuses');
  } catch (error) {
    console.error('Error in syncOrderInvoiceStatuses:', error);
  }
};

/**
 * Update invoice after payment is recorded
 */
const updateInvoiceAfterPayment = async (invoiceId: string, paymentAmount: number): Promise<void> => {
  try {
    // Get current invoice details
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('total_amount, paid_amount, outstanding_amount, order_id')
      .eq('id', invoiceId)
      .single();
      
    if (fetchError || !invoice) {
      console.error('Error fetching invoice for payment update:', fetchError);
      return;
    }
    
    // Calculate new amounts
    const newPaidAmount = (invoice.paid_amount || 0) + paymentAmount;
    const newOutstandingAmount = invoice.total_amount - newPaidAmount;
    
    // Determine new payment status
    let newPaymentStatus = 'unpaid';
    if (newPaidAmount >= invoice.total_amount) {
      newPaymentStatus = 'paid';
    } else if (newPaidAmount > 0) {
      newPaymentStatus = 'partial';
    }
    
    // Update invoice
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        paid_amount: newPaidAmount,
        outstanding_amount: newOutstandingAmount,
        payment_status: newPaymentStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId);
      
    if (updateError) {
      console.error('Error updating invoice after payment:', updateError);
      return;
    }
    
    // If invoice has an associated order, update its payment status too
    if (invoice.order_id) {
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          payment_status: newPaymentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', invoice.order_id);
        
      if (orderError) {
        console.error('Error updating order payment status:', orderError);
      }
    }
  } catch (error) {
    console.error('Error in updateInvoiceAfterPayment:', error);
  }
};

/**
 * Create a ledger entry for a payment
 */
const createPaymentLedgerEntry = async (paymentId: string): Promise<void> => {
  try {
    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*, invoices!inner(customer_id)')
      .eq('id', paymentId)
      .single();
      
    if (paymentError || !payment) {
      console.error('Error fetching payment for ledger entry:', paymentError);
      return;
    }
    
    // Create the ledger entry
    await createLedgerEntry({
      customer_id: payment.invoices.customer_id,
      payment_id: paymentId,
      invoice_id: payment.invoice_id,
      entry_date: payment.payment_date,
      entry_type: 'payment',
      description: `Payment #${payment.payment_number} for Invoice`,
      amount: -payment.amount, // Negative amount for payments (credit)
      running_balance: 0 // This will be calculated by the database trigger
    });
  } catch (error) {
    console.error('Error in createPaymentLedgerEntry:', error);
  }
}; 