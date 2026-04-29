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
      colorPrimary: '#121212',
      colorText: '#121212',
      colorTextSecondary: 'rgba(0,0,0,0.6)',
      colorBackground: 'transparent',
    },
    elements: {
      rootBox: 'w-full mx-auto flex flex-col items-center',
      cardBox: 'w-full m-0 p-0 bg-transparent shadow-none border-none rounded-none',
      card: 'w-full m-0 p-0 bg-transparent shadow-none border-none rounded-none',

      header: 'hidden',
      headerTitle: 'hidden',
      headerSubtitle: 'hidden',

      form: 'flex flex-col gap-6 w-full',
      formField: 'w-full',
      formFieldRow: 'w-full',
      formFieldLabelRow: 'flex mb-2',
      formFieldLabel: 'block text-xs uppercase tracking-widest text-black/60 font-medium',

      formFieldInput: 'w-full bg-white/50 border border-black/10 rounded-full py-3 px-4 focus:outline-none focus:border-black/50 focus:ring-0 transition-colors font-sans text-ink text-sm placeholder:font-light placeholder:text-black/40 shadow-none',
      formFieldInputShowPasswordButton: 'text-black/50 hover:text-ink transition-colors mr-3',
      formFieldSuccessText: 'text-xs text-green-600 mt-1 pl-4',
      formFieldErrorText: 'text-xs text-red-600 mt-1 pl-4',
      formFieldWarningText: 'text-xs text-orange-600 mt-1 pl-4',

      formButtonPrimary: 'w-full px-8 py-3 bg-ink text-white rounded-full uppercase tracking-[0.2em] text-xs font-medium hover:bg-black/80 transition-colors shadow-none border-none outline-none focus:ring-2 focus:ring-ink/20 disabled:opacity-50 disabled:cursor-not-allowed',

      socialButtons: 'flex flex-col gap-3 w-full',
      socialButtonsBlockButton: 'w-full flex items-center justify-center gap-3 bg-white/50 border border-black/10 hover:border-black/20 py-3 px-4 rounded-full hover:bg-black/5 transition-colors text-sm font-medium text-ink shadow-none',
      socialButtonsBlockButtonText: 'text-sm font-medium text-ink',
      socialButtonsProviderIcon: 'w-4 h-4',

      dividerLine: 'bg-black/10',
      dividerText: 'text-black/50 font-light text-xs px-4 bg-transparent uppercase tracking-widest',

      footer: 'bg-transparent border-none shadow-none p-0 mt-6',
      footerActionText: 'text-gray-500 font-light text-sm text-center',
      footerActionLink: 'text-ink font-medium hover:underline text-sm',

      identityPreview: 'bg-black/5 border border-transparent rounded-full py-3 px-4 text-sm shadow-none',
      identityPreviewText: 'text-sm text-ink',
      identityPreviewEditButton: 'text-ink hover:underline text-xs uppercase tracking-widest',

      alert: 'mb-6 p-4 rounded-xl bg-red-50 border border-red-100 shadow-none',
      alertText: 'text-xs text-red-600',
    },
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
        <div className="flex mb-8 relative border-b border-black/10">
          <button 
            type="button"
            onClick={() => setSearchParams({ tab: 'login' })}
            className={`flex-1 py-4 text-sm tracking-widest uppercase transition-colors hover:bg-black/5 ${tab === 'login' ? 'font-medium opacity-100' : 'font-light opacity-50'}`}
          >
            Masuk
          </button>
          <button 
            type="button"
            onClick={() => setSearchParams({ tab: 'register' })}
            className={`flex-1 py-4 text-sm tracking-widest uppercase transition-colors hover:bg-black/5 ${tab === 'register' ? 'font-medium opacity-100' : 'font-light opacity-50'}`}
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

        {/* MOCK LOGIN OPTIONS FOR TESTING (SIMULATION MODE) - HIDDEN BY DEFAULT */}
        {/*
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
        */}

      </div>
    </div>
  );
}
