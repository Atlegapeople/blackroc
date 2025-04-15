-- Create financial tables for BlackRoc

-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    order_id UUID NOT NULL REFERENCES public.orders(id),
    invoice_number TEXT NOT NULL,
    invoice_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    due_date TIMESTAMPTZ NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL,
    paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    outstanding_amount NUMERIC(10,2) NOT NULL,
    invoice_status TEXT NOT NULL DEFAULT 'pending',
    payment_status TEXT NOT NULL DEFAULT 'unpaid',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users,
    updated_by UUID REFERENCES auth.users
);

-- Add RLS policies for invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Invoices are viewable by authenticated users" ON public.invoices
    FOR SELECT USING (auth.role() = 'authenticated');
    
CREATE POLICY "Invoices are insertable by authenticated users" ON public.invoices
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
CREATE POLICY "Invoices are updatable by authenticated users" ON public.invoices
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES public.invoices(id),
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    payment_number TEXT NOT NULL,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    amount NUMERIC(10,2) NOT NULL,
    payment_method TEXT NOT NULL,
    reference TEXT,
    status TEXT NOT NULL DEFAULT 'completed',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users,
    updated_by UUID REFERENCES auth.users
);

-- Add RLS policies for payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Payments are viewable by authenticated users" ON public.payments
    FOR SELECT USING (auth.role() = 'authenticated');
    
CREATE POLICY "Payments are insertable by authenticated users" ON public.payments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
CREATE POLICY "Payments are updatable by authenticated users" ON public.payments
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create ledger_entries table
CREATE TABLE IF NOT EXISTS public.ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.customers(id),
    invoice_id UUID REFERENCES public.invoices(id),
    payment_id UUID REFERENCES public.payments(id),
    entry_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    entry_type TEXT NOT NULL, -- 'invoice', 'payment', 'credit', 'debit'
    amount NUMERIC(10,2) NOT NULL,
    running_balance NUMERIC(10,2) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users,
    updated_by UUID REFERENCES auth.users
);

-- Add RLS policies for ledger_entries
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ledger entries are viewable by authenticated users" ON public.ledger_entries
    FOR SELECT USING (auth.role() = 'authenticated');
    
CREATE POLICY "Ledger entries are insertable by authenticated users" ON public.ledger_entries
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    
CREATE POLICY "Ledger entries are updatable by authenticated users" ON public.ledger_entries
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create triggers to update invoices and add ledger entries

-- Function to update invoice paid and outstanding amounts
CREATE OR REPLACE FUNCTION update_invoice_amounts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.invoices
  SET 
    paid_amount = (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE invoice_id = NEW.invoice_id),
    outstanding_amount = total_amount - (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE invoice_id = NEW.invoice_id),
    payment_status = CASE 
      WHEN total_amount <= (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE invoice_id = NEW.invoice_id) THEN 'paid'
      WHEN (SELECT COALESCE(SUM(amount), 0) FROM public.payments WHERE invoice_id = NEW.invoice_id) > 0 THEN 'partial'
      ELSE 'unpaid'
    END,
    updated_at = now()
  WHERE id = NEW.invoice_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoice_after_payment
AFTER INSERT OR UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION update_invoice_amounts();

-- Function to create ledger entries for invoices and payments
CREATE OR REPLACE FUNCTION create_ledger_entry()
RETURNS TRIGGER AS $$
DECLARE
  v_running_balance NUMERIC(10,2);
  v_description TEXT;
  v_customer_id UUID;
BEGIN
  -- Get the customer ID based on the operation type
  IF TG_TABLE_NAME = 'invoices' THEN
    v_customer_id := NEW.customer_id;
    v_description := 'Invoice #' || NEW.invoice_number;
  ELSIF TG_TABLE_NAME = 'payments' THEN
    v_customer_id := NEW.customer_id;
    v_description := 'Payment #' || NEW.payment_number;
  END IF;
  
  -- Calculate the running balance
  SELECT COALESCE(MAX(running_balance), 0) INTO v_running_balance
  FROM public.ledger_entries
  WHERE customer_id = v_customer_id
  ORDER BY entry_date DESC, created_at DESC
  LIMIT 1;
  
  -- Adjust the running balance based on the entry type
  IF TG_TABLE_NAME = 'invoices' THEN
    v_running_balance := v_running_balance + NEW.total_amount;
  ELSIF TG_TABLE_NAME = 'payments' THEN
    v_running_balance := v_running_balance - NEW.amount;
  END IF;
  
  -- Create the ledger entry
  INSERT INTO public.ledger_entries (
    customer_id,
    invoice_id,
    payment_id,
    entry_date,
    entry_type,
    amount,
    running_balance,
    description,
    created_by,
    updated_by
  )
  VALUES (
    v_customer_id,
    CASE WHEN TG_TABLE_NAME = 'invoices' THEN NEW.id ELSE NEW.invoice_id END,
    CASE WHEN TG_TABLE_NAME = 'payments' THEN NEW.id ELSE NULL END,
    CASE 
      WHEN TG_TABLE_NAME = 'invoices' THEN NEW.invoice_date
      WHEN TG_TABLE_NAME = 'payments' THEN NEW.payment_date
    END,
    CASE 
      WHEN TG_TABLE_NAME = 'invoices' THEN 'invoice'
      WHEN TG_TABLE_NAME = 'payments' THEN 'payment'
    END,
    CASE 
      WHEN TG_TABLE_NAME = 'invoices' THEN NEW.total_amount
      WHEN TG_TABLE_NAME = 'payments' THEN NEW.amount
    END,
    v_running_balance,
    v_description,
    NEW.created_by,
    NEW.updated_by
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_ledger_entry_for_invoice
AFTER INSERT ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION create_ledger_entry();

CREATE TRIGGER create_ledger_entry_for_payment
AFTER INSERT ON public.payments
FOR EACH ROW
EXECUTE FUNCTION create_ledger_entry(); 