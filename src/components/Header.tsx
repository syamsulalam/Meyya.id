import { Link } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, LayoutGrid, LogIn, LogOut, Menu } from 'lucide-react';
import { useStore } from '../store';
import { Show, SignOutButton } from '@clerk/react';

export default function Header() {
  const { cart, user } = useStore();
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 px-4 py-4 border-b border-white/20 bg-white/40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        
        {/* Top Row: Left Icons | Logo | Right Icons */}
        <div className="flex items-center justify-between">
          
          {/* Left Icons - Hanya tampil di desktop (sm:flex) */}
          <div className="hidden sm:flex items-center gap-4 flex-1 justify-start">
            <a href="/#katalog" className="p-2 hover:bg-black/5 rounded-full transition-colors" title="Katalog Produk">
              <LayoutGrid size={20} strokeWidth={1.5} />
            </a>
            <Link to="/search" className="p-2 hover:bg-black/5 rounded-full transition-colors" title="Cari Produk (Search)">
              <Search size={20} strokeWidth={1.5} />
            </Link>
            <Link to="/wishlist" className="p-2 hover:bg-black/5 rounded-full transition-colors" title="Wishlist Tersimpan">
              <Heart size={20} strokeWidth={1.5} />
            </Link>
          </div>

          {/* Left Icons - MOBILE (Cart) */}
          <div className="flex sm:hidden flex-1 justify-start items-center relative z-20">
            <Link to="/cart" className="p-2 hover:bg-black/5 rounded-full transition-colors relative" title="Keranjang Belanja">
              <ShoppingBag size={24} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-black text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full border border-white">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

          {/* Center Logo */}
          <div className="flex-shrink-0 text-center flex justify-center z-10">
            <Link to="/" className="text-[28px] sm:text-[32px] tracking-[0.2em] sm:tracking-[0.3em] font-[200] uppercase mx-2" style={{fontFamily: 'var(--font-logo)'}} title="Beranda MEYYA.ID">
              MEYYA<span className="text-[10px] sm:text-xs font-sans tracking-normal opacity-50 ml-1">.ID</span>
            </Link>
          </div>

          {/* Right Icons - DESKTOP */}
          <div className="hidden sm:flex items-center gap-4 flex-1 justify-end">
            <Link to="/cart" className="p-2 hover:bg-black/5 rounded-full transition-colors relative" title="Keranjang Belanja (Cart)">
              <ShoppingBag size={20} strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-black text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>

            <Link to={user?.role === 'admin' ? "/admin" : "/profil"} className="p-2 hover:bg-black/5 rounded-full transition-colors" title={user?.role === 'admin' ? "Admin Dashboard" : "Profil Akun"}>
              <User size={20} strokeWidth={1.5} />
            </Link>

            {/* CLERK SDK IMPLEMENTATION */}
            <Show when="signed-in">
              <SignOutButton>
                <button className="p-2 hover:bg-black/5 rounded-full transition-colors text-red-500" title="Keluar (Log Out)">
                  <LogOut size={20} strokeWidth={1.5} />
                </button>
              </SignOutButton>
            </Show>
            
            <Show when="signed-out">
               <Link to="/login" className="p-2 hover:bg-black/5 rounded-full transition-colors" title="Masuk / Daftar">
                 <LogIn size={20} strokeWidth={1.5} />
               </Link>
            </Show>
          </div>

          {/* Right Icons - MOBILE (Burger Menu with Hover Group) */}
          <div className="flex sm:hidden flex-1 justify-end items-center group relative z-20">
            <button className="p-2 hover:bg-black/5 rounded-full transition-colors relative" title="Menu">
              <Menu size={24} strokeWidth={1.5} />
            </button>

            {/* Dropdown Mengambang saat di-hover/tap */}
            <div className="absolute top-full right-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
              <div className="bg-white/90 backdrop-blur-xl border border-white/40 shadow-2xl rounded-2xl p-2 flex flex-col gap-1 w-48">
                
                <a href="/#katalog" className="flex items-center gap-3 p-3 hover:bg-black/5 rounded-xl transition-colors" title="Katalog Produk">
                  <LayoutGrid size={18} strokeWidth={1.5} />
                  <span className="text-xs uppercase tracking-widest font-medium">Katalog</span>
                </a>

                <Link to="/search" className="flex items-center gap-3 p-3 hover:bg-black/5 rounded-xl transition-colors" title="Cari Produk">
                  <Search size={18} strokeWidth={1.5} />
                  <span className="text-xs uppercase tracking-widest font-medium">Cari</span>
                </Link>

                <Link to="/wishlist" className="flex items-center gap-3 p-3 hover:bg-black/5 rounded-xl transition-colors" title="Wishlist">
                  <Heart size={18} strokeWidth={1.5} />
                  <span className="text-xs uppercase tracking-widest font-medium">Wishlist</span>
                </Link>

                <div className="h-px bg-black/10 my-1"></div>

                <Link to={user?.role === 'admin' ? "/admin" : "/profil"} className="flex items-center gap-3 p-3 hover:bg-black/5 rounded-xl transition-colors" title="Profil Akun">
                  <User size={18} strokeWidth={1.5} />
                  <span className="text-xs uppercase tracking-widest font-medium">Akun Saya</span>
                </Link>

                <Show when="signed-in">
                  <SignOutButton>
                    <button className="flex w-full items-center gap-3 p-3 hover:bg-red-50 rounded-xl transition-colors text-red-500 text-left" title="Keluar">
                      <LogOut size={18} strokeWidth={1.5} />
                      <span className="text-xs uppercase tracking-widest font-medium">Keluar</span>
                    </button>
                  </SignOutButton>
                </Show>
                
                <Show when="signed-out">
                  <Link to="/login" className="flex items-center gap-3 p-3 hover:bg-black/5 rounded-xl transition-colors" title="Masuk / Daftar">
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
