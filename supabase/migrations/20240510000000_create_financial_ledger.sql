-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  invoice_number TEXT NOT NULL,
  subtotal NUMERIC NOT NULL,
  vat NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  issue_date TIMESTAMP DEFAULT NOW(),
  due_date TIMESTAMP,
  status TEXT DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'paid', 'overdue', 'cancelled')),
  pdf_url TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('eft', 'cash', 'card', 'other')),
  paid_at TIMESTAMP DEFAULT NOW(),
  reference TEXT,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'failed')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create ledger_entries table
CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('debit', 'credit')),
  source TEXT NOT NULL CHECK (source IN ('quote', 'invoice', 'payment', 'refund', 'adjustment')),
  source_id UUID,
  amount NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add index for common queries
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_ledger_entries_customer_id ON ledger_entries(customer_id);
CREATE INDEX idx_ledger_entries_source_id ON ledger_entries(source_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_order_id ON invoices(order_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamp
CREATE TRIGGER set_updated_at_invoices
BEFORE UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_payments
BEFORE UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function to create ledger entries for invoices
CREATE OR REPLACE FUNCTION create_invoice_ledger_entry()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ledger_entries (customer_id, entry_type, source, source_id, amount, description)
  VALUES (NEW.customer_id, 'debit', 'invoice', NEW.id, NEW.total, 
          'Invoice #' || NEW.invoice_number);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create ledger entry when invoice is created
CREATE TRIGGER invoice_ledger_entry_trigger
AFTER INSERT ON invoices
FOR EACH ROW
EXECUTE FUNCTION create_invoice_ledger_entry();

-- Function to create ledger entries for payments
CREATE OR REPLACE FUNCTION create_payment_ledger_entry()
RETURNS TRIGGER AS $$
DECLARE
  invoice_customer_id UUID;
  invoice_number TEXT;
BEGIN
  -- Get customer_id and invoice_number from the associated invoice
  SELECT customer_id, invoice_number INTO invoice_customer_id, invoice_number
  FROM invoices WHERE id = NEW.invoice_id;
  
  -- Create a credit entry in the ledger
  INSERT INTO ledger_entries (customer_id, entry_type, source, source_id, amount, description)
  VALUES (invoice_customer_id, 'credit', 'payment', NEW.id, NEW.amount, 
          'Payment for Invoice #' || invoice_number || ' via ' || NEW.method);
  
  -- Update invoice status if total payment equals or exceeds invoice amount
  UPDATE invoices
  SET status = CASE 
      WHEN (SELECT SUM(amount) FROM payments WHERE invoice_id = NEW.invoice_id AND status = 'confirmed') >= invoices.total 
      THEN 'paid'
      ELSE invoices.status
      END
  WHERE id = NEW.invoice_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create ledger entry when payment is created
CREATE TRIGGER payment_ledger_entry_trigger
AFTER INSERT ON payments
FOR EACH ROW
WHEN (NEW.status = 'confirmed')
EXECUTE FUNCTION create_payment_ledger_entry();

-- Row level security policies
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

-- Policies for invoices
CREATE POLICY invoices_select_policy ON invoices
  FOR SELECT USING (auth.uid() IN (
    SELECT user_id FROM user_profiles WHERE role IN ('admin', 'staff')
  ) OR customer_id IN (
    SELECT id FROM customers WHERE email = auth.email()
  ));

-- Policies for payments
CREATE POLICY payments_select_policy ON payments
  FOR SELECT USING (auth.uid() IN (
    SELECT user_id FROM user_profiles WHERE role IN ('admin', 'staff')
  ) OR invoice_id IN (
    SELECT id FROM invoices WHERE customer_id IN (
      SELECT id FROM customers WHERE email = auth.email()
    )
  ));

-- Policies for ledger entries
CREATE POLICY ledger_entries_select_policy ON ledger_entries
  FOR SELECT USING (auth.uid() IN (
    SELECT user_id FROM user_profiles WHERE role IN ('admin', 'staff')
  ) OR customer_id IN (
    SELECT id FROM customers WHERE email = auth.email()
  ));
