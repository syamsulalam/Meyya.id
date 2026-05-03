import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ClerkProvider } from '@clerk/react';

// @ts-ignore
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  createRoot(document.getElementById('root')!).render(
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h2>Missing Clerk Publishable Key</h2>
      <p>Please add VITE_CLERK_PUBLISHABLE_KEY to your environment variables.</p>
    </div>
  );
} else {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ClerkProvider 
        publishableKey={PUBLISHABLE_KEY} 
        afterSignOutUrl="/" 
        telemetry={false}
      >
        <App />
      </ClerkProvider>
    </StrictMode>,
  );
}
