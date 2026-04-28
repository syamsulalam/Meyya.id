import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, LayoutGrid, LogIn, LogOut, Menu, X, ChevronDown, Package, Ticket, History } from 'lucide-react';
import { useStore } from '../store';
import { Show, SignOutButton, useUser, UserButton } from '@clerk/react';
import CartPreviewDropdown from './CartPreviewDropdown';

export default function Header() {
  const { cart, user: localUser } = useStore();
  const { user: clerkUser, isLoaded } = useUser();
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const location = useLocation();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  return (
    <header className="sticky top-0 z-50 px-4 py-4 border-b border-white/20 bg-white/40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        
        {/* Top Row: Left Icons | Logo | Right Icons */}
        <div className="flex items-center justify-between">
          
          {/* Left Icons - Hanya tampil di desktop (sm:flex) */}
          <div className="hidden sm:flex items-center gap-4 flex-1 justify-start">
            <a href="/#katalog" className="p-2 hover:bg-black/5 rounded-full transition-colors relative flex flex-col items-center group">
              <LayoutGrid size={20} strokeWidth={1.5} />
              <span className="text-[10px] uppercase tracking-widest font-medium opacity-0 group-hover:opacity-100 transition-opacity absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 rounded whitespace-nowrap pointer-events-none">Katalog</span>
            </a>
            <Link to="/search" className="p-2 hover:bg-black/5 rounded-full transition-colors relative flex flex-col items-center group">
              <Search size={20} strokeWidth={1.5} />
              <span className="text-[10px] uppercase tracking-widest font-medium opacity-0 group-hover:opacity-100 transition-opacity absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 rounded whitespace-nowrap pointer-events-none">Cari</span>
            </Link>
            <Link to="/wishlist" className="p-2 hover:bg-black/5 rounded-full transition-colors relative flex flex-col items-center group">
              <Heart size={20} strokeWidth={1.5} />
              <span className="text-[10px] uppercase tracking-widest font-medium opacity-0 group-hover:opacity-100 transition-opacity absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 rounded whitespace-nowrap pointer-events-none">Wishlist</span>
            </Link>
          </div>

          {/* Left Icons - MOBILE (Cart) */}
          <div className="flex sm:hidden flex-1 justify-start items-center relative z-20">
            <Link to="/cart" className="p-2 hover:bg-black/5 rounded-full transition-colors relative">
              <ShoppingBag size={24} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-black text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

          {/* Center Logo */}
          <div className="flex-shrink-0 text-center flex justify-center z-10">
            <Link to="/" className="text-[28px] sm:text-[32px] tracking-[0.2em] sm:tracking-[0.3em] font-[200] uppercase mx-2" style={{fontFamily: 'var(--font-logo)'}}>
              MEYYA<span className="text-[10px] sm:text-xs font-sans tracking-normal opacity-50 ml-1">.ID</span>
            </Link>
          </div>

          {/* Right Icons - DESKTOP */}
          <div className="hidden sm:flex items-center gap-4 flex-1 justify-end">
            <CartPreviewDropdown />

            {/* CLERK SDK IMPLEMENTATION */}
            <Show when="signed-in">
               {/* Custom Profile Indicator & Dropdown on Hover */}
               <div className="relative group">
                 <Link to={localUser?.role === 'admin' ? "/admin" : "/profil"} className="p-2 hover:bg-black/5 rounded-full transition-colors relative flex flex-col items-center group/tooltip">
                    <User size={20} strokeWidth={1.5} />
                    <span className="absolute top-0 right-0 bg-black text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white uppercase">
                      {clerkUser?.firstName?.charAt(0) || clerkUser?.emailAddresses[0]?.emailAddress?.charAt(0) || '@'}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest font-medium opacity-0 group-hover/tooltip:opacity-100 transition-opacity absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">Profil</span>
                 </Link>

                 {/* Hover Dropdown / Tooltip */}
                 <div className="absolute top-full right-0 pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                    <div className="bg-white/95 backdrop-blur-xl border border-black/10 shadow-2xl rounded-2xl p-4 w-56 flex flex-col gap-3">
                      
                      {/* Greeting Header */}
                      <div className="flex flex-col items-center text-center pb-3 border-b border-black/5">
                        <span className="text-[10px] uppercase tracking-widest text-black/50 mb-1">Signed in as</span>
                        <span className="text-sm font-medium truncate w-full px-2" title={clerkUser?.fullName || clerkUser?.primaryEmailAddress?.emailAddress}>
                          {clerkUser?.fullName || clerkUser?.primaryEmailAddress?.emailAddress || 'User'}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <Link to={localUser?.role === 'admin' ? "/admin" : "/profil?tab=akun"} className="flex items-center gap-3 p-2 hover:bg-black/5 rounded-xl transition-colors text-xs font-medium">
                          <User size={16} strokeWidth={1.5} />
                          {localUser?.role === 'admin' ? "Admin Dashboard" : "Akun Saya"}
                        </Link>
                        {localUser?.role !== 'admin' && (
                          <>
                            <Link to="/profil?tab=status" className="flex items-center gap-3 p-2 hover:bg-black/5 rounded-xl transition-colors text-xs font-medium">
                              <Package size={16} strokeWidth={1.5} />
                              Status Pesanan
                            </Link>
                            <Link to="/profil?tab=voucher" className="flex items-center gap-3 p-2 hover:bg-black/5 rounded-xl transition-colors text-xs font-medium">
                              <Ticket size={16} strokeWidth={1.5} />
                              Voucher
                            </Link>
                            <Link to="/profil?tab=riwayat" className="flex items-center gap-3 p-2 hover:bg-black/5 rounded-xl transition-colors text-xs font-medium">
                              <History size={16} strokeWidth={1.5} />
                              Riwayat Pesanan
                            </Link>
                          </>
                        )}
                      </div>

                    </div>
                 </div>
               </div>

               <SignOutButton>
                 <button className="p-2 hover:bg-black/5 rounded-full transition-colors relative flex flex-col items-center group">
                   <LogOut size={20} className="text-red-500" strokeWidth={1.5} />
                   <span className="text-[10px] uppercase tracking-widest font-medium opacity-0 group-hover:opacity-100 transition-opacity absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">Keluar</span>
                 </button>
               </SignOutButton>
            </Show>
            
            <Show when="signed-out">
               <Link to="/profil" className="p-2 hover:bg-black/5 rounded-full transition-colors relative flex flex-col items-center group">
                 <User size={20} strokeWidth={1.5} />
                 <span className="text-[10px] uppercase tracking-widest font-medium opacity-0 group-hover:opacity-100 transition-opacity absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">Profil</span>
               </Link>
               <Link to="/login" className="p-2 hover:bg-black/5 rounded-full transition-colors flex flex-col items-center relative group">
                 <LogIn size={20} strokeWidth={1.5} />
                 <span className="text-[10px] uppercase tracking-widest font-medium opacity-0 group-hover:opacity-100 transition-opacity absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none">Masuk</span>
               </Link>
            </Show>
          </div>

          {/* Right Icons - MOBILE (Burger Menu with Click State) */}
          <div className="flex sm:hidden flex-1 justify-end items-center relative z-20" ref={menuRef}>
            <button 
              className={`p-2 rounded-full transition-colors relative ${isMobileMenuOpen ? 'bg-black/5' : 'hover:bg-black/5'}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} strokeWidth={1.5} /> : <Menu size={24} strokeWidth={1.5} />}
            </button>

            {/* Dropdown Mengambang (Toggle by Click) */}
            <div className={`absolute top-full right-0 mt-2 transition-all duration-300 origin-top-right ${isMobileMenuOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}`}>
              <div className="bg-white/95 backdrop-blur-xl border border-black/10 shadow-2xl rounded-2xl p-2 flex flex-col gap-1 w-56">
                
                {/* User Greeting di Mobile saat Login */}
                <Show when="signed-in">
                  <div className="p-3 mb-1 bg-black/5 rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full border border-black/10 flex shrink-0 items-center justify-center text-black bg-white">
                        <User size={16} strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-[9px] uppercase tracking-widest text-black/50">Halo,</span>
                      <span className="text-xs font-medium truncate">{clerkUser?.firstName || clerkUser?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User'}</span>
                    </div>
                  </div>
                </Show>

                <a href="/#katalog" className="flex items-center gap-3 p-3 hover:bg-black/5 rounded-xl transition-colors">
                  <LayoutGrid size={18} strokeWidth={1.5} />
                  <span className="text-xs uppercase tracking-widest font-medium">Katalog</span>
                </a>

                <Link to="/search" className="flex items-center gap-3 p-3 hover:bg-black/5 rounded-xl transition-colors">
                  <Search size={18} strokeWidth={1.5} />
                  <span className="text-xs uppercase tracking-widest font-medium">Cari</span>
                </Link>

                <Link to="/wishlist" className="flex items-center gap-3 p-3 hover:bg-black/5 rounded-xl transition-colors">
                  <Heart size={18} strokeWidth={1.5} />
                  <span className="text-xs uppercase tracking-widest font-medium">Wishlist</span>
                </Link>

                <div className="h-px bg-black/10 my-1 mx-2"></div>

                <Link to={localUser?.role === 'admin' ? "/admin" : "/profil"} className="flex items-center gap-3 p-3 hover:bg-black/5 rounded-xl transition-colors">
                  <User size={18} strokeWidth={1.5} />
                  <span className="text-xs uppercase tracking-widest font-medium">Akun Saya</span>
                </Link>

                <Show when="signed-in">
                  <SignOutButton>
                    <button className="flex w-full items-center gap-3 p-3 hover:bg-black/5 rounded-xl transition-colors text-red-500 text-left">
                      <LogOut size={18} strokeWidth={1.5} />
                      <span className="text-xs uppercase tracking-widest font-medium">Keluar</span>
                    </button>
                  </SignOutButton>
                </Show>
                
                <Show when="signed-out">
                  <Link to="/login" className="flex items-center gap-3 p-3 hover:bg-black/5 rounded-xl transition-colors">
                    <LogIn size={18} strokeWidth={1.5} />
                    <span className="text-xs uppercase tracking-widest font-medium">Masuk</span>
                  </Link>
                </Show>

              </div>
            </div>
          </div>

        </div>

        {/* Bottom Row: Centered Navigation */}
        <nav className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8 text-[10px] sm:text-xs uppercase tracking-[0.1em] font-medium opacity-70">
          <Link to="/?kategori=pashmina" className="hover:opacity-100 transition-opacity">Pashmina</Link>
          <Link to="/?kategori=abaya" className="hover:opacity-100 transition-opacity">Abaya</Link>
          <Link to="/?kategori=khimar" className="hover:opacity-100 transition-opacity">Khimar</Link>
          <Link to="/?kategori=inner" className="hover:opacity-100 transition-opacity">Inner</Link>
          <Link to="/?kategori=aksesoris" className="hover:opacity-100 transition-opacity">Aksesoris</Link>
        </nav>

      </div>
    </header>
  );
}
