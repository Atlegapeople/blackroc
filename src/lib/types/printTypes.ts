import { ReactElement } from 'react';

// Declaring a module will extend the existing type definitions
declare module 'react-to-print' {
  // Define a custom hook type that allows content and documentTitle
  export function useReactToPrint(options: {
    content: () => HTMLElement | null;
    documentTitle?: string;
    onBeforeGetContent?: () => Promise<void>;
    removeAfterPrint?: boolean;
    onAfterPrint?: () => void;
    pageStyle?: string;
  }): () => void;
} 