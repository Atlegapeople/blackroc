import { useEffect } from 'react';
import { setPageTitle } from '../utils';

/**
 * Custom hook to set the page title with proper branding
 * @param title The page-specific title (without company name)
 */
export function usePageTitle(title: string): void {
  useEffect(() => {
    setPageTitle(title);
  }, [title]);
} 