-- Create a SQL function to properly search for invoices by order ID fragments
-- This will handle cases where we're searching with just part of a UUID

CREATE OR REPLACE FUNCTION search_invoices_by_order_fragment(search_term text)
RETURNS SETOF invoices AS $$
BEGIN
  -- Return all invoices where the order_id contains the search term
  -- This uses the built-in position function to find the search term anywhere in the order_id
  RETURN QUERY
  SELECT *
  FROM invoices
  WHERE position(lower(search_term) in lower(order_id::text)) > 0;
END;
$$ LANGUAGE plpgsql; 