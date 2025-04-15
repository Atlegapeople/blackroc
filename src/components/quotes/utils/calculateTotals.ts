/**
 * Calculate the line total for a quote item
 */
export function calculateLineTotal(quantity: number, unitPrice: number): number {
  return quantity * parseFloat(unitPrice.toString());
}

/**
 * Calculate the total quote amount including items, services, and transport cost
 */
export function calculateQuoteTotal(
  items: { line_total: number }[] = [], 
  services: { rate: number }[] = [], 
  transportCost: number = 0
): number {
  // Sum all item line totals
  const itemsTotal = items.reduce((sum, item) => 
    sum + parseFloat((item.line_total || 0).toString()), 0);
  
  // Sum all service costs
  const servicesTotal = services.reduce((sum, service) => 
    sum + parseFloat((service.rate || 0).toString()), 0);
  
  // Add transport cost
  const total = itemsTotal + servicesTotal + parseFloat(transportCost.toString());
  
  return total;
}

/**
 * Format a number as currency (ZAR)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount);
} 