# Custom React Hooks

This directory contains custom React hooks for use across the application.

## Page Title Management

### usePageTitle

The `usePageTitle` hook makes it easy to set consistent, professional page titles across the application.

#### Usage:

```tsx
import { usePageTitle } from '../lib/hooks/usePageTitle';

function YourComponent() {
  // Set the page title to "Your Page Title | BlackRoc Construction Materials"
  usePageTitle("Your Page Title");
  
  return (
    // Your component JSX
  );
}
```

#### Benefits:

- Ensures consistent branding across all pages
- Automatically formats titles with company name
- Properly handles cleanup when components unmount
- Makes page title management a one-liner in components

#### Implementation:

To add a page title to any component, simply import and use this hook at the top level of your functional component.

```tsx
// Add at the top of your imports
import { usePageTitle } from '../lib/hooks/usePageTitle';

// Add inside your component
usePageTitle("Dashboard"); // Will display "Dashboard | BlackRoc Construction Materials"
``` 