import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ClerkProvider } from '@clerk/react';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider 
      // @ts-ignore
      publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "pk_test_dGVsZXBhdGhpYy1tb3VzZS00MS5jbGVyay5hY2NvdW50cy5kZXYk"} 
      afterSignOutUrl="/" 
      telemetry={false}
    >
      <App />
    </ClerkProvider>
  </StrictMode>,
);
