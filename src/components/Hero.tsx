import React from 'react';

export default function Hero() {
  return (
    <div className="relative w-full h-auto glass-panel overflow-hidden flex flex-col items-center justify-center text-center px-4 py-24 md:py-32 rounded-[40px]">
      {/* Soft decorative background elements */}
      <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-orange-100/30 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-rose-100/30 blur-3xl pointer-events-none" />
      
      <div className="relative z-10 max-w-2xl flex flex-col items-center">
        <span className="text-xs uppercase tracking-[0.2em] mb-6 inline-block opacity-70 text-ink">
          Koleksi Musim Semi/Panas (<i>Spring/Summer Collection</i>)
        </span>
        <h1 className="text-5xl md:text-7xl font-light mb-6 leading-[1.1] tracking-tight text-ink">
          Keanggunan di <br/>
          Setiap Naungan (<i>Drape</i>)
        </h1>
        <p className="text-lg opacity-70 mb-10 font-light max-w-md mx-auto leading-relaxed text-ink">
          Rasakan mode sopan (<i>modest fashion</i>) yang didefinisikan ulang. Menggunakan material premium, buatan tangan yang cermat (<i>meticulous craftsmanship</i>), dan estetika abadi (<i>timeless aesthetic</i>) untuk muslimah modern.
        </p>
        <a href="#katalog" className="glass-button text-ink border-ink/20">
          Jelajahi Koleksi
        </a>
      </div>
    </div>
  );
}
