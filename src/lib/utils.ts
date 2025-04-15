import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a number as a currency string (ZAR)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Sets the document title with consistent branding
 * @param pageTitle The specific page title to display
 */
export function setPageTitle(pageTitle: string): void {
  const companyName = "BlackRoc Construction Materials";
  document.title = pageTitle ? `${pageTitle} | ${companyName}` : companyName;
}
