-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  invoice_number VARCHAR(255) NOT NULL UNIQUE,
  invoice_date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  paid_amount DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  outstanding_amount DECIMAL(10, 2) NOT NULL,
  invoice_status VARCHAR(50) NOT NULL DEFAULT 'draft',
  payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  payment_number VARCHAR(255) NOT NULL UNIQUE,
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  reference_number VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Create ledger_entries table
CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  entry_date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  entry_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  running_balance DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Add RLS policies
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

-- Create policy for invoices
CREATE POLICY "Authenticated users can read all invoices" 
ON public.invoices FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Staff can insert invoices" 
ON public.invoices FOR INSERT 
TO authenticated USING (auth.jwt() ? 'user_role' AND auth.jwt()->>'user_role' IN ('admin', 'staff'));

CREATE POLICY "Staff can update invoices" 
ON public.invoices FOR UPDATE 
TO authenticated USING (auth.jwt() ? 'user_role' AND auth.jwt()->>'user_role' IN ('admin', 'staff'));

-- Create policy for payments
CREATE POLICY "Authenticated users can read all payments" 
ON public.payments FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Staff can insert payments" 
ON public.payments FOR INSERT 
TO authenticated USING (auth.jwt() ? 'user_role' AND auth.jwt()->>'user_role' IN ('admin', 'staff'));

CREATE POLICY "Staff can update payments" 
ON public.payments FOR UPDATE 
TO authenticated USING (auth.jwt() ? 'user_role' AND auth.jwt()->>'user_role' IN ('admin', 'staff'));

-- Create policy for ledger_entries
CREATE POLICY "Authenticated users can read all ledger entries" 
ON public.ledger_entries FOR SELECT 
TO authenticated USING (true);

CREATE POLICY "Staff can insert ledger entries" 
ON public.ledger_entries FOR INSERT 
TO authenticated USING (auth.jwt() ? 'user_role' AND auth.jwt()->>'user_role' IN ('admin', 'staff'));

CREATE POLICY "Staff can update ledger entries" 
ON public.ledger_entries FOR UPDATE 
TO authenticated USING (auth.jwt() ? 'user_role' AND auth.jwt()->>'user_role' IN ('admin', 'staff'));

-- Create functions to handle ledger entries automatically

-- Function to create a ledger entry for new invoices
CREATE OR REPLACE FUNCTION create_invoice_ledger_entry()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.ledger_entries (
    customer_id, 
    invoice_id, 
    entry_date, 
    entry_type, 
    description, 
    amount, 
    running_balance
  )
  SELECT 
    NEW.customer_id,
    NEW.id,
    NEW.invoice_date,
    'invoice',
    'Invoice #' || NEW.invoice_number,
    NEW.total_amount,
    COALESCE(
      (SELECT running_balance FROM public.ledger_entries 
       WHERE customer_id = NEW.customer_id 
       ORDER BY entry_date DESC, created_at DESC LIMIT 1),
      0
    ) + NEW.total_amount;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create a ledger entry for new payments
CREATE OR REPLACE FUNCTION create_payment_ledger_entry()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.ledger_entries (
    customer_id, 
    payment_id, 
    invoice_id,
    entry_date, 
    entry_type, 
    description, 
    amount, 
    running_balance
  )
  SELECT 
    NEW.customer_id,
    NEW.id,
    NEW.invoice_id,
    NEW.payment_date,
    'payment',
    'Payment #' || NEW.payment_number || ' for Invoice #' || i.invoice_number,
    -NEW.amount,
    COALESCE(
      (SELECT running_balance FROM public.ledger_entries 
       WHERE customer_id = NEW.customer_id 
       ORDER BY entry_date DESC, created_at DESC LIMIT 1),
      0
    ) - NEW.amount
  FROM public.invoices i
  WHERE i.id = NEW.invoice_id;
  
  -- Update the invoice paid_amount and payment_status
  UPDATE public.invoices
  SET 
    paid_amount = paid_amount + NEW.amount,
    outstanding_amount = total_amount - (paid_amount + NEW.amount),
    payment_status = CASE 
      WHEN (paid_amount + NEW.amount) >= total_amount THEN 'paid'
      WHEN (paid_amount + NEW.amount) > 0 THEN 'partial'
      ELSE 'unpaid'
    END,
    updated_at = now()
  WHERE id = NEW.invoice_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER create_invoice_ledger
AFTER INSERT ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION create_invoice_ledger_entry();

CREATE TRIGGER create_payment_ledger
AFTER INSERT ON public.payments
FOR EACH ROW
EXECUTE FUNCTION create_payment_ledger_entry();

-- Create indexes for performance
CREATE INDEX idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX idx_invoices_order_id ON public.invoices(order_id);
CREATE INDEX idx_invoices_invoice_status ON public.invoices(invoice_status);
CREATE INDEX idx_invoices_payment_status ON public.invoices(payment_status);

CREATE INDEX idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX idx_payments_customer_id ON public.payments(customer_id);
CREATE INDEX idx_payments_status ON public.payments(status);

CREATE INDEX idx_ledger_customer_id ON public.ledger_entries(customer_id);
CREATE INDEX idx_ledger_invoice_id ON public.ledger_entries(invoice_id);
CREATE INDEX idx_ledger_payment_id ON public.ledger_entries(payment_id);
CREATE INDEX idx_ledger_entry_type ON public.ledger_entries(entry_type);
CREATE INDEX idx_ledger_entry_date ON public.ledger_entries(entry_date); 