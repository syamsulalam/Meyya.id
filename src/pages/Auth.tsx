import React, { useState } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { SignIn, SignUp } from '@clerk/react';

export default function Auth() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const { login } = useStore();
  const navigate = useNavigate();

  const handleMockAuth = (e: React.FormEvent, role: 'customer' | 'admin') => {
    e.preventDefault();
    login(role);
    navigate(role === 'admin' ? '/admin' : '/');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 w-full flex-1 flex flex-col justify-center">
      <div className="glass-panel p-8 md:p-12 rounded-[40px] w-full">
        <h1 className="text-3xl font-light mb-8 font-heading text-center">
          {activeTab === 'login' ? 'Selamat Datang' : 'Buat Akun'}
        </h1>

        <div className="flex flex-col items-center">
          {activeTab === 'login' ? (
            <SignIn
              routing="hash"
              signUpUrl="/login#register"
              fallbackRedirectUrl="/"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none bg-transparent border-none p-0",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: "rounded-full border-black/10 hover:bg-black/5",
                  formButtonPrimary: "bg-ink hover:bg-black/80 rounded-full uppercase tracking-widest text-xs",
                  formFieldInput: "bg-white/50 border-black/10 rounded-full focus:border-black/50",
                  footer: "hidden"
                }
              }}
            />
          ) : (
            <SignUp
              routing="hash"
              signInUrl="/login"
              fallbackRedirectUrl="/"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none bg-transparent border-none p-0",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: "rounded-full border-black/10 hover:bg-black/5",
                  formButtonPrimary: "bg-ink hover:bg-black/80 rounded-full uppercase tracking-widest text-xs",
                  formFieldInput: "bg-white/50 border-black/10 rounded-full focus:border-black/50",
                  footer: "hidden"
                }
              }}
            />
          )}

          {/* Custom Tab Navigation below Clerk components to maintain the "MEYYA" look */}
          <div className="flex mt-8 w-full border-t border-black/10 pt-6">
            <button
              type="button"
              onClick={() => { setActiveTab('login'); }}
              className={`flex-1 text-[10px] tracking-widest uppercase transition-opacity ${activeTab === 'login' ? 'font-bold opacity-100' : 'font-light opacity-50 hover:opacity-80'}`}
            >
              Sudah punya akun? Masuk
            </button>
            <button 
              type="button"
              onClick={() => { setActiveTab('register'); }}
              className={`flex-1 text-[10px] tracking-widest uppercase transition-opacity ${activeTab === 'register' ? 'font-bold opacity-100' : 'font-light opacity-50 hover:opacity-80'}`}
            >
              Belum punya akun? Daftar
            </button>
          </div>
        </div>

        {/* MOCK LOGIN OPTIONS FOR TESTING */}
        <div className="pt-6 border-t border-black/10">
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
