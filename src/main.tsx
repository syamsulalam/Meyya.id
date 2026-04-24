import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ClerkProvider } from '@clerk/react';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;
console.log("[MEYYA.ID] Clerk Publishable Key config length:", PUBLISHABLE_KEY ? PUBLISHABLE_KEY.length : 0);

if (!PUBLISHABLE_KEY) {
  console.error("Missing Clerk Publishable Key in environment variables!");
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </StrictMode>,
);
