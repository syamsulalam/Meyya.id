import React, { useState } from 'react';
import { useStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { useSignIn, useSignUp } from '@clerk/react';

export default function Auth() {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const { login } = useStore();
  const navigate = useNavigate();

  // Clerk Headless Hooks
  const { isLoaded: isSignInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // OTP Verification state
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const handleClerkAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      if (activeTab === 'login') {
        if (!isSignInLoaded) return;
        
        const result = await signIn.create({
          identifier: email,
          password,
        });

        if (result.status === "complete") {
          await setSignInActive({ session: result.createdSessionId });
          login('customer'); // sync local store
          navigate('/');
        } else {
           console.log("Needs further verification steps:", result);
           setErrorMsg('Butuh verifikasi lebih lanjut dari Clerk. Silakan cek pengaturan Dashboard Anda.');
        }

      } else {
        if (!isSignUpLoaded) return;

        const formattedPhone = '+62' + phone;

        const result = await signUp.create({
          emailAddress: email,
          password,
          firstName: name || undefined,
          unsafeMetadata: {
            whatsapp: formattedPhone
          }
        });

        if (result.status === "complete") {
          await setSignUpActive({ session: result.createdSessionId });
          login('customer');
          navigate('/');
        } else {
           // Standard config usually requires verify email OTP if missing_requirements / unverified
           await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
           setPendingVerification(true);
        }
      }
    } catch (err: any) {
       console.error("Auth error", err);
       setErrorMsg(err.errors?.[0]?.message || err.errors?.[0]?.longMessage || 'Terjadi kesalahan pada sistem autentikasi Clerk.');
    } finally {
       setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignUpLoaded) return;
    setIsLoading(true);
    setErrorMsg('');

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verificationCode
      });

      if (completeSignUp.status === "complete") {
        await setSignUpActive({ session: completeSignUp.createdSessionId });
        login('customer');
        navigate('/');
      } else {
        setErrorMsg('Data profil masih kurang lengkap. Silakan cek dashboard Clerk.');
      }
    } catch (err: any) {
      console.error("Verification error", err);
      setErrorMsg(err.errors?.[0]?.message || 'Kode OTP tidak valid atau kadaluarsa.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
     if (!isSignInLoaded) return;
     
     signIn.authenticateWithRedirect({
       strategy: "oauth_google",
       redirectUrl: "/sso-callback",
       redirectUrlComplete: "/"
     });
  };

  const handleMockAuth = (e: React.FormEvent, role: 'customer' | 'admin') => {
    e.preventDefault();
    login(role);
    navigate(role === 'admin' ? '/admin' : '/');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 w-full flex-1 flex flex-col justify-center">
      <div className="glass-panel p-8 md:p-12 rounded-[40px] w-full">
        <h1 className="text-3xl font-light mb-8 font-heading text-center">
          {pendingVerification ? 'Verifikasi' : (activeTab === 'login' ? 'Selamat Datang' : 'Buat Akun')}
        </h1>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-xs text-center border border-red-100">
             {errorMsg}
          </div>
        )}

        {pendingVerification ? (
          <form className="space-y-5" onSubmit={handleVerifyOTP}>
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500 font-light">Kami telah mengirimkan kode 6 digit ke <br/>
                <strong className="text-ink">{email}</strong>
              </p>
            </div>
            <div>
              <input
                type="text"
                value={verificationCode}
                onChange={e => setVerificationCode(e.target.value)}
                placeholder="Kode OTP"
                required
                className="w-full bg-white/50 border border-black/10 rounded-full py-4 px-6 focus:outline-none focus:border-black/50 transition-colors placeholder:tracking-normal font-mono text-center tracking-[0.5em] text-lg"
                maxLength={6}
              />
            </div>
            <button type="submit" disabled={isLoading || verificationCode.length < 6} className="px-6 py-3 bg-ink text-white rounded-full uppercase tracking-[0.2em] text-xs hover:bg-black/80 transition-colors w-full mt-4 disabled:opacity-50">
              {isLoading ? 'Memverifikasi...' : 'Verifikasi'}
            </button>
            <button type="button" onClick={() => { setPendingVerification(false); setErrorMsg(''); }} className="w-full py-3 text-xs uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity mt-2">
              Kembali
            </button>
          </form>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="flex mb-8 pb-4 border-b border-black/10 relative">
              <button 
                type="button"
                onClick={() => { setActiveTab('login'); setErrorMsg(''); }}
                className={`flex-1 text-sm tracking-widest uppercase transition-opacity ${activeTab === 'login' ? 'font-medium opacity-100' : 'font-light opacity-50 hover:opacity-80'}`}
              >
                Masuk
              </button>
              <button 
                type="button"
                onClick={() => { setActiveTab('register'); setErrorMsg(''); }}
                className={`flex-1 text-sm tracking-widest uppercase transition-opacity ${activeTab === 'register' ? 'font-medium opacity-100' : 'font-light opacity-50 hover:opacity-80'}`}
              >
                Daftar
              </button>
              {/* Animated Tab Indicator */}
              <div 
                className="absolute bottom-0 left-0 h-[2px] bg-ink transition-transform duration-300 w-1/2"
                style={{ transform: activeTab === 'login' ? 'translateX(0)' : 'translateX(100%)' }}
              />
            </div>

            <form className="space-y-5" onSubmit={handleClerkAuth}>
              {activeTab === 'register' && (
                <>
                  <div>
                    <input 
                      type="text" 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Nama Lengkap" 
                      required
                      className="w-full bg-white/50 border border-black/10 rounded-full py-3 px-6 focus:outline-none focus:border-black/50 transition-colors placeholder:font-light"
                    />
                  </div>
                  <div className="flex bg-white/50 border border-black/10 rounded-full focus-within:border-black/50 transition-colors overflow-hidden">
                    <div className="bg-black/5 border-r border-black/10 flex items-center justify-center px-4 font-medium text-sm text-gray-600">
                      +62
                    </div>
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={e => {
                        // Hanya ambil angka. Hapus 0 atau 62 di depan secara cerdas.
                        const val = e.target.value.replace(/\D/g, ''); 
                        setPhone(val.startsWith('62') ? val.substring(2) : (val.startsWith('0') ? val.substring(1) : val));
                      }}
                      placeholder="81234567890 (No. WhatsApp)" 
                      required
                      className="w-full bg-transparent py-3 px-4 focus:outline-none placeholder:font-light"
                    />
                  </div>
                </>
              )}
              
              <div>
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Alamat Email" 
                  required
                  className="w-full bg-white/50 border border-black/10 rounded-full py-3 px-6 focus:outline-none focus:border-black/50 transition-colors placeholder:font-light"
                />
              </div>
              <div>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Kata Sandi (Password)" 
                  required
                  className="w-full bg-white/50 border border-black/10 rounded-full py-3 px-6 focus:outline-none focus:border-black/50 transition-colors placeholder:font-light"
                />
              </div>

              <button type="submit" disabled={isLoading || !isSignInLoaded || !isSignUpLoaded} className="px-6 py-3 bg-ink text-white rounded-full uppercase tracking-[0.2em] text-xs hover:bg-black/80 transition-colors w-full mt-4 disabled:opacity-50">
                {isLoading ? 'Memproses...' : (activeTab === 'login' ? 'Masuk' : 'Daftar Sekarang')}
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-black/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-[#f8f7f5] text-gray-500 font-light">Atau lanjutkan dengan</span>
              </div>
            </div>

            <button type="button" disabled={!isSignInLoaded} onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 bg-white border border-black/10 py-3 px-6 rounded-full hover:bg-black/5 transition-colors mb-8 disabled:opacity-50">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                <path fill="none" d="M1 1h22v22H1z" />
              </svg>
              <span className="text-sm font-medium">Google</span>
            </button>

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
          </>
        )}
      </div>
    </div>
  );
}
