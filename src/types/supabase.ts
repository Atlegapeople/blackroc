export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          company: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone: string
          company: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          company?: string
          user_id?: string
          created_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          customer_id: string
          order_id?: string
          invoice_number: string
          invoice_date: string
          due_date: string
          total_amount: number
          paid_amount: number
          outstanding_amount: number
          invoice_status: 'draft' | 'sent' | 'overdue' | 'cancelled'
          payment_status: 'unpaid' | 'partial' | 'paid'
          notes?: string
          created_at: string
          updated_at: string
          deleted_at?: string
        }
        Insert: {
          id?: string
          customer_id: string
          order_id?: string
          invoice_number: string
          invoice_date: string
          due_date: string
          total_amount: number
          paid_amount?: number
          outstanding_amount?: number
          invoice_status: 'draft' | 'sent' | 'overdue' | 'cancelled'
          payment_status?: 'unpaid' | 'partial' | 'paid'
          notes?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          order_id?: string
          invoice_number?: string
          invoice_date?: string
          due_date?: string
          total_amount?: number
          paid_amount?: number
          outstanding_amount?: number
          invoice_status?: 'draft' | 'sent' | 'overdue' | 'cancelled'
          payment_status?: 'unpaid' | 'partial' | 'paid'
          notes?: string
          updated_at?: string
          deleted_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          invoice_id: string
          customer_id: string
          payment_number: string
          payment_date: string
          amount: number
          payment_method: 'cash' | 'credit_card' | 'bank_transfer' | 'eft' | 'other'
          reference_number?: string
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          notes?: string
          created_at: string
          updated_at: string
          deleted_at?: string
        }
        Insert: {
          id?: string
          invoice_id: string
          customer_id: string
          payment_number: string
          payment_date: string
          amount: number
          payment_method: 'cash' | 'credit_card' | 'bank_transfer' | 'eft' | 'other'
          reference_number?: string
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          notes?: string
          created_at?: string
          updated_at?: string
          deleted_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          customer_id?: string
          payment_number?: string
          payment_date?: string
          amount?: number
          payment_method?: 'cash' | 'credit_card' | 'bank_transfer' | 'eft' | 'other'
          reference_number?: string
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          notes?: string
          updated_at?: string
          deleted_at?: string
        }
      }
      ledger_entries: {
        Row: {
          id: string
          customer_id: string
          invoice_id?: string
          payment_id?: string
          entry_date: string
          entry_type: 'invoice' | 'payment' | 'credit' | 'debit' | 'adjustment'
          description: string
          amount: number
          running_balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          invoice_id?: string
          payment_id?: string
          entry_date: string
          entry_type: 'invoice' | 'payment' | 'credit' | 'debit' | 'adjustment'
          description: string
          amount: number
          running_balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          invoice_id?: string
          payment_id?: string
          entry_date?: string
          entry_type?: 'invoice' | 'payment' | 'credit' | 'debit' | 'adjustment'
          description?: string
          amount?: number
          running_balance?: number
          updated_at?: string
        }
      }
      // Other existing tables will be defined here
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
