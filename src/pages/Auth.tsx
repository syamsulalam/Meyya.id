// @ts-nocheck
import React, { useEffect } from 'react';
import { useStore } from '../store';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SignIn, SignUp } from '@clerk/react';
import { meyyaClerkAppearance } from '../lib/clerk-meyya';

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
              appearance={meyyaClerkAppearance}
            />
          ) : (
            <SignIn 
              signUpUrl="/login?tab=register" 
              fallbackRedirectUrl="/"
              appearance={meyyaClerkAppearance}
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
