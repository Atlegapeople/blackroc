import { Database } from '../../types/supabase';

export interface Invoice {
  id: string;
  customer_id: string;
  order_id?: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  invoice_status: 'draft' | 'sent' | 'overdue' | 'cancelled';
  payment_status: 'unpaid' | 'partial' | 'paid';
  notes?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Payment {
  id: string;
  invoice_id: string;
  customer_id: string;
  payment_number: string;
  payment_date: string;
  amount: number;
  payment_method: 'cash' | 'credit_card' | 'bank_transfer' | 'eft' | 'other';
  reference_number?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  notes?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface LedgerEntry {
  id: string;
  customer_id: string;
  invoice_id?: string;
  payment_id?: string;
  entry_date: string;
  entry_type: 'invoice' | 'payment' | 'credit' | 'debit' | 'adjustment';
  description: string;
  amount: number;
  running_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  user_id: string;
  created_at: string;
}

export interface CustomerStatement {
  customer: Customer;
  startDate?: string;
  endDate?: string;
  openingBalance: number;
  entries: LedgerEntry[];
  closingBalance: number;
}

export interface InvoiceWithDetails extends Invoice {
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
  };
  order?: {
    id: string;
    order_number: string;
  };
  payments?: Payment[];
}

export interface PaymentWithDetails extends Payment {
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
  };
  invoice?: {
    id: string;
    invoice_number: string;
  };
}

export interface PaymentFormData {
  invoice_id: string;
  amount: number;
  payment_method: Payment['payment_method'];
  reference_number?: string;
  payment_date: string;
  notes?: string;
}

// Extend the Database types to include our new tables
declare module '../../types/supabase' {
  interface Database {
    public: {
      Tables: {
        // ... existing tables
        invoices: {
          Row: Invoice;
          Insert: Omit<Invoice, 'id' | 'created_at' | 'updated_at'>;
          Update: Partial<Omit<Invoice, 'id' | 'created_at' | 'updated_at'>>;
        };
        payments: {
          Row: Payment;
          Insert: Omit<Payment, 'id' | 'created_at' | 'updated_at'>;
          Update: Partial<Omit<Payment, 'id' | 'created_at' | 'updated_at'>>;
        };
        ledger_entries: {
          Row: LedgerEntry;
          Insert: Omit<LedgerEntry, 'id' | 'created_at' | 'updated_at'>;
          Update: Partial<Omit<LedgerEntry, 'id' | 'created_at' | 'updated_at'>>;
        };
      };
    };
  }
} 