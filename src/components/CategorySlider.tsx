import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const CategoryCard: React.FC<{category: any}> = ({ category }) => {
  const [hasError, setHasError] = useState(false);

  return (
    <Link 
      key={category.id} 
      to={`/?kategori=${category.slug || category.id}#katalog`}
      className="flex-shrink-0 w-[240px] md:w-[320px] aspect-[4/5] snap-start relative rounded-3xl overflow-hidden group/card shadow-sm hover:shadow-xl transition-all duration-500 bg-gray-100 flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/20 group-hover/card:bg-black/10 transition-colors z-10" />
      {(!category.image_url || hasError) ? (
         <div 
           className="w-full h-full flex flex-col items-center justify-center transition-transform duration-700 group-hover/card:scale-105"
           style={{
             background: `linear-gradient(135deg, hsl(${(category.id * 137) % 360}, 10%, 80%), hsl(${(category.id * 137 + 40) % 360}, 20%, 90%))`
           }}
         >
           <ImageOff size={48} className="opacity-20 mb-2 text-black mix-blend-overlay" />
         </div>
      ) : (
        <img 
          src={category.image_url} 
          alt={category.name} 
          onError={() => setHasError(true)}
          className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-700 ease-out"
        />
      )}
      <div className="absolute inset-x-0 bottom-0 p-6 z-20 flex flex-col justify-end">
        <h3 className="text-2xl font-light text-white mb-2 translate-y-2 group-hover/card:translate-y-0 transition-transform duration-500">{category.name}</h3>
        <div className="h-0.5 w-8 bg-white opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 delay-100"></div>
      </div>
    </Link>
  )
}

export default function CategorySlider() {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { data: dbCategories, error } = useSWR('/api/categories', fetcher);
  const categories = Array.isArray(dbCategories) ? dbCategories : [];

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' ? scrollLeft - (clientWidth * 0.8) : scrollLeft + (clientWidth * 0.8);
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full mb-20 max-w-7xl mx-auto px-4 group">
      <div className="flex justify-between items-end mb-6">
        <h2 className="text-3xl md:text-4xl font-light text-ink">
          Pilih Kategori Produk
        </h2>
        <div className="hidden md:flex gap-2">
          <button onClick={() => scroll('left')} className="p-2 border border-black/10 rounded-full hover:bg-black/5 transition-colors">
            <ChevronLeft size={20} className="text-ink" />
          </button>
          <button onClick={() => scroll('right')} className="p-2 border border-black/10 rounded-full hover:bg-black/5 transition-colors">
            <ChevronRight size={20} className="text-ink" />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </div>
  );
}
