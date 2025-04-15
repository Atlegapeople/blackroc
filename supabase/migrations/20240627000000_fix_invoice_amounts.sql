-- Fix for negative outstanding balances in invoices
-- When a payment equals or exceeds the invoice amount, ensure outstanding_amount is 0, not negative

-- First, fix any existing invoices with negative outstanding amounts
UPDATE public.invoices
SET outstanding_amount = 0
WHERE outstanding_amount < 0;

-- Update the function to create ledger entries for payments and properly update invoice amounts
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
  -- Use GREATEST to ensure outstanding_amount is never negative
  UPDATE public.invoices
  SET 
    paid_amount = paid_amount + NEW.amount,
    outstanding_amount = GREATEST(0, total_amount - (paid_amount + NEW.amount)),
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