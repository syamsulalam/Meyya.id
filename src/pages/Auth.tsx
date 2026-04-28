// @ts-nocheck
import React, { useEffect } from 'react';
import { useStore } from '../store';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SignIn, SignUp } from '@clerk/react';

export default function Auth() {
  const { login } = useStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tab = searchParams.get('tab') || 'login';

  const checkClerkEnv = () => {
    const pubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
    if (!pubKey) {
       return "VITE_CLERK_PUBLISHABLE_KEY belum diset. Aplikasi menggunakan kunci default/fallback, yang mana mungkin telah kedaluwarsa atau diblokir. Silakan atur VITE_CLERK_PUBLISHABLE_KEY di Settings/Secrets.";
    }
    if (!pubKey.startsWith("pk_")) {
       return "VITE_CLERK_PUBLISHABLE_KEY tidak valid (harus dimulai dengan pk_).";
    }
    return null;
  };

  const envWarning = checkClerkEnv();

  const handleMockAuth = (e: React.FormEvent, role: 'customer' | 'admin') => {
    e.preventDefault();
    login(role);
    navigate(role === 'admin' ? '/admin' : '/');
  };

  const commonAppearance = {
    variables: {
      fontFamily: 'inherit',
      colorPrimary: '#000000', // Set primary color to black/ink
    },
    elements: {
      rootBox: "w-full mx-auto flex flex-col items-center",
      cardBox: "shadow-none p-0 bg-transparent rounded-none w-full border-none m-0",
      card: "shadow-none p-0 bg-transparent rounded-none w-full border-none m-0",
      headerTitle: "hidden", // We hide their title and use our own via Tabs
      headerSubtitle: "hidden", // Hide their subtitle
      formButtonPrimary: "px-6 py-3 bg-ink text-white rounded-full uppercase tracking-[0.2em] text-xs hover:bg-black/80 transition-colors w-full mt-4 font-medium shadow-none border-none outline-none focus:ring-2 focus:ring-ink/20",
      formFieldInput: "w-full bg-white/50 border border-black/10 rounded-full py-3 px-6 focus:outline-none focus:border-black/50 transition-colors font-sans text-ink text-sm placeholder:font-light",
      formFieldLabelRow: "hidden", // Hide labels so placeholders do the work, matching meyya
      footerActionText: "text-gray-500 font-light text-sm text-center",
      footerActionLink: "text-ink font-medium hover:underline text-sm",
      dividerLine: "bg-black/10",
      dividerText: "text-gray-500 font-light text-xs px-4 bg-transparent uppercase tracking-widest",
      socialButtonsBlockButton: "w-full flex items-center justify-center gap-3 bg-white border border-black/10 py-3 px-6 rounded-full hover:bg-black/5 transition-colors text-sm font-medium text-ink shadow-none",
      socialButtonsBlockButtonText: "font-medium text-ink",
      identityPreviewEditButton: "text-ink hover:underline",
      formFieldSuccessText: "text-sm text-green-600",
      formFieldErrorText: "text-xs text-red-600 mt-1 pl-4",
      alertText: "text-xs text-red-600",
      alert: "mb-6 p-4 rounded-xl bg-red-50 border border-red-100",
      socialButtons: "flex flex-col gap-3",
      form: "flex flex-col gap-5 w-full", // Matching the native space-y-5
      phoneInputBox: "w-full bg-white/50 border border-black/10 rounded-full focus-within:border-black/50 transition-colors font-sans text-ink text-sm overflow-hidden",
      footer: "hidden", // Hide their native footer if we want, or keep it. Let's keep it but styled
    }
  };

  return (
    <div className="mx-auto px-4 py-16 w-full max-w-[560px] flex-1 flex flex-col justify-center items-center">
      <div className="glass-panel p-6 sm:p-10 md:p-12 rounded-[40px] w-full min-h-[400px]">
        
        {envWarning && (
          <div className="mb-6 p-4 rounded-xl bg-orange-50 text-orange-700 text-xs text-center border border-orange-200 flex flex-col gap-2">
             <span className="font-semibold uppercase tracking-widest">Peringatan Konfigurasi</span>
             <span>{envWarning}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex mb-8 pb-4 border-b border-black/10 relative">
          <button 
            type="button"
            onClick={() => setSearchParams({ tab: 'login' })}
            className={`flex-1 text-sm tracking-widest uppercase transition-opacity ${tab === 'login' ? 'font-medium opacity-100' : 'font-light opacity-50 hover:opacity-80'}`}
          >
            Masuk
          </button>
          <button 
            type="button"
            onClick={() => setSearchParams({ tab: 'register' })}
            className={`flex-1 text-sm tracking-widest uppercase transition-opacity ${tab === 'register' ? 'font-medium opacity-100' : 'font-light opacity-50 hover:opacity-80'}`}
          >
            Daftar
          </button>
          {/* Animated Tab Indicator */}
          <div 
            className="absolute bottom-0 left-0 h-[2px] bg-ink transition-transform duration-300 w-1/2"
            style={{ transform: tab === 'login' ? 'translateX(0)' : 'translateX(100%)' }}
          />
        </div>

        <div className="w-full transition-all duration-300">
          {tab === 'register' ? (
            <SignUp 
              signInUrl="/login?tab=login" 
              fallbackRedirectUrl="/"
              appearance={commonAppearance}
            />
          ) : (
            <SignIn 
              signUpUrl="/login?tab=register" 
              fallbackRedirectUrl="/"
              appearance={commonAppearance}
            />
          )}
        </div>

        {/* MOCK LOGIN OPTIONS FOR TESTING */}
        <div className="pt-6 mt-8 border-t border-black/10">
          <p className="text-xs uppercase tracking-widest text-center opacity-40 mb-4">Mode Simulasi (Local Testing)</p>
          <div className="flex gap-2">
            <button onClick={(e) => handleMockAuth(e as any, 'customer')} className="flex-1 py-2 rounded-full border border-black/10 text-xs hover:bg-black/5 transition-colors">
              Bypass Pelanggan
            </button>
            <button onClick={(e) => handleMockAuth(e as any, 'admin')} className="flex-1 py-2 rounded-full border border-black/10 text-xs hover:bg-black/5 transition-colors">
              Bypass Admin
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
